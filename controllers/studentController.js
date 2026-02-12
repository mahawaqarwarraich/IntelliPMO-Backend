import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Student } from '../models/Student.js';
import { Session } from '../models/Session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

const SALT_ROUNDS = 10;

/**
 * Validate required registration fields.
 * Returns { valid: false, message } or { valid: true }.
 */
function validateRegisterBody(body) {
  const required = ['fullName', 'department', 'rollNo', 'cgpa', 'email', 'password', 'session'];
  for (const field of required) {
    if (body[field] == null || (typeof body[field] === 'string' && body[field].trim() === '')) {
      return { valid: false, message: `Missing or empty field: ${field}.` };
    }
  }
  const cgpa = Number(body.cgpa);
  if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
    return { valid: false, message: 'CGPA must be a number between 0 and 4.' };
  }
  if (typeof body.session !== 'string' || !/^\d{4}-\d{4}$/.test(body.session.trim())) {
    return { valid: false, message: 'Session must be in format YYYY-YYYY (e.g. 2021-2025).' };
  }
  if (typeof body.rollNo !== 'string' || !/^\d{8}-\d{3}$/.test(body.rollNo.trim())) {
    return { valid: false, message: 'Roll number must be in format 21011519-085.' };
  }
  return { valid: true };
}

export async function registerStudent(req, res) {
  try {
    const validation = validateRegisterBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fullName, department, rollNo, cgpa, email, password, session } = req.body;
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

    if (sessionDoc.status !== 'active') {
      return res.status(400).json({
        message: `Session "${sessionDoc.year}" not active yet.`,
      });
    }

    const cgpaNum = Number(cgpa);
    if (cgpaNum < sessionDoc.minCGPA) {
      return res.status(400).json({
        message: `Only students with CGPA from ${sessionDoc.minCGPA} to 4 can register to the system.`,
      });
    }

    const existingEmail = await Student.findOne({ email: email.trim().toLowerCase() }).select('_id');
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const existingRollNo = await Student.findOne({ rollNo: rollNo }).select('_id');
    if (existingRollNo) {
      return res.status(409).json({ message: 'An account with this roll number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const student = await Student.create({
      fullName: fullName.trim(),
      department: departmentTrimmed,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      rollNo: rollNo.trim(),
      session: sessionYear,
      session_id: sessionDoc._id,
      cgpa: cgpaNum,
    });

 

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
        message: 'An account with this email or roll number already exists.',
      });
    }
    console.error('registerStudent error:', err);
    return res.status(500).json({
      message: err.message || 'Registration failed. Please try again.',
    });
  }
}

/**
 * Validate required login fields.
 * Returns { valid: false, message } or { valid: true }.
 */
function validateLoginBody(body) {
  if (body.rollNo == null || (typeof body.rollNo === 'string' && body.rollNo.trim() === '')) {
    return { valid: false, message: 'Roll number is required.' };
  }
  if (body.password == null || (typeof body.password === 'string' && body.password.trim() === '')) {
    return { valid: false, message: 'Password is required.' };
  }
  if (typeof body.rollNo !== 'string' || !/^\d{8}-\d{3}$/.test(body.rollNo.trim())) {
    return { valid: false, message: 'Roll number must be in format 21011519-085.' };
  }
  return { valid: true };
}

export async function loginStudent(req, res) {
  try {
    const validation = validateLoginBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { rollNo, password } = req.body;
    const rollNoTrimmed = rollNo.trim();

    const student = await Student.findOne({ rollNo: rollNoTrimmed }).select('+password');
    if (!student) {
      return res.status(401).json({ message: 'Invalid roll number or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, student.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid roll number or password.' });
    }

    const studentObj = student.toObject ? student.toObject() : student;
    delete studentObj.password;

    const token = jwt.sign(
      { userId: student._id, role: 'Student' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      student: studentObj,
    });
  } catch (err) {
    console.error('loginStudent error:', err);
    return res.status(500).json({
      message: err.message || 'Login failed. Please try again.',
    });
  }
}

/**
 * Get current logged-in student. Requires auth middleware (req.user set from token).
 */
export async function getMe(req, res) {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const student = await Student.findById(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const studentObj = student.toObject ? student.toObject() : student;
    delete studentObj.password;

    return res.status(200).json({ student: studentObj });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
}