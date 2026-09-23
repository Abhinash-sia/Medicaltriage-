import mongoose, { Schema, Model } from 'mongoose';
import { IVisualInputDocument, VisualInputProcessingStatus, VisualInputVerificationStatus } from './vision.types.js';

const VisualObservationSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['REDNESS', 'SWELLING', 'DISCOLORATION', 'VISIBLE_WOUND', 'ASYMMETRY', 'VISIBLE_DISCHARGE', 'SKIN_CHANGE', 'OTHER'],
      default: 'OTHER',
    },
    description: { type: String, required: true, trim: true },
    location: { type: String, default: null, trim: true },
    certainty: { type: String, enum: ['OBSERVED', 'APPARENT', 'UNCERTAIN'], default: 'OBSERVED' },
    provenance: { type: String, enum: ['AI_GENERATED', 'HUMAN_VERIFIED'], default: 'AI_GENERATED' },
  },
  { _id: false }
);

const VisualInputSchema = new Schema<IVisualInputDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    contentHash: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy user reference is required'],
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    processingStatus: {
      type: String,
      enum: Object.values(VisualInputProcessingStatus),
      default: VisualInputProcessingStatus.UPLOADED,
      required: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VisualInputVerificationStatus),
      default: VisualInputVerificationStatus.REQUIRED,
      required: true,
      index: true,
    },
    qualityStatus: {
      type: String,
      enum: ['SUFFICIENT', 'INSUFFICIENT', 'UNKNOWN'],
      default: 'SUFFICIENT',
      required: true,
    },
    qualityNotes: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      default: 'mock',
      trim: true,
    },
    observations: {
      type: [VisualObservationSchema],
      default: [],
    },
    processingError: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

VisualInputSchema.index({ caseId: 1, contentHash: 1 }, { unique: true });

export const VisualInput: Model<IVisualInputDocument> =
  mongoose.models.VisualInput || mongoose.model<IVisualInputDocument>('VisualInput', VisualInputSchema);
