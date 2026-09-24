import { Document, Types } from 'mongoose';

export enum ReportProcessingStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum ReportVerificationStatus {
  REQUIRED = 'REQUIRED',
  VERIFIED = 'VERIFIED',
}

export interface IReport {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  storageKey: string;
  contentHash: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadTimestamp: Date;
  processingStatus: ReportProcessingStatus;
  verificationStatus: ReportVerificationStatus;
  ocrStatus?: 'PENDING' | 'PROCESSED' | 'FAILED';
  ocrUsable: boolean;
  extractionConfidence?: number;
  extractedText: string;
  extractedData?: Record<string, any>;
  hasUnstructuredLabData?: boolean;
  isLatest?: boolean;
  processingError?: string;
  verifiedBy?: Types.ObjectId | null;
  verifiedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportDocument extends IReport, Document {
  _id: Types.ObjectId;
}
