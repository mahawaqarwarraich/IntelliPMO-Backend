import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createMessage, getMessagesByGroupId } from '../controllers/messageController.js';

const router = express.Router();

router.get('/:groupId', authMiddleware, getMessagesByGroupId);
router.post('/', authMiddleware, createMessage);

export default router;
