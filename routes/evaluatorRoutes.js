import express from 'express';
import { registerEvaluator, loginEvaluator } from '../controllers/evaluatorController.js';

const router = express.Router();

router.post('/register', registerEvaluator);
router.post('/login', loginEvaluator);

export default router;
