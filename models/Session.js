import mongoose from 'mongoose';
import { DEPARTMENTS } from './constants.js';

const sessionSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, match: /^\d{4}-\d{4}$/ },
    department: { type: String, required: true, enum: DEPARTMENTS },
    minMembers: { type: Number, required: true, min: 1 },
    maxMembers: { type: Number, required: true, min: 1 },
    minGroups: { type: Number, required: true, min: 0 },
    maxGroups: { type: Number, required: true, min: 0 },
    minCGPA: { type: Number, required: true, min: 0, max: 4 },
    numEvaluation: { type: Number, required: true, min: 0 },
    d1Weightage: { type: Number, required: true, min: 0, max: 100 },
    d2Weightage: { type: Number, required: true, min: 0, max: 100 },
    status: { type: String, required: true, enum: ['draft', 'active', 'inactive'], default: 'inactive' },
  },
  { timestamps: true }
);

sessionSchema.index({ year: 1, department: 1 }, { unique: true });

const Session = mongoose.model('Session', sessionSchema);
export { Session };
export default Session;
