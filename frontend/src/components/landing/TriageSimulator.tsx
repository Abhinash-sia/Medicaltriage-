'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  Sparkles,
  FileCheck,
  Stethoscope,
  ChevronRight,
  AlertTriangle,
  HeartPulse,
  Activity,
  CheckCircle2,
  FileText,
  Volume2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Scenario {
  id: string;
  title: string;
  category: string;
  patientProfile: string;
  intakeChannel: 'Audio Transcript (Hindi)' | 'Lab OCR + Audio (Odia)' | 'Web Form (English)';
  symptoms: string[];
  vitals: { hr: string; bp: string; spo2: string; temp: string };
  urgency: 'URGENT' | 'PRIORITY' | 'ROUTINE';
  slaMinutes: number;
  redFlags: string[];
  safetyRulesPassed: number;
  clinicalSummary: string;
  recommendedSpecialty: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'cardio',
    title: 'Acute Retrosternal Chest Pain',
    category: 'Cardiovascular Emergency',
    patientProfile: '58M • History of Hypertension',
    intakeChannel: 'Audio Transcript (Hindi)',
    symptoms: ['Crushing chest pressure radiating to left arm', 'Diaphoresis (cold sweats)', 'Shortness of breath for 45 min'],
    vitals: { hr: '112 bpm', bp: '158/96 mmHg', spo2: '94%', temp: '98.6 °F' },
    urgency: 'URGENT',
    slaMinutes: 15,
    redFlags: ['Rule #03: Acute Coronary Syndrome signature detected', 'Rule #12: SpO2 < 95% with diaphoresis'],
    safetyRulesPassed: 20,
    clinicalSummary: 'High probability of Acute Coronary Event. Immediate 12-lead ECG and emergency cardiac referral required.',
    recommendedSpecialty: 'Emergency Cardiology',
  },
  {
    id: 'fever',
    title: 'Persistent High Fever with Thrombocytopenia',
    category: 'Infectious Disease',
    patientProfile: '34F • 5 Days Post-Monsoon Travel',
    intakeChannel: 'Lab OCR + Audio (Odia)',
    symptoms: ['High grade fever (103.2°F)', 'Petechial rash on lower limbs', 'Platelet count: 48,000/µL'],
    vitals: { hr: '98 bpm', bp: '106/70 mmHg', spo2: '98%', temp: '103.2 °F' },
    urgency: 'PRIORITY',
    slaMinutes: 60,
    redFlags: ['Rule #07: Severe Thrombocytopenia (< 50k) with petechiae — Dengue alert'],
    safetyRulesPassed: 21,
    clinicalSummary: 'Suspicion of severe Dengue / hemorrhagic fever. Urgent CBC monitoring and fluid management triage.',
    recommendedSpecialty: 'Internal Medicine / ID',
  },
  {
    id: 'routine',
    title: 'Seasonal Allergic Rhinitis & Dry Cough',
    category: 'Primary Care',
    patientProfile: '26M • Non-smoker, seasonal history',
    intakeChannel: 'Web Form (English)',
    symptoms: ['Sneezing bouts in morning', 'Watery eyes and nasal itching', 'Mild dry throat tickle (3 days)'],
    vitals: { hr: '72 bpm', bp: '118/76 mmHg', spo2: '99%', temp: '98.4 °F' },
    urgency: 'ROUTINE',
    slaMinutes: 240,
    redFlags: [],
    safetyRulesPassed: 22,
    clinicalSummary: 'Uncomplicated upper respiratory allergic presentation. No red flags or respiratory compromise.',
    recommendedSpecialty: 'General Practice',
  },
];

export function TriageSimulator() {
  const [selectedId, setSelectedId] = useState<string>('cardio');
  const active = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl border border-white/10 bg-[#0C171B]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 px-6 py-4 bg-[#080F12]/60 gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Clinical Decision Simulator
          </span>
          <span className="text-white/20 text-xs font-mono">•</span>
          <span className="font-mono text-xs text-accent">Deterministic 22-Rule Engine Active</span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-1.5 bg-white/[0.04] p-1 rounded-lg border border-white/10 w-full sm:w-auto overflow-x-auto">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSelectedId(sc.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shrink-0 ${
                selectedId === sc.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {sc.title.split(' ')[0]} {sc.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Patient Intake Signals */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-white/10 space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Patient Case Intake</span>
              <span className="font-mono text-xs text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                {active.intakeChannel}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">{active.title}</h3>
            <p className="text-xs text-muted-foreground">{active.patientProfile}</p>
          </div>

          {/* Vitals Ribbon */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'HR', val: active.vitals.hr, icon: Activity },
              { label: 'BP', val: active.vitals.bp, icon: HeartPulse },
              { label: 'SpO2', val: active.vitals.spo2, icon: Sparkles },
              { label: 'TEMP', val: active.vitals.temp, icon: Stethoscope },
            ].map((v, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 p-2.5 rounded-lg space-y-1">
                <span className="font-mono text-[10px] text-muted-foreground block">{v.label}</span>
                <span className="font-mono text-xs font-semibold text-white block tabular-nums">{v.val}</span>
              </div>
            ))}
          </div>

          {/* Symptoms List */}
          <div className="space-y-2">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider block">
              Extracted Symptoms & Transcripts
            </span>
            <div className="space-y-1.5">
              {active.symptoms.map((sym, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2 text-xs text-foreground bg-white/[0.02] border border-white/5 px-3 py-2 rounded-lg"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                  <span>{sym}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Triage Classification & Decision Support */}
        <div className="lg:col-span-7 p-6 space-y-6 bg-gradient-to-br from-[#0C171B] to-[#080E11]">
          {/* Urgency & SLA Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border transition-colors ${
                active.urgency === 'URGENT'
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : active.urgency === 'PRIORITY'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">Triage Tier</span>
                {active.urgency === 'URGENT' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold tracking-tight">{active.urgency}</div>
              <p className="text-[11px] mt-1 text-muted-foreground opacity-90">
                {active.urgency === 'URGENT'
                  ? 'Immediate life-safety escalation'
                  : active.urgency === 'PRIORITY'
                  ? 'Expedited clinical review required'
                  : 'Standard queue non-emergency'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">SLA Window</span>
                <Clock className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums">{active.slaMinutes}m 00s</div>
              <p className="text-[11px] text-muted-foreground">Deterministic response target</p>
            </div>
          </div>

          {/* 22-Rule Safety Engine Feedback */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Safety Engine Evaluation
              </span>
              <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {active.safetyRulesPassed}/22 Rules Cleared
              </span>
            </div>

            {active.redFlags.length > 0 ? (
              <div className="space-y-1.5">
                {active.redFlags.map((rf, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <span>{rf}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-800/30 p-2.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero critical red-flags triggered. Normal protocol verified.</span>
              </div>
            )}
          </div>

          {/* Clinical Structured Decision */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground uppercase tracking-wider">
                Clinician Decision Support
              </span>
              <Badge variant="outline" className="font-mono text-[10px] border-accent/30 text-accent">
                {active.recommendedSpecialty}
              </Badge>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">{active.clinicalSummary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
