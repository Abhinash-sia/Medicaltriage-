'use client';

import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 py-1.5 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            SYNTHETIC DEMO DATA
          </span>
          <span className="text-slate-300 font-medium hidden sm:inline">
            All patient profiles, narratives, and records shown here are fictional and created exclusively for software evaluation.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20 font-semibold">
            NON-DIAGNOSTIC
          </span>
        </div>
      </div>
    </div>
  );
}
