import { Token } from '../models/Token.js';

export async function verifyToken(req, res) {
  try {
    const tokenValue = String(req.query?.token ?? '').trim();
    if (!tokenValue) {
      return res.status(400).json({ message: 'Token is required.' });
    }

    const doc = await Token.findOne({ token: tokenValue }).select('user_id expires_at').lean();
    if (!doc) {
      return res.status(404).json({ message: 'Invalid token.' });
    }

    const expiresAt = doc.expires_at ? new Date(doc.expires_at) : null;
    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      await Token.deleteOne({ token: tokenValue }).catch(() => {});
      return res.status(400).json({ message: 'Token is expired.' });
    }

    return res.status(200).json({ success: true, user_id: doc.user_id });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify token.' });
  }
}

