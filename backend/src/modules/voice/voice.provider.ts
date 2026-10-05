import { env } from '../../config/env.js';
import { SpeechToTextProvider } from './voice.types.js';
import { MockSpeechProvider } from './mock-speech.provider.js';
import { SarvamSpeechProvider } from './sarvam-speech.provider.js';

export function getSpeechToTextProvider(providerOverride?: string): SpeechToTextProvider {
  if (process.env.NODE_ENV === 'test' || env.STT_PROVIDER === 'mock') {
    return new MockSpeechProvider();
  }

  const providerName = providerOverride || env.STT_PROVIDER;

  if (providerName === 'sarvam') {
    return new SarvamSpeechProvider();
  }

  return new MockSpeechProvider();
}
