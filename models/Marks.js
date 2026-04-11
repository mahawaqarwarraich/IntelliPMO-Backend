import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: '',
    },
    gpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    showGrade: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Marks = mongoose.model('Marks', marksSchema);

export { Marks };
export default Marks;
