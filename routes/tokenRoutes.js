import express from 'express';
import { verifyToken, setPassword } from '../controllers/tokenController.js';

const router = express.Router();

// GET /verify-token?token=...
router.get('/verify-token', verifyToken);

// POST /set-password
router.post('/set-password', setPassword);

export default router;

