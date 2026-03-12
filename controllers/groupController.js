import mongoose from 'mongoose';
import { Group } from '../models/Group.js';
import { Session } from '../models/Session.js';
import { Student } from '../models/Student.js';
import { Supervisor } from '../models/Supervisor.js';

/**
 * POST /api/groups (protected).
 * Creates a group for the active session.
 * Body: ideaName, ideaDescription, supervisor_id, members (array of student _ids).
 * Only allowed when the current user's session matches the active session (Student).
 */
export async function createGroup(req, res) {
  try {
    const activeSession = await Session.findOne({ status: 'active' }).lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session. Cannot register a group.' });
    }

    if (req.user?.role !== 'Student') {
      return res.status(403).json({ message: 'Only students can register a group.' });
    }

    const currentStudent = await Student.findById(req.user.userId).select('session_id group_id').lean();
    if (!currentStudent) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    if (!currentStudent.session_id || !currentStudent.session_id.equals(activeSession._id)) {
      return res.status(403).json({ message: 'Your session is not active.' });
    }
    if (currentStudent.group_id) {
      return res.status(400).json({ message: 'You are already in a group.' });
    }

    const { ideaName, ideaDescription, supervisor_id, members } = req.body;

    if (!ideaName || typeof ideaName !== 'string' || ideaName.trim().length < 2) {
      return res.status(400).json({ message: 'Idea name is required (at least 2 characters).' });
    }
    const nameTrimmed = ideaName.trim();
    if (nameTrimmed.length > 200) {
      return res.status(400).json({ message: 'Idea name must be at most 200 characters.' });
    }

    const descTrimmed = (ideaDescription && typeof ideaDescription === 'string' ? ideaDescription.trim() : '') || '';
    if (descTrimmed.length > 2000) {
      return res.status(400).json({ message: 'Idea description must be at most 2000 characters.' });
    }

    if (!supervisor_id || !mongoose.Types.ObjectId.isValid(supervisor_id)) {
      return res.status(400).json({ message: 'Please select a valid supervisor.' });
    }

    const supervisor = await Supervisor.findById(supervisor_id).select('session_id fullName groupsCount').lean();
    if (!supervisor || !supervisor.session_id?.equals(activeSession._id)) {
      return res.status(400).json({ message: 'Selected supervisor is not in the active session.' });
    }

    const maxGroups = activeSession.maxGroups ?? 0;
    const supervisorGroupsCount = supervisor.groupsCount ?? 0;
    if (supervisorGroupsCount >= maxGroups) {
      return res.status(400).json({ message: 'Supervisor capacity reached. Please choose another supervisor.' });
    }

    const maxMembers = activeSession.maxMembers ?? 3;
    const minMembers = activeSession.minMembers ?? 1;

    if (!Array.isArray(members)) {
      return res.status(400).json({ message: 'Members must be an array of student IDs.' });
    }

    const memberIds = members.filter((id) => id != null && mongoose.Types.ObjectId.isValid(id));
    const uniqueIds = [...new Set(memberIds.map((id) => id.toString()))];

    if (uniqueIds.length < minMembers || uniqueIds.length > maxMembers) {
      return res.status(400).json({
        message: `Group must have between ${minMembers} and ${maxMembers} members.`,
      });
    }

    const studentsInSession = await Student.find({
      _id: { $in: uniqueIds },
      session_id: activeSession._id,
    })
      .select('_id group_id')
      .lean();

    if (studentsInSession.length !== uniqueIds.length) {
      return res.status(400).json({ message: 'All selected members must be in the active session.' });
    }

    const alreadyInGroup = studentsInSession.filter((s) => s.group_id != null);
    if (alreadyInGroup.length > 0) {
      return res.status(400).json({ message: 'One or more selected students are already in a group.' });
    }

    

    const group = await Group.create({
      ideaName: nameTrimmed,
      ideaDescription: descTrimmed,
      session_id: activeSession._id,
      supervisor_id,
      members: studentsInSession.map((s) => s._id),
    });

    await Student.updateMany(
      { _id: { $in: studentsInSession.map((s) => s._id) } },
      { $set: { group_id: group._id } }
    );

    return res.status(201).json({
      message: 'Group registered successfully.',
      group: {
        _id: group._id,
        ideaName: group.ideaName,
        ideaDescription: group.ideaDescription,
        session_id: group.session_id,
        supervisor: {
          id: supervisor_id,
          name: supervisor.fullName ?? '',
        },
        members: group.members,
      },
    });
  } catch (err) {
    console.error('createGroup error:', err);
    return res.status(500).json({ message: err.message || 'Failed to register group.' });
  }
}

/**
 * GET /api/groups/status?status=0|1 (protected).
 * Gets active session, then groups where session_id = active session and overallStatus
 * matches status (0 = false, 1 = true). Returns all group fields; populates supervisor
 * and sends supervisorName. Sorted by createdAt ascending (oldest first).
 */
export async function getGroupsByAdmin(req, res) {
  try {
    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session.' });
    }

  
    const groups = await Group.find({
      session_id: activeSession._id,
      adminStatus: 'pending',
    })
      .populate('supervisor_id', 'fullName')
      .sort({ createdAt: 1 })
      .lean();

    const list = groups.map((g) => {
      const { supervisor_id: sup, ...rest } = g;
      return {
        ...rest,
        supervisor_id: g.supervisor_id?._id ?? g.supervisor_id,
        supervisorName: sup?.fullName ?? '',
      };
    });

    return res.status(200).json({ groups: list });
  } catch (err) {
    console.error('getGroupsByStatus error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch groups.' });
  }
}

/**
 * GET /api/groups/registered (protected).
 * Gets active session, then groups where session_id = active session and overallStatus = true.
 * Returns all group fields; populates supervisor and sends supervisorName. Sorted by createdAt ascending.
 */
export async function getAllRegisteredGroups(req, res) {
  try {
    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session.' });
    }

    const groups = await Group.find({
      session_id: activeSession._id,
      overallStatus: true,
    })
      .populate('supervisor_id', 'fullName')
      .sort({ createdAt: 1 })
      .lean();

    const list = groups.map((g) => {
      const { supervisor_id: sup, ...rest } = g;
      return {
        ...rest,
        supervisor_id: g.supervisor_id?._id ?? g.supervisor_id,
        supervisorName: sup?.fullName ?? '',
      };
    });

    return res.status(200).json({ groups: list });
  } catch (err) {
    console.error('getAllRegisteredGroups error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch groups.' });
  }
}

/**
 * GET /api/admin/groups/registered-unassigned (protected, Admin only).
 * Returns registered groups for the active session where panelAssigned is false.
 * Used by the PanelAssignmentD1 screen so only unassigned groups appear.
 */
export async function getRegisteredUnassignedGroups(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session.' });
    }

    const groups = await Group.find({
      session_id: activeSession._id,
      overallStatus: true,
      panelAssigned: false,
    })
      .populate('supervisor_id', 'fullName')
      .sort({ createdAt: 1 })
      .lean();

    const list = groups.map((g) => {
      const { supervisor_id: sup, ...rest } = g;
      return {
        ...rest,
        supervisor_id: g.supervisor_id?._id ?? g.supervisor_id,
        supervisorName: sup?.fullName ?? '',
      };
    });

    return res.status(200).json({ groups: list });
  } catch (err) {
    console.error('getRegisteredUnassignedGroups error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch unassigned groups.' });
  }
}

/**
 * GET /api/admin/groups/:groupId/members (protected, Admin only).
 * Returns the group's members (students) with _id, rollNo, fullName for the given group.
 */
export async function getGroupMembersByGroupId(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { groupId } = req.params;
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id.' });
    }

    const group = await Group.findById(groupId).select('members').populate('members', 'rollNo fullName').lean();
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const students = (group.members || []).map((m) => ({
      _id: m?._id,
      rollNo: m?.rollNo ?? '—',
      fullName: m?.fullName ?? '—',
    }));

    return res.status(200).json({ students });
  } catch (err) {
    console.error('getGroupMembersByGroupId error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch group members.' });
  }
}

/**
 * GET /api/groups/details/:groupId (protected).
 *
 * Returns a single group's display info (name + member names + supervisor name) by group id.
 * Used by the Group chat screen to show the header without re-fetching the full list.
 *
 * - Loads the group by _id (groupId). If not found or invalid id, returns 404/400.
 * - Ensures the requester is allowed to see this group:
 *   - If role is Student: requester's id must be in group.members.
 *   - If role is Supervisor: group.supervisor_id must equal requester's id.
 *   - Otherwise returns 403.
 * - Populates members (Student refs) and supervisor_id (Supervisor ref) to get fullName.
 * - Responds with { group: { ideaName, memberNames: string[], supervisorName } }.
 */
export async function getGroupDetailsById(req, res) {
  try {
    const { groupId } = req.params;
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id.' });
    }

    const group = await Group.findById(groupId)
      .populate('members', 'fullName')
      .populate('supervisor_id', 'fullName')
      .lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const userId = req.user?.userId;
    const role = req.user?.role;

    if (role === 'Student') {
      const memberIds = (group.members || []).map((m) => (m && m._id ? String(m._id) : ''));
      if (!userId || !memberIds.includes(String(userId))) {
        return res.status(403).json({ message: 'You do not have access to this group.' });
      }
    } else if (role === 'Supervisor') {
      const supervisorId = group.supervisor_id?._id ?? group.supervisor_id;
      if (!userId || String(supervisorId) !== String(userId)) {
        return res.status(403).json({ message: 'You do not have access to this group.' });
      }
    } else {
      return res.status(403).json({ message: 'Only students and supervisors can access group chat.' });
    }

    const memberNames = (group.members || [])
      .map((m) => (m && typeof m.fullName === 'string' ? m.fullName : null))
      .filter(Boolean);
    const supervisorName =
      (group.supervisor_id && typeof group.supervisor_id.fullName === 'string')
        ? group.supervisor_id.fullName
        : '';

    return res.status(200).json({
      group: {
        ideaName: group.ideaName ?? '',
        memberNames,
        supervisorName,
      },
    });
  } catch (err) {
    console.error('getGroupDetailsById error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch group details.' });
  }
}

/**
 * GET /api/groups/:id (protected).
 * :id is the student's user id. Finds that student's group_id, then returns the group
 * with only ideaName, adminStatus, adminMessage, supervisorStatus, supervisorMessage.
 */
export async function getGroupByStudentId(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid student id.' });
    }
    if (req.user?.userId && String(req.user.userId) !== String(id)) {
      return res.status(403).json({ message: 'You can only view your own group status.' });
    }

    const student = await Student.findById(id).select('group_id').lean();
    if (!student || !student.group_id) {
      return res.status(404).json({ message: 'No group found for this student.' });
    }

    const group = await Group.findById(student.group_id)
      .select('ideaName adminStatus adminMessage supervisorStatus supervisorMessage')
      .lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    return res.status(200).json({
      group: {
        ideaName: group.ideaName,
        adminStatus: group.adminStatus,
        adminMessage: group.adminMessage ?? '',
        supervisorStatus: group.supervisorStatus,
        supervisorMessage: group.supervisorMessage ?? '',
      },
    });
  } catch (err) {
    console.error('getGroupByStudentId error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch group.' });
  }
}

/**
 * PATCH /api/groups/:id (protected, admin).
 * Body: approval ('accepted'|'rejected'), message (string).
 * If approval is 'accepted': require supervisorStatus 'accepted', then check supervisor
 * groupsCount vs active session maxGroups; if capacity reached return error; else update
 * group (adminStatus, adminMessage, overallStatus true) and increment supervisor groupsCount.
 * If approval is 'rejected': update group (adminStatus, adminMessage only).
 */
export async function updateGroupByAdmin(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admin can update group approval.' });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group id.' });
    }
    const { approval, message } = req.body;
    const adminMessage = typeof message === 'string' ? message.trim() : '';

    if (approval !== 'accepted' && approval !== 'rejected') {
      return res.status(400).json({ message: 'Approval must be "accepted" or "rejected".' });
    }

    const group = await Group.findById(id).select('session_id supervisor_id adminStatus supervisorStatus').lean();
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (approval === 'accepted') {
      if (group.supervisorStatus !== 'accepted') {
        await Group.findByIdAndUpdate(id, {
          $set: { adminStatus: 'accepted', adminMessage, overallStatus: false },
        });
        return res.status(200).json({ message: 'Saved.', group: await Group.findById(id).lean() });
      }
      const activeSession = await Session.findOne({ status: 'active' }).select('maxGroups').lean();
      if (!activeSession) {
        return res.status(400).json({ message: 'No active session.' });
      }
      const supervisor = await Supervisor.findById(group.supervisor_id).select('groupsCount').lean();
      if (!supervisor) {
        return res.status(400).json({ message: 'Supervisor not found.' });
      }
      const maxGroups = activeSession.maxGroups ?? 0;
      const groupsCount = supervisor.groupsCount ?? 0;
      if (groupsCount > maxGroups) {
        return res.status(400).json({
          message: 'Supervisor capacity is reached. Please reject this request.',
        });
      }
      await Group.findByIdAndUpdate(id, {
        $set: { adminStatus: 'accepted', adminMessage, overallStatus: true },
      });
      await Supervisor.findByIdAndUpdate(group.supervisor_id, { $inc: { groupsCount: 1 } });
      return res.status(200).json({
        message: 'Saved.',
        group: await Group.findById(id).lean(),
      });
    }

    await Group.findByIdAndUpdate(id, {
      $set: { adminStatus: 'rejected', adminMessage, overallStatus: false },
    });
    return res.status(200).json({
      message: 'Saved.',
      group: await Group.findById(id).lean(),
    });
  } catch (err) {
    console.error('updateGroupByAdmin error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update group.' });
  }
}



/**
 * PATCH /api/supervisor/groups/:id (protected, supervisor).
 * Body: approval ('accepted'|'rejected'), message (string).
 * Only the group's supervisor can update. If approval 'accepted' and admin already accepted,
 * check capacity then set overallStatus true and increment supervisor groupsCount.
 * If approval 'rejected': update supervisorStatus, supervisorMessage, overallStatus false.
 */
export async function updateGroupBySupervisor(req, res) {
  try {
    if (req.user?.role !== 'Supervisor') {
      return res.status(403).json({ message: 'Only supervisor can update group approval.' });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group id.' });
    }
    const { approval, message } = req.body;
    const supervisorMessage = typeof message === 'string' ? message.trim() : '';

    if (approval !== 'accepted' && approval !== 'rejected') {
      return res.status(400).json({ message: 'Approval must be "accepted" or "rejected".' });
    }

    const group = await Group.findById(id).select('session_id supervisor_id adminStatus supervisorStatus').lean();
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }
    if (String(group.supervisor_id) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You can only update groups assigned to you.' });
    }

    if (approval === 'accepted') {
      if (group.adminStatus !== 'accepted') {
        await Group.findByIdAndUpdate(id, {
          $set: { supervisorStatus: 'accepted', supervisorMessage, overallStatus: false },
        });
        return res.status(200).json({ message: 'Saved.', group: await Group.findById(id).lean() });
      }
      const activeSession = await Session.findOne({ status: 'active' }).select('maxGroups').lean();
      if (!activeSession) {
        return res.status(400).json({ message: 'No active session.' });
      }
      const supervisor = await Supervisor.findById(group.supervisor_id).select('groupsCount').lean();
      if (!supervisor) {
        return res.status(400).json({ message: 'Supervisor not found.' });
      }
      const maxGroups = activeSession.maxGroups ?? 0;
      const groupsCount = supervisor.groupsCount ?? 0;
      if (groupsCount > maxGroups) {
        return res.status(400).json({
          message: 'Supervisor capacity is reached. Please reject this request.',
        });
      }
      await Group.findByIdAndUpdate(id, {
        $set: { supervisorStatus: 'accepted', supervisorMessage, overallStatus: true },
      });
      await Supervisor.findByIdAndUpdate(group.supervisor_id, { $inc: { groupsCount: 1 } });
      return res.status(200).json({
        message: 'Saved.',
        group: await Group.findById(id).lean(),
      });
    }

    await Group.findByIdAndUpdate(id, {
      $set: { supervisorStatus: 'rejected', supervisorMessage, overallStatus: false },
    });
    return res.status(200).json({
      message: 'Saved.',
      group: await Group.findById(id).lean(),
    });
  } catch (err) {
    console.error('updateGroupBySupervisor error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update group.' });
  }
}

/**
 * GET /api/supervisor/groups (protected, supervisor).
 * Returns groups where supervisor_id equals the logged-in supervisor's id and supervisorStatus is 'pending'.
 * Same response shape as getGroupsByAdmin: all fields + supervisorName, sorted by createdAt ascending.
 */
export async function getGroupsBySupervisor(req, res) {
  try {
    if (req.user?.role !== 'Supervisor') {
      return res.status(403).json({ message: 'Only supervisors can access this.' });
    }
    const supervisorId = req.user.userId;
    if (!supervisorId || !mongoose.Types.ObjectId.isValid(supervisorId)) {
      return res.status(400).json({ message: 'Invalid supervisor.' });
    }

    const groups = await Group.find({
      supervisor_id: supervisorId,
      supervisorStatus: 'pending',
    })
      .populate('supervisor_id', 'fullName')
      .sort({ createdAt: 1 })
      .lean();

    const list = groups.map((g) => {
      const { supervisor_id: sup, ...rest } = g;
      return {
        ...rest,
        supervisor_id: g.supervisor_id?._id ?? g.supervisor_id,
        supervisorName: sup?.fullName ?? '',
      };
    });

    return res.status(200).json({ groups: list });
  } catch (err) {
    console.error('getGroupsBySupervisor error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch groups.' });
  }
}

/**
 * GET /api/supervisor/groups/own (protected, supervisor).
 * Same as getGroupsBySupervisor but finds groups where supervisorStatus is 'accepted'.
 */
export async function getGroupsBySupervisorOwn(req, res) {
  try {
    if (req.user?.role !== 'Supervisor') {
      return res.status(403).json({ message: 'Only supervisors can access this.' });
    }
    const supervisorId = req.user.userId;
    if (!supervisorId || !mongoose.Types.ObjectId.isValid(supervisorId)) {
      return res.status(400).json({ message: 'Invalid supervisor.' });
    }

    const groups = await Group.find({
      supervisor_id: supervisorId,
      supervisorStatus: 'accepted',
    })
      .populate('supervisor_id', 'fullName')
      .sort({ createdAt: 1 })
      .lean();

    const list = groups.map((g) => {
      const { supervisor_id: sup, ...rest } = g;
      return {
        ...rest,
        supervisor_id: g.supervisor_id?._id ?? g.supervisor_id,
        supervisorName: sup?.fullName ?? '',
      };
    });

    return res.status(200).json({ groups: list });
  } catch (err) {
    console.error('getGroupsBySupervisorOwn error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch groups.' });
  }
}
