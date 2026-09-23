import fs from 'fs';
import { Types } from 'mongoose';
import { logger } from '../../lib/logger.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { Case } from '../cases/case.model.js';
import { storageService, StorageService } from '../storage/storage.service.js';
import { UserRole } from '../users/user.types.js';
import { safetySuppressionEngine } from './safety-suppression.engine.js';
import { visionAnalysisResultSchema } from './vision.schemas.js';
import { getVisionProvider } from './vision.provider.js';
import { VisualInput } from './visual-input.model.js';
import { IVisualInputDocument, VisualInputProcessingStatus, VisualInputVerificationStatus } from './vision.types.js';

export interface UserContext {
  _id?: Types.ObjectId | string;
  id?: string;
  role: UserRole | string;
  facilityId?: Types.ObjectId | string | null;
}

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

export class VisualInputService {
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
        throw new Error('Access denied: Patient is not authorized to access visual inputs for another patient case');
      }
      return;
    }

    // Facility isolation check for staff/clinicians/reviewers
    const caseFacilityStr = existingCase.facilityId?.toString();
    const userFacilityStr = user.facilityId?.toString();

    if (caseFacilityStr && userFacilityStr && caseFacilityStr !== userFacilityStr) {
      const assignedIdStr = existingCase.assignedReviewerId?.toString();
      if (assignedIdStr !== userIdStr) {
        throw new Error('Access denied: User facility does not match case facility');
      }
    }
  }

  /**
   * Pre-vision image quality check.
   */
  public validateImageQuality(
    fileBuffer: Buffer,
    declaredMimeType: string,
    originalFilename: string
  ): { isValid: boolean; error?: string } {
    if (!fileBuffer || fileBuffer.length === 0) {
      return { isValid: false, error: 'File buffer is empty' };
    }

    const ext = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      return { isValid: false, error: `Unsupported image file extension: ${ext}. Visual inputs support JPEG and PNG images only.` };
    }

    const normMime = declaredMimeType.toLowerCase().trim();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(normMime)) {
      return { isValid: false, error: `Unsupported image MIME type: ${declaredMimeType}` };
    }

    // Magic byte signature check
    if (fileBuffer.length < 4) {
      return { isValid: false, error: 'Image file is too small to contain valid headers' };
    }

    const isPng = fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4e && fileBuffer[3] === 0x47;
    const isJpg = fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff;

    if (!isPng && !isJpg) {
      return { isValid: false, error: 'File header does not match JPEG or PNG magic bytes' };
    }

    return { isValid: true };
  }

  /**
   * Upload and analyze visual input.
   */
  public async uploadAndProcessVisualInput(
    caseId: string,
    fileBuffer: Buffer,
    declaredMimeType: string,
    originalFilename: string,
    user: UserContext
  ): Promise<IVisualInputDocument> {
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      throw new Error(`Case not found with ID: ${caseId}`);
    }

    this.verifyCaseAccess(existingCase, user);

    // 1. Pre-vision quality check BEFORE Vision Provider call
    const qualityCheck = this.validateImageQuality(fileBuffer, declaredMimeType, originalFilename);
    if (!qualityCheck.isValid) {
      throw new Error(`Image validation failed: ${qualityCheck.error}`);
    }

    // Save file and compute SHA-256 hash
    const storedFile = await this.storage.saveFile(fileBuffer, declaredMimeType, originalFilename);

    const userIdObj = new Types.ObjectId((user._id || user.id) as string);

    // Case-scoped idempotency check (caseId + contentHash)
    const existingInput = await VisualInput.findOne({
      caseId: existingCase._id,
      contentHash: storedFile.contentHash,
    });

    if (existingInput) {
      logger.info({ caseId, contentHash: storedFile.contentHash }, 'Duplicate visual input uploaded for case, returning existing record');
      return existingInput;
    }

    // Create VisualInput in UPLOADED state
    const visualInput = await VisualInput.create({
      caseId: existingCase._id,
      storageKey: storedFile.storageKey,
      contentHash: storedFile.contentHash,
      originalFilename: storedFile.originalFilename,
      mimeType: storedFile.mimeType,
      fileSize: storedFile.fileSize,
      uploadedBy: userIdObj,
      uploadedAt: new Date(),
      processingStatus: VisualInputProcessingStatus.UPLOADED,
      verificationStatus: VisualInputVerificationStatus.REQUIRED,
      qualityStatus: 'SUFFICIENT',
      provider: 'mock',
      observations: [],
    });

    // Emit VISUAL_INPUT_UPLOADED audit log
    await AuditLog.create({
      actorId: userIdObj.toString(),
      actorRole: user.role as any,
      action: AuditEventType.VISUAL_INPUT_UPLOADED,
      resourceType: 'VisualInput',
      resourceId: visualInput._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'VISUAL_INPUT_API',
      outcome: 'SUCCESS',
      metadata: {
        originalFilename: storedFile.originalFilename,
        mimeType: storedFile.mimeType,
        fileSize: storedFile.fileSize,
        contentHash: storedFile.contentHash,
      },
    });

    // Update status to PROCESSING
    visualInput.processingStatus = VisualInputProcessingStatus.PROCESSING;
    await visualInput.save();

    await AuditLog.create({
      actorId: userIdObj.toString(),
      actorRole: user.role as any,
      action: AuditEventType.VISUAL_ANALYSIS_STARTED,
      resourceType: 'VisualInput',
      resourceId: visualInput._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'VISION_SERVICE',
      outcome: 'SUCCESS',
    });

    // Execute Vision Provider
    const visionProvider = getVisionProvider();
    const rawResult = await visionProvider.analyzeImage(fileBuffer, storedFile.mimeType);

    // Validate raw result via Zod schema
    const validatedResult = visionAnalysisResultSchema.parse(rawResult);

    if (validatedResult.qualityStatus === 'INSUFFICIENT' || validatedResult.error) {
      const errMsg = validatedResult.error || validatedResult.qualityNotes || 'Image quality is insufficient for reliable visual observation.';
      visualInput.processingStatus = VisualInputProcessingStatus.FAILED;
      visualInput.qualityStatus = 'INSUFFICIENT';
      visualInput.qualityNotes = validatedResult.qualityNotes || errMsg;
      visualInput.processingError = errMsg;
      visualInput.verificationStatus = VisualInputVerificationStatus.REQUIRED;
      await visualInput.save();

      await AuditLog.create({
        actorId: userIdObj.toString(),
        actorRole: user.role as any,
        action: AuditEventType.VISUAL_ANALYSIS_FAILED,
        resourceType: 'VisualInput',
        resourceId: visualInput._id.toString(),
        caseId: existingCase._id,
        timestamp: new Date(),
        source: 'VISION_SERVICE',
        outcome: 'FAILURE',
        metadata: { error: errMsg, qualityStatus: 'INSUFFICIENT' },
      });

      return visualInput;
    }

    // Apply Safety Suppression Engine
    const safeObservations = safetySuppressionEngine.filterObservations(validatedResult.observations as any);

    visualInput.processingStatus = VisualInputProcessingStatus.PROCESSED;
    visualInput.qualityStatus = 'SUFFICIENT';
    visualInput.observations = safeObservations as any;
    visualInput.verificationStatus = VisualInputVerificationStatus.REQUIRED;
    await visualInput.save();

    await AuditLog.create({
      actorId: userIdObj.toString(),
      actorRole: user.role as any,
      action: AuditEventType.VISUAL_ANALYSIS_PROCESSED,
      resourceType: 'VisualInput',
      resourceId: visualInput._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'VISION_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        observationCount: safeObservations.length,
        qualityStatus: 'SUFFICIENT',
      },
    });

    return visualInput;
  }

  public async getVisualInputsByCaseId(caseId: string, user: UserContext): Promise<IVisualInputDocument[]> {
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      throw new Error(`Case not found with ID: ${caseId}`);
    }

    this.verifyCaseAccess(existingCase, user);

    return VisualInput.find({ caseId: existingCase._id }).sort({ createdAt: -1 });
  }

  public async getVisualInputById(visualInputId: string, user: UserContext): Promise<IVisualInputDocument> {
    const visualInput = await VisualInput.findById(visualInputId);
    if (!visualInput) {
      throw new Error(`Visual input not found with ID: ${visualInputId}`);
    }

    const existingCase = await Case.findById(visualInput.caseId);
    if (!existingCase) {
      throw new Error(`Associated case not found for visual input: ${visualInputId}`);
    }

    this.verifyCaseAccess(existingCase, user);

    return visualInput;
  }

  public async getVisualInputFileStream(
    visualInputId: string,
    user: UserContext
  ): Promise<{ stream: fs.ReadStream; filename: string; mimeType: string }> {
    const visualInput = await VisualInput.findById(visualInputId);
    if (!visualInput) {
      throw new Error(`Visual input not found with ID: ${visualInputId}`);
    }

    const existingCase = await Case.findById(visualInput.caseId);
    if (!existingCase) {
      throw new Error(`Associated case not found for visual input: ${visualInputId}`);
    }

    this.verifyCaseAccess(existingCase, user);

    const stream = this.storage.getReadStream(visualInput.storageKey);

    return {
      stream,
      filename: visualInput.originalFilename,
      mimeType: visualInput.mimeType,
    };
  }

  public async verifyVisualInput(visualInputId: string, user: UserContext): Promise<IVisualInputDocument> {
    const visualInput = await VisualInput.findById(visualInputId);
    if (!visualInput) {
      throw new Error(`Visual input not found with ID: ${visualInputId}`);
    }

    const existingCase = await Case.findById(visualInput.caseId);
    if (!existingCase) {
      throw new Error(`Associated case not found for visual input: ${visualInputId}`);
    }

    if (user.role === UserRole.PATIENT) {
      throw new Error('Access denied: Only reviewers or admins can verify visual input observations');
    }

    this.verifyCaseAccess(existingCase, user);

    const userIdObj = new Types.ObjectId((user._id || user.id) as string);

    visualInput.verificationStatus = VisualInputVerificationStatus.VERIFIED;
    visualInput.verifiedBy = userIdObj;
    visualInput.verifiedAt = new Date();
    await visualInput.save();

    await AuditLog.create({
      actorId: userIdObj.toString(),
      actorRole: user.role as any,
      action: AuditEventType.VISUAL_INPUT_VERIFIED,
      resourceType: 'VisualInput',
      resourceId: visualInput._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'REVIEWER_API',
      outcome: 'SUCCESS',
    });

    return visualInput;
  }
}

export const visualInputService = new VisualInputService();
