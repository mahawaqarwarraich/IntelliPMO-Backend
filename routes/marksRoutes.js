import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMyFypGrade, getShowGradeStatusActiveSession, toggleShowGradeActiveSession } from '../controllers/marksController.js';

const router = express.Router();

router.get('/my-fyp-grade', authMiddleware, getMyFypGrade);
router.get('/show-grade-status', authMiddleware, getShowGradeStatusActiveSession);
router.post('/toggle-show-grade', authMiddleware, toggleShowGradeActiveSession);

export default router;
