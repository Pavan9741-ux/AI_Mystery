import test from 'node:test';
import assert from 'node:assert/strict';
import { createCaseSchema, generatedCaseSchema, normalizeGeneratedEnums, validateReferences } from '../src/validators/case.js';

const validCase = () => {
  const suspects = Array.from({ length: 4 }, (_, i) => ({ suspectId: `s${i}`, name: `Person ${i}`, role: 'Student', motive: 'A motive', alibi: 'An alibi', profileDescription: 'A profile.' }));
  const evidence = Array.from({ length: 8 }, (_, i) => ({ evidenceId: `e${i}`, type: 'DOCUMENT', title: `Record ${i}`, description: 'A record.', source: 'Fictional archive', relatedSuspectIds: [], relatedEvidenceIds: [], clueType: 'CLUE', importance: 'MEDIUM', content: {} }));
  return { title: 'A Quiet Disappearance', briefing: { summary:'A summary', incident:'An incident', location:'A room', incidentTime:'2026-10-24T14:00:00.000Z' }, suspects, timeline: Array.from({length:4},(_,i)=>({ eventId:`t${i}`, timestamp:`2026-10-24T1${i}:00:00.000Z`, description:'A recorded event', certainty:'CONFIRMED', sourceEvidenceIds:[`e${i}`], involvedSuspectIds:['s0'] })), evidence, solution: { culpritSuspectId:'s0', motive:'A motive', method:'A method', completeExplanation:'An explanation grounded in evidence.', decisiveEvidenceIds:['e0','e1'], contradictionEvidenceIds:[], redHerringExplanations:[], hints:[1,2,3].map(level=>({level,text:`Hint ${level}`,relatedEvidenceIds:['e0']})) } };
};

test('case request enforces scenario limits and supported options', () => {
  assert.equal(createCaseSchema.safeParse({ scenario: 'x'.repeat(50), category:'THEFT', difficulty:'MEDIUM' }).success, true);
  assert.equal(createCaseSchema.safeParse({ scenario: 'too short', category:'THEFT', difficulty:'MEDIUM' }).success, false);
});
test('generated case accepts a complete structurally sound file', () => {
  const parsed = generatedCaseSchema.safeParse(validCase());
  assert.equal(parsed.success, true);
  assert.deepEqual(validateReferences(parsed.data), []);
});
test('reference validator rejects missing culprit and evidence IDs', () => {
  const data = validCase(); data.solution.culpritSuspectId = 'missing'; data.solution.hints[0].relatedEvidenceIds = ['missing-evidence'];
  assert.ok(validateReferences(data).some((issue) => issue.includes('culprit')));
  assert.ok(validateReferences(data).some((issue) => issue.includes('unknown evidence')));
});
test('generated enums are normalized from model casing and spacing before validation', () => {
  const data = validCase(); data.timeline[0].certainty = 'confirmed'; data.evidence[0].type = 'forensic report'; data.evidence[0].clueType = 'red herring'; data.evidence[0].importance = 'high';
  const normalized = normalizeGeneratedEnums(data);
  assert.equal(normalized.timeline[0].certainty, 'CONFIRMED');
  assert.equal(normalized.evidence[0].type, 'FORENSIC_REPORT');
  assert.equal(normalized.evidence[0].clueType, 'RED_HERRING');
  assert.equal(generatedCaseSchema.safeParse(normalized).success, true);
});
