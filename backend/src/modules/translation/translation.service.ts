import crypto from 'crypto';
import { Types } from 'mongoose';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../middleware/error-handler.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { Case } from '../cases/case.model.js';
import { VoiceInputModel } from '../voice/voice-input.model.js';
import { Report } from '../reports/report.model.js';
import { TranslationModel } from './translation.model.js';
import { getTranslationProvider } from './translation.provider.js';
import {
  ITranslationDocument,
  TranslationSourceType,
  TranslationStatus,
  TranslationProvenance,
  TranslationVerificationStatus,
  TranslationProvider,
} from './translation.types.js';
import {
  isLanguageSupported,
  normalizeLanguageCode,
} from './translation.languages.js';

export class TranslationService {
  private provider?: TranslationProvider;

  constructor(providerInstance?: TranslationProvider) {
    this.provider = providerInstance;
  }

  private getProvider(): TranslationProvider {
    return this.provider || getTranslationProvider();
  }

  /**
   * Request or reuse a translation for patient text, voice transcript, or report OCR.
   */
  public async translateContent(params: {
    caseId: string;
    sourceType: TranslationSourceType;
    sourceId?: string;
    targetLanguage: string;
    sourceLanguage?: string;
    requestedByUserId: string;
  }): Promise<ITranslationDocument> {
    const { caseId, sourceType, sourceId, targetLanguage, sourceLanguage, requestedByUserId } =
      params;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      const error: AppError = new Error('Case not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const normTarget = normalizeLanguageCode(targetLanguage);
    if (!isLanguageSupported(normTarget)) {
      const error: AppError = new Error(`Unsupported or invalid target language: ${targetLanguage}`);
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    // Resolve source content and source record ID
    let originalText = '';
    let resolvedSourceId = sourceId || caseId;
    let detectedLanguageFromSource: string | undefined = undefined;

    if (sourceType === TranslationSourceType.PATIENT_TEXT) {
      resolvedSourceId = caseId;
      originalText = caseDoc.chiefComplaint || '';
      if (!originalText.trim()) {
        const error: AppError = new Error('No patient text content available to translate');
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }
    } else if (sourceType === TranslationSourceType.VOICE_TRANSCRIPT) {
      if (!sourceId) {
        const error: AppError = new Error('sourceId is required for VOICE_TRANSCRIPT translation');
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }
      const voiceInput = await VoiceInputModel.findById(sourceId);
      if (!voiceInput || voiceInput.caseId.toString() !== caseId) {
        const error: AppError = new Error('Voice transcript not found for this case');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }
      originalText = voiceInput.transcript?.text || '';
      detectedLanguageFromSource = voiceInput.detectedLanguage;
      if (!originalText.trim()) {
        const error: AppError = new Error('No voice transcript text available to translate');
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }
    } else if (sourceType === TranslationSourceType.REPORT_OCR) {
      if (!sourceId) {
        const error: AppError = new Error('sourceId is required for REPORT_OCR translation');
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }
      const report = await Report.findById(sourceId);
      if (!report || report.caseId.toString() !== caseId) {
        const error: AppError = new Error('Report not found for this case');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }
      originalText = report.extractedText || '';
      if (!originalText.trim()) {
        const error: AppError = new Error('No OCR text available to translate');
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }
    } else {
      const error: AppError = new Error(`Unsupported sourceType: ${sourceType}`);
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    // Compute deterministic SHA-256 hash of the exact original source content
    const sourceContentHash = crypto.createHash('sha256').update(originalText).digest('hex');

    // Idempotency check: caseId + sourceType + sourceId + sourceContentHash + targetLanguage
    const existingTranslation = await TranslationModel.findOne({
      caseId: new Types.ObjectId(caseId),
      sourceType,
      sourceId: new Types.ObjectId(resolvedSourceId),
      sourceContentHash,
      targetLanguage: normTarget,
    });

    if (existingTranslation && existingTranslation.status === TranslationStatus.COMPLETED) {
      logger.info(
        { caseId, translationId: existingTranslation._id },
        'Reusing existing completed translation for identical source text and target language'
      );
      return existingTranslation;
    }

    const effectiveSourceLanguage = sourceLanguage
      ? normalizeLanguageCode(sourceLanguage)
      : detectedLanguageFromSource && detectedLanguageFromSource !== 'UNKNOWN'
      ? normalizeLanguageCode(detectedLanguageFromSource)
      : caseDoc.language
      ? normalizeLanguageCode(caseDoc.language)
      : 'UNKNOWN';

    // Create or update record to TRANSLATING state
    let translationRecord: ITranslationDocument;
    if (existingTranslation) {
      existingTranslation.status = TranslationStatus.TRANSLATING;
      existingTranslation.processingError = undefined;
      translationRecord = await existingTranslation.save();
    } else {
      try {
        translationRecord = await TranslationModel.create({
          caseId: new Types.ObjectId(caseId),
          sourceType,
          sourceId: new Types.ObjectId(resolvedSourceId),
          sourceLanguage: effectiveSourceLanguage,
          targetLanguage: normTarget,
          originalText,
          translatedText: '',
          sourceContentHash,
          status: TranslationStatus.TRANSLATING,
          provider: 'mock',
          provenance: TranslationProvenance.AI_GENERATED,
          verificationStatus: TranslationVerificationStatus.REQUIRED,
          requestedBy: new Types.ObjectId(requestedByUserId),
        });
      } catch (createErr: any) {
        // Handle concurrent request duplicate key race (E11000)
        if (
          createErr.code === 11000 ||
          createErr.message?.includes('E11000') ||
          createErr.message?.includes('duplicate key')
        ) {
          logger.info(
            { caseId, sourceContentHash, sourceType, normTarget },
            'Caught concurrent creation race; returning existing translation record'
          );
          const racedRecord = await TranslationModel.findOne({
            caseId: new Types.ObjectId(caseId),
            sourceType,
            sourceId: new Types.ObjectId(resolvedSourceId),
            sourceContentHash,
            targetLanguage: normTarget,
          });
          if (racedRecord) {
            if (racedRecord.status === TranslationStatus.COMPLETED) {
              return racedRecord;
            }
            translationRecord = racedRecord;
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }

    // Audit logs
    await AuditLog.create({
      actorId: requestedByUserId,
      actorRole: 'USER',
      action: AuditEventType.TRANSLATION_REQUESTED,
      resourceType: 'Translation',
      resourceId: translationRecord._id.toString(),
      caseId: new Types.ObjectId(caseId),
      timestamp: new Date(),
      source: 'TRANSLATION_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        sourceType,
        sourceId: resolvedSourceId,
        targetLanguage: normTarget,
      },
    });

    await AuditLog.create({
      actorId: requestedByUserId,
      actorRole: 'USER',
      action: AuditEventType.TRANSLATION_STARTED,
      resourceType: 'Translation',
      resourceId: translationRecord._id.toString(),
      caseId: new Types.ObjectId(caseId),
      timestamp: new Date(),
      source: 'TRANSLATION_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        sourceType,
        targetLanguage: normTarget,
      },
    });

    // Execute provider translation
    const provider = this.getProvider();
    const result = await provider.translate({
      sourceText: originalText,
      sourceLanguage: effectiveSourceLanguage,
      targetLanguage: normTarget,
    });

    // Handle provider error or empty output
    if (result.error || !result.translatedText || !result.translatedText.trim()) {
      translationRecord.status = TranslationStatus.FAILED;
      translationRecord.processingError =
        result.error || 'Translation provider returned empty output';
      translationRecord.provider = result.provider;
      translationRecord.providerRequestId = result.providerRequestId;
      await translationRecord.save();

      await AuditLog.create({
        actorId: requestedByUserId,
        actorRole: 'USER',
        action: AuditEventType.TRANSLATION_FAILED,
        resourceType: 'Translation',
        resourceId: translationRecord._id.toString(),
        caseId: new Types.ObjectId(caseId),
        timestamp: new Date(),
        source: 'TRANSLATION_SERVICE',
        outcome: 'FAILURE',
        metadata: {
          error: translationRecord.processingError,
          provider: result.provider,
        },
      });

      return translationRecord;
    }

    // Save successful translation atomically
    translationRecord.status = TranslationStatus.COMPLETED;
    translationRecord.translatedText = result.translatedText;
    translationRecord.sourceLanguage = result.sourceLanguage || effectiveSourceLanguage;
    translationRecord.provider = result.provider;
    translationRecord.providerRequestId = result.providerRequestId;
    translationRecord.processingError = undefined;
    await translationRecord.save();

    await AuditLog.create({
      actorId: requestedByUserId,
      actorRole: 'USER',
      action: AuditEventType.TRANSLATION_COMPLETED,
      resourceType: 'Translation',
      resourceId: translationRecord._id.toString(),
      caseId: new Types.ObjectId(caseId),
      timestamp: new Date(),
      source: 'TRANSLATION_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        sourceType,
        targetLanguage: normTarget,
        provider: result.provider,
      },
    });

    return translationRecord;
  }

  /**
   * Get all translations for a case.
   */
  public async getTranslationsForCase(caseId: string): Promise<ITranslationDocument[]> {
    return TranslationModel.find({ caseId: new Types.ObjectId(caseId) }).sort({ createdAt: -1 });
  }

  /**
   * Get translation by ID.
   */
  public async getTranslationById(translationId: string): Promise<ITranslationDocument> {
    const translation = await TranslationModel.findById(translationId);
    if (!translation) {
      const error: AppError = new Error('Translation not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return translation;
  }

  /**
   * Verify translation (Reviewers only).
   */
  public async verifyTranslation(
    translationId: string,
    reviewerUserId: string
  ): Promise<ITranslationDocument> {
    const translation = await TranslationModel.findById(translationId);
    if (!translation) {
      const error: AppError = new Error('Translation not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (translation.status !== TranslationStatus.COMPLETED) {
      const error: AppError = new Error('Cannot verify an incomplete or failed translation');
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    translation.verificationStatus = TranslationVerificationStatus.VERIFIED;
    translation.verifiedBy = new Types.ObjectId(reviewerUserId);
    translation.verifiedAt = new Date();
    await translation.save();

    await AuditLog.create({
      actorId: reviewerUserId,
      actorRole: 'REVIEWER',
      action: AuditEventType.TRANSLATION_VERIFIED,
      resourceType: 'Translation',
      resourceId: translation._id.toString(),
      caseId: translation.caseId,
      timestamp: new Date(),
      source: 'TRANSLATION_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        verifiedBy: reviewerUserId,
        verifiedAt: translation.verifiedAt,
      },
    });

    return translation;
  }
}

export const translationService = new TranslationService();
