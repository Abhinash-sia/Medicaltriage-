export interface TimelineEvent {
  eventType?: 'SYMPTOM_ONSET' | 'SYMPTOM_CHANGE' | 'MEDICAL_ENCOUNTER' | 'REPORT' | 'MEDICATION' | 'OTHER' | null;
  date?: string | null;
  relativeTime?: string | null;
  description: string;
  source?: 'PATIENT' | 'AI_EXTRACTION' | 'REPORT' | 'VOICE_TRANSCRIPT' | null;
  provenance?: 'AI_GENERATED' | 'HUMAN_VERIFIED' | null;
  certainty?: 'CERTAIN' | 'APPROXIMATE' | 'UNCERTAIN' | null;
  sourceQuote?: string | null;
}

export interface MissingInformationItem {
  id?: string | null;
  field?: string | null;
  topic?: string | null;
  description: string;
  importance?: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL' | null;
  reason?: string | null;
  source?: 'PATIENT_NARRATIVE' | 'STRUCTURED_SYMPTOMS' | 'TIMELINE' | 'REPORT' | null;
  provenance?: 'AI_GENERATED' | 'HUMAN_VERIFIED' | null;
}

export interface FollowUpQuestion {
  id?: string | null;
  question: string;
  linkedMissingInformationId?: string | null;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  reason?: string | null;
  answerType?: 'TEXT' | 'YES_NO' | 'DATE' | 'DURATION' | 'NUMBER' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'UNKNOWN' | null;
  provenance?: 'AI_GENERATED' | 'HUMAN_VERIFIED' | null;
}

export interface ExtractionResult {
  symptoms: Array<{
    name: string;
    normalizedLabel?: string | null;
    status: 'PRESENT' | 'ABSENT' | 'UNCERTAIN';
    onset?: string | null;
    duration?: string | null;
    frequency?: string | null;
    severity?: string | null;
    context?: string | null;
  }>;
  negativeFindings: string[];
  timeline: TimelineEvent[];
  uncertainties: string[];
  missingInformation?: MissingInformationItem[] | null;
  followUpQuestions?: FollowUpQuestion[] | null;
  confidence?: number | null;
}

export interface AiExtractionProvider {
  extractSymptoms(input: { narrative: string; language?: string }): Promise<ExtractionResult>;
}
