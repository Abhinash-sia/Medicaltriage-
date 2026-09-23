import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred.'
      : err.message || 'An unexpected error occurred.';

  logger.error(
    {
      err: {
        message: err.message,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      requestId: req.id,
      statusCode,
    },
    'Handled application error'
  );

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
    requestId: req.id,
  });
};
