// import mongoose from 'mongoose';
// import { D1EvaluationForm } from '../models/D1EvaluationForm.js';
// import { Student } from '../models/Student.js';

// /** All numeric form fields that contribute to obtainedMarks80 (same as in D1EvaluationForm model). */
// const MARK_FIELDS = [
//   'understandingOfExistingSystem5',
//   'wellDefinedGoalsAndObjectives5',
//   'conceptualArchitecture5',
//   'presentationSkill5',
//   'functionalRequirement2',
//   'interfaces2',
//   'usecaseDescription2',
//   'usecaseDiagram2',
//   'nonFunctionalAttribute2',
//   'domainModelOrErd2',
//   'classDiagramOrDataFlowDiagram2',
//   'sequenceDiagramOrStateTransitionDiagram2',
//   'stateChartDiagramOrArchitecturalDiagram2',
//   'collaborationDiagramOrComponentDiagram2',
//   'partialWorkingSystem10',
//   'supervisorMarks20',
//   'adminMarks10',
// ];

// /**
//  * PATCH /api/d1-evaluation-form/:studentId (protected).
//  * Creates or updates the D1 evaluation form for the given student.
//  * Body: any subset of form fields (e.g. { adminMarks10: 8 }). Only fields present in the model are applied.
//  * After create/update, obtainedMarks80 is set to the sum of all mark fields.
//  */
// export async function upsertD1EvaluationForm(req, res) {
//   try {
//     const studentId = req.params.studentId;
//     if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({ message: 'Valid student id is required.' });
//     }

//     const student = await Student.findById(studentId).select('_id').lean();
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }

//     const body = req.body || {};
//     const updates = {};
//     for (const key of MARK_FIELDS) {
//       if (Object.prototype.hasOwnProperty.call(body, key)) {
//         const val = body[key];
//         const num = typeof val === 'number' && Number.isFinite(val) ? val : Number(val);
//         if (Number.isFinite(num) && num >= 0) {
//           updates[key] = num;
//         }
//       }
//     }

//     // If admin has provided adminMarks10 in this request, mark that admin D1 marks have been given for this student.
//     if (Object.prototype.hasOwnProperty.call(updates, 'adminMarks10')) {
//       await Student.findByIdAndUpdate(studentId, { $set: { adminD1Marks: true } }, { new: false });
//     }

//     // If supervisor has provided supervisorMarks20 in this request, mark that supervisor D1 marks have been given for this student.
//     if (Object.prototype.hasOwnProperty.call(updates, 'supervisorMarks20')) {
//       await Student.findByIdAndUpdate(studentId, { $set: { supervisorD1Marks: true } }, { new: false });
//     }

//     let form = await D1EvaluationForm.findOne({ student_id: studentId }).lean();
//     if (!form) {
//       const doc = {
//         student_id: studentId,
//         understandingOfExistingSystem5: 0,
//         wellDefinedGoalsAndObjectives5: 0,
//         conceptualArchitecture5: 0,
//         presentationSkill5: 0,
//         functionalRequirement2: 0,
//         interfaces2: 0,
//         usecaseDescription2: 0,
//         usecaseDiagram2: 0,
//         nonFunctionalAttribute2: 0,
//         domainModelOrErd2: 0,
//         classDiagramOrDataFlowDiagram2: 0,
//         sequenceDiagramOrStateTransitionDiagram2: 0,
//         stateChartDiagramOrArchitecturalDiagram2: 0,
//         collaborationDiagramOrComponentDiagram2: 0,
//         partialWorkingSystem10: 0,
//         supervisorMarks20: 0,
//         adminMarks10: 0,
//         obtainedMarks80: 0,
//       };
//       for (const [k, v] of Object.entries(updates)) {
//         doc[k] = v;
//       }
//       let total = 0;
//       for (const f of MARK_FIELDS) {
//         total += Number(doc[f]) || 0;
//       }
//       doc.obtainedMarks80 = total;
//       form = await D1EvaluationForm.create(doc);
//     } else {
//       const toSet = { ...updates };
//       let total = 0;
//       for (const f of MARK_FIELDS) {
//         const v = toSet[f] !== undefined ? toSet[f] : form[f];
//         total += Number(v) || 0;
//       }
//       toSet.obtainedMarks80 = total;
//       form = await D1EvaluationForm.findOneAndUpdate(
//         { student_id: studentId },
//         { $set: toSet },
//         { new: true }
//       ).lean();
//     }

//     return res.status(200).json({
//       message: form ? 'D1 evaluation form updated.' : 'D1 evaluation form created.',
//       form: {
//         _id: form._id,
//         student_id: form.student_id,
//         obtainedMarks80: form.obtainedMarks80,
//         ...Object.fromEntries(MARK_FIELDS.map((f) => [f, form[f]])),
//       },
//     });
//   } catch (err) {
//     console.error('upsertD1EvaluationForm error:', err);
//     return res.status(500).json({ message: err.message || 'Failed to save D1 evaluation form.' });
//   }
// }

import mongoose from 'mongoose';
import { D1EvaluationForm } from '../models/D1EvaluationForm.js';
import { Student } from '../models/Student.js';
import { upsertStudentMarksFromEvaluationForms } from '../utils/studentMarksRollup.js';

/**
 * New-model criteria keys where each field has:
 * { maxMarks: Number, obtainedMarks: Number }
 */
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

/** Rubric keys that make up evaluatorMarks (stored like supervisor/admin: subdocs + rollup). */
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
 * PATCH /api/d1-evaluation-form/:studentId (protected).
 * Upserts D1 form for the new model shape where each criterion has maxMarks and obtainedMarks.
 *
 * Supported body formats per criterion:
 * - { adminMarks: 8 } -> sets adminMarks.obtainedMarks = 8
 * - { adminMarks: { obtainedMarks: 8 } } -> same
 * - { adminMarks: { maxMarks: 10, obtainedMarks: 8 } } -> updates both
 */
export async function upsertD1EvaluationForm(req, res) {
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

      // Allow { key: number } shorthand for obtained marks.
      if (typeof incoming === 'number' || typeof incoming === 'string') {
        const obtained = toNonNegativeNumber(incoming);
        if (obtained !== null) {
          setOps[`${key}.obtainedMarks`] = obtained;
          touchedKeys.add(key);
        }
        continue;
      }

      // Allow object shape { obtainedMarks, maxMarks }.
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

    // Keep role-completion flags on Student in sync.
    if (touchedKeys.has('adminMarks')) {
      await Student.findByIdAndUpdate(studentId, { $set: { adminD1Marks: true } }, { new: false });
    }
    if (touchedKeys.has('supervisorMarks')) {
      await Student.findByIdAndUpdate(studentId, { $set: { supervisorD1Marks: true } }, { new: false });
    }
    const touchedEvaluatorRubric = [...touchedKeys].some((k) => EVALUATOR_RUBRIC_KEYS.includes(k));
    if (touchedEvaluatorRubric) {
      await Student.findByIdAndUpdate(studentId, { $set: { evaluatorD1Marks: true } }, { new: false });
    }

    // Upsert the form with incoming field updates first.
    let form = await D1EvaluationForm.findOneAndUpdate(
      { student_id: studentId },
      {
        $setOnInsert: { student_id: studentId },
        ...(Object.keys(setOps).length ? { $set: setOps } : {}),
      },
      { upsert: true, new: true }
    ).lean();

    // Recalculate total.obtainedMarks from all criterion obtained marks (cap at total.maxMarks, default 80).
    let sum = 0;
    for (const key of CRITERIA_KEYS) {
      sum += Number(form?.[key]?.obtainedMarks) || 0;
    }
    const maxTotal = Number(form?.total?.maxMarks);
    const cap = Number.isFinite(maxTotal) && maxTotal > 0 ? maxTotal : 80;
    const obtainedTotal = Math.min(sum, cap);

    // Evaluator rollup (same pattern as supervisorMarks / adminMarks: { maxMarks, obtainedMarks }).
    let evaluatorObtained = 0;
    for (const key of EVALUATOR_RUBRIC_KEYS) {
      evaluatorObtained += Number(form?.[key]?.obtainedMarks) || 0;
    }
    evaluatorObtained = Math.min(evaluatorObtained, EVALUATOR_MARKS_MAX);

    form = await D1EvaluationForm.findOneAndUpdate(
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
      console.error('upsertStudentMarksFromEvaluationForms (D1) error:', marksErr);
    }

    return res.status(200).json({
      message: 'D1 evaluation form upserted successfully.',
      form,
    });
  } catch (err) {
    console.error('upsertD1EvaluationForm error:', err);
    return res.status(500).json({ message: err.message || 'Failed to save D1 evaluation form.' });
  }
}