import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createSubmission, getSubmissions } from '../controllers/submissionController.js';

const router = express.Router();

router.get('/', authMiddleware, getSubmissions);
router.post('/', authMiddleware, createSubmission);

export default router;
