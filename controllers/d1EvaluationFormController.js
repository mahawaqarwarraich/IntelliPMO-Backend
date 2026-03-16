import mongoose from 'mongoose';
import { D1EvaluationForm } from '../models/D1EvaluationForm.js';
import { Student } from '../models/Student.js';

/** All numeric form fields that contribute to obtainedMarks80 (same as in D1EvaluationForm model). */
const MARK_FIELDS = [
  'understandingOfExistingSystem5',
  'wellDefinedGoalsAndObjectives5',
  'conceptualArchitecture5',
  'presentationSkill5',
  'functionalRequirement2',
  'interfaces2',
  'usecaseDescription2',
  'usecaseDiagram2',
  'nonFunctionalAttribute2',
  'domainModelOrErd2',
  'classDiagramOrDataFlowDiagram2',
  'sequenceDiagramOrStateTransitionDiagram2',
  'stateChartDiagramOrArchitecturalDiagram2',
  'collaborationDiagramOrComponentDiagram2',
  'partialWorkingSystem10',
  'supervisorMarks20',
  'adminMarks10',
];

/**
 * PATCH /api/d1-evaluation-form/:studentId (protected).
 * Creates or updates the D1 evaluation form for the given student.
 * Body: any subset of form fields (e.g. { adminMarks10: 8 }). Only fields present in the model are applied.
 * After create/update, obtainedMarks80 is set to the sum of all mark fields.
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
    const updates = {};
    for (const key of MARK_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        const val = body[key];
        const num = typeof val === 'number' && Number.isFinite(val) ? val : Number(val);
        if (Number.isFinite(num) && num >= 0) {
          updates[key] = num;
        }
      }
    }

    // If admin has provided adminMarks10 in this request, mark that admin D1 marks have been given for this student.
    if (Object.prototype.hasOwnProperty.call(updates, 'adminMarks10')) {
      await Student.findByIdAndUpdate(studentId, { $set: { adminD1Marks: true } }, { new: false });
    }

    let form = await D1EvaluationForm.findOne({ student_id: studentId }).lean();
    if (!form) {
      const doc = {
        student_id: studentId,
        understandingOfExistingSystem5: 0,
        wellDefinedGoalsAndObjectives5: 0,
        conceptualArchitecture5: 0,
        presentationSkill5: 0,
        functionalRequirement2: 0,
        interfaces2: 0,
        usecaseDescription2: 0,
        usecaseDiagram2: 0,
        nonFunctionalAttribute2: 0,
        domainModelOrErd2: 0,
        classDiagramOrDataFlowDiagram2: 0,
        sequenceDiagramOrStateTransitionDiagram2: 0,
        stateChartDiagramOrArchitecturalDiagram2: 0,
        collaborationDiagramOrComponentDiagram2: 0,
        partialWorkingSystem10: 0,
        supervisorMarks20: 0,
        adminMarks10: 0,
        obtainedMarks80: 0,
      };
      for (const [k, v] of Object.entries(updates)) {
        doc[k] = v;
      }
      let total = 0;
      for (const f of MARK_FIELDS) {
        total += Number(doc[f]) || 0;
      }
      doc.obtainedMarks80 = total;
      form = await D1EvaluationForm.create(doc);
    } else {
      const toSet = { ...updates };
      let total = 0;
      for (const f of MARK_FIELDS) {
        const v = toSet[f] !== undefined ? toSet[f] : form[f];
        total += Number(v) || 0;
      }
      toSet.obtainedMarks80 = total;
      form = await D1EvaluationForm.findOneAndUpdate(
        { student_id: studentId },
        { $set: toSet },
        { new: true }
      ).lean();
    }

    return res.status(200).json({
      message: form ? 'D1 evaluation form updated.' : 'D1 evaluation form created.',
      form: {
        _id: form._id,
        student_id: form.student_id,
        obtainedMarks80: form.obtainedMarks80,
        ...Object.fromEntries(MARK_FIELDS.map((f) => [f, form[f]])),
      },
    });
  } catch (err) {
    console.error('upsertD1EvaluationForm error:', err);
    return res.status(500).json({ message: err.message || 'Failed to save D1 evaluation form.' });
  }
}
