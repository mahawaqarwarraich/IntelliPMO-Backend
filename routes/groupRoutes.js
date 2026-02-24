import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createGroup, getGroupByStudentId, getGroupsByStatus, updateGroupByAdmin } from '../controllers/groupController.js';

const router = express.Router();

router.post('/', authMiddleware, createGroup);
router.get('/status', authMiddleware, getGroupsByStatus);
router.patch('/:id', authMiddleware, updateGroupByAdmin);
router.get('/:id', authMiddleware, getGroupByStudentId);

export default router;
