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
  const required = ['fullName', 'department', 'email', 'password', 'session', 'designation'];
  for (const field of required) {
    if (body[field] == null || (typeof body[field] === 'string' && body[field].trim() === '')) {
      return { valid: false, message: `Missing or empty field: ${field}.` };
    }
  }
  if (typeof body.session !== 'string' || !/^\d{4}-\d{4}$/.test(body.session.trim())) {
    return { valid: false, message: 'Session must be in format YYYY-YYYY (e.g. 2021-2025).' };
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

    const { fullName, department, email, password, session, designation } = req.body;
    const sessionYear = session.trim();
    const departmentTrimmed = department.trim();

    const sessionDoc = await Session.findOne({
      year: sessionYear,
      department: departmentTrimmed,
    });

    if (!sessionDoc) {
      return res.status(400).json({
        message: `Session "${sessionYear}" not found for department ${departmentTrimmed}.`,
      });
    }

    const existingEmail = await Evaluator.findOne({ email: email.trim().toLowerCase() }).select('_id');
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const evaluator = await Evaluator.create({
      fullName: fullName.trim(),
      department: departmentTrimmed,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      designation: designation.trim(),
      session_id: sessionDoc._id,
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
        message: 'An account with this email already exists.',
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
