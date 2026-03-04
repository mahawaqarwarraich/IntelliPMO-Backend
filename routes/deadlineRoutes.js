import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createDeadline } from '../controllers/deadlineController.js';

const router = express.Router();

router.post('/', authMiddleware, createDeadline);

export default router;
