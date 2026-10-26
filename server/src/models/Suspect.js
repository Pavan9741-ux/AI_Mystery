import mongoose from 'mongoose';

const SuspectSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, suspectId: { type: String, required: true },
  name: { type: String, required: true }, age: Number, role: String, relationshipToIncident: String, motive: String,
  alibi: String, portraitUrl: String, profileDescription: String,
}, { timestamps: true });
SuspectSchema.index({ caseId: 1, suspectId: 1 }, { unique: true });
export const Suspect = mongoose.model('Suspect', SuspectSchema);
