'use client';

import React, { useState, useEffect } from 'react';
import { Info, ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStoredUser } from '@/lib/authSession';

/**
 * Checks whether the current user is an automated/synthetic demo persona.
 * Returns false for normal user accounts created through registration.
 */
export function isDemoUser(user: any): boolean {
  if (!user) return false;
  if (user.isDemoAccount === true) return true;

  const email = (user.email || '').toLowerCase().trim();

  // Known seeded demo accounts
  const demoEmails = [
    'patient.demo.001@example.test',
    'nurse.demo.001@example.test',
    'doctor.demo.001@example.test',
    'officer.demo.001@example.test',
    'admin.demo.001@example.test',
    'admin@hospital.org',
  ];

  if (demoEmails.includes(email)) return true;

  // Pattern checks for synthetic demo test accounts
  if (
    email.endsWith('@example.test') ||
    email.includes('.demo.') ||
    email.startsWith('demo.')
  ) {
    return true;
  }

  return false;
}

interface DemoBannerProps {
  user?: any;
}

export function DemoBanner({ user: propUser }: DemoBannerProps) {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(propUser || null);
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (propUser !== undefined) {
      setCurrentUser(propUser);
    } else {
      setCurrentUser(getStoredUser());
    }
  }, [propUser]);

  if (!mounted || isDismissed) return null;

  // ONLY render when authenticated as a synthetic demo account
  if (!isDemoUser(currentUser)) {
    return null;
  }

  const personaLabel = currentUser?.name
    ? `${currentUser.name} (${currentUser.role || 'DEMO'})`
    : currentUser?.email || 'Synthetic Demo Account';

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-950 dark:text-amber-200 py-1.5 px-4 text-[11px] font-medium tracking-tight animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 font-bold">
            <Info className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>DEMO ACCOUNT: {personaLabel}</span>
          </span>
          <span className="text-amber-900/90 dark:text-amber-200/90 hidden sm:inline">
            {t('common.demoBannerNotice')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500/15 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-[4px] border border-amber-500/25 text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{t('common.nonDiagnostic')}</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-0.5 rounded hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors ml-1 cursor-pointer"
            title="Dismiss demo notice"
            aria-label="Dismiss demo notice"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
