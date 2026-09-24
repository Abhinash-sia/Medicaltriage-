import { Response, NextFunction } from 'express';
import { RetentionService } from './retention.service.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const getRetentionStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const status = await RetentionService.getRetentionStatus(req.user.id);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

export const executePurgeHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const requestIdStr = req.id ? String(req.id) : undefined;
    const result = await RetentionService.executePurge(req.user.id, req.body || {}, requestIdStr);

    res.status(200).json({
      success: true,
      data: result,
      message: result.dryRun ? 'Purge dry run executed successfully' : 'Data purge executed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const retryFailedPurgesHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const result = await RetentionService.retryFailedPurges(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
