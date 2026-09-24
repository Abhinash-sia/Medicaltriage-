export interface SupportedLanguage {
  code: string;
  displayName: string;
  providerCode: string;
  enabled: boolean;
}

export const SUPPORTED_LANGUAGES: Record<string, SupportedLanguage> = {
  en: {
    code: 'en',
    displayName: 'English',
    providerCode: 'en-IN',
    enabled: true,
  },
  hi: {
    code: 'hi',
    displayName: 'Hindi (हिन्दी)',
    providerCode: 'hi-IN',
    enabled: true,
  },
  or: {
    code: 'or',
    displayName: 'Odia (ଓଡ଼ିଆ)',
    providerCode: 'or-IN',
    enabled: true,
  },
  bn: {
    code: 'bn',
    displayName: 'Bengali (বাংলা)',
    providerCode: 'bn-IN',
    enabled: true,
  },
  ta: {
    code: 'ta',
    displayName: 'Tamil (தமிழ்)',
    providerCode: 'ta-IN',
    enabled: true,
  },
  te: {
    code: 'te',
    displayName: 'Telugu (తెలుగు)',
    providerCode: 'te-IN',
    enabled: true,
  },
  mr: {
    code: 'mr',
    displayName: 'Marathi (मराठी)',
    providerCode: 'mr-IN',
    enabled: true,
  },
  kn: {
    code: 'kn',
    displayName: 'Kannada (ಕನ್ನಡ)',
    providerCode: 'kn-IN',
    enabled: true,
  },
  ml: {
    code: 'ml',
    displayName: 'Malayalam (മലയാളം)',
    providerCode: 'ml-IN',
    enabled: true,
  },
  pa: {
    code: 'pa',
    displayName: 'Punjabi (ਪੰਜਾਬੀ)',
    providerCode: 'pa-IN',
    enabled: true,
  },
  gu: {
    code: 'gu',
    displayName: 'Gujarati (ગુજરાતી)',
    providerCode: 'gu-IN',
    enabled: true,
  },
};

/**
  * Checks if a language code is supported by the system.
  */
export function isLanguageSupported(code: string): boolean {
  if (!code) return false;
  const normalized = code.toLowerCase().split('-')[0].trim();
  return Boolean(SUPPORTED_LANGUAGES[normalized]?.enabled);
}

/**
  * Normalizes language code (e.g. "hi-IN" or "HI" -> "hi").
  */
export function normalizeLanguageCode(code: string): string {
  if (!code) return 'UNKNOWN';
  const normalized = code.toLowerCase().split('-')[0].trim();
  return SUPPORTED_LANGUAGES[normalized] ? normalized : code;
}

/**
  * Returns the provider-specific language code for Sarvam AI (e.g. "hi" -> "hi-IN").
  */
export function getProviderLanguageCode(code: string): string {
  const norm = normalizeLanguageCode(code);
  const lang = SUPPORTED_LANGUAGES[norm];
  if (lang) {
    return lang.providerCode;
  }
  return code || 'en-IN';
}

/**
  * Returns list of supported language objects.
  */
export function getSupportedLanguagesList(): SupportedLanguage[] {
  return Object.values(SUPPORTED_LANGUAGES).filter((l) => l.enabled);
}
