'use client';

import React, { useState } from 'react';
import {
  Mic,
  ShieldCheck,
  Stethoscope,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface StepDetail {
  step: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  highlights: string[];
  mockData: {
    title: string;
    items: { k: string; v: string }[];
  };
}

const STEPS: StepDetail[] = [
  {
    step: '01',
    badge: 'Multimodal Intake',
    title: 'Zero-friction patient ingestion across voice, lab docs & forms',
    subtitle: 'Low-latency edge transcription and document OCR in English, Hindi, and Odia',
    description:
      'Patients or field health workers can speak naturally or upload mobile photos of handwritten prescriptions and lab reports. Audio is transcribed with medical phrase boosting; lab reports are extracted via OCR with strict tabular boundary parsing.',
    icon: Mic,
    highlights: [
      'Real-time Audio waveform visualizer (Web Audio API)',
      'Multilingual speech recognition for Indian regional dialects',
      'High-confidence lab values extraction (Hb, Platelets, TLC, Creatinine)',
    ],
    mockData: {
      title: 'Ingestion Provenance Stream',
      items: [
        { k: 'Voice Buffer', v: 'Hindi • 16kHz PCM • 42.1s' },
        { k: 'OCR Document', v: 'CBC_Report_0926.pdf (320 DPI)' },
        { k: 'Grounding ID', v: 'IN-OD-2026-99218' },
      ],
    },
  },
  {
    step: '02',
    badge: 'Safety & Urgency Engine',
    title: 'Deterministic 22-rule clinical boundary verification',
    subtitle: 'Rule-based red-flag gatekeeper runs before any AI synthesis',
    description:
      'Before generating clinical notes, a hardcoded 22-rule safety engine scans vitals and keywords for life-threatening conditions (STEMI, sepsis, pediatric dehydration, anaphylaxis). Urgency is mathematically categorized with hard SLA deadlines (15m / 60m / 240m).',
    icon: ShieldCheck,
    highlights: [
      'Hardcoded deterministic logic prevents LLM hallucinations',
      'Dynamic SLA countdown timer based on patient acuity',
      'Non-diagnostic boundary guardrails strictly enforced',
    ],
    mockData: {
      title: 'Rule Engine Execution Matrix',
      items: [
        { k: 'Rule #01 (Anaphylaxis)', v: 'PASSED (Negative)' },
        { k: 'Rule #03 (Chest Pain)', v: 'FLAGGED (Retrosternal)' },
        { k: 'Calculated SLA', v: '15 min (URGENT Tier)' },
      ],
    },
  },
  {
    step: '03',
    badge: 'Side-by-Side Synthesis',
    title: 'Original source provenance cards with 100% cited grounding',
    subtitle: 'Reviewers inspect verbatim quotes alongside synthesized summaries',
    description:
      'The platform generates side-by-side translation and provenance cards. Every symptom, vital, and timeline point is hyperlinked directly to its source transcript span or OCR bounding box, eliminating ambiguity for the reviewing doctor.',
    icon: Layers,
    highlights: [
      'Side-by-side original vernacular vs standardized English',
      'Visual provenance badge chips (Voice, Form, OCR)',
      'Timeline chronology synthesis of symptom progression',
    ],
    mockData: {
      title: 'Dossier Grounding Links',
      items: [
        { k: 'Original Transcript', v: 'छाती में बहुत तेज दर्द है... (Hindi)' },
        { k: 'English Translation', v: 'Severe crushing chest pain...' },
        { k: 'Confidence Score', v: '98.4% (Verbatim Match)' },
      ],
    },
  },
  {
    step: '04',
    badge: 'Human Authorization & Referral',
    title: 'Qualified clinician sign-off with verified QR-coded referrals',
    subtitle: 'Secure handoff to specialized facilities with audit trail persistence',
    description:
      'A licensed healthcare professional reviews the structured dossier, edits notes with full audit logging, and authorizes one-click referral generation complete with verification QR codes and facility SLA tracking.',
    icon: Stethoscope,
    highlights: [
      'Strict Human-in-the-Loop requirement before any disposition',
      'Tamper-evident QR referral dispatch with emergency facility lookup',
      'Immutable audit log tracking review timestamp and credentials',
    ],
    mockData: {
      title: 'Authorization Certificate',
      items: [
        { k: 'Reviewing Clinician', v: 'Dr. Anita Sharma, MD (Reg: MCI-88392)' },
        { k: 'Escalation Facility', v: 'District Cardiology Center, Cuttack' },
        { k: 'Referral Token', v: 'REF-2026-OD-8812 (Active)' },
      ],
    },
  },
];

export function StorytellingPipeline() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const active = STEPS[activeStepIndex];
  const IconComponent = active.icon;

  return (
    <div className="w-full space-y-10">
      {/* Stepper Navigation Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {STEPS.map((s, idx) => {
          const StepIcon = s.icon;
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={s.step}
              onClick={() => setActiveStepIndex(idx)}
              className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border'
              }`}
            >
              <span className={`font-mono text-xs font-bold ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
                {s.step}
              </span>
              <div className="flex items-center space-x-1.5">
                <StepIcon className="w-4 h-4" />
                <span className="text-xs font-semibold">{s.badge}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Showcase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card/60 dark:bg-card/40 border border-border rounded-2xl p-6 sm:p-10 backdrop-blur-xl shadow-lg transition-colors">
        {/* Left Narrative Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
              <IconComponent className="w-3.5 h-3.5" />
              <span>Phase {active.step} • {active.badge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
              {active.title}
            </h3>
            <p className="text-sm font-medium text-primary dark:text-accent">{active.subtitle}</p>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {active.description}
          </p>

          <div className="space-y-2.5 pt-2">
            {active.highlights.map((h, i) => (
              <div key={i} className="flex items-start space-x-2.5 text-xs text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-accent shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center space-x-4">
            <button
              onClick={() => setActiveStepIndex((prev) => (prev + 1) % STEPS.length)}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-primary dark:text-accent hover:underline transition-colors"
            >
              <span>Explore Next Phase ({STEPS[(activeStepIndex + 1) % STEPS.length].badge})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Interactive Mock Display */}
        <div className="lg:col-span-5 bg-muted/40 dark:bg-[#080E11] border border-border dark:border-white/10 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs font-semibold text-foreground">{active.mockData.title}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">AUDIT TELEMETRY</span>
          </div>

          <div className="space-y-2">
            {active.mockData.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-card dark:bg-white/[0.03] border border-border dark:border-white/5 p-3 rounded-lg flex flex-col space-y-1"
              >
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  {item.k}
                </span>
                <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {item.v}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Cryptographic Integrity</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SHA-256 Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
