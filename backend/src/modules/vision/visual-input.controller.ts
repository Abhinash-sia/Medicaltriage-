import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { visualInputService } from './visual-input.service.js';
import { AppError } from '../../middleware/error-handler.js';

export class VisualInputController {
  public uploadVisualInput = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        const error: AppError = new Error('No visual input image file uploaded');
        error.statusCode = 400;
        error.code = 'INVALID_FILE';
        return next(error);
      }

      const caseId = (req.params.caseId || req.body.caseId) as string;
      if (!caseId) {
        const error: AppError = new Error('caseId parameter or body field is required');
        error.statusCode = 400;
        error.code = 'MISSING_CASE_ID';
        return next(error);
      }

      const visualInput = await visualInputService.uploadAndProcessVisualInput(
        caseId,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        req.user!
      );

      res.status(201).json({
        status: 'success',
        data: { visualInput },
      });
    } catch (err: any) {
      if (err.message?.includes('Access denied')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      if (err.message?.includes('not found')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }
      if (err.message?.includes('validation failed')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 400;
        error.code = 'INVALID_FILE';
        return next(error);
      }
      next(err);
    }
  };

  public getVisualInputsByCase = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const caseId = req.params.caseId as string;
      const visualInputs = await visualInputService.getVisualInputsByCaseId(caseId, req.user!);

      res.status(200).json({
        status: 'success',
        data: { visualInputs },
      });
    } catch (err: any) {
      if (err.message?.includes('Access denied')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      if (err.message?.includes('not found')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }
      next(err);
    }
  };

  public getVisualInput = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const visualInputId = req.params.visualInputId as string;
      const visualInput = await visualInputService.getVisualInputById(visualInputId, req.user!);

      res.status(200).json({
        status: 'success',
        data: { visualInput },
      });
    } catch (err: any) {
      if (err.message?.includes('Access denied')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      if (err.message?.includes('not found')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }
      next(err);
    }
  };

  public downloadVisualInputFile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const visualInputId = req.params.visualInputId as string;
      const { stream, filename, mimeType } = await visualInputService.getVisualInputFileStream(visualInputId, req.user!);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      stream.pipe(res);
    } catch (err: any) {
      if (err.message?.includes('Access denied')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      if (err.message?.includes('not found')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }
      next(err);
    }
  };

  public verifyVisualInput = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const visualInputId = req.params.visualInputId as string;
      const visualInput = await visualInputService.verifyVisualInput(visualInputId, req.user!);

      res.status(200).json({
        status: 'success',
        data: { visualInput },
      });
    } catch (err: any) {
      if (err.message?.includes('Access denied')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      if (err.message?.includes('not found')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        return next(error);
      }
      next(err);
    }
  };
}

export const visualInputController = new VisualInputController();
