import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminService } from './admin.service.js';
import { UserRole } from '../users/user.types.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  facilityId: z.string().optional(),
});

export const listUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = adminUsersQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const error: AppError = new Error(parseResult.error.errors[0]?.message || 'Validation error');
      error.statusCode = 400;
      error.code = 'ADMIN_VALIDATION_ERROR';
      return next(error);
    }

    const data = await AdminService.listUsers(parseResult.data);
    res.status(200).json({
      success: true,
      data: data.users,
      pagination: data.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const userId = String(req.params.userId);
    const user = await AdminService.deactivateUser(userId, req.user.id, req.requestId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const reactivateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const userId = String(req.params.userId);
    const user = await AdminService.reactivateUser(userId, req.user.id, req.requestId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metrics = await AdminService.getDashboardMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};
