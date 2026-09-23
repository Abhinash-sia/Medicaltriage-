import fs from 'fs';
import { Types } from 'mongoose';
import { logger } from '../../lib/logger.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { Case } from '../cases/case.model.js';
import { getOcrProvider } from '../ocr/ocr.provider.js';
import { storageService, StorageService } from '../storage/storage.service.js';
import { UserRole } from '../users/user.types.js';
import { Report } from './report.model.js';
import { IReportDocument, ReportProcessingStatus, ReportVerificationStatus } from './report.types.js';

export interface UserContext {
  _id?: Types.ObjectId | string;
  id?: string;
  role: UserRole | string;
  facilityId?: Types.ObjectId | string | null;
}

export class ReportService {
  private storage: StorageService;

  constructor(storageInstance?: StorageService) {
    this.storage = storageInstance || storageService;
  }

  /**
   * Helper to verify authorization for a user against a case.
   */
  private verifyCaseAccess(existingCase: any, user: UserContext): void {
    const userIdStr = (user._id || user.id)?.toString();
    const patientIdStr = existingCase.patientId?.toString();

    // Patient access check
    if (user.role === UserRole.PATIENT) {
      if (patientIdStr !== userIdStr) {
        throw new Error('Access denied: Patient is not authorized to access reports for another patient case');
      }
      return;
    }

    // Facility isolation check for staff/clinicians/reviewers
    const caseFacilityStr = existingCase.facilityId?.toString();
    const userFacilityStr = user.facilityId?.toString();

    if (caseFacilityStr && userFacilityStr && caseFacilityStr !== userFacilityStr) {
      // Check if user is directly assigned to the case
      const assignedIdStr = existingCase.assignedReviewerId?.toString();
      if (assignedIdStr !== userIdStr) {
        throw new Error('Access denied: User facility does not match case facility');
      }
    }
  }

  /**
   * Upload and process report for a case.
   */
  public async uploadAndProcessReport(
    caseId: string,
    fileBuffer: Buffer,
    declaredMimeType: string,
    originalFilename: string,
    user: UserContext
  ): Promise<IReportDocument> {
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      throw new Error(`Case not found with ID: ${caseId}`);
    }

    // Authorize user access to case
    this.verifyCaseAccess(existingCase, user);

    // Validate and save file to storage (validates magic bytes, mime, extension, size, traversal)
    const storedFile = await this.storage.saveFile(fileBuffer, declaredMimeType, originalFilename);

    // Case-level idempotency check: check if report with same (caseId, contentHash) already exists
    const existingReport = await Report.findOne({
      caseId: existingCase._id,
      contentHash: storedFile.contentHash,
    });

    if (existingReport) {
      logger.info({ caseId, contentHash: storedFile.contentHash }, 'Duplicate report uploaded for case, returning existing record');
      return existingReport;
    }

    // Create Report record in UPLOADED state
    const report = await Report.create({
      caseId: existingCase._id,
      storageKey: storedFile.storageKey,
      contentHash: storedFile.contentHash,
      originalFilename: storedFile.originalFilename,
      mimeType: storedFile.mimeType,
      fileSize: storedFile.fileSize,
      uploadTimestamp: new Date(),
      processingStatus: ReportProcessingStatus.UPLOADED,
      verificationStatus: ReportVerificationStatus.REQUIRED,
      ocrStatus: 'PENDING',
      ocrUsable: false,
      extractedText: '',
      extractionConfidence: 0.0,
    });

    const actorId = (user._id || user.id)?.toString() || 'SYSTEM';

    // Emit REPORT_UPLOADED audit log
    await AuditLog.create({
      actorId,
      actorRole: user.role as any,
      action: AuditEventType.REPORT_UPLOADED,
      resourceType: 'Report',
      resourceId: report._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'REPORT_API',
      outcome: 'SUCCESS',
      metadata: {
        originalFilename: storedFile.originalFilename,
        mimeType: storedFile.mimeType,
        fileSize: storedFile.fileSize,
        contentHash: storedFile.contentHash,
      },
    });

    // Update status to PROCESSING
    report.processingStatus = ReportProcessingStatus.PROCESSING;
    await report.save();

    await AuditLog.create({
      actorId,
      actorRole: user.role as any,
      action: AuditEventType.REPORT_OCR_STARTED,
      resourceType: 'Report',
      resourceId: report._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'OCR_SERVICE',
      outcome: 'SUCCESS',
    });

    // Execute OCR Provider
    const ocrProvider = getOcrProvider();
    const ocrResult = await ocrProvider.extractText(fileBuffer, storedFile.mimeType);

    if (ocrResult.error) {
      report.processingStatus = ReportProcessingStatus.FAILED;
      report.ocrStatus = 'FAILED';
      report.processingError = ocrResult.error;
      report.ocrUsable = false;
      report.verificationStatus = ReportVerificationStatus.REQUIRED;
      await report.save();

      await AuditLog.create({
        actorId,
        actorRole: user.role as any,
        action: AuditEventType.REPORT_OCR_FAILED,
        resourceType: 'Report',
        resourceId: report._id.toString(),
        caseId: existingCase._id,
        timestamp: new Date(),
        source: 'OCR_SERVICE',
        outcome: 'FAILURE',
        metadata: { error: ocrResult.error },
      });

      return report;
    }

    // OCR success (text may be empty or present)
    report.processingStatus = ReportProcessingStatus.PROCESSED;
    report.ocrStatus = 'PROCESSED';
    report.extractedText = ocrResult.text;
    report.ocrUsable = ocrResult.usable;
    report.extractionConfidence = ocrResult.confidence || (ocrResult.usable ? 0.9 : 0.0);
    report.verificationStatus = ReportVerificationStatus.REQUIRED;
    await report.save();

    await AuditLog.create({
      actorId,
      actorRole: user.role as any,
      action: AuditEventType.REPORT_OCR_PROCESSED,
      resourceType: 'Report',
      resourceId: report._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'OCR_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        ocrUsable: ocrResult.usable,
        extractedTextLength: ocrResult.text.length,
      },
    });

    return report;
  }

  /**
   * Retrieves list of reports for a case.
   */
  public async getReportsByCaseId(caseId: string, user: UserContext): Promise<IReportDocument[]> {
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      throw new Error(`Case not found with ID: ${caseId}`);
    }

    this.verifyCaseAccess(existingCase, user);

    return Report.find({ caseId: existingCase._id }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves single report metadata by ID.
   */
  public async getReportById(reportId: string, user: UserContext): Promise<IReportDocument> {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error(`Report not found with ID: ${reportId}`);
    }

    const existingCase = await Case.findById(report.caseId);
    if (!existingCase) {
      throw new Error(`Associated case not found for report: ${reportId}`);
    }

    this.verifyCaseAccess(existingCase, user);

    return report;
  }

  /**
   * Retrieves secure file read stream for report download.
   */
  public async getReportFileStream(
    reportId: string,
    user: UserContext
  ): Promise<{ stream: fs.ReadStream; filename: string; mimeType: string }> {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error(`Report not found with ID: ${reportId}`);
    }

    const existingCase = await Case.findById(report.caseId);
    if (!existingCase) {
      throw new Error(`Associated case not found for report: ${reportId}`);
    }

    // Strict cross-user and facility isolation authorization check
    this.verifyCaseAccess(existingCase, user);

    const stream = this.storage.getReadStream(report.storageKey);

    return {
      stream,
      filename: report.originalFilename,
      mimeType: report.mimeType,
    };
  }

  /**
   * Human verification of report OCR results by a reviewer.
   */
  public async verifyReport(reportId: string, user: UserContext): Promise<IReportDocument> {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error(`Report not found with ID: ${reportId}`);
    }

    const existingCase = await Case.findById(report.caseId);
    if (!existingCase) {
      throw new Error(`Associated case not found for report: ${reportId}`);
    }

    // Only reviewer staff (Doctor, Nurse, Health Worker, Medical Officer, Admin) can verify report
    if (user.role === UserRole.PATIENT) {
      throw new Error('Access denied: Only reviewers or admins can verify report OCR output');
    }

    this.verifyCaseAccess(existingCase, user);

    const userIdObj = new Types.ObjectId((user._id || user.id) as string);

    report.verificationStatus = ReportVerificationStatus.VERIFIED;
    report.verifiedBy = userIdObj;
    report.verifiedAt = new Date();
    await report.save();

    await AuditLog.create({
      actorId: userIdObj.toString(),
      actorRole: user.role as any,
      action: AuditEventType.REPORT_OCR_VERIFIED,
      resourceType: 'Report',
      resourceId: report._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'REVIEWER_API',
      outcome: 'SUCCESS',
    });

    return report;
  }
}

export const reportService = new ReportService();
