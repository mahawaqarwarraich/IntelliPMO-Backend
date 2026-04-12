import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMyFypGrade, toggleShowGradeActiveSession } from '../controllers/marksController.js';

const router = express.Router();

router.get('/my-fyp-grade', authMiddleware, getMyFypGrade);
router.post('/toggle-show-grade', authMiddleware, toggleShowGradeActiveSession);

export default router;
