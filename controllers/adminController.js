import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { Session } from '../models/Session.js';

const SALT_ROUNDS = 10;

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
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        message: `An admin with this ${field} already exists.`,
      });
    }
    console.error('registerAdmin error:', err);
    return res.status(500).json({
      message: err.message || 'Registration failed. Please try again.',
    });
  }
}
