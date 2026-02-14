import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDomains, createDomain, updateDomain } from '../controllers/domainController.js';

const router = express.Router();

router.get('/', getDomains);
router.post('/', authMiddleware, createDomain);
router.put('/:id', authMiddleware, updateDomain);

export default router;
