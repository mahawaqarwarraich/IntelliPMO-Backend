import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createGroup, getGroupByStudentId } from '../controllers/groupController.js';

const router = express.Router();

router.post('/', authMiddleware, createGroup)
router.get('/:id', authMiddleware, getGroupByStudentId);

export default router;
