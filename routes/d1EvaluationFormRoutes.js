import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upsertD1EvaluationForm } from '../controllers/d1EvaluationFormController.js';

const router = express.Router();

// Create or update D1 evaluation form for a student (body: form fields e.g. adminMarks10; param: studentId)
router.patch('/:studentId', authMiddleware, upsertD1EvaluationForm);

export default router;
