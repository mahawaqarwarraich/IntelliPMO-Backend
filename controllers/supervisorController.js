import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Supervisor } from '../models/Supervisor.js';
import { Domain } from '../models/Domain.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate required supervisor registration fields.
 * Returns { valid: false, message } or { valid: true }.
 */
function validateRegisterBody(body) {
  const required = ['fullName', 'email', 'password', 'session_id', 'designation', 'domain_id'];
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

    const { fullName, email, password, session_id, designation, domain_id } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const supervisor = await Supervisor.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      designation: designation.trim(),
      session_id: session_id,
      domain_id: domainDoc._id,
    });

    const supervisorObj = supervisor.toObject ? supervisor.toObject() : supervisor;
    delete supervisorObj.password;

    return res.status(201).json({
      message: 'Account created successfully.',
      supervisor: supervisorObj,
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

    const supervisor = await Supervisor.findOne({ email: emailTrimmed }).select('+password').populate('session_id', 'year');
    if (!supervisor) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, supervisor.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const supervisorObj = supervisor.toObject ? supervisor.toObject() : supervisor;
    delete supervisorObj.password;
    supervisorObj.sessionYear = supervisor.session_id?.year ?? null;

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
