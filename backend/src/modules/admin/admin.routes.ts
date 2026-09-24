import { Router } from 'express';
import {
  listUsers,
  deactivateUser,
  reactivateUser,
  getDashboardMetrics,
} from './admin.controller.js';
import { authenticateJwt, requireRole } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';

export const adminRouter = Router();

adminRouter.use(authenticateJwt);
adminRouter.use(requireRole(UserRole.ADMIN));


adminRouter.get('/users', listUsers);
adminRouter.post('/users/:userId/deactivate', deactivateUser);
adminRouter.post('/users/:userId/reactivate', reactivateUser);
adminRouter.get('/dashboard', getDashboardMetrics);
