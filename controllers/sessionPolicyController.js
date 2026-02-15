import { Session } from '../models/Session.js';

const SESSION_YEAR_REGEX = /^\d{4}-\d{4}$/;

/**
 * GET /api/session-policy?year=2021-2025
 * Protected by auth. Returns the session document for the given year.
 */
export async function getSessionPolicy(req, res) {
  try {
    const year = req.query.year?.trim();

    if (!year) {
      return res.status(400).json({
        message: 'Query parameter year is required.',
      });
    }

    if (!SESSION_YEAR_REGEX.test(year)) {
      return res.status(400).json({
        message: 'Year must be in format YYYY-YYYY (e.g. 2021-2025).',
      });
    }

    const session = await Session.findOne({ year });
    if (!session) {
      return res.status(404).json({
        message: `No session found for year ${year}.`,
      });
    }

    return res.status(200).json({ session });
  } catch (err) {
    console.error('getSessionPolicy error:', err);
    return res.status(500).json({
      message: err.message || 'Failed to fetch session policy.',
    });
  }
}
