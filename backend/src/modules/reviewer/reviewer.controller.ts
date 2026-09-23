import { Response, NextFunction } from 'express';
import { reviewerCasesQuerySchema, submitReviewSchema } from './reviewer.schemas.js';
import { ReviewerService } from './reviewer.service.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const getQueueCases = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = reviewerCasesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstErrorMessage =
        parseResult.error.errors[0]?.message || 'Invalid reviewer query parameters';
      const error: AppError = new Error(firstErrorMessage);
      error.statusCode = 400;
      error.code = 'REVIEWER_VALIDATION_ERROR';
      return next(error);
    }

    const result = await ReviewerService.getCases(parseResult.data);
    res.status(200).json({
      success: true,
      data: result.cases,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const caseIdParam = req.params.caseId;
    const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

    const caseDetails = await ReviewerService.getCaseById(caseId);
    res.status(200).json({
      success: true,
      data: caseDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const submitCaseReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication required for review submission');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const caseIdParam = req.params.caseId;
    const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

    const parseResult = submitReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstErrorMessage =
        parseResult.error.errors[0]?.message || 'Invalid review submission input';
      const error: AppError = new Error(firstErrorMessage);
      error.statusCode = 400;
      error.code = 'REVIEWER_VALIDATION_ERROR';
      return next(error);
    }

    const requestIdStr = req.id ? String(req.id) : undefined;
    const reviewResult = await ReviewerService.submitReview(
      caseId,
      req.user.id,
      parseResult.data,
      requestIdStr
    );

    res.status(201).json({
      success: true,
      data: reviewResult,
    });
  } catch (error) {
    next(error);
  }
};
