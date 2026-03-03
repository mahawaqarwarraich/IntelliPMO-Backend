import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createMeeting, getMeetings } from '../controllers/meetingController.js';

const router = express.Router();

router.get('/', authMiddleware, getMeetings);
router.post('/', authMiddleware, createMeeting);

export default router;
