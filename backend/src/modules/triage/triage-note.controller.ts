import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { TriageNoteService } from './triage-note.service.js';
import { AppError } from '../../middleware/error-handler.js';

export const generateTriageNoteHandler = async (
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
    const reviewerId = req.user.id;
    const facilityId = req.user.facilityId;

    const result = await TriageNoteService.generateTriageNote(caseId, reviewerId, facilityId);

    res.status(200).json({
      success: true,
      data: result.note,
      isNew: result.isNew,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveTriageNoteHandler = async (
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
    const facilityId = req.user.facilityId;

    let note = await TriageNoteService.getActiveNote(caseId, facilityId);

    // If no active note exists yet, generate one automatically on GET
    if (!note) {
      const result = await TriageNoteService.generateTriageNote(caseId, req.user.id, facilityId);
      note = result.note;
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyTriageNoteHandler = async (
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
    const reviewerId = req.user.id;
    const facilityId = req.user.facilityId;
    const { reviewerNotes } = req.body || {};

    const updatedNote = await TriageNoteService.verifyTriageNote(caseId, reviewerId, reviewerNotes, facilityId);

    res.status(200).json({
      success: true,
      data: updatedNote,
      message: 'Structured triage note verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTriageNoteHistoryHandler = async (
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
    const facilityId = req.user.facilityId;

    const history = await TriageNoteService.getNoteHistory(caseId, facilityId);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
