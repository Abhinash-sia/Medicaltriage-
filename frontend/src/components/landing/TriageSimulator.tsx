'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  HeartPulse,
  Activity,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';

export function TriageSimulator() {
  const { language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>('cardio');

  const isHindi = language === 'hi';
  const isOdia = language === 'or';

  const SCENARIOS = [
    {
      id: 'cardio',
      tabLabel: isOdia ? 'ଛାତି ଯନ୍ତ୍ରଣା' : isHindi ? 'सीने में दर्द' : 'Chest Pain',
      title: isOdia
        ? 'ତୀବ୍ର ଛାତି ଯନ୍ତ୍ରଣା ଏବଂ ନିଃଶ୍ୱାସ କଷ୍ଟ'
        : isHindi
        ? 'तीव्र सीने में दर्द और सांस लेने में कठिनाई'
        : 'Acute Retrosternal Chest Pain',
      category: isOdia ? 'ହୃଦରୋଗ ଜରୁରୀକାଳୀନ' : isHindi ? 'हृदय संबंधी आपात स्थिति' : 'Cardiovascular Emergency',
      patientProfile: isOdia ? '୫୮M • ଉଚ୍ଚ ରକ୍ତଚାପର ଇତିହାସ' : isHindi ? '58M • उच्च रक्तचाप का इतिहास' : '58M • History of Hypertension',
      intakeChannel: isOdia ? 'ଭଏସ୍‌ ଟ୍ରାନ୍ସକ୍ରିପ୍ଟ (ଓଡ଼ିଆ)' : isHindi ? 'वॉयस ट्रांसक्रिप्ट (हिंदी)' : 'Audio Transcript (Hindi)',
      symptoms: isOdia
        ? [
            'ବାମ ହାତକୁ ଯାଉଥିବା ପ୍ରବଳ ଛାତି କଷ୍ଟ',
            'ପ୍ରଚୁର ଥଣ୍ଡା ଝାଳ ଏବଂ ମୁଣ୍ଡ ବୁଲାଇବା',
            '୪୫ ମିନିଟ୍‌ ଧରି ନିଃଶ୍ୱାସ ପ୍ରଶ୍ୱାସ ନେବାରେ କଷ୍ଟ',
          ]
        : isHindi
        ? [
            'बाएं हाथ में फैलता हुआ सीने का तेज दर्द',
            'ठंडा पसीना और चक्कर आना',
            '45 मिनट से सांस लेने में तकलीफ',
          ]
        : [
            'Crushing chest pressure radiating to left arm',
            'Diaphoresis (cold sweats)',
            'Shortness of breath for 45 min',
          ],
      vitals: { hr: '112 bpm', bp: '158/96 mmHg', spo2: '94%', temp: '98.6 °F' },
      urgency: 'URGENT' as const,
      slaMinutes: 15,
      redFlags: isOdia
        ? ['ନିୟମ #୦୩: ଆକ୍ୟୁଟ୍‌ କରୋନାରୀ ସିଣ୍ଡ୍ରୋମ୍‌ ସଙ୍କେତ ଚିହ୍ନଟ', 'ନିୟମ #୧୨: SpO2 < ୯୫% ସହିତ ଝାଳ']
        : isHindi
        ? ['नियम #03: एक्यूट कोरोनरी सिंड्रोम संकेत का पता चला', 'नियम #12: SpO2 < 95% के साथ पसीना']
        : ['Rule #03: Acute Coronary Syndrome signature detected', 'Rule #12: SpO2 < 95% with diaphoresis'],
      safetyRulesPassed: 20,
      clinicalSummary: isOdia
        ? 'ହୃଦଘାତର ସମ୍ଭାବନା ଅଧିକ। ତୁରନ୍ତ 12-lead ECG ଏବଂ ହୃଦରୋଗ ବିଶେଷଜ୍ଞଙ୍କୁ ରେଫର୍‌ ଆବଶ୍ୟକ।'
        : isHindi
        ? 'हार्ट अटैक की उच्च संभावना। तत्काल 12-lead ECG और आपातकालीन कार्डियोलॉजी रेफरल आवश्यक।'
        : 'High probability of Acute Coronary Event. Immediate 12-lead ECG and emergency cardiac referral required.',
      recommendedSpecialty: isOdia ? 'ଜରୁରୀକାଳୀନ ହୃଦରୋଗ ବିଭାଗ' : isHindi ? 'आपातकालीन कार्डियोलॉजी' : 'Emergency Cardiology',
    },
    {
      id: 'fever',
      tabLabel: isOdia ? 'ଜ୍ୱର ଓ ପ୍ଲେଟଲେଟ୍‌' : isHindi ? 'तेज बुखार' : 'High Fever',
      title: isOdia
        ? 'ପ୍ଲେଟଲେଟ୍‌ ହ୍ରାସ ସହିତ ତୀବ୍ର ଜ୍ୱର'
        : isHindi
        ? 'प्लेटलेट्स में गिरावट के साथ लगातार तेज बुखार'
        : 'Persistent High Fever with Thrombocytopenia',
      category: isOdia ? 'ସଂକ୍ରାମକ ରୋଗ' : isHindi ? 'संक्रामक रोग' : 'Infectious Disease',
      patientProfile: isOdia ? '୩୪F • ୫ ଦିନର ବର୍ଷାଜନିତ ଜ୍ୱର' : isHindi ? '34F • 5 दिन से यात्रा पश्चात बुखार' : '34F • 5 Days Post-Monsoon Travel',
      intakeChannel: isOdia ? 'ଲ୍ୟାବ୍‌ OCR + ଭଏସ୍‌ (ଓଡ଼ିଆ)' : isHindi ? 'लैब OCR + वॉयस (हिंदी)' : 'Lab OCR + Audio (Odia)',
      symptoms: isOdia
        ? ['ଉଚ୍ଚ ମାତ୍ରାର ଜ୍ୱର (୧୦୩.୨°F)', 'ଗୋଡ଼ରେ ନାଲି ଦାଗ (Petechial rash)', 'ପ୍ଲେଟଲେଟ୍‌ ସଂଖ୍ୟା: ୪୮,୦୦୦/µL']
        : isHindi
        ? ['तेज बुखार (103.2°F)', 'पैरों पर लाल चकत्ते (Petechial rash)', 'प्लेटलेट काउंट: 48,000/µL']
        : ['High grade fever (103.2°F)', 'Petechial rash on lower limbs', 'Platelet count: 48,000/µL'],
      vitals: { hr: '98 bpm', bp: '106/70 mmHg', spo2: '98%', temp: '103.2 °F' },
      urgency: 'PRIORITY' as const,
      slaMinutes: 60,
      redFlags: isOdia
        ? ['ନିୟମ #୦୭: ଗୁରୁତର ପ୍ଲେଟଲେଟ୍‌ ହ୍ରାସ (< ୫୦,୦୦୦) — ଡେଙ୍ଗୁ ସତର୍କତା']
        : isHindi
        ? ['नियम #07: गंभीर प्लेटलेट की कमी (< 50k) — डेंगू चेतावनी']
        : ['Rule #07: Severe Thrombocytopenia (< 50k) with petechiae — Dengue alert'],
      safetyRulesPassed: 21,
      clinicalSummary: isOdia
        ? 'ଗୁରୁତର ଡେଙ୍ଗୁ ସନ୍ଦେହ। ନିୟମିତ CBC ଯାଞ୍ଚ ଏବଂ ଫ୍ଲୁଇଡ୍‌ ମ୍ୟାନେଜମେଣ୍ଟ ଆବଶ୍ୟକ।'
        : isHindi
        ? 'गंभीर डेंगू का संदेह। तत्काल सीबीसी निगरानी और आईवी फ्लुइड प्रबंधन की आवश्यकता।'
        : 'Suspicion of severe Dengue / hemorrhagic fever. Urgent CBC monitoring and fluid management triage.',
      recommendedSpecialty: isOdia ? 'ମେଡିସିନ୍‌ ବିଭାଗ' : isHindi ? 'इंटरनल मेडिसिन' : 'Internal Medicine / ID',
    },
    {
      id: 'routine',
      tabLabel: isOdia ? 'ସାଧାରଣ ଥଣ୍ଡା' : isHindi ? 'सामान्य सर्दी' : 'Mild Allergy',
      title: isOdia
        ? 'ଋତୁକାଳୀନ ଆଲର୍ଜି ଓ ଶୁଖିଲା କାଶ'
        : isHindi
        ? 'मौसमी एलर्जी और सूखी खांसी'
        : 'Seasonal Allergic Rhinitis & Dry Cough',
      category: isOdia ? 'ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟସେବା' : isHindi ? 'प्राथमिक स्वास्थ्य देखभाल' : 'Primary Care',
      patientProfile: isOdia ? '୨୬M • ଆଲର୍ଜିର ଇତିହାସ' : isHindi ? '26M • मौसमी एलर्जी इतिहास' : '26M • Non-smoker, seasonal history',
      intakeChannel: isOdia ? 'ଅନ୍‌ଲାଇନ୍‌ ଫର୍ମ' : isHindi ? 'वेब फॉर्म' : 'Web Form (English)',
      symptoms: isOdia
        ? ['ସକାଳେ ବାରମ୍ବାର ଛିଙ୍କ ହେବା', 'ଆଖିରୁ ପାଣି ବାହାରିବା ଓ ନାକ କୁଣ୍ଡାଇ ହେବା', '୩ ଦିନ ଧରି ସାମାନ୍ୟ ଶୁଖିଲା କାଶ']
        : isHindi
        ? ['सुबह के समय बार-बार छींक आना', 'आंखों से पानी और नाक में खुजली', '3 दिनों से हल्की सूखी खांसी']
        : ['Sneezing bouts in morning', 'Watery eyes and nasal itching', 'Mild dry throat tickle (3 days)'],
      vitals: { hr: '72 bpm', bp: '118/76 mmHg', spo2: '99%', temp: '98.4 °F' },
      urgency: 'ROUTINE' as const,
      slaMinutes: 240,
      redFlags: [],
      safetyRulesPassed: 22,
      clinicalSummary: isOdia
        ? 'ସାଧାରଣ ଶ୍ୱାସନଳୀ ଆଲର୍ଜି। କୌଣସି ଜରୁରୀ ବିପଦ ସଙ୍କେତ ନାହିଁ।'
        : isHindi
        ? 'असरदार ऊपरी श्वसन एलर्जी। कोई गंभीर आपातकालीन लक्षण नहीं।'
        : 'Uncomplicated upper respiratory allergic presentation. No red flags or respiratory compromise.',
      recommendedSpecialty: isOdia ? 'ସାଧାରଣ ଚିକିତ୍ସାଳୟ' : isHindi ? 'सामान्य अभ्यास' : 'General Practice',
    },
  ];

  const active = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  return (
    <div className="glass-panel w-full max-w-6xl mx-auto rounded-2xl shadow-xl overflow-hidden transition-all duration-300 relative">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/30 dark:bg-[#080F12]/60 gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isOdia ? 'କ୍ଲିନିକାଲ୍‌ ନିଷ୍ପତ୍ତି ସିମୁଲେଟର' : isHindi ? 'लाइव नैदानिक निर्णय सिम्युलेटर' : 'Live Clinical Decision Simulator'}
          </span>
          <span className="text-muted-foreground/40 text-xs font-mono">•</span>
          <span className="font-mono text-xs text-primary dark:text-accent font-semibold">
            {isOdia ? '୨୨-ନିୟମ ସୁରକ୍ଷା ଇଞ୍ଜିନ୍‌ ସକ୍ରିୟ' : isHindi ? '22-नियम सुरक्षा इंजन सक्रिय' : '22-Rule Safety Engine Active'}
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-1.5 bg-background dark:bg-white/[0.04] p-1 rounded-lg border border-border w-full sm:w-auto overflow-x-auto">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSelectedId(sc.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shrink-0 ${
                selectedId === sc.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/[0.04]'
              }`}
            >
              {sc.tabLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Patient Intake Signals */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-border space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                {isOdia ? 'ରୋଗୀ ଗ୍ରହଣ ତଥ୍ୟ' : isHindi ? 'मरीज़ इनटेक विवरण' : 'Patient Case Intake'}
              </span>
              <span className="font-mono text-xs text-primary dark:text-accent bg-primary/10 dark:bg-accent/10 px-2.5 py-1 rounded border border-primary/20 dark:border-accent/20 leading-normal">
                {active.intakeChannel}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">{active.title}</h3>
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
              <div key={i} className="glass-card p-2.5 rounded-lg space-y-1">
                <span className="font-mono text-[10px] text-muted-foreground block">{v.label}</span>
                <span className="font-mono text-xs font-semibold text-foreground block tabular-nums">{v.val}</span>
              </div>
            ))}
          </div>

          {/* Symptoms List */}
          <div className="space-y-2">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider block">
              {isOdia ? 'ଚିହ୍ନଟ ହୋଇଥିବା ଲକ୍ଷଣ ଓ ରିପୋର୍ଟ' : isHindi ? 'निकाले गए लक्षण और विवरण' : 'Extracted Symptoms & Transcripts'}
            </span>
            <div className="space-y-1.5">
              {active.symptoms.map((sym, idx) => (
                <div
                  key={idx}
                  className="glass-card flex items-start space-x-2 text-xs text-foreground px-3 py-2 rounded-lg"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-primary dark:text-accent mt-0.5 shrink-0" />
                  <span>{sym}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Triage Classification & Decision Support */}
        <div className="lg:col-span-7 p-6 space-y-6 bg-muted/20 dark:bg-gradient-to-br dark:from-[#0C171B] dark:to-[#080E11]">
          {/* Urgency & SLA Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border transition-colors ${
                active.urgency === 'URGENT'
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : active.urgency === 'PRIORITY'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                  {isOdia ? 'ଟ୍ରାଏଜ୍‌ ବର୍ଗ' : isHindi ? 'ट्राइएज श्रेणी' : 'Triage Tier'}
                </span>
                {active.urgency === 'URGENT' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {active.urgency === 'URGENT'
                  ? isOdia ? 'ଜରୁରୀ (URGENT)' : isHindi ? 'तत्काल (URGENT)' : 'URGENT'
                  : active.urgency === 'PRIORITY'
                  ? isOdia ? 'ପ୍ରାଥମିକତା (PRIORITY)' : isHindi ? 'प्राथमिकता (PRIORITY)' : 'PRIORITY'
                  : isOdia ? 'ସାଧାରଣ (ROUTINE)' : isHindi ? 'दिनचर्या (ROUTINE)' : 'ROUTINE'}
              </div>
              <p className="text-[11px] mt-1 opacity-90">
                {active.urgency === 'URGENT'
                  ? isOdia ? 'ତୁରନ୍ତ ଜୀବନରକ୍ଷା ପଦକ୍ଷେପ ଆବଶ୍ୟକ' : isHindi ? 'तत्काल जीवन-सुरक्षा समीक्षा आवश्यक' : 'Immediate life-safety escalation'
                  : active.urgency === 'PRIORITY'
                  ? isOdia ? 'ଶୀଘ୍ର ଡାକ୍ତରୀ ସମୀକ୍ଷା ଆବଶ୍ୟକ' : isHindi ? 'शीघ्र नैदानिक समीक्षा आवश्यक' : 'Expedited clinical review required'
                  : isOdia ? 'ସାଧାରଣ ଧାଡ଼ି (ଜରୁରୀକାଳୀନ ନୁହେଁ)' : isHindi ? 'मानक कतार (गैर-आपातकालीन)' : 'Standard queue non-emergency'}
              </p>
            </div>

            <div className="glass-card p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                  {isOdia ? 'SLA ସମୟସୀମା' : isHindi ? 'SLA समयसीमा' : 'SLA Window'}
                </span>
                <Clock className="w-3.5 h-3.5 text-primary dark:text-accent" />
              </div>
              <div className="text-2xl font-mono font-bold text-foreground tabular-nums">{active.slaMinutes}m 00s</div>
              <p className="text-[11px] text-muted-foreground">
                {isOdia ? 'ନିର୍ଦ୍ଧାରିତ ସମୀକ୍ଷା ଲକ୍ଷ୍ୟ' : isHindi ? 'निर्धारित प्रतिक्रिया लक्ष्य' : 'Deterministic response target'}
              </p>
            </div>
          </div>

          {/* 22-Rule Safety Engine Feedback */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                {isOdia ? 'ସୁରକ୍ଷା ଇଞ୍ଜିନ୍‌ ମୂଲ୍ୟାୟନ' : isHindi ? 'सुरक्षा इंजन मूल्यांकन' : 'Safety Engine Evaluation'}
              </span>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {active.safetyRulesPassed}/22 {isOdia ? 'ନିୟମ ସଫଳ' : isHindi ? 'नियम उत्तीर्ण' : 'Rules Cleared'}
              </span>
            </div>

            {active.redFlags.length > 0 ? (
              <div className="space-y-1.5">
                {active.redFlags.map((rf, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-2.5 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                    <span>{rf}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-2.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {isOdia
                    ? 'କୌଣସି ବିପଦଜନକ ଲକ୍ଷଣ ଚିହ୍ନଟ ହୋଇନାହିଁ। ସୁରକ୍ଷା ପ୍ରୋଟୋକଲ୍‌ ସଫଳ।'
                    : isHindi
                    ? 'कोई गंभीर रेड-फ्लैग नहीं मिला। सामान्य प्रोटोकॉल सत्यापित।'
                    : 'Zero critical red-flags triggered. Normal protocol verified.'}
                </span>
              </div>
            )}
          </div>

          {/* Clinical Structured Decision */}
          <div className="glass-card p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground uppercase tracking-wider">
                {isOdia ? 'ଡାକ୍ତରୀ ନିଷ୍ପତ୍ତି ସହାୟତା' : isHindi ? 'चिकित्सक निर्णय सहायता' : 'Clinician Decision Support'}
              </span>
              <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary dark:border-accent/30 dark:text-accent">
                {active.recommendedSpecialty}
              </Badge>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{active.clinicalSummary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
