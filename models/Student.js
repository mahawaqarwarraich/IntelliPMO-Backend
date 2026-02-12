import mongoose from 'mongoose';
import { User } from './User.js';

const studentSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true, unique: true, match: /^\d{8}-\d{3}$/ },
    session: { type: String, required: true, match: /^\d{4}-\d{4}$/ },
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    cgpa: { type: Number, min: 0, max: 4, default: null },
    obtainedMarks: { type: Number, min: 0, default: null },
    finalGrade: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const Student = User.discriminator('Student', studentSchema);

export { Student };
export default Student;
