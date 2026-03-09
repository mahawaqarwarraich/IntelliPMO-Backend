import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createPanelD1 } from '../controllers/panelController.js';

const router = express.Router();

router.post('/d1', authMiddleware, createPanelD1);

export default router;

