import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDomains, createDomain, updateDomain, deleteDomain } from '../controllers/domainController.js';

const router = express.Router();

router.get('/', getDomains);
router.post('/', authMiddleware, createDomain);
router.put('/:id', authMiddleware, updateDomain);
router.delete('/:id', authMiddleware, deleteDomain);

export default router;
