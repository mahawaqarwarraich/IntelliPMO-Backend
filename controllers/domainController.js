import { Domain } from '../models/Domain.js';

/**
 * GET /api/domains - List all domains (for dropdowns).
 */
export async function getDomains(req, res) {
  try {
    const domains = await Domain.find().sort({ name: 1 }).select('_id name description').lean();
    return res.status(200).json({ domains });
  } catch (err) {
    console.error('getDomains error:', err);
    return res.status(500).json({ message: 'Failed to fetch domains.' });
  }
}
