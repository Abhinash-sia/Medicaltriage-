import mongoose, { Schema } from 'mongoose';
import {
  IVoiceInputDocument,
  VoiceProcessingStatus,
  VoiceTranscriptStatus,
  VoiceVerificationStatus,
  TranscriptSource,
  TranscriptProvenance,
} from './voice.types.js';

const VoiceTranscriptSchema = new Schema(
  {
    text: { type: String, default: '' },
    source: {
      type: String,
      enum: Object.values(TranscriptSource),
      default: TranscriptSource.VOICE_TRANSCRIPT,
    },
    provenance: {
      type: String,
      enum: Object.values(TranscriptProvenance),
      default: TranscriptProvenance.AI_GENERATED,
    },
    language: { type: String, default: 'UNKNOWN' },
    confidence: { type: Number, default: null },
  },
  { _id: false }
);

const VoiceInputSchema = new Schema<IVoiceInputDocument>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    storageKey: { type: String, required: true },
    contentHash: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    durationMs: { type: Number, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    processingStatus: {
      type: String,
      enum: Object.values(VoiceProcessingStatus),
      default: VoiceProcessingStatus.UPLOADED,
    },
    transcriptStatus: {
      type: String,
      enum: Object.values(VoiceTranscriptStatus),
      default: VoiceTranscriptStatus.EMPTY,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VoiceVerificationStatus),
      default: VoiceVerificationStatus.REQUIRED,
    },
    requestedLanguage: { type: String, default: 'en-IN' },
    detectedLanguage: { type: String, default: 'UNKNOWN' },
    provider: { type: String, required: true, default: 'mock' },
    providerRequestId: { type: String, default: null },
    processingError: { type: String, default: null },
    transcript: { type: VoiceTranscriptSchema, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for case-scoped idempotency
VoiceInputSchema.index({ caseId: 1, contentHash: 1 }, { unique: true });

export const VoiceInputModel = mongoose.model<IVoiceInputDocument>('VoiceInput', VoiceInputSchema);
