import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';
import {
  getQueueCases,
  getCaseDetails,
  submitCaseReview,
  claimCaseHandler,
  releaseCaseHandler,
  assignCaseHandler,
  unassignCaseHandler,
  processSlaEscalations,
  extractCaseInformation,
  getCaseTimelineHandler,
  getCaseMissingInformationHandler,
} from './reviewer.controller.js';

const reviewerRouter = Router();

const REVIEWER_ROLES = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
  UserRole.ADMIN,
];

// All reviewer routes require JWT authentication and authorized reviewer roles
reviewerRouter.use(authenticateJwt);
reviewerRouter.use(requireRoles(...REVIEWER_ROLES));

// Queue endpoints
reviewerRouter.get('/', getQueueCases);
reviewerRouter.get('/cases', getQueueCases);

// SLA batch processing endpoint (restricted to ADMIN and MEDICAL_OFFICER roles)
reviewerRouter.post(
  '/sla/process',
  requireRoles(UserRole.ADMIN, UserRole.MEDICAL_OFFICER),
  processSlaEscalations
);

// Detail and human review endpoints
reviewerRouter.get('/cases/:caseId', getCaseDetails);
reviewerRouter.post('/cases/:caseId/review', submitCaseReview);
reviewerRouter.post('/cases/:caseId/extraction', extractCaseInformation);
reviewerRouter.get('/cases/:caseId/timeline', getCaseTimelineHandler);
reviewerRouter.get('/cases/:caseId/missing-information', getCaseMissingInformationHandler);

// Reviewer ownership assignment endpoints
reviewerRouter.post('/cases/:caseId/claim', claimCaseHandler);
reviewerRouter.post('/cases/:caseId/release', releaseCaseHandler);

// Admin-only administrative assignment endpoints
reviewerRouter.post('/cases/:caseId/assign', requireRoles(UserRole.ADMIN), assignCaseHandler);
reviewerRouter.post('/cases/:caseId/unassign', requireRoles(UserRole.ADMIN), unassignCaseHandler);

export { reviewerRouter };
