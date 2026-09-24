import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';
import {
  getCaseReferralsHandler,
  getIncomingReferralsHandler,
  updateReferralStatusHandler,
} from './referral.controller.js';

const referralRouter = Router();

const REVIEWER_ROLES = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
  UserRole.ADMIN,
];

referralRouter.use(authenticateJwt);
referralRouter.use(requireRoles(...REVIEWER_ROLES));

// Query endpoints for referral history & incoming referrals
referralRouter.get('/cases/:caseId', getCaseReferralsHandler);
referralRouter.get('/incoming', getIncomingReferralsHandler);

// Referral lifecycle status transition endpoint (ACCEPT, REJECT, CANCEL, COMPLETE)
referralRouter.patch('/:referralId/status', updateReferralStatusHandler);

export { referralRouter };
