import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getGroupsByAdmin, updateGroupByAdmin, getRegisteredUnassignedGroups, getGroupMembersByGroupId } from '../controllers/groupController.js';

const router = express.Router();

// Admin view of groups needing approval
router.get('/', authMiddleware, getGroupsByAdmin);

// Registered groups for active session where panelAssigned is false
router.get('/registered-unassigned', authMiddleware, getRegisteredUnassignedGroups);

// Group members (students) with rollNo, fullName – for admin (e.g. Give D1 marks)
router.get('/:groupId/members', authMiddleware, getGroupMembersByGroupId);

// Admin updates to a group
router.patch('/:id', authMiddleware, updateGroupByAdmin);

export default router;
