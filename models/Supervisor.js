import mongoose from 'mongoose';

const supervisorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    domain_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Domain',
      required: true,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

supervisorSchema.index({ email: 1, session_id: 1 }, { unique: true });

const Supervisor = mongoose.model('Supervisor', supervisorSchema);

export { Supervisor };
export default Supervisor;
