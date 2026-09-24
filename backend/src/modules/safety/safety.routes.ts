import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';
import { evaluateCaseSafety, getCaseSafetyDetails } from './safety.controller.js';

const safetyRouter = Router();

const REVIEWER_ROLES = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
  UserRole.ADMIN,
];

safetyRouter.use(authenticateJwt);
safetyRouter.use(requireRoles(...REVIEWER_ROLES));

safetyRouter.post('/:caseId/safety/evaluate', evaluateCaseSafety);
safetyRouter.get('/:caseId/safety', getCaseSafetyDetails);

export { safetyRouter };
