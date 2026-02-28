import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createMessage } from '../controllers/messageController.js';

const router = express.Router();

router.post('/', authMiddleware, createMessage);

export default router;
