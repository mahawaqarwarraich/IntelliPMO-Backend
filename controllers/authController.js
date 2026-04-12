import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { Supervisor } from '../models/Supervisor.js';
import { Evaluator } from '../models/Evaluator.js';
import { Student } from '../models/Student.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ROLL_REGEX = /^\d{8}-\d{3}$/;

function validateUnifiedLoginBody(body) {
  const identifier =
    typeof body.identifier === 'string'
      ? body.identifier.trim()
      : typeof body.email === 'string'
        ? body.email.trim()
        : '';
  const password = body.password;

  if (!identifier) {
    return { valid: false, message: 'Email or roll number is required.' };
  }
  if (password == null || (typeof password === 'string' && password.trim() === '')) {
    return { valid: false, message: 'Password is required.' };
  }
  if (typeof password !== 'string' || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters.' };
  }

  const isRoll = STUDENT_ROLL_REGEX.test(identifier);
  if (!isRoll && !EMAIL_REGEX.test(identifier)) {
    return { valid: false, message: 'Enter a valid email address or student roll number (e.g. 21011519-085).' };
  }

  return { valid: true, identifier, password };
}

/**
 * POST /api/auth/login
 * Body: { identifier, password } — identifier is an email (staff) or roll number (student).
 * Returns: { message, token, role, user, defenseType? }
 */
export async function loginUnified(req, res) {
  try {
    const validation = validateUnifiedLoginBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { identifier, password } = validation;

    if (STUDENT_ROLL_REGEX.test(identifier)) {
      const student = await Student.findOne({ rollNo: identifier }).select('+password');
      if (!student) {
        return res.status(401).json({ message: 'Invalid roll number or password.' });
      }
      const passwordMatch = await bcrypt.compare(password, student.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid roll number or password.' });
      }
      const user = student.toObject ? student.toObject() : student;
      delete user.password;
      const token = jwt.sign({ userId: student._id, role: 'Student' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      return res.status(200).json({
        message: 'Logged in successfully.',
        token,
        role: 'Student',
        user,
      });
    }

    const emailTrimmed = identifier.toLowerCase();

    const admin = await Admin.findOne({ email: emailTrimmed }).select('+password');
    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      const user = admin.toObject ? admin.toObject() : admin;
      delete user.password;
      const token = jwt.sign({ userId: admin._id, role: 'Admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      return res.status(200).json({
        message: 'Logged in successfully.',
        token,
        role: 'Admin',
        user,
      });
    }

    const supervisor = await Supervisor.findOne({ email: emailTrimmed }).select('+password');
    if (supervisor) {
      const passwordMatch = await bcrypt.compare(password, supervisor.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      const user = supervisor.toObject ? supervisor.toObject() : supervisor;
      delete user.password;
      const token = jwt.sign({ userId: supervisor._id, role: 'Supervisor' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      return res.status(200).json({
        message: 'Logged in successfully.',
        token,
        role: 'Supervisor',
        user,
      });
    }

    const evaluator = await Evaluator.findOne({ email: emailTrimmed }).select('+password');
    if (evaluator) {
      const passwordMatch = await bcrypt.compare(password, evaluator.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      const user = evaluator.toObject ? evaluator.toObject() : evaluator;
      delete user.password;
      const token = jwt.sign({ userId: evaluator._id, role: 'Evaluator' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      return res.status(200).json({
        message: 'Logged in successfully.',
        token,
        role: 'Evaluator',
        user,
        defenseType: user.defenseType ?? undefined,
      });
    }

    return res.status(401).json({ message: 'Invalid email or password.' });
  } catch (err) {
    console.error('loginUnified error:', err);
    return res.status(500).json({ message: err.message || 'Login failed. Please try again.' });
  }
}
