import mongoose from 'mongoose';
import { DEPARTMENTS } from './constants.js';

const supervisorSchema = new mongoose.Schema(
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
    domain_id: {
      type: mongoose.Types.ObjectId,
      ref: 'Domain',
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

supervisorSchema.index({ email: 1 });

const Supervisor = mongoose.model('Supervisor', supervisorSchema);

export { Supervisor };
export default Supervisor;
