'use client';

import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../i18n/config';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function LanguageSelector({ className = '', variant = 'full' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      <select
        id="language-selector"
        data-testid="language-selector"
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        aria-label="Select UI Language"
        className="bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
            {variant === 'full' ? `${lang.nativeName} (${lang.name})` : lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
