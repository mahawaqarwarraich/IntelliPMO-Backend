import mongoose from 'mongoose';

const totalObtainedSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0, min: 0 },
    obtained: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const marksSchema = new mongoose.Schema(
  {
    d1: {
      type: totalObtainedSchema,
      default: () => ({ total: 80, obtained: 0 }),
    },
    d2: {
      type: totalObtainedSchema,
      default: () => ({ total: 80, obtained: 0 }),
    },
    d: {
      type: totalObtainedSchema,
      default: () => ({ total: 160, obtained: 0 }),
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
