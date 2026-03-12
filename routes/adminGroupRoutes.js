import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getGroupsByAdmin, updateGroupByAdmin, getRegisteredUnassignedGroups } from '../controllers/groupController.js';

const router = express.Router();

// Admin view of groups needing approval
router.get('/', authMiddleware, getGroupsByAdmin);

// Registered groups for active session where panelAssigned is false
router.get('/registered-unassigned', authMiddleware, getRegisteredUnassignedGroups);

// Admin updates to a group
router.patch('/:id', authMiddleware, updateGroupByAdmin);

export default router;
