import mongoose from 'mongoose';
import { D2EvaluationForm } from '../models/D2EvaluationForm.js';
import { Student } from '../models/Student.js';
import { upsertStudentMarksFromEvaluationForms } from '../utils/studentMarksRollup.js';

const CRITERIA_KEYS = [
  'understandingOfExistingSystem',
  'wellDefinedGoalsAndObjectives',
  'conceptualArchitecture',
  'presentationSkill',
  'functionalRequirement',
  'interfaces',
  'usecaseDescription',
  'usecaseDiagram',
  'nonFunctionalAttribute',
  'domainModelOrErd',
  'classDiagramOrDataFlowDiagram',
  'sequenceDiagramOrStateTransitionDiagram',
  'stateChartDiagramOrArchitecturalDiagram',
  'collaborationDiagramOrComponentDiagram',
  'partialWorkingSystem',
  'supervisorMarks',
  'adminMarks',
];

const EVALUATOR_RUBRIC_KEYS = [
  'understandingOfExistingSystem',
  'wellDefinedGoalsAndObjectives',
  'conceptualArchitecture',
  'presentationSkill',
  'functionalRequirement',
  'interfaces',
  'usecaseDescription',
  'usecaseDiagram',
  'nonFunctionalAttribute',
  'domainModelOrErd',
  'classDiagramOrDataFlowDiagram',
  'sequenceDiagramOrStateTransitionDiagram',
  'stateChartDiagramOrArchitecturalDiagram',
  'collaborationDiagramOrComponentDiagram',
  'partialWorkingSystem',
];

const EVALUATOR_MARKS_MAX = 52;

function toNonNegativeNumber(v) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * PATCH /api/d2-evaluation-form/:studentId (protected).
 * Upserts D2 evaluation form (same shape as D1) and updates Student completion flags for D2.
 */
export async function upsertD2EvaluationForm(req, res) {
  try {
    const studentId = req.params.studentId;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Valid student id is required.' });
    }

    const student = await Student.findById(studentId).select('_id').lean();
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const body = req.body || {};
    const setOps = {};
    const touchedKeys = new Set();

    for (const key of CRITERIA_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
      const incoming = body[key];

      if (typeof incoming === 'number' || typeof incoming === 'string') {
        const obtained = toNonNegativeNumber(incoming);
        if (obtained !== null) {
          setOps[`${key}.obtainedMarks`] = obtained;
          touchedKeys.add(key);
        }
        continue;
      }

      if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
        const obtained = toNonNegativeNumber(incoming.obtainedMarks);
        const max = toNonNegativeNumber(incoming.maxMarks);
        if (obtained !== null) {
          setOps[`${key}.obtainedMarks`] = obtained;
          touchedKeys.add(key);
        }
        if (max !== null) {
          setOps[`${key}.maxMarks`] = max;
          touchedKeys.add(key);
        }
      }
    }

    if (touchedKeys.has('adminMarks')) {
      await Student.findByIdAndUpdate(studentId, { $set: { adminD2Marks: true } }, { new: false });
    }
    if (touchedKeys.has('supervisorMarks')) {
      await Student.findByIdAndUpdate(studentId, { $set: { supervisorD2Marks: true } }, { new: false });
    }
    const touchedEvaluatorRubric = [...touchedKeys].some((k) => EVALUATOR_RUBRIC_KEYS.includes(k));
    if (touchedEvaluatorRubric) {
      await Student.findByIdAndUpdate(studentId, { $set: { evaluatorD2Marks: true } }, { new: false });
    }

    let form = await D2EvaluationForm.findOneAndUpdate(
      { student_id: studentId },
      {
        $setOnInsert: { student_id: studentId },
        ...(Object.keys(setOps).length ? { $set: setOps } : {}),
      },
      { upsert: true, new: true }
    ).lean();

    let sum = 0;
    for (const key of CRITERIA_KEYS) {
      sum += Number(form?.[key]?.obtainedMarks) || 0;
    }
    const maxTotal = Number(form?.total?.maxMarks);
    const cap = Number.isFinite(maxTotal) && maxTotal > 0 ? maxTotal : 80;
    const obtainedTotal = Math.min(sum, cap);

    let evaluatorObtained = 0;
    for (const key of EVALUATOR_RUBRIC_KEYS) {
      evaluatorObtained += Number(form?.[key]?.obtainedMarks) || 0;
    }
    evaluatorObtained = Math.min(evaluatorObtained, EVALUATOR_MARKS_MAX);

    form = await D2EvaluationForm.findOneAndUpdate(
      { student_id: studentId },
      {
        $set: {
          'total.maxMarks': cap,
          'total.obtainedMarks': obtainedTotal,
          'evaluatorMarks.maxMarks': EVALUATOR_MARKS_MAX,
          'evaluatorMarks.obtainedMarks': evaluatorObtained,
        },
      },
      { new: true }
    ).lean();

    try {
      await upsertStudentMarksFromEvaluationForms(studentId);
    } catch (marksErr) {
      console.error('upsertStudentMarksFromEvaluationForms (D2) error:', marksErr);
    }

    return res.status(200).json({
      message: 'D2 evaluation form upserted successfully.',
      form,
    });
  } catch (err) {
    console.error('upsertD2EvaluationForm error:', err);
    return res.status(500).json({ message: err.message || 'Failed to save D2 evaluation form.' });
  }
}

