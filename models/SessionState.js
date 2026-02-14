import mongoose from 'mongoose';
import { DEPARTMENTS } from './constants.js';

const sessionStateSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, enum: DEPARTMENTS },
    activeSessions: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

sessionStateSchema.index({ department: 1 }, { unique: true });

const SessionState = mongoose.model('SessionState', sessionStateSchema);
export { SessionState };
export default SessionState;
