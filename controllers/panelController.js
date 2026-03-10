import mongoose from 'mongoose';
import { Panel } from '../models/Panel.js';
import { Session } from '../models/Session.js';
import { Evaluator } from '../models/Evaluator.js';

/**
 * POST /api/panels/:defenseType (protected, Admin only).
 * :defenseType from URL (e.g. /api/panels/d1) must be d1 or d2.
 * Creates a panel for the active session; selected evaluators must match that defense type.
 * Body: { panelName, members: [evaluatorId, ...] }
 */
export async function createPanel(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const rawType = (req.params?.defenseType || '').toLowerCase();
    if (rawType !== 'd1' && rawType !== 'd2') {
      return res.status(400).json({ message: 'Invalid defense type. Use d1 or d2 in the URL (e.g. /api/panels/d1).' });
    }
    const defenseType = rawType;

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

    // Ensure evaluators exist, match the given defense type, and belong to the active session.
    const found = await Evaluator.find({
      _id: { $in: ids },
      session_id: activeSession._id,
      defenseType,
    })
      .select('_id')
      .lean();

    if ((found || []).length !== ids.length) {
      return res.status(400).json({ message: `One or more selected evaluators are not valid for ${defenseType.toUpperCase()} in the active session.` });
    }

    const panel = await Panel.create({
      panelName: panelName.trim(),
      members: ids,
      defenseType,
      session_id: activeSession._id,
      assignedGroups: [],
    });

    return res.status(201).json({
      message: 'Panel created successfully.',
      panel: {
        _id: panel._id,
        panelName: panel.panelName,
        members: panel.members,
        defenseType: panel.defenseType,
        session_id: panel.session_id,
        assignedGroups: panel.assignedGroups,
        createdAt: panel.createdAt,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'A panel with this name already exists for the active session.' });
    }
    console.error('createPanel error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create panel.' });
  }
}

/**
 * GET /api/panels?defenseType=d1|d2 (protected).
 * Returns panels for the active session matching the given defense type.
 * Populates members with evaluator fullName for display. All authenticated users may call this.
 */
export async function getPanels(req, res) {
  try {
    const defenseType = (req.query?.defenseType || '').toLowerCase();
    if (defenseType !== 'd1' && defenseType !== 'd2') {
      return res.status(400).json({ message: 'Query defenseType is required and must be d1 or d2.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(200).json({ panels: [] });
    }

    const panels = await Panel.find({
      session_id: activeSession._id,
      defenseType,
    })
      .select('_id panelName defenseType assignedGroups members')
      .populate('members', 'fullName')
      .populate('assignedGroups', 'ideaName')
      .sort({ panelName: 1 })
      .lean();

    const list = (panels || []).map((p) => ({
      _id: p._id,
      panelName: p.panelName,
      defenseType: p.defenseType,
      assignedGroups: p.assignedGroups,
      assignedGroupNames: (p.assignedGroups || []).map((g) => (g && g.ideaName ? g.ideaName : '—')),
      memberNames: (p.members || []).map((m) => (m && m.fullName ? m.fullName : '—')),
    }));

    return res.status(200).json({ panels: list });
  } catch (err) {
    console.error('getPanels error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch panels.' });
  }
}

/**
 * POST /api/panels/:panelId/assign-groups (protected, Admin only).
 * Body: { groupIds: [groupId, ...] }.
 * Adds the given groups to the panel's assignedGroups array for the active session.
 * Only allows groups that are registered (overallStatus true) in the active session.
 */
export async function assignGroupsToPanel(req, res) {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { panelId } = req.params;
    if (!panelId || !mongoose.Types.ObjectId.isValid(panelId)) {
      return res.status(400).json({ message: 'Invalid panel id.' });
    }

    const activeSession = await Session.findOne({ status: 'active' }).select('_id').lean();
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session. Cannot create assignments.' });
    }

    const panel = await Panel.findOne({ _id: panelId, session_id: activeSession._id }).select('_id').lean();
    if (!panel) {
      return res.status(404).json({ message: 'Panel not found for the active session.' });
    }

    const { groupIds } = req.body;
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ message: 'At least one group id is required.' });
    }

    const uniqueIds = [...new Set(groupIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (uniqueIds.length === 0) {
      return res.status(400).json({ message: 'No valid group ids provided.' });
    }

    // Ensure groups exist, are in the active session, and are registered (overallStatus true).
    const { Group } = await import('../models/Group.js');
    const groups = await Group.find({
      _id: { $in: uniqueIds },
      session_id: activeSession._id,
      overallStatus: true,
    })
      .select('_id')
      .lean();

    if (!groups || groups.length !== uniqueIds.length) {
      return res.status(400).json({ message: 'One or more groups are not valid registered groups in the active session.' });
    }

    const updated = await Panel.findByIdAndUpdate(
      panelId,
      { $addToSet: { assignedGroups: { $each: uniqueIds } } },
      { new: true }
    )
      .select('_id panelName assignedGroups')
      .lean();

    return res.status(200).json({
      message: 'Groups assigned to panel successfully.',
      panel: updated,
    });
  } catch (err) {
    console.error('assignGroupsToPanel error:', err);
    return res.status(500).json({ message: err.message || 'Failed to assign groups to panel.' });
  }
}

