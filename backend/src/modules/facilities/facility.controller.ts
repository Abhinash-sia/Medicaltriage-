import { Response, NextFunction } from 'express';
import { FacilityService } from './facility.service.js';
import {
  createFacilitySchema,
  updateFacilitySchema,
  updateFacilityLanguagesSchema,
} from './facility.schemas.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { UserRole } from '../users/user.types.js';
import { AppError } from '../../middleware/error-handler.js';

export const getFacilities = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activeOnly = req.query.active === 'true';
    const facilities = await FacilityService.getFacilities(activeOnly);
    res.status(200).json({
      success: true,
      data: facilities,
    });
  } catch (error) {
    next(error);
  }
};

export const getFacilityById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const facilityId = String(req.params.facilityId);
    const facility = await FacilityService.getFacilityById(facilityId);
    res.status(200).json({
      success: true,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

export const createFacility = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const parseResult = createFacilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      const error: AppError = new Error(parseResult.error.errors[0]?.message || 'Validation error');
      error.statusCode = 400;
      error.code = 'FACILITY_VALIDATION_ERROR';
      return next(error);
    }

    const facility = await FacilityService.createFacility(
      parseResult.data,
      req.user.id,
      req.user.role as UserRole,
      req.requestId
    );

    res.status(201).json({
      success: true,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFacility = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const facilityId = String(req.params.facilityId);
    const parseResult = updateFacilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      const error: AppError = new Error(parseResult.error.errors[0]?.message || 'Validation error');
      error.statusCode = 400;
      error.code = 'FACILITY_VALIDATION_ERROR';
      return next(error);
    }

    const facility = await FacilityService.updateFacility(
      facilityId,
      parseResult.data,
      req.user.id,
      req.user.role as UserRole,
      req.requestId
    );

    res.status(200).json({
      success: true,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFacilityLanguages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_MISSING';
      return next(error);
    }

    const facilityId = String(req.params.facilityId);
    const parseResult = updateFacilityLanguagesSchema.safeParse(req.body);
    if (!parseResult.success) {
      const error: AppError = new Error(parseResult.error.errors[0]?.message || 'Validation error');
      error.statusCode = 400;
      error.code = 'FACILITY_VALIDATION_ERROR';
      return next(error);
    }

    const facility = await FacilityService.updateFacilityLanguages(
      facilityId,
      parseResult.data,
      req.user.id,
      req.user.role as UserRole,
      req.requestId
    );

    res.status(200).json({
      success: true,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};
