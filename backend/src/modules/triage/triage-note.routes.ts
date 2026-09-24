import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';
import {
  generateTriageNoteHandler,
  getActiveTriageNoteHandler,
  verifyTriageNoteHandler,
  getTriageNoteHistoryHandler,
} from './triage-note.controller.js';

const triageNoteRouter = Router();

const REVIEWER_ROLES = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
  UserRole.ADMIN,
];

triageNoteRouter.use(authenticateJwt);
triageNoteRouter.use(requireRoles(...REVIEWER_ROLES));

triageNoteRouter.post('/:caseId/triage-note/generate', generateTriageNoteHandler);
triageNoteRouter.get('/:caseId/triage-note', getActiveTriageNoteHandler);
triageNoteRouter.post('/:caseId/triage-note/verify', verifyTriageNoteHandler);
triageNoteRouter.get('/:caseId/triage-note/history', getTriageNoteHistoryHandler);

export { triageNoteRouter };
