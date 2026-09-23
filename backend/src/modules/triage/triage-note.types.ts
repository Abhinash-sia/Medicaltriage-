import { Document, Types } from 'mongoose';
import { CasePriority } from '../cases/case.types.js';

export enum NoteProvenance {
  AI_GENERATED = 'AI_GENERATED',
  HUMAN_VERIFIED = 'HUMAN_VERIFIED',
}

export enum GenerationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ITriageNote {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  presentingConcern: string;
  symptomSummary: string;
  timelineSummary?: string;
  relevantExtractedReportInfo?: string;
  missingInformation?: string[];
  suggestedFollowUpQuestions?: string[];
  safetySignals?: string[];
  priority: CasePriority;
  provenance: NoteProvenance;
  generationStatus: GenerationStatus;
  generatedBy: string;
  generatedAt: Date;
  modelVersion?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewerNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITriageNoteDocument extends ITriageNote, Document {
  _id: Types.ObjectId;
}
