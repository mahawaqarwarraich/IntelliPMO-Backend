import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createGroup, getGroupByStudentId, getGroupsByStatus } from '../controllers/groupController.js';

const router = express.Router();

router.post('/', authMiddleware, createGroup);
router.get('/status', authMiddleware, getGroupsByStatus);
router.get('/:id', authMiddleware, getGroupByStudentId);

export default router;
