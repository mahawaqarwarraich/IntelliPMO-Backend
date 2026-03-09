import mongoose from 'mongoose';

const panelSchema = new mongoose.Schema(
  {
    panelName: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluator',
        required: true,
      },
    ],
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
  },
  { timestamps: true }
);

panelSchema.index({ session_id: 1 });
panelSchema.index({ panelName: 1, session_id: 1 }, { unique: true });

const Panel = mongoose.model('Panel', panelSchema);

export { Panel };
export default Panel;

