import { logger } from '../../lib/logger.js';
import { OcrProvider, OcrResult } from './ocr.types.js';

export class GoogleCloudVisionOcrProvider implements OcrProvider {
  private visionClient: any = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    try {
      // Lazy load to prevent runtime crash if dependency is missing or credentials unset
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const vision = require('@google-cloud/vision');
      this.visionClient = new vision.ImageAnnotatorClient();
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Google Cloud Vision SDK not available or initialized');
    }
  }

  public async extractText(fileBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    if (!this.visionClient) {
      logger.error('Google Cloud Vision SDK client is not available');
      return {
        text: '',
        usable: false,
        error: 'Google Cloud Vision OCR provider client not configured',
      };
    }

    try {
      logger.info({ mimeType, size: fileBuffer.length }, 'Performing Google Cloud Vision OCR');

      const [result] = await this.visionClient.textDetection({
        image: { content: fileBuffer },
      });

      const detections = result.textAnnotations;
      const extractedText = detections && detections.length > 0 ? detections[0].description || '' : '';
      const trimmedText = extractedText.trim();
      const isUsable = trimmedText.length > 0;

      return {
        text: trimmedText,
        confidence: isUsable ? 0.95 : 0.0,
        usable: isUsable,
      };
    } catch (err: any) {
      logger.error({ err: err.message }, 'Google Cloud Vision OCR extraction failed');
      return {
        text: '',
        usable: false,
        error: `OCR service error: ${err.message}`,
      };
    }
  }
}
