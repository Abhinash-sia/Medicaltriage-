import { Response, NextFunction } from 'express';
import { updateReferralStatusSchema } from './referral.schemas.js';
import { ReferralService } from './referral.service.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const getCaseReferralsHandler = async (
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

    const referrals = await ReferralService.getCaseReferrals(caseId, req.user.id);
    res.status(200).json({
      success: true,
      data: referrals,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncomingReferralsHandler = async (
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

    const incoming = await ReferralService.getIncomingReferrals(req.user.id);
    res.status(200).json({
      success: true,
      data: incoming,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReferralStatusHandler = async (
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

    const referralIdParam = req.params.referralId;
    const referralId = Array.isArray(referralIdParam) ? referralIdParam[0] : referralIdParam;

    const parseResult = updateReferralStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstErrorMessage =
        parseResult.error.errors[0]?.message || 'Invalid referral status update input';
      const error: AppError = new Error(firstErrorMessage);
      error.statusCode = 400;
      error.code = 'REFERRAL_VALIDATION_ERROR';
      return next(error);
    }

    const requestIdStr = req.id ? String(req.id) : undefined;
    const result = await ReferralService.updateReferralStatus(
      referralId,
      req.user.id,
      parseResult.data.status,
      parseResult.data.notes,
      requestIdStr
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `Referral status successfully updated to ${parseResult.data.status}`,
    });
  } catch (error) {
    next(error);
  }
};
