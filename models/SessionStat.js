import mongoose from 'mongoose';
import { DEPARTMENTS } from './constants.js';

const sessionStatSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, enum: DEPARTMENTS },
    activeSessions: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

sessionStatSchema.index({ department: 1 }, { unique: true });

const SessionStat = mongoose.model('SessionState', sessionStatSchema);
export { SessionStat };
export default SessionStat;
