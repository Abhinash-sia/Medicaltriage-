import mongoose, { Schema, Model } from 'mongoose';
import {
  ITranslationDocument,
  TranslationSourceType,
  TranslationStatus,
  TranslationProvenance,
  TranslationVerificationStatus,
} from './translation.types.js';

const TranslationSchema = new Schema<ITranslationDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    sourceType: {
      type: String,
      enum: Object.values(TranslationSourceType),
      required: true,
      index: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    sourceLanguage: {
      type: String,
      default: 'UNKNOWN',
      trim: true,
    },
    targetLanguage: {
      type: String,
      required: true,
      trim: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    translatedText: {
      type: String,
      default: '',
    },
    sourceContentHash: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TranslationStatus),
      default: TranslationStatus.PENDING,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    providerRequestId: {
      type: String,
      default: null,
    },
    processingError: {
      type: String,
      default: null,
    },
    provenance: {
      type: String,
      enum: Object.values(TranslationProvenance),
      default: TranslationProvenance.AI_GENERATED,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(TranslationVerificationStatus),
      default: TranslationVerificationStatus.REQUIRED,
      required: true,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound unique index for case-scoped idempotency:
// same caseId + sourceType + sourceId + sourceContentHash + targetLanguage => unique translation record
TranslationSchema.index(
  {
    caseId: 1,
    sourceType: 1,
    sourceId: 1,
    sourceContentHash: 1,
    targetLanguage: 1,
  },
  { unique: true }
);

export const TranslationModel: Model<ITranslationDocument> =
  mongoose.models.Translation ||
  mongoose.model<ITranslationDocument>('Translation', TranslationSchema);
