import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { registerAdmin, loginAdmin, saveSession } from '../controllers/adminController.js';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/save-session', authMiddleware, saveSession);

export default router;
