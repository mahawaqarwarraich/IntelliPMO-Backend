import express from 'express';
import { registerStudent, loginStudent, getMe } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);

router.get('/me', authMiddleware, getMe);

export default router;
