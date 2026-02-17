import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDomainsSupervisors } from '../controllers/domainsSupervisorsController.js';

const router = Router();

router.get('/', authMiddleware, getDomainsSupervisors);

export default router;
