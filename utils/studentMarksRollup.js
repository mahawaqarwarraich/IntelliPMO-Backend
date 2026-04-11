import mongoose from 'mongoose';
import { Marks } from '../models/Marks.js';
import { D1EvaluationForm } from '../models/D1EvaluationForm.js';
import { D2EvaluationForm } from '../models/D2EvaluationForm.js';

/** Max combined marks across D1 + D2 (each form total caps at 80). */
const COMBINED_DEFENSE_MAX = 160;

/**
 * Grading table (percentage = combined obtained / 160 * 100).
 * @param {number} percentage
 * @returns {{ grade: string, gpa: number }}
 */
export function gradeAndGpaFromPercentage(percentage) {
  const p = Number(percentage);
  if (!Number.isFinite(p) || p < 0) {
    return { grade: 'F', gpa: 0 };
  }
  if (p >= 85) return { grade: 'A', gpa: 4.0 };
  if (p >= 80) return { grade: 'A-', gpa: 3.67 };
  if (p >= 75) return { grade: 'B+', gpa: 3.33 };
  if (p >= 70) return { grade: 'B', gpa: 3.0 };
  if (p >= 65) return { grade: 'B-', gpa: 2.67 };
  if (p >= 61) return { grade: 'C+', gpa: 2.33 };
  if (p >= 58) return { grade: 'C', gpa: 2.0 };
  if (p >= 55) return { grade: 'C-', gpa: 1.67 };
  if (p >= 50) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0 };
}

/**
 * Uses each evaluation form's rollup `total.obtainedMarks` only.
 * Combined obtained = D1 total obtained + D2 total obtained.
 * Percentage = (combined / 160) * 100, then grade and GPA from that percentage.
 *
 * @param {string|import('mongoose').Types.ObjectId} studentId
 */
export async function upsertStudentMarksFromEvaluationForms(studentId) {
  if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
    return null;
  }

  const sid = new mongoose.Types.ObjectId(String(studentId));
  const [d1Form, d2Form] = await Promise.all([
    D1EvaluationForm.findOne({ student_id: sid }).lean(),
    D2EvaluationForm.findOne({ student_id: sid }).lean(),
  ]);

  const d1Obtained = Number(d1Form?.total?.obtainedMarks) || 0;
  const d2Obtained = Number(d2Form?.total?.obtainedMarks) || 0;
  const combinedObtained = d1Obtained + d2Obtained;

  const percentage = (combinedObtained / COMBINED_DEFENSE_MAX) * 100;
  const { grade, gpa } = gradeAndGpaFromPercentage(percentage);

  const doc = await Marks.findOneAndUpdate(
    { student_id: sid },
    {
      $setOnInsert: { student_id: sid },
      $set: {
        percentage,
        grade,
        gpa,
      },
      $unset: {
        d1: '',
        d2: '',
        d: '',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return doc;
}
