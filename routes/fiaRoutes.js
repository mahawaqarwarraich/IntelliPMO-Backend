import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { chatWithFIA } from '../controllers/fiaController.js';

const router = express.Router();

router.post('/chat', authMiddleware, chatWithFIA);

export default router;

