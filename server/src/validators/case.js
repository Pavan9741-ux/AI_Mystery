import { z } from 'zod';

export const createCaseSchema = z.object({
  scenario: z.string().trim().min(50).max(1500),
  category: z.enum(['MURDER_MYSTERY', 'THEFT', 'MISSING_OBJECT', 'CORPORATE_ESPIONAGE', 'DIGITAL_MYSTERY', 'SUSPICIOUS_INCIDENT']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  titlePreference: z.string().trim().max(100).optional().default(''),
  evidenceIntensity: z.enum(['STANDARD', 'DETAILED']).optional().default('STANDARD'),
});

const id = z.string().min(1);
const content = z.record(z.string(), z.unknown());

export function normalizeGeneratedEnums(data) {
  if (!data || typeof data !== 'object') return data;
  const toEnum = (value) => typeof value === 'string' ? value.trim().replace(/[\s-]+/g, '_').toUpperCase() : value;
  for (const event of data.timeline ?? []) event.certainty = toEnum(event.certainty);
  for (const item of data.evidence ?? []) {
    item.type = toEnum(item.type);
    item.clueType = toEnum(item.clueType);
    item.importance = toEnum(item.importance);
  }
  return data;
}

export const generatedCaseSchema = z.object({
  title: z.string().min(3).max(100),
  briefing: z.object({ summary: z.string(), incident: z.string(), location: z.string(), incidentTime: z.string().datetime() }),
  suspects: z.array(z.object({ suspectId: id, name: z.string(), age: z.number().optional(), role: z.string(), relationshipToIncident: z.string().optional().default(''), motive: z.string(), alibi: z.string(), profileDescription: z.string() })).min(4).max(6),
  timeline: z.array(z.object({ eventId: id, timestamp: z.string().datetime(), description: z.string(), certainty: z.enum(['CONFIRMED','CLAIMED','INFERRED','UNCERTAIN']), sourceEvidenceIds: z.array(id), involvedSuspectIds: z.array(id) })).min(4),
  evidence: z.array(z.object({ evidenceId: id, type: z.enum(['CHAT','IMAGE','CCTV','DOCUMENT','WITNESS_STATEMENT','FORENSIC_REPORT','AUDIO_TRANSCRIPT']), title: z.string(), description: z.string(), source: z.string(), occurredAt: z.string().datetime().optional(), relatedSuspectIds: z.array(id), relatedEvidenceIds: z.array(id), clueType: z.enum(['CLUE','RED_HERRING','NEUTRAL']), importance: z.enum(['LOW','MEDIUM','HIGH']), content })).min(8).max(15),
  solution: z.object({ culpritSuspectId: id, motive: z.string(), method: z.string(), completeExplanation: z.string(), decisiveEvidenceIds: z.array(id).min(2), contradictionEvidenceIds: z.array(id), redHerringExplanations: z.array(z.object({ evidenceId: id, explanation: z.string() })), hints: z.array(z.object({ level: z.number().int().min(1).max(3), text: z.string(), relatedEvidenceIds: z.array(id).min(1) })).length(3) }),
});

export function validateReferences(data) {
  const suspectIds = new Set(data.suspects.map((s) => s.suspectId));
  const evidenceIds = new Set(data.evidence.map((e) => e.evidenceId));
  const eventIds = new Set(data.timeline.map((e) => e.eventId));
  const issues = [];
  if (suspectIds.size !== data.suspects.length) issues.push('Suspect IDs must be unique.');
  if (evidenceIds.size !== data.evidence.length) issues.push('Evidence IDs must be unique.');
  if (eventIds.size !== data.timeline.length) issues.push('Timeline event IDs must be unique.');
  if (!suspectIds.has(data.solution.culpritSuspectId)) issues.push('The culprit must reference an existing suspect.');
  for (const e of data.evidence) {
    if (e.relatedSuspectIds.some((id) => !suspectIds.has(id))) issues.push(`${e.evidenceId} references an unknown suspect.`);
    if (e.relatedEvidenceIds.some((id) => !evidenceIds.has(id))) issues.push(`${e.evidenceId} references unknown evidence.`);
  }
  for (const e of data.timeline) {
    if (!e.sourceEvidenceIds.length) issues.push(`${e.eventId} must reference evidence.`);
    if (e.sourceEvidenceIds.some((id) => !evidenceIds.has(id))) issues.push(`${e.eventId} references unknown evidence.`);
    if (e.involvedSuspectIds.some((id) => !suspectIds.has(id))) issues.push(`${e.eventId} references an unknown suspect.`);
  }
  for (const id of [...data.solution.decisiveEvidenceIds, ...data.solution.contradictionEvidenceIds, ...data.solution.hints.flatMap((h) => h.relatedEvidenceIds), ...data.solution.redHerringExplanations.map((h) => h.evidenceId)]) {
    if (!evidenceIds.has(id)) issues.push(`Solution references unknown evidence ${id}.`);
  }
  if (data.solution.hints.map((h) => h.level).sort().join(',') !== '1,2,3') issues.push('Hints must include levels 1, 2, and 3 exactly once.');
  return issues;
}
