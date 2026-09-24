import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../users/user.types.js';
import {
  getRetentionStatusHandler,
  executePurgeHandler,
  retryFailedPurgesHandler,
} from './retention.controller.js';

const retentionRouter = Router();

// All retention endpoints are strictly restricted to ADMIN role
retentionRouter.use(authenticateJwt);
retentionRouter.use(requireRoles(UserRole.ADMIN));

retentionRouter.get('/status', getRetentionStatusHandler);
retentionRouter.post('/purge', executePurgeHandler);
retentionRouter.post('/retry-failed-purges', retryFailedPurgesHandler);

export { retentionRouter };
