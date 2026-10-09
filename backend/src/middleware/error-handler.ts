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
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  let message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred.'
      : err.message || 'An unexpected error occurred.';

  // Map Mongoose buffering timeouts or disconnection errors to clean 503 errors
  if (err.message && (err.message.includes('buffering timed out') || err.message.includes('topology was closed'))) {
    statusCode = 503;
    errorCode = 'DATABASE_UNAVAILABLE';
    message = 'Database service is temporarily unavailable. Please check MongoDB connection or try again shortly.';
  }

  if (statusCode >= 500) {
    logger.error(
      {
        err: {
          message: err.message,
          stack: err.stack,
        },
        requestId: req.id,
        statusCode,
      },
      `Server Error [${statusCode}]: ${err.message}`
    );
  } else {
    logger.warn(`[${statusCode}] ${req.method} ${req.path} -> ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
    requestId: req.id,
  });
};
