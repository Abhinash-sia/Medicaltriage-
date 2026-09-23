import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import {
  SpeechToTextProvider,
  SpeechToTextOptions,
  SpeechToTextResult,
} from './voice.types.js';

export class SarvamSpeechProvider implements SpeechToTextProvider {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.SARVAM_API_KEY;
  }

  public async transcribe(options: SpeechToTextOptions): Promise<SpeechToTextResult> {
    if (!this.apiKey) {
      logger.error('Sarvam API key is not configured');
      return {
        text: '',
        language: options.language || 'UNKNOWN',
        confidence: null,
        error: 'Audio transcription could not be completed (Provider unconfigured).',
      };
    }

    try {
      // Build FormData payload for Sarvam STT REST API
      const formData = new FormData();
      const fileBlob = new Blob([new Uint8Array(options.audioBuffer)], { type: options.mimeType });
      formData.append('file', fileBlob, 'audio.wav');
      if (options.language && options.language !== 'UNKNOWN') {
        formData.append('language_code', options.language);
      }
      formData.append('model', 'saarika:v2');

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': this.apiKey,
        },
        body: formData,
      });

      const providerRequestId = response.headers.get('x-request-id') || response.headers.get('sarvam-request-id') || undefined;

      if (!response.ok) {
        logger.error(
          { status: response.status, providerRequestId },
          'Sarvam STT API returned error status'
        );
        return {
          text: '',
          language: options.language || 'UNKNOWN',
          confidence: null,
          providerRequestId,
          error: 'Audio transcription could not be completed.',
        };
      }

      const data = (await response.json()) as {
        transcript?: string;
        language_code?: string;
        confidence?: number;
      };

      return {
        text: data.transcript || '',
        language: data.language_code || options.language || 'UNKNOWN',
        confidence: typeof data.confidence === 'number' ? data.confidence : null,
        providerRequestId,
      };
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Sarvam STT Provider execution failure');
      return {
        text: '',
        language: options.language || 'UNKNOWN',
        confidence: null,
        error: 'Audio transcription could not be completed.',
      };
    }
  }
}
