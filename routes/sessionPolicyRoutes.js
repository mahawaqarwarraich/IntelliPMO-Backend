import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getSessionPolicy } from '../controllers/sessionPolicyController.js';

const router = express.Router();

router.get('/', authMiddleware, getSessionPolicy);

export default router;
