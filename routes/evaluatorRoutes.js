import express from 'express';
import { registerEvaluator, loginEvaluator, getAllEvaluators, deleteEvaluator } from '../controllers/evaluatorController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerEvaluator);
router.post('/login', loginEvaluator);

router.get('/', authMiddleware, getAllEvaluators);
router.delete('/:id', authMiddleware, deleteEvaluator);

export default router;
