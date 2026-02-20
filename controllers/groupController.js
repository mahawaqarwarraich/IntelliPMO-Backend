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

    const supervisor = await Supervisor.findById(supervisor_id).select('session_id fullName').lean();
    if (!supervisor || !supervisor.session_id?.equals(activeSession._id)) {
      return res.status(400).json({ message: 'Selected supervisor is not in the active session.' });
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
      supervisor: {
        id: supervisor_id,
        name: supervisor.fullName ?? '',
      },
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
          id: group.supervisor?.id,
          name: group.supervisor?.name ?? '',
        },
        members: group.members,
      },
    });
  } catch (err) {
    console.error('createGroup error:', err);
    return res.status(500).json({ message: err.message || 'Failed to register group.' });
  }
}
