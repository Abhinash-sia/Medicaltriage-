import { Document, Types } from 'mongoose';

export type VisualObservationType =
  | 'REDNESS'
  | 'SWELLING'
  | 'DISCOLORATION'
  | 'VISIBLE_WOUND'
  | 'ASYMMETRY'
  | 'VISIBLE_DISCHARGE'
  | 'SKIN_CHANGE'
  | 'OTHER';

export interface VisualObservation {
  id: string;
  type: VisualObservationType;
  description: string;
  location?: string | null;
  certainty: 'OBSERVED' | 'APPARENT' | 'UNCERTAIN';
  provenance: 'AI_GENERATED' | 'HUMAN_VERIFIED';
}

export enum VisualInputProcessingStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum VisualInputVerificationStatus {
  REQUIRED = 'REQUIRED',
  VERIFIED = 'VERIFIED',
}

export type VisualInputQualityStatus = 'SUFFICIENT' | 'INSUFFICIENT' | 'UNKNOWN';

export interface IVisualInput {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  storageKey: string;
  contentHash: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  processingStatus: VisualInputProcessingStatus;
  verificationStatus: VisualInputVerificationStatus;
  qualityStatus: VisualInputQualityStatus;
  qualityNotes?: string | null;
  provider: string;
  observations: VisualObservation[];
  processingError?: string | null;
  verifiedBy?: Types.ObjectId | null;
  verifiedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVisualInputDocument extends IVisualInput, Document {
  _id: Types.ObjectId;
}

export interface VisionAnalysisResult {
  qualityStatus: VisualInputQualityStatus;
  qualityNotes?: string;
  observations: VisualObservation[];
  error?: string;
}

export interface VisionProvider {
  analyzeImage(fileBuffer: Buffer, mimeType: string): Promise<VisionAnalysisResult>;
}
