import mongoose from 'mongoose';
import { Meeting } from '../models/Meeting.js';
import { Group } from '../models/Group.js';
import { Student } from '../models/Student.js';
import { Session } from '../models/Session.js';

/**
 * GET /api/meetings (protected, Supervisor or Student).
 * Supervisor: returns all meetings they created (supervisor_id = current user), scoped to active session.
 * Student: returns all meetings created by their supervisor (student's group -> group.supervisor_id -> meetings by that supervisor), scoped to active session.
 * Each meeting includes group name (via populated group_id). Sorted by meetingDate ascending, then startingTime ascending.
 */
export async function getMeetings(req, res) {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    if (role !== 'Supervisor' && role !== 'Student') {
      return res.status(403).json({ message: 'Only supervisors and students can view meetings.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ meetings: [] });
    }

    let supervisorId = null;

    if (role === 'Supervisor') {
      supervisorId = userId;
    } else {
      const student = await Student.findById(userId).select('group_id').lean();
      if (!student?.group_id) {
        return res.status(200).json({ meetings: [] });
      }
      const group = await Group.findOne({
        _id: student.group_id,
        session_id: activeSession._id,
      })
        .select('supervisor_id')
        .lean();
      if (!group?.supervisor_id) {
        return res.status(200).json({ meetings: [] });
      }
      supervisorId = group.supervisor_id;
    }

    const groupIdsInSession = await Group.find({
      session_id: activeSession._id,
      supervisor_id: supervisorId,
    })
      .select('_id')
      .lean();
    const ids = (groupIdsInSession || []).map((g) => g._id);
    if (ids.length === 0) {
      return res.status(200).json({ meetings: [] });
    }

    const meetings = await Meeting.find({ group_id: { $in: ids } })
      .populate('group_id', 'ideaName')
      .sort({ meetingDate: 1, startingTime: 1 })
      .lean();

    const list = (meetings || []).map((m) => {
      const group = m.group_id;
      const groupName = group?.ideaName ?? '';
      const groupId = group?._id ?? m.group_id;
      return {
        _id: m._id,
        supervisor_id: m.supervisor_id,
        group_id: groupId,
        groupName,
        meetingTitle: m.meetingTitle,
        meetingDate: m.meetingDate,
        meetingLocation: m.meetingLocation,
        startingTime: m.startingTime,
        endingTime: m.endingTime,
        createdAt: m.createdAt,
      };
    });

    return res.status(200).json({ meetings: list });
  } catch (err) {
    console.error('getMeetings error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch meetings.' });
  }
}

/**
 * POST /api/meetings (protected, supervisor only).
 * Creates a new meeting for one of the supervisor's groups.
 * Body: { group_id, meetingTitle, meetingDate, meetingLocation, startingTime, endingTime }.
 * supervisor_id is set from req.user.userId.
 * Validates that group_id belongs to the authenticated supervisor (and group exists).
 */
export async function createMeeting(req, res) {
  try {
    if (req.user?.role !== 'Supervisor') {
      return res.status(403).json({ message: 'Only supervisors can create meetings.' });
    }

    const supervisorId = req.user.userId;
    const { group_id, meetingTitle, meetingDate, meetingLocation, startingTime, endingTime } = req.body;

    if (!group_id || !mongoose.Types.ObjectId.isValid(group_id)) {
      return res.status(400).json({ message: 'Valid group is required.' });
    }

    const titleStr = typeof meetingTitle === 'string' ? meetingTitle.trim() : '';
    if (!titleStr || titleStr.length < 1) {
      return res.status(400).json({ message: 'Meeting title is required.' });
    }

    const locationStr = typeof meetingLocation === 'string' ? meetingLocation.trim() : '';
    if (!locationStr) {
      return res.status(400).json({ message: 'Meeting location is required.' });
    }

    const startTimeStr = typeof startingTime === 'string' ? startingTime.trim() : '';
    const endTimeStr = typeof endingTime === 'string' ? endingTime.trim() : '';
    if (!startTimeStr || !endTimeStr) {
      return res.status(400).json({ message: 'Starting time and ending time are required.' });
    }

    let dateObj = null;
    if (meetingDate) {
      dateObj = new Date(meetingDate);
      if (Number.isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid meeting date.' });
      }
    } else {
      return res.status(400).json({ message: 'Meeting date is required.' });
    }

    const group = await Group.findOne({
      _id: group_id,
      supervisor_id: supervisorId,
      overallStatus: true,
    })
      .select('_id')
      .lean();

    if (!group) {
      return res.status(403).json({ message: 'You can only create meetings for your accepted groups.' });
    }

    const meeting = await Meeting.create({
      supervisor_id: supervisorId,
      group_id,
      meetingTitle: titleStr,
      meetingDate: dateObj,
      meetingLocation: locationStr,
      startingTime: startTimeStr,
      endingTime: endTimeStr,
    });

    const created = meeting.toObject ? meeting.toObject() : meeting;
    return res.status(201).json({ meeting: created });
  } catch (err) {
    console.error('createMeeting error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create meeting.' });
  }
}

/**
 * DELETE /api/meetings/:id (protected, supervisor only).
 * Deletes a meeting. The meeting's supervisor_id must match the authenticated user.
 */
export async function deleteMeeting(req, res) {
  try {
    if (req.user?.role !== 'Supervisor') {
      return res.status(403).json({ message: 'Only supervisors can delete meetings.' });
    }

    const meetingId = req.params.id;
    if (!meetingId || !mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ message: 'Invalid meeting id.' });
    }

    const meeting = await Meeting.findById(meetingId).select('supervisor_id').lean();
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found.' });
    }
    if (String(meeting.supervisor_id) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You can only delete your own meetings.' });
    }

    await Meeting.findByIdAndDelete(meetingId);
    return res.status(200).json({ message: 'Meeting deleted.' });
  } catch (err) {
    console.error('deleteMeeting error:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete meeting.' });
  }
}
