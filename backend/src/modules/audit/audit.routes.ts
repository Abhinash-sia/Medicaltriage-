import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';
import { getCaseAuditTrailHandler } from './audit.controller.js';

const auditRouter = Router();

const REVIEWER_ROLES = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
  UserRole.ADMIN,
];

// All audit trail endpoints require JWT authentication and reviewer/admin authorization
auditRouter.use(authenticateJwt);
auditRouter.use(requireRoles(...REVIEWER_ROLES));

// Audit trail for a specific case
auditRouter.get('/:caseId/audit-trail', getCaseAuditTrailHandler);

export { auditRouter };
