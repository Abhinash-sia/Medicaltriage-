import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import { Case } from '../cases/case.model.js';
import { CaseStatus } from '../cases/case.types.js';
import { Report } from '../reports/report.model.js';
import { VoiceInputModel as VoiceInput } from '../voice/voice-input.model.js';
import { VisualInput } from '../vision/visual-input.model.js';
import { TriageNote } from '../triage/triage-note.model.js';
import { SafetyEvaluation } from '../safety/safety-evaluation.model.js';
import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import {
  RetentionStatusSummary,
  PurgeExecutionInput,
  PurgeExecutionResult,
} from './retention.types.js';
import { AppError } from '../../middleware/error-handler.js';

const ENGINEERING_RETENTION_DISCLAIMER =
  'These retention durations are engineering defaults for the prototype and are not claims about legally mandated healthcare retention periods.';

function createError(statusCode: number, message: string, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

export class RetentionService {
  /**
   * Retrieves retention metrics and purge eligibility overview.
   */
  public static async getRetentionStatus(adminUserId: string): Promise<RetentionStatusSummary> {
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw createError(403, 'Admin authorization required to view retention status', 'ADMIN_ROLE_REQUIRED');
    }

    const clinicalCaseCount = await Case.countDocuments({ isDeleted: { $ne: true } });

    let reportCount = 0;
    try { reportCount = await Report.countDocuments({}); } catch { reportCount = 0; }
    let voiceCount = 0;
    try { voiceCount = await VoiceInput.countDocuments({}); } catch { voiceCount = 0; }
    let visualCount = 0;
    try { visualCount = await VisualInput.countDocuments({}); } catch { visualCount = 0; }
    const mediaBlobCount = reportCount + voiceCount + visualCount;

    let triageNoteCount = 0;
    try { triageNoteCount = await TriageNote.countDocuments({}); } catch { triageNoteCount = 0; }
    let safetyEvalCount = 0;
    try { safetyEvalCount = await SafetyEvaluation.countDocuments({}); } catch { safetyEvalCount = 0; }
    const aiDerivedCount = triageNoteCount + safetyEvalCount;

    const auditLogCount = await AuditLog.countDocuments({});

    const eligiblePurgeCount = await Case.countDocuments({
      status: { $in: [CaseStatus.RESOLVED, CaseStatus.CLOSED] },
      isDeleted: { $ne: true },
    });

    let failedFileCleanupCount = 0;
    try {
      failedFileCleanupCount = await Report.countDocuments({ purgeStatus: 'FILE_CLEANUP_FAILED' });
    } catch {
      failedFileCleanupCount = 0;
    }

    return {
      clinicalCaseCount,
      mediaBlobCount,
      aiDerivedCount,
      auditLogCount,
      eligiblePurgeCount,
      failedFileCleanupCount,
      disclaimer: ENGINEERING_RETENTION_DISCLAIMER,
    };
  }

  /**
   * Executes administrative data purge on resolved/closed cases with physical file unlinking and error recovery state.
   */
  public static async executePurge(
    adminUserId: string,
    input: PurgeExecutionInput,
    requestId?: string
  ): Promise<PurgeExecutionResult> {
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw createError(403, 'Admin authorization required to execute data purge', 'ADMIN_ROLE_REQUIRED');
    }

    const dryRun = input.dryRun === true;
    const caseQuery: Record<string, any> = {
      status: { $in: [CaseStatus.RESOLVED, CaseStatus.CLOSED] },
      isDeleted: { $ne: true },
    };

    if (input.caseId) {
      if (!mongoose.Types.ObjectId.isValid(input.caseId)) {
        throw createError(400, 'Invalid case ID format for purge');
      }
      caseQuery._id = new mongoose.Types.ObjectId(input.caseId);
    }

    if (input.olderThanDays && input.olderThanDays > 0) {
      const threshold = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000);
      caseQuery.updatedAt = { $lte: threshold };
    }

    const eligibleCases = await Case.find(caseQuery);
    const eligibleCount = eligibleCases.length;

    if (dryRun) {
      return {
        dryRun: true,
        eligibleCases: eligibleCount,
        purgedCases: 0,
        deletedFiles: 0,
        failedFiles: 0,
        fileCleanupErrors: [],
        timestamp: new Date(),
        disclaimer: ENGINEERING_RETENTION_DISCLAIMER,
      };
    }

    let purgedCaseCount = 0;
    let deletedFileCount = 0;
    let failedFileCount = 0;
    const fileCleanupErrors: Array<{ path: string; error: string }> = [];

    const rootUploadsDir = path.resolve(process.cwd(), 'uploads');
    const rootArtifactsDir = path.resolve(process.cwd(), 'artifacts');

    for (const caseDoc of eligibleCases) {
      const caseId = caseDoc._id;

      // Gather attached media records
      let reports: any[] = [];
      let voices: any[] = [];
      let visuals: any[] = [];
      try { reports = await Report.find({ caseId }); } catch {}
      try { voices = await VoiceInput.find({ caseId }); } catch {}
      try { visuals = await VisualInput.find({ caseId }); } catch {}

      const filesToUnlink: string[] = [];
      reports.forEach((r: any) => (r.filePath || r.storageKey) && filesToUnlink.push(r.filePath || r.storageKey));
      voices.forEach((v: any) => (v.filePath || v.storageKey) && filesToUnlink.push(v.filePath || v.storageKey));
      visuals.forEach((v: any) => (v.filePath || v.storageKey) && filesToUnlink.push(v.filePath || v.storageKey));

      // Step 1 & 2: Physical File Unlinking with Path Traversal Protection
      for (const filePath of filesToUnlink) {
        const resolvedPath = path.resolve(filePath);
        // Verify path stays within allowed storage root
        if (!resolvedPath.startsWith(rootUploadsDir) && !resolvedPath.startsWith(rootArtifactsDir)) {
          failedFileCount++;
          fileCleanupErrors.push({ path: filePath, error: 'Path traversal protection: path is outside upload root' });
          continue;
        }

        try {
          if (fs.existsSync(resolvedPath)) {
            await fs.promises.unlink(resolvedPath);
            deletedFileCount++;
          }
        } catch (unlinkErr: any) {
          failedFileCount++;
          fileCleanupErrors.push({ path: filePath, error: String(unlinkErr.message || unlinkErr) });
        }
      }

      // Step 3 & 4: Database document soft-deletion / anonymization
      const finalPurgeStatus = failedFileCount > 0 ? 'FILE_CLEANUP_FAILED' : 'PURGED';

      try { await Report.updateMany({ caseId }, { isDeleted: true, purgeStatus: finalPurgeStatus }); } catch {}
      try { await VoiceInput.deleteMany({ caseId }); } catch {}
      try { await VisualInput.deleteMany({ caseId }); } catch {}
      try { await TriageNote.deleteMany({ caseId }); } catch {}
      try { await SafetyEvaluation.deleteMany({ caseId }); } catch {}

      caseDoc.isDeleted = true;
      caseDoc.deletedAt = new Date();
      await caseDoc.save();

      purgedCaseCount++;
    }

    // Log Audit Event
    try {
      await AuditLog.create({
        actorId: adminUserId,
        actorRole: UserRole.ADMIN,
        action: AuditEventType.DATA_PURGE_EXECUTED,
        resourceType: 'Retention',
        resourceId: 'SYSTEM_PURGE',
        requestId: requestId || null,
        timestamp: new Date(),
        source: 'RETENTION_SERVICE',
        outcome: 'SUCCESS',
        metadata: {
          purgedCases: purgedCaseCount,
          deletedFiles: deletedFileCount,
          failedFiles: failedFileCount,
          dryRun: false,
          disclaimer: ENGINEERING_RETENTION_DISCLAIMER,
        },
      });
    } catch {}

    return {
      dryRun: false,
      eligibleCases: eligibleCount,
      purgedCases: purgedCaseCount,
      deletedFiles: deletedFileCount,
      failedFiles: failedFileCount,
      fileCleanupErrors,
      timestamp: new Date(),
      disclaimer: ENGINEERING_RETENTION_DISCLAIMER,
    };
  }

  /**
   * Retries failed file cleanups for records marked FILE_CLEANUP_FAILED.
   */
  public static async retryFailedPurges(adminUserId: string): Promise<{ retriedFiles: number; remainingFailures: number }> {
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw createError(403, 'Admin authorization required to retry failed purges');
    }

    const failedReports = await Report.find({ isDeleted: true, purgeStatus: 'FILE_CLEANUP_FAILED' });
    let retriedFiles = 0;
    let remainingFailures = 0;

    for (const report of failedReports) {
      const targetPath = (report as any).filePath || (report as any).storageKey;
      if (targetPath) {
        try {
          if (fs.existsSync(targetPath)) {
            await fs.promises.unlink(targetPath);
          }
          (report as any).purgeStatus = 'PURGED';
          await report.save();
          retriedFiles++;
        } catch (_) {
          remainingFailures++;
        }
      }
    }

    return { retriedFiles, remainingFailures };
  }
}
