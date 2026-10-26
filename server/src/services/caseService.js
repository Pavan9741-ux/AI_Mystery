import mongoose from 'mongoose';
import { MysteryCase } from '../models/MysteryCase.js';
import { Suspect } from '../models/Suspect.js';
import { Evidence } from '../models/Evidence.js';
import { TimelineEvent } from '../models/TimelineEvent.js';
import { CanonicalSolution } from '../models/CanonicalSolution.js';
import { InvestigationProgress } from '../models/InvestigationProgress.js';
import { generateCase } from '../ai/caseGenerator.js';
import { AppError } from '../utils/errors.js';

const publicSuspect = (item) => ({ suspectId:item.suspectId, name:item.name, age:item.age, role:item.role, relationshipToIncident:item.relationshipToIncident, motive:item.motive, alibi:item.alibi, portraitUrl:item.portraitUrl, profileDescription:item.profileDescription });
const publicEvidence = (item, includeContent = false) => ({ evidenceId:item.evidenceId, type:item.type, title:item.title, description:item.description, source:item.source, occurredAt:item.occurredAt, relatedSuspectIds:item.relatedSuspectIds, relatedEvidenceIds:item.relatedEvidenceIds, clueType:item.clueType, importance:item.importance, ...(includeContent ? { content:item.content } : {}) });
const publicEvent = (item) => ({ eventId:item.eventId, timestamp:item.timestamp, description:item.description, certainty:item.certainty, sourceEvidenceIds:item.sourceEvidenceIds, involvedSuspectIds:item.involvedSuspectIds });
const findOwned = async (caseId, sessionId) => {
  if (!mongoose.isValidObjectId(caseId)) throw new AppError(404, 'CASE_NOT_FOUND', 'This case could not be found.');
  const doc = await MysteryCase.findOne({ _id: caseId, sessionId });
  if (!doc) throw new AppError(404, 'CASE_NOT_FOUND', 'This case could not be found.');
  return doc;
};
const requireReady = (doc) => { if (doc.status !== 'READY') throw new AppError(409, 'CASE_NOT_READY', 'This case is not ready to investigate.'); };
const getProgress = (caseId, sessionId) => InvestigationProgress.findOneAndUpdate({ caseId, sessionId }, { $setOnInsert: { caseId, sessionId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
const privateSolution = async (caseId) => CanonicalSolution.findOne({ caseId }).select('+solution');

export async function createCase(input, sessionId) {
  const doc = await MysteryCase.create({ ...input, title: input.titlePreference || 'Case in progress', status: 'GENERATING', sessionId, generation: { provider: 'google-genai', model: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite' } });
  try {
    const { data, attempt } = await generateCase(input);
    doc.status = 'VALIDATING'; await doc.save();
    await Promise.all([
      Suspect.insertMany(data.suspects.map((item) => ({ ...item, caseId:doc._id }))),
      Evidence.insertMany(data.evidence.map((item) => ({ ...item, caseId:doc._id }))),
      TimelineEvent.insertMany(data.timeline.map((item) => ({ ...item, caseId:doc._id }))),
      CanonicalSolution.create({ caseId:doc._id, solution:data.solution }),
    ]);
    doc.title = data.title; doc.briefing = data.briefing; doc.suspectIds = data.suspects.map((s) => s.suspectId);
    doc.evidenceIds = data.evidence.map((e) => e.evidenceId); doc.timelineIds = data.timeline.map((e) => e.eventId);
    doc.generation.attempts = attempt; doc.status = 'READY'; await doc.save();
    return { caseId: String(doc._id), status: 'READY', title: doc.title, message: 'Your mystery is ready.' };
  } catch (error) {
    await Promise.all([Suspect.deleteMany({caseId:doc._id}), Evidence.deleteMany({caseId:doc._id}), TimelineEvent.deleteMany({caseId:doc._id}), CanonicalSolution.deleteOne({caseId:doc._id})]);
    doc.status = 'FAILED'; doc.generation.errorCode = error.code ?? 'AI_PROVIDER_ERROR'; await doc.save(); throw error;
  }
}

export async function listCases(sessionId) {
  const docs = await MysteryCase.find({ sessionId, status: 'READY' }).sort({ createdAt: -1 }).limit(50).select('title category difficulty status createdAt');
  return docs.map((d) => ({ caseId: String(d._id), title: d.title, category: d.category, difficulty: d.difficulty, status: d.status, createdAt: d.createdAt }));
}
export async function getCase(caseId, sessionId) {
  const doc = await findOwned(caseId, sessionId); requireReady(doc);
  const [suspects, evidence, timeline, progress] = await Promise.all([
    Suspect.find({caseId:doc._id}).sort({suspectId:1}), Evidence.find({caseId:doc._id}).sort({evidenceId:1}), TimelineEvent.find({caseId:doc._id}).sort({timestamp:1}), getProgress(doc._id,sessionId),
  ]);
  return { caseId:String(doc._id), status:doc.status, title:doc.title, category:doc.category, difficulty:doc.difficulty, briefing:doc.briefing, suspects:suspects.map(publicSuspect), timeline:timeline.map(publicEvent), evidence:evidence.map((e)=>publicEvidence(e)), progress:{reviewedEvidenceIds:progress.reviewedEvidenceIds,bookmarkedEvidenceIds:progress.bookmarkedEvidenceIds,shortlistedSuspectIds:progress.shortlistedSuspectIds,notes:progress.notes,hintsUsed:progress.hintsUsed,completed:Boolean(progress.completedAt)} };
}
export async function getSuspects(caseId, sessionId) { const c=await findOwned(caseId,sessionId);requireReady(c);return (await Suspect.find({caseId:c._id})).map(publicSuspect); }
export async function getEvidence(caseId, sessionId, type) { const c=await findOwned(caseId,sessionId);requireReady(c);return (await Evidence.find({caseId:c._id,...(type?{type}:{})})).map((e)=>publicEvidence(e)); }
export async function getEvidenceDetail(caseId, evidenceId, sessionId) {
  const c=await findOwned(caseId,sessionId);requireReady(c);const e=await Evidence.findOne({caseId:c._id,evidenceId});
  if(!e)throw new AppError(404,'EVIDENCE_NOT_FOUND','Evidence could not be found.');return publicEvidence(e,true);
}
export async function updateProgress(caseId, sessionId, input) {
  const c=await findOwned(caseId,sessionId);requireReady(c);
  const [evidence,suspects]=await Promise.all([Evidence.find({caseId:c._id}).select('evidenceId'),Suspect.find({caseId:c._id}).select('suspectId')]);
  const validEvidence=new Set(evidence.map((e)=>e.evidenceId));const validSuspects=new Set(suspects.map((s)=>s.suspectId));
  for(const id of [...(input.reviewedEvidenceIds??[]),...(input.bookmarkedEvidenceIds??[])])if(!validEvidence.has(id))throw new AppError(400,'VALIDATION_ERROR',`Unknown evidence ID: ${id}`);
  for(const id of input.shortlistedSuspectIds??[])if(!validSuspects.has(id))throw new AppError(400,'VALIDATION_ERROR',`Unknown suspect ID: ${id}`);
  const p=await getProgress(c._id,sessionId);Object.assign(p,input);await p.save();
  return {reviewedEvidenceIds:p.reviewedEvidenceIds,bookmarkedEvidenceIds:p.bookmarkedEvidenceIds,shortlistedSuspectIds:p.shortlistedSuspectIds,notes:p.notes};
}
export async function requestHint(caseId, sessionId, level) {
  const c=await findOwned(caseId,sessionId);requireReady(c);const [sol,p]=await Promise.all([privateSolution(c._id),getProgress(c._id,sessionId)]);
  const hint=sol?.solution?.hints.find((h)=>h.level===level);if(!hint)throw new AppError(404,'HINT_NOT_FOUND','That hint is not available.');
  if(!p.hintsUsed.includes(level)){p.hintsUsed.push(level);await p.save();}return hint;
}
export async function accuse(caseId, sessionId, selectedSuspectId, reasoning) {
  const c=await findOwned(caseId,sessionId);requireReady(c);const p=await getProgress(c._id,sessionId);
  if(p.completedAt)throw new AppError(409,'ACCUSATION_ALREADY_SUBMITTED','An accusation has already been submitted for this case.');
  if(!await Suspect.exists({caseId:c._id,suspectId:selectedSuspectId}))throw new AppError(400,'VALIDATION_ERROR','Select a suspect from this case.');
  const sol=await privateSolution(c._id);const isCorrect=selectedSuspectId===sol.solution.culpritSuspectId;const completedAt=new Date();
  const updated=await InvestigationProgress.findOneAndUpdate({_id:p._id,completedAt:null},{$set:{attempt:{selectedSuspectId,reasoning,isCorrect,submittedAt:completedAt},completedAt}},{new:true});
  if(!updated)throw new AppError(409,'ACCUSATION_ALREADY_SUBMITTED','An accusation has already been submitted for this case.');
  return {attemptId:String(updated._id),isCorrect,caseCompleted:true,result:{message:isCorrect?'Your accusation is correct.':'Your accusation was incorrect.'}};
}
export async function getSolution(caseId, sessionId) {
  const c=await findOwned(caseId,sessionId);requireReady(c);const p=await InvestigationProgress.findOne({caseId:c._id,sessionId});
  if(!p?.completedAt)throw new AppError(403,'SOLUTION_NOT_AVAILABLE','Submit an accusation before reviewing the solution.');
  const sol=await privateSolution(c._id);const culprit=await Suspect.findOne({caseId:c._id,suspectId:sol.solution.culpritSuspectId});
  return {culprit:{suspectId:culprit.suspectId,name:culprit.name,profile:culprit.profileDescription},motive:sol.solution.motive,method:sol.solution.method,completeExplanation:sol.solution.completeExplanation,decisiveEvidenceIds:sol.solution.decisiveEvidenceIds,contradictionEvidenceIds:sol.solution.contradictionEvidenceIds,redHerringExplanations:sol.solution.redHerringExplanations,selectedSuspectId:p.attempt.selectedSuspectId,isCorrect:p.attempt.isCorrect};
}
