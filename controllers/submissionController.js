import { Submission } from '../models/Submission.js';
import { Deadline } from '../models/Deadline.js';
import { Session } from '../models/Session.js';
import { Student } from '../models/Student.js';

/**
 * POST /api/submissions (protected, Student only).
 * Body: { deadline_id, fileUrl, fileName, submittedAt? }.
 * If submittedAt or current time exceeds the deadline's due date/time, status is set to 'late', else 'on time'.
 * Creates the submission document with student_id from auth.
 */
export async function createSubmission(req, res) {
  try {
    if (req.user?.role !== 'Student') {
      return res.status(403).json({ message: 'Only students can submit for deadlines.' });
    }

    const studentId = req.user?.userId;
    const { deadline_id, fileUrl, fileName, submittedAt } = req.body;

    if (!deadline_id || !fileUrl?.trim() || !fileName?.trim()) {
      return res.status(400).json({ message: 'deadline_id, fileUrl, and fileName are required.' });
    }

    const deadline = await Deadline.findById(deadline_id).lean();
    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found.' });
    }

    const submittedAtDate = submittedAt ? new Date(submittedAt) : new Date();
    if (Number.isNaN(submittedAtDate.getTime())) {
      return res.status(400).json({ message: 'Invalid submittedAt.' });
    }

    // Build deadline moment: dueDate (date) + dueTime (HH:mm)
    const dueDate = new Date(deadline.dueDate);
    const [h, m] = (deadline.dueTime || '').trim().split(':').map((x) => parseInt(x, 10) || 0);
    dueDate.setHours(h, m, 0, 0);

    const isLate = submittedAtDate.getTime() > dueDate.getTime();
    const status = isLate ? 'late' : 'on time';

    const doc = {
      student_id: studentId,
      deadline_id,
      fileUrl: fileUrl.trim(),
      fileName: fileName.trim(),
      status,
      submittedAt: submittedAtDate,
    };

    const submission = await Submission.create(doc);
    return res.status(201).json({
      message: 'Submission created successfully.',
      submission: {
        _id: submission._id,
        student_id: submission.student_id,
        deadline_id: submission.deadline_id,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err) {
    console.error('createSubmission error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create submission.' });
  }
}

/**
 * GET /api/submissions (protected, Admin only).
 * Returns all submissions for deadlines that belong to the active session.
 * Each row includes deadline name, student rollNo, file info and status.
 */
export async function getSubmissions(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can view submissions.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ submissions: [] });
    }

    const deadlines = await Deadline.find({ session_id: activeSession._id }).select('_id').lean();
    const deadlineIds = (deadlines || []).map((d) => d._id);
    if (deadlineIds.length === 0) {
      return res.status(200).json({ submissions: [] });
    }

    const list = await Submission.find({ deadline_id: { $in: deadlineIds } })
      .populate('deadline_id', 'deadlineName')
      .populate('student_id', 'rollNo')
      .sort({ submittedAt: -1 })
      .lean();

    const submissions = (list || []).map((s) => {
      const deadline = s.deadline_id;
      const student = s.student_id;
      return {
        _id: s._id,
        deadlineName: deadline?.deadlineName ?? '',
        fileUrl: s.fileUrl,
        fileName: s.fileName,
        status: s.status,
        rollNo: student?.rollNo ?? '',
        submittedAt: s.submittedAt,
      };
    });

    return res.json({ submissions });
  } catch (err) {
    console.error('getSubmissions error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch submissions.' });
  }
}
