import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { createCaseSchema } from '../validators/case.js';
import * as service from '../services/caseService.js';
import { AppError } from '../utils/errors.js';

export const api = Router();
const ah = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
api.post('/sessions', (req, res) => res.status(201).json({ sessionId: req.sessionId ?? randomUUID() }));
api.get('/cases', ah(async (req, res) => res.json({ cases: await service.listCases(req.sessionId) })));
api.post('/cases', ah(async (req, res) => {
  const parsed = createCaseSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Please check the scenario and case options.', parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  res.status(201).json(await service.createCase(parsed.data, req.sessionId));
}));
api.get('/cases/:caseId', ah(async (req, res) => res.json(await service.getCase(req.params.caseId, req.sessionId))));
api.get('/cases/:caseId/suspects', ah(async (req, res) => res.json({ suspects: await service.getSuspects(req.params.caseId, req.sessionId) })));
api.get('/cases/:caseId/evidence', ah(async (req, res) => {
  const type = req.query.type;
  const allowed = ['CHAT','IMAGE','CCTV','DOCUMENT','WITNESS_STATEMENT','FORENSIC_REPORT','AUDIO_TRANSCRIPT'];
  if (type && !allowed.includes(type)) throw new AppError(400, 'VALIDATION_ERROR', 'Unsupported evidence type.');
  res.json({ evidence: await service.getEvidence(req.params.caseId, req.sessionId, type) });
}));
api.get('/cases/:caseId/evidence/:evidenceId', ah(async (req, res) => res.json({ evidence: await service.getEvidenceDetail(req.params.caseId, req.params.evidenceId, req.sessionId) })));
api.patch('/cases/:caseId/progress', ah(async (req, res) => {
  const schema = z.object({ reviewedEvidenceIds: z.array(z.string()).max(30).optional(), bookmarkedEvidenceIds: z.array(z.string()).max(30).optional(), shortlistedSuspectIds: z.array(z.string()).max(10).optional(), notes: z.string().max(5000).optional() }).strict();
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data ?? {}).length) throw new AppError(400, 'VALIDATION_ERROR', 'Provide valid investigation progress.');
  res.json(await service.updateProgress(req.params.caseId, req.sessionId, parsed.data));
}));
api.post('/cases/:caseId/hints', ah(async (req, res) => {
  const parsed = z.object({ level: z.number().int().min(1).max(3) }).safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Choose a hint level from 1 to 3.');
  const hint = await service.requestHint(req.params.caseId, req.sessionId, parsed.data.level);
  res.json({ level: hint.level, hint: hint.text, relatedEvidenceIds: hint.relatedEvidenceIds });
}));
api.post('/cases/:caseId/accusations', ah(async (req, res) => {
  const parsed = z.object({ selectedSuspectId: z.string().min(1), reasoning: z.string().max(2000).optional().default('') }).safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Select a suspect and keep your reasoning under 2,000 characters.');
  res.json(await service.accuse(req.params.caseId, req.sessionId, parsed.data.selectedSuspectId, parsed.data.reasoning));
}));
api.get('/cases/:caseId/solution', ah(async (req, res) => res.json(await service.getSolution(req.params.caseId, req.sessionId))));
