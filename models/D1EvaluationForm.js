import mongoose from 'mongoose';

const d1EvaluationFormSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    understandingOfExistingSystem5: { type: Number, required: true },
    wellDefinedGoalsAndObjectives5: { type: Number, required: true },
    conceptualArchitecture5: { type: Number, required: true },
    presentationSkill5: { type: Number, required: true },
    functionalRequirement2: { type: Number, required: true },
    interfaces2: { type: Number, required: true },
    usecaseDescription2: { type: Number, required: true },
    usecaseDiagram2: { type: Number, required: true },
    nonFunctionalAttribute2: { type: Number, required: true },
    domainModelOrErd2: { type: Number, required: true },
    classDiagramOrDataFlowDiagram2: { type: Number, required: true },
    sequenceDiagramOrStateTransitionDiagram2: { type: Number, required: true },
    stateChartDiagramOrArchitecturalDiagram2: { type: Number, required: true },
    collaborationDiagramOrComponentDiagram2: { type: Number, required: true },
    partialWorkingSystem10: { type: Number, required: true },
    supervisorMarks20: { type: Number, required: true },
    adminMarks10: { type: Number, required: true },
    obtainedMarks80: { type: Number, required: true },
  },
  { timestamps: true }
);

d1EvaluationFormSchema.index({ student_id: 1 });

const D1EvaluationForm = mongoose.model('D1EvaluationForm', d1EvaluationFormSchema);

export { D1EvaluationForm };
export default D1EvaluationForm;

