import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import {
  TranslationProvider,
  TranslationRequest,
  TranslationResult,
} from './translation.types.js';
import {
  getProviderLanguageCode,
  normalizeLanguageCode,
  isLanguageSupported,
} from './translation.languages.js';

const sarvamResponseSchema = z.object({
  translated_text: z.string().optional(),
  source_language_code: z.string().optional(),
});

export class SarvamTranslationProvider implements TranslationProvider {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.SARVAM_API_KEY;
  }

  public async translate(request: TranslationRequest): Promise<TranslationResult> {
    const { sourceText, sourceLanguage, targetLanguage } = request;

    const normalizedTarget = normalizeLanguageCode(targetLanguage);
    const normalizedSource = sourceLanguage ? normalizeLanguageCode(sourceLanguage) : 'UNKNOWN';

    if (!this.apiKey) {
      logger.error('Sarvam API key is not configured');
      return {
        translatedText: '',
        sourceLanguage: normalizedSource,
        targetLanguage: normalizedTarget,
        provider: 'sarvam',
        error: 'Translation could not be completed (Provider credentials missing).',
      };
    }

    if (!isLanguageSupported(targetLanguage)) {
      return {
        translatedText: '',
        sourceLanguage: normalizedSource,
        targetLanguage: normalizedTarget,
        provider: 'sarvam',
        error: `Unsupported target language: ${targetLanguage}`,
      };
    }

    try {
      const sourceLangCode = getProviderLanguageCode(sourceLanguage || 'en');
      const targetLangCode = getProviderLanguageCode(targetLanguage);

      const payload = {
        input: sourceText,
        source_language_code: sourceLangCode,
        target_language_code: targetLangCode,
        model: 'mayura:v1',
      };

      const response = await fetch('https://api.sarvam.ai/translate', {
        method: 'POST',
        headers: {
          'api-subscription-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const providerRequestId =
        response.headers.get('x-request-id') ||
        response.headers.get('sarvam-request-id') ||
        undefined;

      if (!response.ok) {
        logger.error(
          { status: response.status, providerRequestId },
          'Sarvam Translation API returned non-OK status'
        );
        return {
          translatedText: '',
          sourceLanguage: normalizedSource,
          targetLanguage: normalizedTarget,
          provider: 'sarvam',
          providerRequestId,
          error: 'Translation service error.',
        };
      }

      const json = await response.json();
      const parseResult = sarvamResponseSchema.safeParse(json);

      if (!parseResult.success || !parseResult.data.translated_text) {
        logger.error(
          { providerRequestId, parseError: parseResult.error?.format() },
          'Sarvam Translation API response validation failed or returned empty text'
        );
        return {
          translatedText: '',
          sourceLanguage: normalizedSource,
          targetLanguage: normalizedTarget,
          provider: 'sarvam',
          providerRequestId,
          error: 'Translation provider returned malformed or empty output.',
        };
      }

      const translatedText = parseResult.data.translated_text;

      return {
        translatedText,
        sourceLanguage: parseResult.data.source_language_code
          ? normalizeLanguageCode(parseResult.data.source_language_code)
          : normalizedSource,
        targetLanguage: normalizedTarget,
        provider: 'sarvam',
        providerRequestId,
      };
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Sarvam Translation Provider execution exception');
      return {
        translatedText: '',
        sourceLanguage: normalizedSource,
        targetLanguage: normalizedTarget,
        provider: 'sarvam',
        error: 'Translation could not be completed due to service failure.',
      };
    }
  }
}
