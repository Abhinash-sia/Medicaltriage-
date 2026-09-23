import { AiExtractionProvider, ExtractionResult } from './ai.types.js';

export class MockAiExtractionProvider implements AiExtractionProvider {
  private customHandler?: (input: { narrative: string; language?: string }) => Promise<ExtractionResult> | ExtractionResult;
  private shouldFailWith?: Error;
  private delayMs: number = 0;

  constructor(options?: {
    customHandler?: (input: { narrative: string; language?: string }) => Promise<ExtractionResult> | ExtractionResult;
    shouldFailWith?: Error;
    delayMs?: number;
  }) {
    this.customHandler = options?.customHandler;
    this.shouldFailWith = options?.shouldFailWith;
    this.delayMs = options?.delayMs || 0;
  }

  setCustomHandler(handler: (input: { narrative: string; language?: string }) => Promise<ExtractionResult> | ExtractionResult) {
    this.customHandler = handler;
  }

  setFailure(error: Error) {
    this.shouldFailWith = error;
  }

  clearFailure() {
    this.shouldFailWith = undefined;
  }

  async extractSymptoms(input: { narrative: string; language?: string }): Promise<ExtractionResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldFailWith) {
      throw this.shouldFailWith;
    }

    if (this.customHandler) {
      return await this.customHandler(input);
    }

    // Default mock response based on sample text or generic extraction
    const narrative = input.narrative.toLowerCase();
    const symptoms: ExtractionResult['symptoms'] = [];
    const negativeFindings: string[] = [];
    const uncertainties: string[] = [];

    if (narrative.includes('fever')) {
      symptoms.push({
        name: 'fever',
        normalizedLabel: 'fever',
        status: 'PRESENT',
        duration: narrative.includes('three days') || narrative.includes('3 days') ? '3 days' : null,
        onset: narrative.includes('monday') ? 'Monday' : null,
        severity: null,
      });
    }

    if (narrative.includes('vomit') || narrative.includes('vomiting')) {
      symptoms.push({
        name: 'vomiting',
        normalizedLabel: 'vomiting',
        status: 'PRESENT',
        frequency: narrative.includes('twice a day') || narrative.includes('twice daily') ? 'twice a day' : null,
        severity: null,
      });
    }

    if (narrative.includes("don't have chest pain") || narrative.includes('no chest pain')) {
      negativeFindings.push('chest pain');
    }

    const timeline: ExtractionResult['timeline'] = [];
    if (narrative.includes('fever')) {
      timeline.push({
        eventType: 'SYMPTOM_ONSET',
        description: 'Fever started',
        relativeTime: narrative.includes('3 days') || narrative.includes('three days') ? '3 days ago' : 'Monday',
        certainty: narrative.includes('monday') ? 'APPROXIMATE' : 'CERTAIN',
        sourceQuote: 'fever for about three days',
      });
    }

    if (narrative.includes('vomit') || narrative.includes('vomiting')) {
      timeline.push({
        eventType: 'SYMPTOM_ONSET',
        description: 'Vomiting began',
        relativeTime: '2 days ago',
        certainty: 'CERTAIN',
        sourceQuote: 'vomiting twice a day',
      });
    }

    if (narrative.includes('paracetamol') || narrative.includes('tablet')) {
      timeline.push({
        eventType: 'MEDICATION',
        description: 'Patient reported taking paracetamol',
        relativeTime: 'Yesterday',
        certainty: 'CERTAIN',
        sourceQuote: 'took paracetamol yesterday',
      });
    }

    const missingInformation: ExtractionResult['missingInformation'] = [];
    const followUpQuestions: ExtractionResult['followUpQuestions'] = [];

    if (narrative.includes('fever') && !narrative.includes('3 days') && !narrative.includes('three days') && !narrative.includes('monday')) {
      missingInformation.push({
        id: 'gap-1',
        field: 'fever_duration',
        topic: 'Fever Duration',
        description: 'Duration of reported fever was not specified in the narrative',
        importance: 'IMPORTANT',
        reason: 'Clarify timeline of fever onset',
        source: 'PATIENT_NARRATIVE',
      });
      followUpQuestions.push({
        id: 'q-1',
        question: 'When did the fever first begin?',
        linkedMissingInformationId: 'gap-1',
        priority: 'MEDIUM',
        reason: 'Clarify fever onset date',
        answerType: 'DATE',
      });
    }

    if (narrative.includes('vomit') || narrative.includes('vomiting')) {
      missingInformation.push({
        id: 'gap-2',
        field: 'vomiting_frequency',
        topic: 'Vomiting Frequency',
        description: 'Frequency of vomiting episodes is unclear from narrative',
        importance: 'IMPORTANT',
        reason: 'Evaluate fluid loss context',
        source: 'PATIENT_NARRATIVE',
      });
      followUpQuestions.push({
        id: 'q-2',
        question: 'How often have you been vomiting?',
        linkedMissingInformationId: 'gap-2',
        priority: 'MEDIUM',
        reason: 'Clarify frequency of vomiting',
        answerType: 'TEXT',
      });
    }

    return {
      symptoms,
      negativeFindings,
      timeline,
      uncertainties,
      missingInformation,
      followUpQuestions,
      confidence: 0.95,
    };
  }
}
