import mongoose from 'mongoose';

const InvestigationProgressSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, sessionId: { type: String, required: true, index: true },
  reviewedEvidenceIds: { type: [String], default: [] }, bookmarkedEvidenceIds: { type: [String], default: [] },
  shortlistedSuspectIds: { type: [String], default: [] }, notes: { type: String, maxlength: 5000, default: '' },
  hintsUsed: { type: [Number], default: [] }, attempt: { type: mongoose.Schema.Types.Mixed, default: null }, completedAt: Date,
}, { timestamps: true });
InvestigationProgressSchema.index({ caseId: 1, sessionId: 1 }, { unique: true });

export const InvestigationProgress = mongoose.model('InvestigationProgress', InvestigationProgressSchema);
