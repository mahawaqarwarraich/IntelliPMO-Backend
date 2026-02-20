import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    ideaName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    ideaDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    supervisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supervisor',
      required: true,
    },
   
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    adminStatus: { type: Boolean, default: false },
    adminMessage: { type: String, trim: true, default: '' },
    supervisorStatus: { type: Boolean, default: false },
    supervisorMessage: { type: String, trim: true, default: '' },
    overallStatus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

groupSchema.index({ session_id: 1 });
groupSchema.index({ 'supervisor.id': 1 });

const Group = mongoose.model('Group', groupSchema);

export { Group };
export default Group;
