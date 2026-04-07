import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { Supervisor } from '../models/Supervisor.js';
import { Domain } from '../models/Domain.js';
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
 * Validate required supervisor registration fields.
 * Returns { valid: false, message } or { valid: true }.
 */
function validateRegisterBody(body) {
  const required = ['fullName', 'email', 'session_id', 'designation', 'domain_id'];
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
  if (!mongoose.Types.ObjectId.isValid(body.domain_id)) {
    return { valid: false, message: 'Invalid domain selected.' };
  }
  return { valid: true };
}

export async function registerSupervisor(req, res) {
  try {
    const validation = validateRegisterBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fullName, email, session_id, designation, domain_id } = req.body;

    const domainDoc = await Domain.findById(domain_id).select('_id');
    if (!domainDoc) {
      return res.status(400).json({ message: 'Selected domain is not valid.' });
    }

    const existing = await Supervisor.findOne({
      email: email.trim().toLowerCase(),
      session_id,
    }).select('_id');
    if (existing) {
      return res.status(409).json({ message: 'You are already registered for this session.' });
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

    const supervisor = await Supervisor.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      designation: designation.trim(),
      session_id: session_id,
      domain_id: domainDoc._id,
    });

    const tokenValue = crypto.randomBytes(32).toString('hex');
    await Token.create({
      user_id: supervisor._id,
      token: tokenValue,
    });

    const { transporter, from } = createMailer();
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const setPasswordUrl = `${frontendBaseUrl}/set-password?token=${encodeURIComponent(tokenValue)}`;
    try {
      await transporter.sendMail({
        from,
        to: supervisor.email,
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
      await Supervisor.deleteOne({ _id: supervisor._id }).catch(() => {});
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
    console.error('registerSupervisor error:', err);
    return res.status(500).json({
      message: err.message || 'Registration failed. Please try again.',
    });
  }
}

/**
 * Validate required supervisor login fields.
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

export async function loginSupervisor(req, res) {
  try {
    const validation = validateLoginBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { email, password } = req.body;
    const emailTrimmed = email.trim().toLowerCase();

    const supervisor = await Supervisor.findOne({ email: emailTrimmed }).select('+password');
    if (!supervisor) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, supervisor.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const supervisorObj = supervisor.toObject ? supervisor.toObject() : supervisor;
    delete supervisorObj.password;

    const token = jwt.sign(
      { userId: supervisor._id, role: 'Supervisor' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      supervisor: supervisorObj,
    });
  } catch (err) {
    console.error('loginSupervisor error:', err);
    return res.status(500).json({
      message: err.message || 'Login failed. Please try again.',
    });
  }
}

/**
 * GET /api/supervisors (protected, admin only).
 * Fetches supervisors that have an active session_id, with domain name.
 * Returns { supervisors } with number, supervisorName, email, domainName, _id.
 */
export async function getAllSupervisors(req, res) {
  try {
   

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ supervisors: [] });
    }

    const supervisors = await Supervisor.find({ session_id: activeSession._id })
      .populate('domain_id', 'name')
      .sort({ fullName: 1 })
      .lean();

    const list = supervisors.map((s, index) => ({
      number: index + 1,
      supervisorName: s.fullName ?? '—',
      email: s.email ?? '—',
      domainName: s.domain_id?.name ?? '—',
      groupsCount: s.groupsCount ?? 0,
      _id: s._id,
    }));

    return res.status(200).json({ supervisors: list });
  } catch (err) {
    console.error('getAllSupervisors error:', err);
    return res.status(500).json({ message: err.message || 'Failed to load supervisors.' });
  }
}

/**
 * DELETE /api/supervisors/:id (protected, admin only).
 */
export async function deleteSupervisor(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid supervisor ID.' });
    }

    const supervisor = await Supervisor.findByIdAndDelete(id);
    if (!supervisor) {
      return res.status(404).json({ message: 'Supervisor not found.' });
    }

    return res.status(200).json({ message: 'Supervisor deleted successfully.' });
  } catch (err) {
    console.error('deleteSupervisor error:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete supervisor.' });
  }
}
