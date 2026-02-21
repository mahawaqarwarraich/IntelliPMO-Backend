import { Session } from '../models/Session.js';

/**
 * GET /api/sessions
 * Query: status (optional) - e.g. 'active' to list only active sessions.
 * Returns list of sessions with _id and year for dropdowns.
 */
export async function getSessions(req, res) {
  try {
    const { status } = req.query;
    const filter = status ? { status: status } : {};
    const sessions = await Session.find(filter).select('_id year').sort({ year: 1 }).lean();
    return res.json({ sessions });
  } catch (err) {
    console.error('getSessions error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch sessions.' });
  }
}

/**
 * GET /api/sessions/active
 * Returns the full active session document or null if none is active.
 */
export async function getActiveSession(req, res) {
  try {
    const activeSession = await Session.findOne({ status: 'active' }).lean();
    return res.json({ activeSession: activeSession || null });
  } catch (err) {
    console.error('getActiveSession error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch active session.' });
  }
}

/**
 * GET /api/sessions/active-id
 * Returns only the active session's _id (or null). For session match checks.
 */
export async function getActiveSessionId(req, res) {
  try {
    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    return res.json({ activeSessionId: activeSession?._id ?? null });
  } catch (err) {
    console.error('getActiveSessionId error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch active session id.' });
  }
}
