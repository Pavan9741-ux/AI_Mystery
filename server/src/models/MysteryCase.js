import mongoose from 'mongoose';

const MysteryCaseSchema = new mongoose.Schema({
  title: { type: String, required: true }, scenario: { type: String, required: true }, category: String, difficulty: String,
  status: { type: String, enum: ['GENERATING','VALIDATING','READY','FAILED'], default: 'GENERATING' },
  briefing: { summary: String, incident: String, location: String, incidentTime: Date },
  suspectIds: { type: [String], default: [] }, evidenceIds: { type: [String], default: [] }, timelineIds: { type: [String], default: [] },
  generation: { provider: String, model: String, attempts: Number, errorCode: String },
  sessionId: { type: String, required: true, index: true },
}, { timestamps: true, strict: true });

export const MysteryCase = mongoose.model('MysteryCase', MysteryCaseSchema);
