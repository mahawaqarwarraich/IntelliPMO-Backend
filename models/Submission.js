import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    deadline_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deadline',
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['on time', 'late'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ student_id: 1, deadline_id: 1 });
submissionSchema.index({ deadline_id: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

export { Submission };
export default Submission;
