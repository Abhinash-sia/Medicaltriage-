import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { reportService } from './report.service.js';
import { AppError } from '../../middleware/error-handler.js';

export class ReportController {
  public uploadReport = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        const error: AppError = new Error('No report file uploaded');
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

      const report = await reportService.uploadAndProcessReport(
        caseId,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        req.user!
      );

      res.status(201).json({
        status: 'success',
        data: { report },
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
      if (err.message?.includes('File validation failed')) {
        const error: AppError = new Error(err.message);
        error.statusCode = 400;
        error.code = 'INVALID_FILE';
        return next(error);
      }
      next(err);
    }
  };

  public getReportsByCase = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const caseId = req.params.caseId as string;
      const reports = await reportService.getReportsByCaseId(caseId, req.user!);

      res.status(200).json({
        status: 'success',
        data: { reports },
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

  public getReport = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reportId = req.params.reportId as string;
      const report = await reportService.getReportById(reportId, req.user!);

      res.status(200).json({
        status: 'success',
        data: { report },
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

  public downloadReportFile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reportId = req.params.reportId as string;
      const { stream, filename, mimeType } = await reportService.getReportFileStream(reportId, req.user!);

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

  public verifyReport = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reportId = req.params.reportId as string;
      const report = await reportService.verifyReport(reportId, req.user!);

      res.status(200).json({
        status: 'success',
        data: { report },
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

export const reportController = new ReportController();
