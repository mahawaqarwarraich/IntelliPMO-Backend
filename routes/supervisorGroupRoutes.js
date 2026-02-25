import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getGroupsBySupervisor, getGroupsBySupervisorOwn, updateGroupBySupervisor } from '../controllers/groupController.js';

const router = express.Router();

router.get('/own', authMiddleware, getGroupsBySupervisorOwn);
router.get('/', authMiddleware, getGroupsBySupervisor);
router.patch('/:id', authMiddleware, updateGroupBySupervisor);

export default router;