import { Document, Types } from 'mongoose';

export enum ReportProcessingStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED',
}

export interface IReport {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  uploadTimestamp: Date;
  processingStatus: ReportProcessingStatus;
  ocrStatus?: string;
  extractionStatus?: string;
  extractionConfidence?: number;
  extractedText?: string;
  structuredData?: Record<string, unknown>;
  verificationRequired: boolean;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportDocument extends IReport, Document {
  _id: Types.ObjectId;
}
