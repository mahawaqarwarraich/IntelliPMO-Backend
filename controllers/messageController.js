import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { Group } from '../models/Group.js';
import { Student } from '../models/Student.js';
import { Supervisor } from '../models/Supervisor.js';

/**
 * GET /api/messages/:groupId (protected).
 *
 * Returns messages for a group, sorted oldest to newest.
 * Query param: after (optional) — ISO timestamp; if present, only messages with createdAt > after are returned.
 * Used on initial load (no after) and by polling (with after=lastMessageTimestamp) to get new messages.
 *
 * - Validates groupId from the URL. If invalid or missing, returns 400.
 * - Ensures the requester has access to the group: if Student, must be in group.members;
 *   if Supervisor, must be group.supervisor_id. Otherwise returns 403.
 * - Queries MongoDB: find messages where groupId equals the given group id and, if after is provided,
 *   createdAt is greater than the given timestamp. Sorts by createdAt ascending (oldest first).
 * - Returns 200 with { messages: [...] } (plain array of message documents).
 */
export async function getMessagesByGroupId(req, res) {
  try {
    const { groupId } = req.params;
    const { after } = req.query;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id.' });
    }
    if (role !== 'Student' && role !== 'Supervisor') {
      return res.status(403).json({ message: 'Only students and supervisors can view group messages.' });
    }

    const group = await Group.findById(groupId)
      .populate('members', '_id')
      .select('supervisor_id members')
      .lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (role === 'Student') {
      const memberIds = (group.members || []).map((m) => (m && m._id ? String(m._id) : ''));
      if (!userId || !memberIds.includes(String(userId))) {
        return res.status(403).json({ message: 'You do not have access to this group.' });
      }
    } else {
      const supervisorId = group.supervisor_id ? String(group.supervisor_id) : '';
      if (!userId || supervisorId !== String(userId)) {
        return res.status(403).json({ message: 'You do not have access to this group.' });
      }
    }

    const filter = { groupId };
    if (after) {
      const afterDate = new Date(after);
      if (!Number.isNaN(afterDate.getTime())) {
        filter.createdAt = { $gt: afterDate };
      }
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({ messages: messages || [] });
  } catch (err) {
    console.error('getMessagesByGroupId error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch messages.' });
  }
}

/**
 * POST /api/messages (protected).
 *
 * Saves a text message to the database for a group chat.
 * Request body: { groupId, senderId, content }.
 *
 * - Validates groupId and content; senderId must match the authenticated user (req.user.userId).
 * - Ensures the user is allowed to post in this group: if Student, must be in group.members;
 *   if Supervisor, must be group.supervisor_id. Otherwise returns 403.
 * - Resolves senderName from Student or Supervisor model by senderId.
 * - Creates a Message document with groupId, senderId, senderName, content (file fields left default).
 * - Returns 201 with the created message (including _id, createdAt).
 */
export async function createMessage(req, res) {
  try {
    const { groupId, senderId, content } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id.' });
    }
    if (!userId || String(senderId) !== String(userId)) {
      return res.status(403).json({ message: 'Sender must be the authenticated user.' });
    }
    if (role !== 'Student' && role !== 'Supervisor') {
      return res.status(403).json({ message: 'Only students and supervisors can send messages.' });
    }

    const contentStr = typeof content === 'string' ? content.trim() : '';
    if (!contentStr) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const group = await Group.findById(groupId)
      .populate('members', '_id')
      .select('supervisor_id members')
      .lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (role === 'Student') {
      const memberIds = (group.members || []).map((m) => (m && m._id ? String(m._id) : ''));
      if (!memberIds.includes(String(userId))) {
        return res.status(403).json({ message: 'You do not have access to this group.' });
      }
    } else {
      const supervisorId = group.supervisor_id ? String(group.supervisor_id) : '';
      if (supervisorId !== String(userId)) {
        return res.status(403).json({ message: 'You do not have access to this group.' });
      }
    }

    let senderName = '';
    if (role === 'Student') {
      const student = await Student.findById(userId).select('fullName').lean();
      senderName = (student && student.fullName) ? student.fullName : 'Student';
    } else {
      const supervisor = await Supervisor.findById(userId).select('fullName').lean();
      senderName = (supervisor && supervisor.fullName) ? supervisor.fullName : 'Supervisor';
    }

    const message = await Message.create({
      groupId,
      senderId: userId,
      senderName,
      content: contentStr,
    });

    const created = message.toObject ? message.toObject() : message;
    return res.status(201).json({ message: created });
  } catch (err) {
    console.error('createMessage error:', err);
    return res.status(500).json({ message: err.message || 'Failed to save message.' });
  }
}
