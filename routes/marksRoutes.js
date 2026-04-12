import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { toggleShowGradeActiveSession } from '../controllers/marksController.js';

const router = express.Router();

router.post('/toggle-show-grade', authMiddleware, toggleShowGradeActiveSession);

export default router;
