import { env } from '../../config/env.js';
import { TranslationProvider } from './translation.types.js';
import { MockTranslationProvider } from './mock-translation.provider.js';
import { SarvamTranslationProvider } from './sarvam-translation.provider.js';

export function getTranslationProvider(providerName?: string): TranslationProvider {
  if (process.env.NODE_ENV === 'test' || env.TRANSLATION_PROVIDER === 'mock') {
    return new MockTranslationProvider();
  }

  const selectedProvider = providerName || env.TRANSLATION_PROVIDER;

  if (selectedProvider === 'sarvam') {
    return new SarvamTranslationProvider();
  }

  return new MockTranslationProvider();
}
