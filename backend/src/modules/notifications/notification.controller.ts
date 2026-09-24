import { Response, NextFunction } from 'express';
import { NotificationService } from './notification.service.js';
import { notificationQuerySchema } from './notification.schemas.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const getNotifications = async (
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

    const parseResult = notificationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const error: AppError = new Error(parseResult.error.errors[0]?.message || 'Validation error');
      error.statusCode = 400;
      error.code = 'NOTIFICATION_VALIDATION_ERROR';
      return next(error);
    }

    const data = await NotificationService.getNotifications(req.user.id, parseResult.data);

    res.status(200).json({
      success: true,
      data: data.notifications,
      pagination: data.pagination,
      unreadCount: data.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
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

    const count = await NotificationService.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
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

    const notificationId = String(req.params.notificationId);
    const notification = await NotificationService.markAsRead(
      req.user.id,
      notificationId,
      req.requestId
    );

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
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

    const result = await NotificationService.markAllAsRead(req.user.id, req.requestId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
