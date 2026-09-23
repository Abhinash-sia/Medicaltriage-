import { Router } from 'express';
import { submitIntake, getMyCases, getCaseById } from './intake.controller.js';
import { authenticateJwt, requireRole } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';

export const intakeRouter = Router();

// Require JWT authentication and PATIENT role for self-intake endpoints
intakeRouter.use(authenticateJwt);
intakeRouter.use(requireRole(UserRole.PATIENT));

intakeRouter.post('/', submitIntake);
intakeRouter.get('/my-cases', getMyCases);
intakeRouter.get('/:caseId', getCaseById);
