'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './config';
import { dictionaries, en } from './dictionaries';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (keyPath: string) => keyPath,
});

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  if (typeof curr === 'string') {
    return curr;
  }
  return undefined;
}

const COOKIE_NAME = 'NEXT_LOCALE';
const LOCAL_STORAGE_KEY = 'app_locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let initialLang: SupportedLanguage = DEFAULT_LANGUAGE;

    // Check localStorage first
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY) as SupportedLanguage | null;
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        initialLang = stored;
      }
    } catch {
      // localStorage read failed fallback to cookies
    }

    // Check cookies if not found in localStorage
    if (initialLang === DEFAULT_LANGUAGE && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
      if (match && match[1]) {
        const cookieLang = decodeURIComponent(match[1]) as SupportedLanguage;
        if (SUPPORTED_LANGUAGES.some((l) => l.code === cookieLang)) {
          initialLang = cookieLang;
        }
      }
    }

    setLanguageState(initialLang);
    setIsInitialized(true);
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;

    setLanguageState(newLang);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newLang);
    } catch {
      // localStorage write failed
    }

    try {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
        newLang
      )}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Cookie write failed
    }
  }, []);

  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const targetDict = dictionaries[language] || en;
      let val = getNestedValue(targetDict, keyPath);

      // Fallback to English dictionary if key is missing in target language
      if (val === undefined && language !== 'en') {
        val = getNestedValue(en, keyPath);
      }

      // Final fallback to key path string itself if key does not exist
      if (val === undefined) {
        val = keyPath;
      }

      // Interpolate params if provided (e.g. {name: 'John'})
      if (params && typeof val === 'string') {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          val = val!.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramVal));
        });
      }

      return val;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
