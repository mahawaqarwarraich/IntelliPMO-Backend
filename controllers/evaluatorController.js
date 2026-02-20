import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Evaluator } from '../models/Evaluator.js';
import { Session } from '../models/Session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate required evaluator registration fields.
 * Returns { valid: false, message } or { valid: true }.
 */
function validateRegisterBody(body) {
  const required = ['fullName', 'email', 'password', 'session_id', 'designation'];
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
  return { valid: true };
}

export async function registerEvaluator(req, res) {
  try {
    const validation = validateRegisterBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fullName, email, password, session_id, designation } = req.body;

    const existing = await Evaluator.findOne({
      email: email.trim().toLowerCase(),
      session_id,
    }).select('_id');
    if (existing) {
      return res.status(409).json({ message: 'You are already registered for this session.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const evaluator = await Evaluator.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      designation: designation.trim(),
      session_id: session_id,
    });

    const evaluatorObj = evaluator.toObject ? evaluator.toObject() : evaluator;
    delete evaluatorObj.password;

    return res.status(201).json({
      message: 'Account created successfully.',
      evaluator: evaluatorObj,
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

    const evaluator = await Evaluator.findOne({ email: emailTrimmed }).select('+password').populate('session_id', 'year');
    if (!evaluator) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, evaluator.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const evaluatorObj = evaluator.toObject ? evaluator.toObject() : evaluator;
    delete evaluatorObj.password;
    evaluatorObj.sessionYear = evaluator.session_id?.year ?? null;

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

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ evaluators: [] });
    }

    const evaluators = await Evaluator.find({ session_id: activeSession._id })
      .select('fullName email')
      .sort({ fullName: 1 })
      .lean();

    const list = evaluators.map((e, index) => ({
      number: index + 1,
      evaluatorName: e.fullName ?? '—',
      email: e.email ?? '—',
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
