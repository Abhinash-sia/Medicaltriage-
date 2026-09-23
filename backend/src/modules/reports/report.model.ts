import mongoose, { Schema, Model } from 'mongoose';
import { IReportDocument, ReportProcessingStatus } from './report.types.js';

const ReportSchema = new Schema<IReportDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
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
    storagePath: {
      type: String,
      required: true,
      trim: true,
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
    ocrStatus: {
      type: String,
      default: 'PENDING',
      trim: true,
    },
    extractionStatus: {
      type: String,
      default: 'PENDING',
      trim: true,
    },
    extractionConfidence: {
      type: Number,
      min: 0.0,
      max: 1.0,
    },
    extractedText: {
      type: String,
      default: '',
    },
    structuredData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    verificationRequired: {
      type: Boolean,
      default: true,
      index: true,
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

export const Report: Model<IReportDocument> =
  mongoose.models.Report || mongoose.model<IReportDocument>('Report', ReportSchema);
