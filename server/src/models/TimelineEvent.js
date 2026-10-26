import mongoose from 'mongoose';

const TimelineEventSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, eventId: { type: String, required: true },
  timestamp: Date, description: String, certainty: { type: String, enum: ['CONFIRMED','CLAIMED','INFERRED','UNCERTAIN'] },
  sourceEvidenceIds: [String], involvedSuspectIds: [String],
}, { timestamps: true });
TimelineEventSchema.index({ caseId: 1, eventId: 1 }, { unique: true });
export const TimelineEvent = mongoose.model('TimelineEvent', TimelineEventSchema);
