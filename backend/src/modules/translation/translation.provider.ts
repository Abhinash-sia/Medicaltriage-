import { env } from '../../config/env.js';
import { TranslationProvider } from './translation.types.js';
import { MockTranslationProvider } from './mock-translation.provider.js';
import { SarvamTranslationProvider } from './sarvam-translation.provider.js';

export function getTranslationProvider(providerName?: string): TranslationProvider {
  const selectedProvider = providerName || env.TRANSLATION_PROVIDER;

  if (selectedProvider === 'sarvam') {
    return new SarvamTranslationProvider();
  }

  return new MockTranslationProvider();
}
