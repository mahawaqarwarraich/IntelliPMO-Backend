import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upsertD2EvaluationForm } from '../controllers/d2EvaluationFormController.js';

const router = express.Router();

router.patch('/:studentId', authMiddleware, upsertD2EvaluationForm);

export default router;

