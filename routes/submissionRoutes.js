import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createSubmission } from '../controllers/submissionController.js';

const router = express.Router();

router.post('/', authMiddleware, createSubmission);

export default router;
