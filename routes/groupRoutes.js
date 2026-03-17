import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createGroup,
  getGroupByStudentId,
  getAllRegisteredGroups,
  getGroupDetailsById,
  getGroupMembersByGroupId,
} from '../controllers/groupController.js';

const router = express.Router();

router.post('/', authMiddleware, createGroup);
router.get('/registered', authMiddleware, getAllRegisteredGroups);
router.get('/details/:groupId', authMiddleware, getGroupDetailsById);
router.get('/:groupId/members', authMiddleware, getGroupMembersByGroupId);
router.get('/:id', authMiddleware, getGroupByStudentId);

export default router;
