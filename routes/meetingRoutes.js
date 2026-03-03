import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createMeeting, getMeetings, deleteMeeting } from '../controllers/meetingController.js';

const router = express.Router();

router.get('/', authMiddleware, getMeetings);
router.post('/', authMiddleware, createMeeting);
router.delete('/:id', authMiddleware, deleteMeeting);

export default router;
