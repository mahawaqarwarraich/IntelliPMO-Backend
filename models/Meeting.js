import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    supervisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supervisor',
      required: true,
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    meetingTitle: {
      type: String,
      required: true,
      trim: true,
    },
    meetingDate: {
      type: Date,
      required: true,
    },
    meetingLocation: {
      type: String,
      required: true,
      trim: true,
    },
    startingTime: {
      type: String,
      required: true,
      trim: true,
    },
    endingTime: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

meetingSchema.index({ supervisor_id: 1 });
meetingSchema.index({ group_id: 1 });
meetingSchema.index({ meetingDate: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

export { Meeting };
export default Meeting;
