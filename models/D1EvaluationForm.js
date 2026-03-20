import mongoose from 'mongoose';

/*
Old model (kept commented as requested)
const d1EvaluationFormSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    understandingOfExistingSystem5: { type: Number, default: 0 },
    wellDefinedGoalsAndObjectives5: { type: Number, default: 0 },
    conceptualArchitecture5: { type: Number, default: 0 },
    presentationSkill5: { type: Number, default: 0 },
    functionalRequirement2: { type: Number, default: 0 },
    interfaces2: { type: Number, default: 0 },
    usecaseDescription2: { type: Number, default: 0 },
    usecaseDiagram2: { type: Number, default: 0 },
    nonFunctionalAttribute2: { type: Number, default: 0 },
    domainModelOrErd2: { type: Number, default: 0 },
    classDiagramOrDataFlowDiagram2: { type: Number, default: 0 },
    sequenceDiagramOrStateTransitionDiagram2: { type: Number, default: 0 },
    stateChartDiagramOrArchitecturalDiagram2: { type: Number, default: 0 },
    collaborationDiagramOrComponentDiagram2: { type: Number, default: 0 },
    partialWorkingSystem10: { type: Number, default: 0 },
    supervisorMarks20: { type: Number, default: 0 },
    adminMarks10: { type: Number, default: 0 },
    obtainedMarks80: { type: Number, default: 0 },
  },
  { timestamps: true }
);
*/

const markFieldSchema = new mongoose.Schema(
  {
    maxMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const d1EvaluationFormSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    understandingOfExistingSystem: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 5, obtainedMarks: 0 }),
    },
    wellDefinedGoalsAndObjectives: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 5, obtainedMarks: 0 }),
    },
    conceptualArchitecture: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 5, obtainedMarks: 0 }),
    },
    presentationSkill: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 5, obtainedMarks: 0 }),
    },
    functionalRequirement: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    interfaces: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    usecaseDescription: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    usecaseDiagram: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    nonFunctionalAttribute: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    domainModelOrErd: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    classDiagramOrDataFlowDiagram: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    sequenceDiagramOrStateTransitionDiagram: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    stateChartDiagramOrArchitecturalDiagram: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    collaborationDiagramOrComponentDiagram: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 2, obtainedMarks: 0 }),
    },
    partialWorkingSystem: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 10, obtainedMarks: 0 }),
    },
    supervisorMarks: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 20, obtainedMarks: 0 }),
    },
    adminMarks: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 10, obtainedMarks: 0 }),
    },
    total: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 80, obtainedMarks: 0 }),
    },
  },
  { timestamps: true }
);

d1EvaluationFormSchema.index({ student_id: 1 });

const D1EvaluationForm = mongoose.model('D1EvaluationForm', d1EvaluationFormSchema);

export { D1EvaluationForm };
export default D1EvaluationForm;

