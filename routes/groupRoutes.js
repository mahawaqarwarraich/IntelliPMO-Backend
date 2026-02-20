import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createGroup } from '../controllers/groupController.js';

const router = express.Router();

router.post('/', authMiddleware, createGroup);

export default router;
