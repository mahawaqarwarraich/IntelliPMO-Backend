import mongoose from 'mongoose';

const evaluatorSchema = new mongoose.Schema(
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
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    defenseType: {
      type: String,
      required: true,
      enum: ['d1', 'd2'],
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

evaluatorSchema.index({ email: 1, session_id: 1 }, { unique: true });

const Evaluator = mongoose.model('Evaluator', evaluatorSchema);

export { Evaluator };
export default Evaluator;
