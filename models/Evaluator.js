import mongoose from 'mongoose';
import { DEPARTMENTS } from './constants.js';

const evaluatorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    department: {
      type: String,
      required: true,
      enum: DEPARTMENTS,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
  },
  { timestamps: true }
);

evaluatorSchema.index({ email: 1 });

const Evaluator = mongoose.model('Evaluator', evaluatorSchema);

export { Evaluator };
export default Evaluator;
