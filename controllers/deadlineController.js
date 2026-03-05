import { Deadline } from '../models/Deadline.js';
import { Session } from '../models/Session.js';

/**
 * POST /api/deadlines (protected, Admin only).
 * Fetches the active session, then creates a deadline with session_id set to that session.
 * Body: { deadlineName, dueDate, dueTime, description? }
 */
export async function createDeadline(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can create deadlines.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session. Cannot create a deadline.' });
    }

    const { deadlineName, dueDate, dueTime, description } = req.body;
    if (!deadlineName?.trim()) {
      return res.status(400).json({ message: 'Deadline name is required.' });
    }
    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required.' });
    }
    if (!dueTime?.trim()) {
      return res.status(400).json({ message: 'Due time is required.' });
    }

    const doc = {
      deadlineName: deadlineName.trim(),
      dueDate: new Date(dueDate),
      dueTime: dueTime.trim(),
      session_id: activeSession._id,
      description: description?.trim() ?? '',
    };

    const deadline = await Deadline.create(doc);
    return res.status(201).json({
      message: 'Deadline created successfully.',
      deadline: {
        _id: deadline._id,
        deadlineName: deadline.deadlineName,
        dueDate: deadline.dueDate,
        dueTime: deadline.dueTime,
        session_id: deadline.session_id,
        description: deadline.description,
        createdAt: deadline.createdAt,
      },
    });
  } catch (err) {
    console.error('createDeadline error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create deadline.' });
  }
}

/**
 * GET /api/deadlines (protected, Admin or Student).
 * Returns all deadlines for the active session (or [] if no active session).
 * Used by the AllDeadlines component to display deadline cards.
 */
export async function getDeadlines(req, res) {
  try {
    const role = req.user?.role;
    if (role !== 'Admin' && role !== 'Student') {
      return res.status(403).json({ message: 'Only admins and students can view deadlines.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ deadlines: [] });
    }

    const list = await Deadline.find({ session_id: activeSession._id })
      .sort({ dueDate: 1, dueTime: 1 })
      .lean();

    const deadlines = (list || []).map((d) => ({
      _id: d._id,
      deadlineName: d.deadlineName,
      dueDate: d.dueDate,
      dueTime: d.dueTime,
      session_id: d.session_id,
      description: d.description,
      createdAt: d.createdAt,
    }));

    return res.json({ deadlines });
  } catch (err) {
    console.error('getDeadlines error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch deadlines.' });
  }
}
