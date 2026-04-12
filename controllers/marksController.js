import mongoose from 'mongoose';
import { Session } from '../models/Session.js';
import { Student } from '../models/Student.js';
import { Marks } from '../models/Marks.js';

/**
 * POST /api/marks/toggle-show-grade (protected, Admin only).
 * Flips `showGrade` on every Marks document for the active session:
 * either `session_id` matches the active session, or the linked student belongs to that session.
 */
export async function toggleShowGradeActiveSession(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can toggle grade visibility.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session.' });
    }

    const sessionOid = activeSession._id;
    const studentIds = await Student.find({ session_id: sessionOid }).distinct('_id');
    const oids = (studentIds || [])
      .map((id) => String(id))
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const filter =
      oids.length > 0
        ? {
            $or: [{ session_id: sessionOid }, { student_id: { $in: oids } }],
          }
        : { session_id: sessionOid };

    const result = await Marks.updateMany(filter, [
      { $set: { showGrade: { $eq: [{ $ifNull: ['$showGrade', false] }, false] } } },
    ]);

    return res.status(200).json({
      message: 'Grade visibility toggled for marks in the active session.',
      matchedCount: result.matchedCount ?? 0,
      modifiedCount: result.modifiedCount ?? 0,
    });
  } catch (err) {
    console.error('toggleShowGradeActiveSession error:', err);
    return res.status(500).json({ message: err.message || 'Failed to toggle grade visibility.' });
  }
}
