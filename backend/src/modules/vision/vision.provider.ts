import { env } from '../../config/env.js';
import { GeminiVisionProvider } from './gemini-vision.provider.js';
import { MockVisionProvider } from './mock-vision.provider.js';
import { VisionProvider } from './vision.types.js';

export function getVisionProvider(): VisionProvider {
  if (process.env.NODE_ENV === 'test' || env.VISION_PROVIDER === 'mock') {
    return new MockVisionProvider();
  }

  if (env.VISION_PROVIDER === 'gemini_vision') {
    return new GeminiVisionProvider();
  }

  return new MockVisionProvider();
}
