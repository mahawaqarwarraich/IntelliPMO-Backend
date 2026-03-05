import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createDeadline, getDeadlines } from '../controllers/deadlineController.js';

const router = express.Router();

router.get('/', authMiddleware, getDeadlines);
router.post('/', authMiddleware, createDeadline);

export default router;
