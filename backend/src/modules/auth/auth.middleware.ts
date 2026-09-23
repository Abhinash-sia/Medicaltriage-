import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types.js';
import { verifyToken } from './auth.utils.js';
import { UserRole } from '../users/user.types.js';
import { AppError } from '../../middleware/error-handler.js';
import { User } from '../users/user.model.js';

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: AppError = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      const error: AppError = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err: unknown) {
      const isExpired = err instanceof Error && err.name === 'TokenExpiredError';
      const error: AppError = new Error(isExpired ? 'Authentication token expired' : 'Invalid authentication token');
      error.statusCode = 401;
      error.code = isExpired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID';
      return next(error);
    }

    // Verify user is active and not deleted
    const userDoc = await User.findOne({ _id: payload.id, isDeleted: false, isActive: true });
    if (!userDoc) {
      const error: AppError = new Error('Account inactive or deleted');
      error.statusCode = 401;
      error.code = 'AUTH_ACCOUNT_INACTIVE';
      return next(error);
    }

    req.user = {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      phone: userDoc.phone,
      role: userDoc.role,
      facilityId: userDoc.facilityId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error: AppError = new Error('Access forbidden: Insufficient permissions for this role');
      error.statusCode = 403;
      error.code = 'AUTH_FORBIDDEN';
      return next(error);
    }

    next();
  };
};

export const requireRole = (allowedRole: UserRole) => requireRoles(allowedRole);
