import { Router } from 'express';
import {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  updateFacilityLanguages,
} from './facility.controller.js';
import { authenticateJwt, requireRole } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';

export const facilityRouter = Router();

facilityRouter.get('/', authenticateJwt, getFacilities);
facilityRouter.get('/:facilityId', authenticateJwt, getFacilityById);
facilityRouter.post('/', authenticateJwt, requireRole(UserRole.ADMIN), createFacility);
facilityRouter.patch('/:facilityId', authenticateJwt, requireRole(UserRole.ADMIN), updateFacility);
facilityRouter.patch(
  '/:facilityId/languages',
  authenticateJwt,
  requireRole(UserRole.ADMIN),
  updateFacilityLanguages
);

