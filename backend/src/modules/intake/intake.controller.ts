import { Response, NextFunction } from 'express';
import { intakeSubmitSchema } from './intake.schemas.js';
import { IntakeService } from './intake.service.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const submitIntake = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication required for patient intake');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const parseResult = intakeSubmitSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstErrorMessage = parseResult.error.errors[0]?.message || 'Invalid intake request input';
      const error: AppError = new Error(firstErrorMessage);
      error.statusCode = 400;
      error.code = 'INTAKE_VALIDATION_ERROR';
      return next(error);
    }

    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    const inputWithKey = {
      ...parseResult.data,
      idempotencyKey,
    };

    const requestIdStr = req.id ? String(req.id) : undefined;
    const intakeResult = await IntakeService.submitIntake(req.user.id, inputWithKey, requestIdStr);

    res.status(201).json({
      success: true,
      data: intakeResult,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyCases = async (
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

    const cases = await IntakeService.getPatientCases(req.user.id);
    res.status(200).json({
      success: true,
      data: cases,
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseById = async (
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

    const caseIdParam = req.params.caseId;
    const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;
    const caseDetails = await IntakeService.getPatientCaseById(caseId, req.user.id);

    res.status(200).json({
      success: true,
      data: caseDetails,
    });
  } catch (error) {
    next(error);
  }
};
