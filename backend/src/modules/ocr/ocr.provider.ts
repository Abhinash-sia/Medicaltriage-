import { env } from '../../config/env.js';
import { GoogleCloudVisionOcrProvider } from './google-vision.provider.js';
import { MockOcrProvider } from './mock-ocr.provider.js';
import { OcrProvider } from './ocr.types.js';

export function getOcrProvider(): OcrProvider {
  if (process.env.NODE_ENV === 'test' || env.OCR_PROVIDER === 'mock') {
    return new MockOcrProvider();
  }

  if (env.OCR_PROVIDER === 'google_vision') {
    return new GoogleCloudVisionOcrProvider();
  }

  return new MockOcrProvider();
}
