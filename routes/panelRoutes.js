import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createPanel } from '../controllers/panelController.js';

const router = express.Router();

router.post('/:defenseType', authMiddleware, createPanel);

export default router;

