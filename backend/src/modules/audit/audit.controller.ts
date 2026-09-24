import { Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Case } from '../cases/case.model.js';
import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { AuditLog } from './audit-log.model.js';
import { AuditEventType } from './audit-log.types.js';
import { ReferralService } from '../referrals/referral.service.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

function createError(statusCode: number, message: string, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

export const getCaseAuditTrailHandler = async (
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
      const error: AppError = new Error('Patients cannot view internal audit trails');
      error.statusCode = 403;
      error.code = 'AUTH_FORBIDDEN';
      return next(error);
    }

    const caseIdParam = req.params.caseId;
    const caseIdStr = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

    if (!mongoose.Types.ObjectId.isValid(caseIdStr)) {
      const error: AppError = new Error('Invalid case ID format');
      error.statusCode = 400;
      error.code = 'INVALID_CASE_ID';
      return next(error);
    }

    const caseDoc = await Case.findOne({ _id: new Types.ObjectId(caseIdStr), isDeleted: false });
    if (!caseDoc) {
      const error: AppError = new Error('Case record not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    // Verify facility isolation (originating facility or active referred destination facility)
    await ReferralService.checkReferralFacilityAccess(caseDoc, req.user.id);

    const auditLogs = await AuditLog.find({ caseId: caseDoc._id }).sort({ timestamp: -1 }).lean();

    // Sanitize audit metadata for presentation
    const sanitizedLogs = await Promise.all(
      auditLogs.map(async (log) => {
        let actorName = 'System Service';
        if (log.actorId && log.actorRole !== 'SYSTEM') {
          try {
            const actor = await User.findById(log.actorId).select('name role');
            if (actor) actorName = actor.name;
          } catch (_) {}
        }

        const metadataCopy = { ...(log.metadata || {}) };
        // Strip sensitive keys if present
        delete (metadataCopy as any).password;
        delete (metadataCopy as any).token;
        delete (metadataCopy as any).apiKey;
        delete (metadataCopy as any).secret;

        return {
          id: log._id.toString(),
          actorId: log.actorId,
          actorName,
          actorRole: log.actorRole,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          caseId: log.caseId ? log.caseId.toString() : null,
          timestamp: log.timestamp,
          source: log.source,
          outcome: log.outcome,
          metadata: metadataCopy,
        };
      })
    );

    // Log AUDIT_LOG_VIEWED audit event
    const requestIdStr = req.id ? String(req.id) : undefined;
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role as any,
      action: AuditEventType.AUDIT_LOG_VIEWED,
      resourceType: 'Case',
      resourceId: caseDoc._id.toString(),
      caseId: caseDoc._id,
      requestId: requestIdStr || null,
      timestamp: new Date(),
      source: 'AUDIT_SERVICE',
      outcome: 'SUCCESS',
      metadata: { recordCount: sanitizedLogs.length },
    });

    res.status(200).json({
      success: true,
      data: sanitizedLogs,
    });
  } catch (error) {
    next(error);
  }
};
