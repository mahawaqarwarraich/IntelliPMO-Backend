import { Supervisor } from '../models/Supervisor.js';
import { Session } from '../models/Session.js';

/**
 * GET /api/domains-supervisors (protected).
 * Fetches supervisors that have an active session_id, along with their domain names.
 * Returns { supervisors } with number, domain name, supervisor name, email.
 */
export async function getDomainsSupervisors(req, res) {
  try {
    // Find the active session
    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ supervisors: [] });
    }

    // Fetch supervisors with the active session_id
    const supervisors = await Supervisor.find({ session_id: activeSession._id })
      .populate('domain_id', 'name')
      .sort({ fullName: 1 })
      .lean();

    const list = supervisors.map((s, index) => ({
      _id: s._id,
      number: index + 1,
      domainName: s.domain_id?.name ?? '—',
      supervisorName: s.fullName ?? '—',
      supervisorEmail: s.email ?? '—',
    }));

    return res.status(200).json({ supervisors: list });
  } catch (err) {
    console.error('getDomainsSupervisors error:', err);
    return res.status(500).json({ message: err.message || 'Failed to load data.' });
  }
}
