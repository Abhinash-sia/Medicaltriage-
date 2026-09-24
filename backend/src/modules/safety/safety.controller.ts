import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { UserRole } from '../users/user.types.js';
import { AppError } from '../../middleware/error-handler.js';
import { SafetyEvaluationService } from './safety-evaluation.service.js';
import { Case } from '../cases/case.model.js';

export const evaluateCaseSafety = async (
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

    if (req.user.role === UserRole.PATIENT) {
      const error: AppError = new Error('Patients are not authorized to view or trigger safety evaluations');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    const caseIdParam = req.params.caseId;
    const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      const error: AppError = new Error('Case not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    // Facility isolation check
    if (req.user.role !== UserRole.ADMIN && caseDoc.facilityId && req.user.facilityId && caseDoc.facilityId !== req.user.facilityId) {
      const error: AppError = new Error('Unauthorized facility access');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    const evaluation = await SafetyEvaluationService.evaluateCase(caseId, req.user.id);

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseSafetyDetails = async (
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

    if (req.user.role === UserRole.PATIENT) {
      const error: AppError = new Error('Patients are not authorized to view safety evaluation details');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    const caseIdParam = req.params.caseId;
    const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      const error: AppError = new Error('Case not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    // Facility isolation check
    if (req.user.role !== UserRole.ADMIN && caseDoc.facilityId && req.user.facilityId && caseDoc.facilityId !== req.user.facilityId) {
      const error: AppError = new Error('Unauthorized facility access');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    const activeEvaluation = await SafetyEvaluationService.getActiveEvaluation(caseId);
    const history = await SafetyEvaluationService.getEvaluationHistory(caseId);

    res.status(200).json({
      success: true,
      data: {
        activeEvaluation,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};
