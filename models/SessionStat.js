import mongoose from 'mongoose';

const sessionStatSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    activeSessions: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const SessionStat = mongoose.model('SessionState', sessionStatSchema);
export { SessionStat };
export default SessionStat;
