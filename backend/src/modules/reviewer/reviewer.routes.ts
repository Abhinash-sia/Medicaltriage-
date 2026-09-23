import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';
import { getQueueCases, getCaseDetails, submitCaseReview } from './reviewer.controller.js';

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

// Detail and action endpoints
reviewerRouter.get('/cases/:caseId', getCaseDetails);
reviewerRouter.post('/cases/:caseId/review', submitCaseReview);

export { reviewerRouter };
