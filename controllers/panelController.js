import mongoose from 'mongoose';
import { Panel } from '../models/Panel.js';
import { Session } from '../models/Session.js';
import { Evaluator } from '../models/Evaluator.js';

/**
 * POST /api/panels/d1 (protected, Admin only).
 * Creates a panel for the active session and ensures selected evaluators are D1 evaluators of the active session.
 * Body: { panelName, members: [evaluatorId, ...] }
 */
export async function createPanelD1(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session. Cannot create a panel.' });
    }

    const { panelName, members } = req.body;
    if (!panelName?.trim()) {
      return res.status(400).json({ message: 'Panel name is required.' });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Please select at least one evaluator.' });
    }

    const ids = [...new Set(members)].filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (ids.length === 0) {
      return res.status(400).json({ message: 'Invalid evaluator IDs.' });
    }

    // Ensure evaluators exist, are D1, and belong to the active session.
    const found = await Evaluator.find({
      _id: { $in: ids },
      session_id: activeSession._id,
      defenseType: 'd1',
    })
      .select('_id')
      .lean();

    if ((found || []).length !== ids.length) {
      return res.status(400).json({ message: 'One or more selected evaluators are not valid for D1 in the active session.' });
    }

    const panel = await Panel.create({
      panelName: panelName.trim(),
      members: ids,
      session_id: activeSession._id,
    });

    return res.status(201).json({
      message: 'Panel created successfully.',
      panel: {
        _id: panel._id,
        panelName: panel.panelName,
        members: panel.members,
        session_id: panel.session_id,
        createdAt: panel.createdAt,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'A panel with this name already exists for the active session.' });
    }
    console.error('createPanelD1 error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create panel.' });
  }
}

