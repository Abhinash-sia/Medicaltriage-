'use client';

import React, { useState } from 'react';
import {
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Stethoscope,
  Globe,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  Lock,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';

interface CaseScenario {
  id: string;
  tabLabel: { en: string; hi: string; or: string };
  caseToken: string;
  demographics: string;
  sourceLang: string;
  intakeText: { en: string; hi: string; or: string };
  extractedVitals: { bp: string; hr: string; spo2: string; temp: string };
  extractedSymptoms: string[];
  ruleTriggered: string;
  ruleStatus: 'CRITICAL_URGENT' | 'HIGH_PRIORITY' | 'STANDARD_ROUTINE';
  priorityBadge: string;
  priorityColor: string;
  slaTarget: string;
  confidence: string;
}

const SCENARIOS: CaseScenario[] = [
  {
    id: 'cardiac',
    tabLabel: {
      en: 'Chest Pain (Urgent)',
      hi: 'सीने में दर्द (आपातकाल)',
      or: 'ଛାତି ଯନ୍ତ୍ରଣା (ଜରୁରୀ)',
    },
    caseToken: 'CASE #OD-9842',
    demographics: '54y • Male • Cuttack Node',
    sourceLang: 'Odia / English',
    intakeText: {
      en: '"Crushing substernal pressure for 45 mins radiating to left jaw with cold sweats."',
      hi: '"45 मिनट से सीने में भारी दबाव और बाएं जबड़े में दर्द के साथ पसीना आ रहा है।"',
      or: '"୪୫ ମିନିଟ୍‌ ହେବ ଛାତିରେ ଭୀଷଣ ଚାପ ସହ ବାମ କାନ୍ଧ ଓ ମୁହଁକୁ ଯନ୍ତ୍ରଣା ବ୍ୟାପୁଛି।"',
    },
    extractedVitals: { bp: '148/92', hr: '94 bpm', spo2: '96%', temp: '98.6°F' },
    extractedSymptoms: ['Acute Substernal Pressure', 'Left Radiation', 'Diaphoresis', 'Dyspnea'],
    ruleTriggered: 'RULE-104: Acute Coronary Syndrome Protocol',
    ruleStatus: 'CRITICAL_URGENT',
    priorityBadge: 'URGENT',
    priorityColor: 'border-rose-500/40 text-rose-500 bg-rose-500/10',
    slaTarget: '< 60 mins SLA',
    confidence: '98.4%',
  },
  {
    id: 'respiratory',
    tabLabel: {
      en: 'Pediatric Wheeze (Priority)',
      hi: 'बाल श्वास कष्ट (प्राथमिकता)',
      or: 'ଶିଶୁ ଶ୍ୱାସକଷ୍ଟ (ପ୍ରାଥମିକତା)',
    },
    caseToken: 'CASE #ND-4412',
    demographics: '6y • Male • Balasore Node',
    sourceLang: 'Hindi',
    intakeText: {
      en: '"Barking cough for 2 days, sudden onset stridor and mild subcostal retraction."',
      hi: '"2 दिनों से तेज खांसी, अचानक सांस लेने में घरघराहट और सीने में खिंचाव।"',
      or: '"୨ ଦିନ ଧରି କାଶ ଏବଂ ଶ୍ୱାସ ନେବାରେ ଶବ୍ଦ ହେଉଛି।"',
    },
    extractedVitals: { bp: '102/68', hr: '118 bpm', spo2: '94%', temp: '101.4°F' },
    extractedSymptoms: ['Inspiratory Stridor', 'Subcostal Retractions', 'High Grade Fever'],
    ruleTriggered: 'RULE-208: Pediatric Airway Assessment Protocol',
    ruleStatus: 'HIGH_PRIORITY',
    priorityBadge: 'PRIORITY',
    priorityColor: 'border-amber-500/40 text-amber-500 bg-amber-500/10',
    slaTarget: '< 4 hours SLA',
    confidence: '96.1%',
  },
  {
    id: 'routine',
    tabLabel: {
      en: 'Chronic Follow-up (Routine)',
      hi: 'नियमित परामर्श (सामान्य)',
      or: 'ସାଧାରଣ ପରାମର୍ଶ (ନିୟମିତ)',
    },
    caseToken: 'CASE #OD-1109',
    demographics: '42y • Female • Khordha Node',
    sourceLang: 'Odia',
    intakeText: {
      en: '"Mild lower back stiffness for 3 weeks after farm work, no numbness or red flags."',
      hi: '"3 सप्ताह से कमर में हल्का दर्द, कोई सुन्नता या गंभीर लक्षण नहीं।"',
      or: '"୩ ସପ୍ତାହ ଧରି କଟି ଯନ୍ତ୍ରଣା ହେଉଛି, କୌଣସି ଅଚେତ ଅବସ୍ଥା ନାହିଁ।"',
    },
    extractedVitals: { bp: '120/80', hr: '74 bpm', spo2: '99%', temp: '98.4°F' },
    extractedSymptoms: ['Lumbar Muscular Strain', 'Positional Stiffness', 'Zero Neurologic Deficit'],
    ruleTriggered: 'RULE-301: Non-Emergency Outpatient Pathway',
    ruleStatus: 'STANDARD_ROUTINE',
    priorityBadge: 'ROUTINE',
    priorityColor: 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10',
    slaTarget: '< 24 hours SLA',
    confidence: '99.2%',
  },
];

export function HeroTelemetryCockpit() {
  const { language } = useLanguage();
  const [activeScenarioId, setActiveScenarioId] = useState<string>('cardiac');

  const langKey = language === 'hi' ? 'hi' : language === 'or' ? 'or' : 'en';
  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  return (
    <div className="glass-panel w-full rounded-2xl p-5 sm:p-6 space-y-5 transition-all duration-300 relative overflow-hidden border border-border shadow-lg">
      {/* Top Specular Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 dark:via-accent/40 to-transparent pointer-events-none" />

      {/* Header with Live Engine Status & De-identification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-primary dark:text-accent" />
              <span>CLINICAL TRIAGE WORKFLOW</span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>De-identified Patient Token • DISHA / HIPAA Compliant</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-mono text-[10px] font-bold px-2 py-0.5 ${scenario.priorityColor}`}>
            {scenario.priorityBadge}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border bg-card">
            {scenario.slaTarget}
          </Badge>
        </div>
      </div>

      {/* Interactive Scenario Switcher Tabs */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Clinical Triage Simulation Scenario:</span>
          <span className="text-primary dark:text-accent font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Zero PII Stored
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/50 dark:bg-black/40 rounded-xl border border-border/60">
          {SCENARIOS.map((s) => {
            const isActive = s.id === activeScenarioId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScenarioId(s.id)}
                className={`text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col gap-0.5 ${
                  isActive
                    ? 'bg-card text-foreground shadow-xs border border-border font-semibold ring-1 ring-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                }`}
              >
                <span className="truncate text-[11px]">{s.tabLabel[langKey]}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{s.priorityBadge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Details Box */}
      <div className="bg-card/70 dark:bg-card/40 border border-border/80 rounded-xl p-4 space-y-3 backdrop-blur-md">
        {/* De-identified Patient Token Header */}
        <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary dark:text-accent font-mono text-[10px] font-bold">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-mono font-bold text-foreground text-xs flex items-center gap-1.5">
                <span>{scenario.caseToken}</span>
                <Badge variant="outline" className="text-[8px] font-mono py-0 px-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                  ANONYMIZED
                </Badge>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">{scenario.demographics} • Lang: {scenario.sourceLang}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono text-muted-foreground">Extraction Accuracy</div>
            <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{scenario.confidence}</div>
          </div>
        </div>

        {/* Multilingual Intake Preview */}
        <div className="p-2.5 bg-muted/40 dark:bg-black/30 rounded-lg border border-border/60 text-xs italic text-foreground/90 font-serif leading-relaxed">
          {scenario.intakeText[langKey]}
        </div>

        {/* 4-Step Pipeline Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Step 1: Multilingual Intake */}
          <div className="p-2 bg-card border border-border rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-primary dark:text-accent" />
                <span>1. Intake</span>
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-[11px] font-semibold text-foreground truncate">Multilingual</div>
            <div className="text-[9px] font-mono text-muted-foreground">Odia / Hindi / EN</div>
          </div>

          {/* Step 2: AI Entities */}
          <div className="p-2 bg-card border border-border rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary dark:text-accent" />
                <span>2. Extract</span>
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-[11px] font-semibold text-foreground truncate">{scenario.extractedSymptoms.length} Entities</div>
            <div className="text-[9px] font-mono text-muted-foreground">Vitals & Symptoms</div>
          </div>

          {/* Step 3: Deterministic Rule */}
          <div className="p-2 bg-card border border-border rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary dark:text-accent" />
                <span>3. Rules</span>
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-[11px] font-semibold text-foreground truncate">Rule Guardrail</div>
            <div className="text-[9px] font-mono text-muted-foreground">Zero Hallucination</div>
          </div>

          {/* Step 4: Human Review SLA */}
          <div className="p-2 bg-card border border-border rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary dark:text-accent" />
                <span>4. SLA</span>
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-[11px] font-semibold text-foreground truncate">{scenario.slaTarget}</div>
            <div className="text-[9px] font-mono text-muted-foreground">Physician Queue</div>
          </div>
        </div>

        {/* Rule Guardrail Banner */}
        <div className="p-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary dark:text-accent shrink-0" />
            <div className="font-mono text-[11px]">
              <span className="font-semibold text-foreground">{scenario.ruleTriggered}</span>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            Validated
          </Badge>
        </div>
      </div>
    </div>
  );
}
