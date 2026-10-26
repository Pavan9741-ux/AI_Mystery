import mongoose from 'mongoose';

const CanonicalSolutionSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
  solution: { type: mongoose.Schema.Types.Mixed, required: true, select: false },
}, { timestamps: true });
export const CanonicalSolution = mongoose.model('CanonicalSolution', CanonicalSolutionSchema);
