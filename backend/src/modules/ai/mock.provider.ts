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

    return {
      symptoms,
      negativeFindings,
      timeline: [],
      uncertainties,
      confidence: 0.95,
    };
  }
}
