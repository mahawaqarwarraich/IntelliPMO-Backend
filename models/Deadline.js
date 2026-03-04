import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema(
  {
    deadlineName: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    dueTime: {
      type: String,
      required: true,
      trim: true,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

deadlineSchema.index({ session_id: 1 });
deadlineSchema.index({ dueDate: 1 });

const Deadline = mongoose.model('Deadline', deadlineSchema);

export { Deadline };
export default Deadline;
