import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createPanel, getPanels, assignGroupsToPanel } from '../controllers/panelController.js';

const router = express.Router();

// Get panels for the active session by defense type (e.g. d1)
router.get('/', authMiddleware, getPanels);

// Create a new panel for the active session (d1 or d2 in URL param)
router.post('/:defenseType', authMiddleware, createPanel);

// Assign groups to a panel (stored in panel.assignedGroups)
router.post('/:panelId/assign-groups', authMiddleware, assignGroupsToPanel);

export default router;

