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
  confidence?: number | null;
}

export interface AiExtractionProvider {
  extractSymptoms(input: { narrative: string; language?: string }): Promise<ExtractionResult>;
}
