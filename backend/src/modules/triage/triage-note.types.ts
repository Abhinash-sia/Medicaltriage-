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

export interface ITimelineEvent {
  eventType?: 'SYMPTOM_ONSET' | 'SYMPTOM_CHANGE' | 'MEDICAL_ENCOUNTER' | 'REPORT' | 'MEDICATION' | 'OTHER';
  date?: string | null;
  relativeTime?: string | null;
  description: string;
  source: 'PATIENT' | 'AI_EXTRACTION' | 'REPORT' | 'VOICE_TRANSCRIPT';
  provenance: 'AI_GENERATED' | 'HUMAN_VERIFIED';
  certainty: 'CERTAIN' | 'APPROXIMATE' | 'UNCERTAIN';
  sourceQuote?: string | null;
}

export interface ITriageNote {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  presentingConcern: string;
  symptomSummary: string;
  timelineSummary?: string;
  timelineEvents?: ITimelineEvent[];
  relevantExtractedReportInfo?: string;
  missingInformation?: string[];
  negativeFindings?: string[];
  uncertainties?: string[];
  confidence?: number | null;
  sourceTextHash?: string;
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
