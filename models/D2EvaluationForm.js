import mongoose from 'mongoose';

const markFieldSchema = new mongoose.Schema(
  {
    maxMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const d2EvaluationFormSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    presentation: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 10, obtainedMarks: 0 }),
    },
    completeWorkingSystem: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 40, obtainedMarks: 0 }),
    },
    supervisorMarks: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 20, obtainedMarks: 0 }),
    },
    adminMarks: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 10, obtainedMarks: 0 }),
    },
    evaluatorMarks: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 50, obtainedMarks: 0 }),
    },
    total: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 80, obtainedMarks: 0 }),
    },
  },
  { timestamps: true }
);

d2EvaluationFormSchema.index({ student_id: 1 });

const D2EvaluationForm = mongoose.model('D2EvaluationForm', d2EvaluationFormSchema);

export { D2EvaluationForm };
export default D2EvaluationForm;

