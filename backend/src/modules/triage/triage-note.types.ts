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

export interface IMissingInformationItem {
  id: string;
  field?: string;
  topic?: string;
  description: string;
  importance: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  reason?: string;
  source: 'PATIENT_NARRATIVE' | 'STRUCTURED_SYMPTOMS' | 'TIMELINE' | 'REPORT';
  provenance: 'AI_GENERATED' | 'HUMAN_VERIFIED';
}

export interface IFollowUpQuestionItem {
  id: string;
  question: string;
  linkedMissingInformationId?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason?: string;
  answerType: 'TEXT' | 'YES_NO' | 'DATE' | 'DURATION' | 'NUMBER' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'UNKNOWN';
  provenance: 'AI_GENERATED' | 'HUMAN_VERIFIED';
}

export enum NoteStatus {
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
}

export interface ISymptomSectionItem {
  id: string;
  name: string;
  severity?: string;
  duration?: string;
  bodySite?: string;
  category?: string;
  verifiedStatus?: string;
  source: string;
  provenance: string;
}

export interface IReportSectionItem {
  reportId: string;
  fileType: string;
  status: string;
  summary?: string;
  keyFindings?: string[];
  verifiedByHuman: boolean;
  uploadedAt: Date;
}

export interface IVoiceSectionItem {
  voiceId: string;
  transcript: string;
  durationSeconds?: number;
  verifiedByHuman: boolean;
  uploadedAt: Date;
}

export interface IVisualSectionItem {
  visualId: string;
  imageType: string;
  description?: string;
  keyFindings?: string[];
  verifiedByHuman: boolean;
  uploadedAt: Date;
}

export interface ITranslationSectionItem {
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  provider: string;
  verifiedByHuman: boolean;
}

export interface ISafetyReviewSection {
  activeEvaluationId?: string;
  priority: CasePriority;
  triggeredRules: Array<{
    ruleId: string;
    ruleName: string;
    category: string;
    matchedTrigger: string;
    recommendedPriority: CasePriority;
  }>;
  evaluatedAt: Date;
}

export interface IReviewerAttentionSection {
  criticalCount: number;
  unverifiedCount: number;
  uncertaintiesCount: number;
  safetyUrgent: boolean;
  actionRequired: string;
}

export interface ITriageNote {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  noteVersion?: number;
  status?: NoteStatus | 'ACTIVE' | 'SUPERSEDED';
  sourceEvidenceHash?: string;
  presentingConcern: string;
  symptomSummary: string;
  timelineSummary?: string;
  timelineEvents?: ITimelineEvent[];
  relevantExtractedReportInfo?: string;
  missingInformation?: string[];
  missingInformationItems?: IMissingInformationItem[];
  negativeFindings?: string[];
  uncertainties?: string[];
  confidence?: number | null;
  sourceTextHash?: string;
  suggestedFollowUpQuestions?: string[];
  followUpQuestionItems?: IFollowUpQuestionItem[];
  safetySignals?: string[];
  symptomsSection?: ISymptomSectionItem[];
  reportsSection?: IReportSectionItem[];
  voiceSection?: IVoiceSectionItem[];
  visualSection?: IVisualSectionItem[];
  translationsSection?: ITranslationSectionItem[];
  safetyReviewSection?: ISafetyReviewSection;
  reviewerAttentionSection?: IReviewerAttentionSection;
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

