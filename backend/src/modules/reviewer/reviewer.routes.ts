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

// Detail and human review endpoints
reviewerRouter.get('/cases/:caseId', getCaseDetails);
reviewerRouter.post('/cases/:caseId/review', submitCaseReview);

// Reviewer ownership assignment endpoints
reviewerRouter.post('/cases/:caseId/claim', claimCaseHandler);
reviewerRouter.post('/cases/:caseId/release', releaseCaseHandler);

// Admin-only administrative assignment endpoints
reviewerRouter.post('/cases/:caseId/assign', requireRoles(UserRole.ADMIN), assignCaseHandler);
reviewerRouter.post('/cases/:caseId/unassign', requireRoles(UserRole.ADMIN), unassignCaseHandler);

export { reviewerRouter };
