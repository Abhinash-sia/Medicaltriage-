import { env } from '../../config/env.js';
import { AiExtractionProvider } from './ai.types.js';
import { GeminiAiProvider } from './gemini.provider.js';
import { MockAiExtractionProvider } from './mock.provider.js';

let activeProvider: AiExtractionProvider | null = null;

export function getAiProvider(): AiExtractionProvider {
  if (activeProvider) {
    return activeProvider;
  }

  // Always use mock provider during automated test runs (VITEST) or when API key is missing
  if (
    process.env.VITEST === 'true' ||
    process.env.NODE_ENV === 'test' ||
    env.NODE_ENV === 'test' ||
    !env.GEMINI_API_KEY
  ) {
    activeProvider = new MockAiExtractionProvider();
    return activeProvider;
  }

  activeProvider = new GeminiAiProvider();
  return activeProvider;
}

export function setAiProvider(provider: AiExtractionProvider | null): void {
  activeProvider = provider;
}
