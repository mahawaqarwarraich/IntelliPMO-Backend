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
    evaluatorMarks: {
      type: markFieldSchema,
      default: () => ({ maxMarks: 52, obtainedMarks: 0 }),
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

