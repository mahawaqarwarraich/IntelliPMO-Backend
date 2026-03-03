import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createMeeting } from '../controllers/meetingController.js';

const router = express.Router();

router.post('/', authMiddleware, createMeeting);

export default router;
