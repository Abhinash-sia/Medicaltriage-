import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
          Phase 1 — Engineering Foundation
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Healthcare Triage Assistant
        </h1>

        <p className="text-slate-600 text-base leading-relaxed">
          Human-in-the-loop decision-support platform designed for Government Hospitals, Primary
          Health Centres (PHCs), Public Health Camps, and Community Clinics.
        </p>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-amber-900 space-y-1">
          <p className="font-semibold">Safety & System Boundary Notice:</p>
          <p>
            This system assists healthcare staff by organizing patient communications for qualified
            human review. It is not a doctor, diagnostic system, or treatment platform.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          Application foundation initialized. Feature modules under development.
        </div>
      </div>
    </main>
  );
}
