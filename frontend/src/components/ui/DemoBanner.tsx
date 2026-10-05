import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export function DemoBanner() {
  const { t } = useLanguage();

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-950 dark:text-amber-200 py-1.5 px-4 text-[11px] font-medium tracking-tight">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            {t('common.demoDataNotice')}
          </span>
          <span className="text-amber-900/90 dark:text-amber-200/90 hidden sm:inline">
            {t('common.demoBannerNotice')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500/15 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-[4px] border border-amber-500/25 text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            {t('common.nonDiagnostic')}
          </span>
        </div>
      </div>
    </div>
  );
}
