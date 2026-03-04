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
