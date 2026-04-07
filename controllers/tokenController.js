import { Token } from '../models/Token.js';
import { Student } from '../models/Student.js';
import { Supervisor } from '../models/Supervisor.js';
import { Evaluator } from '../models/Evaluator.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

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

export async function setPassword(req, res) {
  try {
    const tokenValue = String(req.body?.token ?? '').trim();
    const newPassword = String(req.body?.new_password ?? '');

    if (!tokenValue) {
      return res.status(400).json({ message: 'Token is required.' });
    }
    if (!newPassword || newPassword.trim().length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
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

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const update = { $set: { password: hashedPassword, status: 'active' } };
    let updated =
      (await Student.findByIdAndUpdate(doc.user_id, update, { new: false }).select('_id')) ||
      (await Supervisor.findByIdAndUpdate(doc.user_id, update, { new: false }).select('_id')) ||
      (await Evaluator.findByIdAndUpdate(doc.user_id, update, { new: false }).select('_id'));

    if (!updated) return res.status(404).json({ message: 'User not found.' });

    await Token.deleteOne({ token: tokenValue }).catch(() => {});
    return res.status(200).json({ success: true, message: 'Password set successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to set password.' });
  }
}

