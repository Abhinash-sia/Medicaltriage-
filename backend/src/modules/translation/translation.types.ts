import { Document, Types } from 'mongoose';
import { z } from 'zod';

export enum TranslationSourceType {
  PATIENT_TEXT = 'PATIENT_TEXT',
  VOICE_TRANSCRIPT = 'VOICE_TRANSCRIPT',
  REPORT_OCR = 'REPORT_OCR',
}

export enum TranslationStatus {
  PENDING = 'PENDING',
  TRANSLATING = 'TRANSLATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TranslationProvenance {
  AI_GENERATED = 'AI_GENERATED',
}

export enum TranslationVerificationStatus {
  REQUIRED = 'REQUIRED',
  VERIFIED = 'VERIFIED',
}

export interface ITranslation {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  sourceType: TranslationSourceType;
  sourceId: Types.ObjectId;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  sourceContentHash: string;
  status: TranslationStatus;
  provider: string;
  providerRequestId?: string;
  processingError?: string;
  provenance: TranslationProvenance;
  verificationStatus: TranslationVerificationStatus;
  verifiedAt?: Date | null;
  verifiedBy?: Types.ObjectId | null;
  requestedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITranslationDocument extends ITranslation, Document {
  _id: Types.ObjectId;
}

export interface TranslationRequest {
  sourceText: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
  providerRequestId?: string;
  error?: string;
}

export interface TranslationProvider {
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

// Zod schemas for API input validation
export const createTranslationSchema = z.object({
  sourceType: z.nativeEnum(TranslationSourceType),
  sourceId: z.string().optional(),
  targetLanguage: z.string().min(2, 'Target language must be at least 2 characters'),
  sourceLanguage: z.string().optional(),
});

export type CreateTranslationInput = z.infer<typeof createTranslationSchema>;
