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
    console.log(sessions);
    return res.json({ sessions });
  } catch (err) {
    console.error('getSessions error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch sessions.' });
  }
}
