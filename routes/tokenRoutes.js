import express from 'express';
import { verifyToken } from '../controllers/tokenController.js';

const router = express.Router();

// GET /verify-token?token=...
router.get('/verify-token', verifyToken);

export default router;

