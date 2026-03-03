import mongoose from 'mongoose';
import { Meeting } from '../models/Meeting.js';
import { Group } from '../models/Group.js';

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
      supervisorStatus: 'accepted',
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
