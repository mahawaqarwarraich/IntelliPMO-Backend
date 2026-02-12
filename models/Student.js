import mongoose from 'mongoose';
import { DEPARTMENTS } from './constants.js';

const studentSchema = new mongoose.Schema(
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
    rollNo: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{8}-\d{3}$/,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 4,
      default: null,
    },
    obtainedMarks: {
      type: Number,
      min: 0,
      default: null,
    },
    finalGrade: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

studentSchema.index({ email: 1 });
studentSchema.index({ rollNo: 1 });

const Student = mongoose.model('Student', studentSchema);

export { Student };
export default Student;
