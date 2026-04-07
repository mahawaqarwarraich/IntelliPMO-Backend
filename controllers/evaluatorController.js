import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { Evaluator } from '../models/Evaluator.js';
import { Session } from '../models/Session.js';
import { Token } from '../models/Token.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createMailer() {
  const user = process.env.GMAIL_USER || 'your-email@gmail.com';
  const pass = process.env.GMAIL_PASS || 'your-app-password';
  const from = process.env.MAIL_FROM || user;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return { transporter, from };
}

/**
 * Validate required evaluator registration fields.
 * Returns { valid: false, message } or { valid: true }.
 */
function validateRegisterBody(body) {
  const required = ['fullName', 'email', 'session_id', 'designation', 'defenseType'];
  for (const field of required) {
    if (body[field] == null || (typeof body[field] === 'string' && body[field].trim() === '')) {
      return { valid: false, message: `Missing or empty field: ${field}.` };
    }
  }
  if (!mongoose.Types.ObjectId.isValid(body.session_id)) {
    return { valid: false, message: 'Please select a valid session.' };
  }
  if (typeof body.designation !== 'string' || body.designation.trim().length < 2) {
    return { valid: false, message: 'Designation must be at least 2 characters.' };
  }
  if (!['d1', 'd2'].includes(body.defenseType)) {
    return { valid: false, message: 'Defense type must be D1 or D2.' };
  }
  return { valid: true };
}

export async function registerEvaluator(req, res) {
  try {
    const validation = validateRegisterBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fullName, email, session_id, designation, defenseType } = req.body;

    const existing = await Evaluator.findOne({
      email: email.trim().toLowerCase(),
      session_id,
    }).select('_id');
    if (existing) {
      return res.status(409).json({ message: 'You are already registered for this session.' });
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

    const evaluator = await Evaluator.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      designation: designation.trim(),
      defenseType: defenseType.trim().toLowerCase(),
      session_id: session_id,
    });

    const tokenValue = crypto.randomBytes(32).toString('hex');
    await Token.create({
      user_id: evaluator._id,
      token: tokenValue,
    });

    const { transporter, from } = createMailer();
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const setPasswordUrl = `${frontendBaseUrl}/set-password?token=${encodeURIComponent(tokenValue)}`;
    try {
      await transporter.sendMail({
        from,
        to: evaluator.email,
        subject: 'Set your password',
        text: `Hi,

Your account has been created on IntelliPMO.

To get started, please set your password by clicking the link below:

Set Your Password
${setPasswordUrl}

This link will expire in 1 hour for security reasons.

If you did not expect this email, you can safely ignore it.

Thanks,
IntelliPMO Support Team`,
        html: `<div style="font-family:Segoe UI,system-ui,-apple-system,Arial,sans-serif;line-height:1.5;color:#111827;">
<p>Hi,</p>
<p>Your account has been created on IntelliPMO.</p>
<p>To get started, please set your password by clicking the button below:</p>
<p><a href="${setPasswordUrl}" style="display:inline-block;padding:12px 16px;background:#0097a7;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">👉 Set Your Password</a></p>
<p><small>This link will expire in 1 hour for security reasons.</small></p>
<p>If you did not expect this email, you can safely ignore it.</p>
<p>Thanks,<br/>IntelliPMO Support Team</p>
</div>`,
      });
    } catch (mailErr) {
      await Token.deleteOne({ token: tokenValue }).catch(() => {});
      await Evaluator.deleteOne({ _id: evaluator._id }).catch(() => {});
      throw mailErr;
    }

    return res.status(201).json({
      message: 'Account created successfully.',
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: messages.length ? messages[0] : 'Validation failed.',
        errors: messages,
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'You are already registered for this session.',
      });
    }
    console.error('registerEvaluator error:', err);
    return res.status(500).json({
      message: err.message || 'Registration failed. Please try again.',
    });
  }
}

/**
 * Validate required evaluator login fields.
 * Returns { valid: false, message } or { valid: true }.
 */
function validateLoginBody(body) {
  if (body.email == null || (typeof body.email === 'string' && body.email.trim() === '')) {
    return { valid: false, message: 'Email is required.' };
  }
  if (body.password == null || (typeof body.password === 'string' && body.password.trim() === '')) {
    return { valid: false, message: 'Password is required.' };
  }
  if (typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  return { valid: true };
}

export async function loginEvaluator(req, res) {
  try {
    const validation = validateLoginBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { email, password } = req.body;
    const emailTrimmed = email.trim().toLowerCase();

    const evaluator = await Evaluator.findOne({ email: emailTrimmed }).select('+password');
    if (!evaluator) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, evaluator.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const evaluatorObj = evaluator.toObject ? evaluator.toObject() : evaluator;
    delete evaluatorObj.password;

    const token = jwt.sign(
      { userId: evaluator._id, role: 'Evaluator' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      evaluator: evaluatorObj,
    });
  } catch (err) {
    console.error('loginEvaluator error:', err);
    return res.status(500).json({
      message: err.message || 'Login failed. Please try again.',
    });
  }
}

/**
 * GET /api/evaluators (protected, admin only).
 * Fetches evaluators that have an active session_id.
 * Returns { evaluators } with number, evaluatorName, email, _id.
 */
export async function getAllEvaluators(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { defenseType } = req.query;

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ evaluators: [] });
    }

    const filter = { session_id: activeSession._id };
    if (defenseType && ['d1', 'd2'].includes(String(defenseType).toLowerCase())) {
      filter.defenseType = String(defenseType).toLowerCase();
    }

    const evaluators = await Evaluator.find(filter)
      .select('fullName email defenseType')
      .sort({ fullName: 1 })
      .lean();

    const list = evaluators.map((e, index) => ({
      number: index + 1,
      evaluatorName: e.fullName ?? '—',
      email: e.email ?? '—',
      defenseType: e.defenseType ?? '—',
      _id: e._id,
    }));

    return res.status(200).json({ evaluators: list });
  } catch (err) {
    console.error('getAllEvaluators error:', err);
    return res.status(500).json({ message: err.message || 'Failed to load evaluators.' });
  }
}

/**
 * DELETE /api/evaluators/:id (protected, admin only).
 */
export async function deleteEvaluator(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid evaluator ID.' });
    }

    const evaluator = await Evaluator.findByIdAndDelete(id);
    if (!evaluator) {
      return res.status(404).json({ message: 'Evaluator not found.' });
    }

    return res.status(200).json({ message: 'Evaluator deleted successfully.' });
  } catch (err) {
    console.error('deleteEvaluator error:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete evaluator.' });
  }
}
