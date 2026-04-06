import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
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
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    rollNo: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{8}-\d{3}$/,
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
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
    adminD1Marks: {
      type: Boolean,
      default: false,
    },
    supervisorD1Marks: {
      type: Boolean,
      default: false,
    },
    evaluatorD1Marks: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);

export { Student };
export default Student;
