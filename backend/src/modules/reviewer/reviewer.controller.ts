import { Response, NextFunction } from 'express';
import { reviewerCasesQuerySchema, submitReviewSchema, adminAssignSchema } from './reviewer.schemas.js';
import { ReviewerService } from './reviewer.service.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { UserRole } from '../users/user.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const getQueueCases = async (
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

    const parseResult = reviewerCasesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstErrorMessage =
        parseResult.error.errors[0]?.message || 'Invalid reviewer query parameters';
      const error: AppError = new Error(firstErrorMessage);
      error.statusCode = 400;
      error.code = 'REVIEWER_VALIDATION_ERROR';
      return next(error);
    }

    const result = await ReviewerService.getCases(parseResult.data, req.user.id);
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
    if (!req.user || !req.user.id) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const caseIdParam = req.params.caseId;
    const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

    const caseDetails = await ReviewerService.getCaseById(caseId, req.user.id);
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

export const claimCaseHandler = async (
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
    const requestIdStr = req.id ? String(req.id) : undefined;

    const result = await ReviewerService.claimCase(caseId, req.user.id, requestIdStr);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const releaseCaseHandler = async (
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
    const requestIdStr = req.id ? String(req.id) : undefined;
    const isAdmin = req.user.role === UserRole.ADMIN;

    const result = await ReviewerService.releaseCase(caseId, req.user.id, isAdmin, requestIdStr);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const assignCaseHandler = async (
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
    const parseResult = adminAssignSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstErrorMessage =
        parseResult.error.errors[0]?.message || 'Invalid administrative assignment input';
      const error: AppError = new Error(firstErrorMessage);
      error.statusCode = 400;
      error.code = 'ASSIGNMENT_VALIDATION_ERROR';
      return next(error);
    }

    const requestIdStr = req.id ? String(req.id) : undefined;
    const result = await ReviewerService.assignCase(
      caseId,
      req.user.id,
      parseResult.data.reviewerId,
      requestIdStr
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const unassignCaseHandler = async (
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
    const requestIdStr = req.id ? String(req.id) : undefined;

    const result = await ReviewerService.unassignCase(caseId, req.user.id, requestIdStr);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
