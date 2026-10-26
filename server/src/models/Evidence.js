import mongoose from 'mongoose';

const EvidenceSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, evidenceId: { type: String, required: true },
  type: String, title: String, description: String, source: String, occurredAt: Date, content: mongoose.Schema.Types.Mixed,
  relatedSuspectIds: [String], relatedEvidenceIds: [String], clueType: String, importance: String,
  media: { kind: String, url: String, thumbnailUrl: String, mimeType: String, generationStatus: String },
}, { timestamps: true });
EvidenceSchema.index({ caseId: 1, evidenceId: 1 }, { unique: true });
export const Evidence = mongoose.model('Evidence', EvidenceSchema);
