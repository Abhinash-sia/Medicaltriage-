export interface TimelineEvent {
  description: string;
  relativeTime?: string | null;
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
