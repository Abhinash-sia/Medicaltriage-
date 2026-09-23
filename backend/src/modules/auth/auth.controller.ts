import { Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from './auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const register = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const error: AppError = new Error(parseResult.error.errors[0]?.message || 'Validation error');
      error.statusCode = 400;
      error.code = 'AUTH_VALIDATION_ERROR';
      return next(error);
    }

    const authData = await AuthService.registerUser(parseResult.data);
    res.status(201).json({
      success: true,
      data: authData,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const error: AppError = new Error(parseResult.error.errors[0]?.message || 'Validation error');
      error.statusCode = 400;
      error.code = 'AUTH_VALIDATION_ERROR';
      return next(error);
    }

    const authData = await AuthService.loginUser(parseResult.data);
    res.status(200).json({
      success: true,
      data: authData,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
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

    const userProfile = await AuthService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};
