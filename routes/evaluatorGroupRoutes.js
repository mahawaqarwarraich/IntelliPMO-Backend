import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getGroupsByEvaluatorOwn } from '../controllers/groupController.js';

const router = express.Router();

// Evaluator view: groups assigned to their D1 panels (active session only).
router.get('/own', authMiddleware, getGroupsByEvaluatorOwn);

export default router;

