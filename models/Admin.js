import mongoose from 'mongoose';
import { DEPARTMENTS } from './constants.js';

const adminSchema = new mongoose.Schema(
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
      trim: true,
      default: null,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Session',
    },
  },
  { timestamps: true }
);

adminSchema.index({ email: 1 });

const Admin = mongoose.model('Admin', adminSchema);

export { Admin };
export default Admin;
