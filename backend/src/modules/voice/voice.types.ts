import { Document, Types } from 'mongoose';

export enum VoiceProcessingStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum VoiceTranscriptStatus {
  EMPTY = 'EMPTY',
  AVAILABLE = 'AVAILABLE',
}

export enum VoiceVerificationStatus {
  REQUIRED = 'REQUIRED',
  VERIFIED = 'VERIFIED',
}

export enum TranscriptSource {
  VOICE_TRANSCRIPT = 'VOICE_TRANSCRIPT',
}

export enum TranscriptProvenance {
  AI_GENERATED = 'AI_GENERATED',
  HUMAN_VERIFIED = 'HUMAN_VERIFIED',
}

export interface IVoiceTranscript {
  text: string;
  source: TranscriptSource;
  provenance: TranscriptProvenance;
  language: string;
  confidence?: number | null;
}

export interface IVoiceInput {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  storageKey: string;
  contentHash: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  durationMs?: number | null;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  processingStatus: VoiceProcessingStatus;
  transcriptStatus: VoiceTranscriptStatus;
  verificationStatus: VoiceVerificationStatus;
  requestedLanguage: string;
  detectedLanguage: string;
  provider: string;
  providerRequestId?: string;
  processingError?: string;
  transcript?: IVoiceTranscript;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVoiceInputDocument extends IVoiceInput, Document {
  _id: Types.ObjectId;
}

export interface SpeechToTextOptions {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
}

export interface SpeechToTextResult {
  text: string;
  language: string;
  confidence?: number | null;
  providerRequestId?: string;
  error?: string;
}

export interface SpeechToTextProvider {
  transcribe(options: SpeechToTextOptions): Promise<SpeechToTextResult>;
}
