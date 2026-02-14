import mongoose from 'mongoose';
import { Domain } from '../models/Domain.js';

/**
 * GET /api/domains - List all domains (for dropdowns).
 */
export async function getDomains(req, res) {
  try {
    const domains = await Domain.find().sort({ name: 1 }).select('_id name description').lean();
    return res.status(200).json({ domains });
  } catch (err) {
    console.error('getDomains error:', err);
    return res.status(500).json({ message: 'Failed to fetch domains.' });
  }
}

function validateDomainBody(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return { valid: false, message: 'Domain name is required.' };
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  return { valid: true, data: { name, description } };
}

/**
 * POST /api/domains - Create domain (auth required).
 */
export async function createDomain(req, res) {
  try {
    const validation = validateDomainBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    const { name, description } = validation.data;
    const domain = await Domain.create({ name, description });
    return res.status(201).json({ message: 'Domain created successfully.', domain });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A domain with this name already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] || 'Validation failed.', errors: messages });
    }
    console.error('createDomain error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create domain.' });
  }
}

/**
 * PUT /api/domains/:id - Update domain (auth required).
 */
export async function updateDomain(req, res) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid domain id.' });
    }
    const validation = validateDomainBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    const { name, description } = validation.data;
    const domain = await Domain.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found.' });
    }
    return res.status(200).json({ message: 'Domain updated successfully.', domain });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A domain with this name already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] || 'Validation failed.', errors: messages });
    }
    console.error('updateDomain error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update domain.' });
  }
}
