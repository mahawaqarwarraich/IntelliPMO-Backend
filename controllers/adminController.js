import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { Session } from '../models/Session.js';
import { SessionStat } from '../models/SessionStat.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate required admin registration fields.
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

export async function registerAdmin(req, res) {
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

    const existingEmail = await Admin.findOne({ email: email.trim().toLowerCase() }).select('_id');
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await Admin.create({
      fullName: fullName.trim(),
      department: departmentTrimmed,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      designation: designation.trim(),
      session_id: sessionDoc._id,
    });

    const adminObj = admin.toObject ? admin.toObject() : admin;
    delete adminObj.password;

    return res.status(201).json({
      message: 'Account created successfully.',
      admin: adminObj,
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
    console.error('registerAdmin error:', err);
    return res.status(500).json({
      message: err.message || 'Registration failed. Please try again.',
    });
  }
}

/**
 * Validate required admin login fields.
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

export async function loginAdmin(req, res) {
  try {
    const validation = validateLoginBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { email, password } = req.body;
    const emailTrimmed = email.trim().toLowerCase();

    const admin = await Admin.findOne({ email: emailTrimmed }).select('+password').populate('session_id', 'year');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const adminObj = admin.toObject ? admin.toObject() : admin;
    delete adminObj.password;
    adminObj.sessionYear = admin.session_id?.year ?? null;

    const token = jwt.sign(
      { userId: admin._id, role: 'Admin' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      admin: adminObj,
    });
  } catch (err) {
    console.error('loginAdmin error:', err);
    return res.status(500).json({
      message: err.message || 'Login failed. Please try again.',
    });
  }
}

const SESSION_YEAR_REGEX = /^\d{4}-\d{4}$/;

function validateSaveSessionBody(body) {
  const required = ['sessionYear', 'department', 'status', 'minCGPA', 'minMembers', 'maxMembers', 'minGroups', 'maxGroups', 'numEvaluations', 'defense1Weightage', 'defense2Weightage'];
  for (const field of required) {
    if (body[field] == null || (typeof body[field] === 'string' && body[field].trim() === '')) {
      return { valid: false, message: `Missing or empty field: ${field}.` };
    }
  }
  const sessionYear = typeof body.sessionYear === 'string' ? body.sessionYear.trim() : String(body.sessionYear);
  if (!SESSION_YEAR_REGEX.test(sessionYear)) {
    return { valid: false, message: 'Session year must be in format YYYY-YYYY (e.g. 2021-2025).' };
  }
  const validStatuses = ['draft', 'active', 'completed'];
  if (!validStatuses.includes(body.status)) {
    return { valid: false, message: 'Invalid status. Must be draft, active, or completed.' };
  }
  return {
    valid: true,
    data: {
      year: sessionYear,
      department: body.department,
      status: body.status,
      minCGPA: Number(body.minCGPA),
      minMembers: Number(body.minMembers),
      maxMembers: Number(body.maxMembers),
      minGroups: Number(body.minGroups),
      maxGroups: Number(body.maxGroups),
      numEvaluation: Number(body.numEvaluations),
      d1Weightage: Number(body.defense1Weightage),
      d2Weightage: Number(body.defense2Weightage),
    },
  };
}

/**
 * POST /api/admins/save-session (protected by auth).
 * If status is active: check session stats; if activeSessions is 1 return error; if 0 increment by 1 and proceed.
 * Then upsert Session by year+department.
 */
export async function saveSession(req, res) {
  try {
    const validation = validateSaveSessionBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { year, department, minCGPA, minMembers, maxMembers, minGroups, maxGroups, numEvaluation, d1Weightage, d2Weightage } = validation.data;


    const existing = await Session.findOne({ year, department });
    let sessionDoc;

    if (existing) {
      
      existing.minCGPA = minCGPA;
      existing.minMembers = minMembers;
      existing.maxMembers = maxMembers;
      existing.minGroups = minGroups;
      existing.maxGroups = maxGroups;
      existing.numEvaluation = numEvaluation;
      existing.d1Weightage = d1Weightage;
      existing.d2Weightage = d2Weightage;
      await existing.save();
      sessionDoc = existing;
    } else {
      sessionDoc = await Session.create({
        year,
        department,
       
        minCGPA,
        minMembers,
        maxMembers,
        minGroups,
        maxGroups,
        numEvaluation,
        d1Weightage,
        d2Weightage,
      });
    }

    return res.status(200).json({
      message: existing ? 'Session updated successfully.' : 'Session created successfully.',
      session: sessionDoc,
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
      return res.status(409).json({ message: 'A session with this year and department already exists.' });
    }
    console.error('saveSession error:', err);
    return res.status(500).json({
      message: err.message || 'Failed to save session. Please try again.',
    });
  }
}