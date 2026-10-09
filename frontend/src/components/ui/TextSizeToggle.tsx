'use client';

import React, { useEffect, useState } from 'react';
import { Type } from 'lucide-react';

export type TextSizeLevel = 'normal' | 'large' | 'xlarge';

export function TextSizeToggle() {
  const [textSize, setTextSize] = useState<TextSizeLevel>('normal');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('user-text-size') as TextSizeLevel) || 'normal';
    setTextSize(saved);
    if (saved && saved !== 'normal') {
      document.documentElement.setAttribute('data-text-size', saved);
    }
  }, []);

  const cycleTextSize = () => {
    const next: TextSizeLevel =
      textSize === 'normal' ? 'large' : textSize === 'large' ? 'xlarge' : 'normal';

    setTextSize(next);
    localStorage.setItem('user-text-size', next);
    if (next === 'normal') {
      document.documentElement.removeAttribute('data-text-size');
    } else {
      document.documentElement.setAttribute('data-text-size', next);
    }
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded border border-border bg-card flex items-center justify-center opacity-0" />
    );
  }

  const label =
    textSize === 'normal'
      ? 'Font Size: Default (18px base) — Click for larger text'
      : textSize === 'large'
      ? 'Font Size: Large (20px base) — Click for extra large'
      : 'Font Size: Extra Large (22px base) — Click to reset';

  return (
    <button
      type="button"
      onClick={cycleTextSize}
      className="h-8 px-2 rounded border border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent flex items-center gap-1 transition-colors cursor-pointer text-xs font-semibold"
      aria-label={label}
      title={label}
    >
      <Type className="w-3.5 h-3.5 text-accent shrink-0" />
      <span className="font-mono text-[11px] font-bold">
        {textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++'}
      </span>
    </button>
  );
}
