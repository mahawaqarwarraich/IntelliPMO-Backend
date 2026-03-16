import mongoose from 'mongoose';

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

d1EvaluationFormSchema.index({ student_id: 1 });

const D1EvaluationForm = mongoose.model('D1EvaluationForm', d1EvaluationFormSchema);

export { D1EvaluationForm };
export default D1EvaluationForm;

