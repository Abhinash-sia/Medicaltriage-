import fs from 'fs';
import { Types } from 'mongoose';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { storageService, StorageService } from '../storage/storage.service.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { Case } from '../cases/case.model.js';
import { VoiceInputModel } from './voice-input.model.js';
import { getSpeechToTextProvider } from './voice.provider.js';
import {
  IVoiceInputDocument,
  VoiceProcessingStatus,
  VoiceTranscriptStatus,
  VoiceVerificationStatus,
  TranscriptSource,
  TranscriptProvenance,
  SpeechToTextProvider,
} from './voice.types.js';

export class VoiceInputService {
  private storage: StorageService;
  private sttProvider?: SpeechToTextProvider;

  constructor(storageInstance?: StorageService, sttProviderInstance?: SpeechToTextProvider) {
    this.storage = storageInstance || storageService;
    this.sttProvider = sttProviderInstance;
  }

  /**
   * Uploads and initiates transcription for a patient voice input.
   */
  public async uploadVoiceInput(
    caseId: string,
    fileBuffer: Buffer,
    declaredMimeType: string,
    originalFilename: string,
    uploadedByUserId: string,
    requestedLanguage?: string
  ): Promise<IVoiceInputDocument> {
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new Error('Case not found');
    }

    // File validation (MIME, extension, size, magic bytes)
    const validation = this.storage.validateFile(fileBuffer, declaredMimeType, originalFilename);
    if (!validation.isValid) {
      throw new Error(`Audio format is not supported for transcription. (${validation.error})`);
    }

    // Compute content hash
    const contentHash = this.storage.computeContentHash(fileBuffer);

    // Case-scoped idempotency check: caseId + contentHash
    const existingInput = await VoiceInputModel.findOne({
      caseId: new Types.ObjectId(caseId),
      contentHash,
    });

    if (existingInput) {
      logger.info(
        { caseId, contentHash, voiceInputId: existingInput._id },
        'Reusing existing VoiceInput for duplicate audio upload on same case'
      );
      return existingInput;
    }

    // Save audio file to storage
    const storedFile = await this.storage.saveFile(
      fileBuffer,
      declaredMimeType,
      originalFilename,
      'voice'
    );

    const lang = requestedLanguage || caseDoc.language || 'en-IN';

    // Create VoiceInput record
    const voiceInput = await VoiceInputModel.create({
      caseId: new Types.ObjectId(caseId),
      storageKey: storedFile.storageKey,
      contentHash,
      originalFilename: storedFile.originalFilename,
      mimeType: storedFile.mimeType,
      fileSize: storedFile.fileSize,
      durationMs: null,
      uploadedBy: new Types.ObjectId(uploadedByUserId),
      uploadedAt: new Date(),
      processingStatus: VoiceProcessingStatus.UPLOADED,
      transcriptStatus: VoiceTranscriptStatus.EMPTY,
      verificationStatus: VoiceVerificationStatus.REQUIRED,
      requestedLanguage: lang,
      detectedLanguage: 'UNKNOWN',
      provider: env.STT_PROVIDER,
    });

    // Audit log
    await AuditLog.create({
      actorId: uploadedByUserId,
      actorRole: 'PATIENT',
      action: AuditEventType.VOICE_INPUT_UPLOADED,
      resourceType: 'VoiceInput',
      resourceId: voiceInput._id.toString(),
      caseId: new Types.ObjectId(caseId),
      timestamp: new Date(),
      source: 'VOICE_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        mimeType: storedFile.mimeType,
        fileSize: storedFile.fileSize,
        originalFilename: storedFile.originalFilename,
      },
    });

    // Run transcription
    return await this.transcribeVoiceInput(voiceInput._id.toString(), uploadedByUserId);
  }

  /**
   * Performs STT transcription for a VoiceInput record.
   */
  public async transcribeVoiceInput(
    voiceInputId: string,
    actorId = 'SYSTEM'
  ): Promise<IVoiceInputDocument> {
    const voiceInput = await VoiceInputModel.findById(voiceInputId);
    if (!voiceInput) {
      throw new Error('VoiceInput not found');
    }

    voiceInput.processingStatus = VoiceProcessingStatus.PROCESSING;
    await voiceInput.save();

    await AuditLog.create({
      actorId,
      actorRole: actorId === 'SYSTEM' ? 'SYSTEM' : 'PATIENT',
      action: AuditEventType.VOICE_TRANSCRIPTION_STARTED,
      resourceType: 'VoiceInput',
      resourceId: voiceInput._id.toString(),
      caseId: voiceInput.caseId,
      timestamp: new Date(),
      source: 'VOICE_SERVICE',
      outcome: 'SUCCESS',
    });

    try {
      // Read audio file buffer from storage
      const physicalPath = this.storage.getResolvedPath(voiceInput.storageKey);
      const audioBuffer = await fs.promises.readFile(physicalPath);

      const provider = this.sttProvider || getSpeechToTextProvider(voiceInput.provider);

      const result = await provider.transcribe({
        audioBuffer,
        mimeType: voiceInput.mimeType,
        language: voiceInput.requestedLanguage,
      });

      if (result.error) {
        voiceInput.processingStatus = VoiceProcessingStatus.FAILED;
        voiceInput.processingError = result.error;
        await voiceInput.save();

        await AuditLog.create({
          actorId,
          actorRole: actorId === 'SYSTEM' ? 'SYSTEM' : 'PATIENT',
          action: AuditEventType.VOICE_TRANSCRIPTION_FAILED,
          resourceType: 'VoiceInput',
          resourceId: voiceInput._id.toString(),
          caseId: voiceInput.caseId,
          timestamp: new Date(),
          source: 'VOICE_SERVICE',
          outcome: 'FAILURE',
          metadata: { error: result.error },
        });

        return voiceInput;
      }

      const rawText = (result.text || '').trim();
      const detectedLang = result.language || voiceInput.requestedLanguage || 'UNKNOWN';

      if (rawText === '') {
        voiceInput.processingStatus = VoiceProcessingStatus.PROCESSED;
        voiceInput.transcriptStatus = VoiceTranscriptStatus.EMPTY;
        voiceInput.detectedLanguage = detectedLang;
        voiceInput.providerRequestId = result.providerRequestId || undefined;
        voiceInput.transcript = {
          text: '',
          source: TranscriptSource.VOICE_TRANSCRIPT,
          provenance: TranscriptProvenance.AI_GENERATED,
          language: detectedLang,
          confidence: result.confidence ?? null,
        };
      } else {
        voiceInput.processingStatus = VoiceProcessingStatus.PROCESSED;
        voiceInput.transcriptStatus = VoiceTranscriptStatus.AVAILABLE;
        voiceInput.detectedLanguage = detectedLang;
        voiceInput.providerRequestId = result.providerRequestId || undefined;
        voiceInput.transcript = {
          text: rawText,
          source: TranscriptSource.VOICE_TRANSCRIPT,
          provenance: TranscriptProvenance.AI_GENERATED,
          language: detectedLang,
          confidence: result.confidence ?? null,
        };
      }

      await voiceInput.save();

      await AuditLog.create({
        actorId,
        actorRole: actorId === 'SYSTEM' ? 'SYSTEM' : 'PATIENT',
        action: AuditEventType.VOICE_TRANSCRIPTION_PROCESSED,
        resourceType: 'VoiceInput',
        resourceId: voiceInput._id.toString(),
        caseId: voiceInput.caseId,
        timestamp: new Date(),
        source: 'VOICE_SERVICE',
        outcome: 'SUCCESS',
        metadata: {
          transcriptStatus: voiceInput.transcriptStatus,
          detectedLanguage: voiceInput.detectedLanguage,
        },
      });

      return voiceInput;
    } catch (err: any) {
      voiceInput.processingStatus = VoiceProcessingStatus.FAILED;
      voiceInput.processingError = 'Audio transcription could not be completed.';
      await voiceInput.save();

      await AuditLog.create({
        actorId,
        actorRole: actorId === 'SYSTEM' ? 'SYSTEM' : 'PATIENT',
        action: AuditEventType.VOICE_TRANSCRIPTION_FAILED,
        resourceType: 'VoiceInput',
        resourceId: voiceInput._id.toString(),
        caseId: voiceInput.caseId,
        timestamp: new Date(),
        source: 'VOICE_SERVICE',
        outcome: 'FAILURE',
        metadata: { error: err?.message },
      });

      return voiceInput;
    }
  }

  /**
   * Retrieves voice inputs for a case.
   */
  public async getVoiceInputsForCase(caseId: string): Promise<IVoiceInputDocument[]> {
    return await VoiceInputModel.find({ caseId: new Types.ObjectId(caseId) }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a single voice input by ID.
   */
  public async getVoiceInputById(voiceInputId: string): Promise<IVoiceInputDocument | null> {
    return await VoiceInputModel.findById(voiceInputId);
  }

  /**
   * Retrieves read stream for voice input audio file.
   */
  public async getAudioReadStream(voiceInputId: string): Promise<{
    readStream: fs.ReadStream;
    mimeType: string;
    originalFilename: string;
    fileSize: number;
  }> {
    const voiceInput = await VoiceInputModel.findById(voiceInputId);
    if (!voiceInput) {
      throw new Error('VoiceInput record not found');
    }

    const readStream = this.storage.getReadStream(voiceInput.storageKey);
    return {
      readStream,
      mimeType: voiceInput.mimeType,
      originalFilename: voiceInput.originalFilename,
      fileSize: voiceInput.fileSize,
    };
  }

  /**
   * Reviewer marks a machine-generated transcript as verified.
   */
  public async verifyVoiceInput(
    voiceInputId: string,
    reviewerId: string,
    reviewerRole = 'DOCTOR'
  ): Promise<IVoiceInputDocument> {
    const voiceInput = await VoiceInputModel.findById(voiceInputId);
    if (!voiceInput) {
      throw new Error('VoiceInput record not found');
    }

    voiceInput.verificationStatus = VoiceVerificationStatus.VERIFIED;
    voiceInput.verifiedBy = new Types.ObjectId(reviewerId);
    voiceInput.verifiedAt = new Date();
    await voiceInput.save();

    await AuditLog.create({
      actorId: reviewerId,
      actorRole: reviewerRole as any,
      action: AuditEventType.VOICE_INPUT_VERIFIED,
      resourceType: 'VoiceInput',
      resourceId: voiceInput._id.toString(),
      caseId: voiceInput.caseId,
      timestamp: new Date(),
      source: 'VOICE_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        verifiedAt: voiceInput.verifiedAt,
      },
    });

    return voiceInput;
  }
}

export const voiceInputService = new VoiceInputService();
