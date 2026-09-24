import mongoose, { Schema, Model } from 'mongoose';
import { IReportDocument, ReportProcessingStatus, ReportVerificationStatus } from './report.types.js';

const ReportSchema = new Schema<IReportDocument>(
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
    uploadTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: Object.values(ReportProcessingStatus),
      default: ReportProcessingStatus.UPLOADED,
      required: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(ReportVerificationStatus),
      default: ReportVerificationStatus.REQUIRED,
      required: true,
      index: true,
    },
    ocrStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
      trim: true,
    },
    ocrUsable: {
      type: Boolean,
      default: false,
      index: true,
    },
    extractionConfidence: {
      type: Number,
      min: 0.0,
      max: 1.0,
      default: 0.0,
    },
    extractedText: {
      type: String,
      default: '',
    },
    extractedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    hasUnstructuredLabData: {
      type: Boolean,
      default: false,
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
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

// Compound unique index for case-scoped idempotency: same file uploaded twice to the same case is deduplicated
ReportSchema.index({ caseId: 1, contentHash: 1 }, { unique: true });

export const Report: Model<IReportDocument> =
  mongoose.models.Report || mongoose.model<IReportDocument>('Report', ReportSchema);
