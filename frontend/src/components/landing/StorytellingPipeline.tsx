'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Mic,
  ShieldCheck,
  Stethoscope,
  Layers,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Sparkles,
  Volume2,
  FileSearch,
  ScanLine,
  AlertTriangle,
  QrCode,
  Clock,
  ExternalLink,
  Lock,
  Building2,
  FileCheck,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function StorytellingPipeline() {
  const { t, language } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsTrackRef = useRef<HTMLDivElement>(null);

  const isHindi = language === 'hi';
  const isOdia = language === 'or';

  const STEPS = [
    {
      id: 'step-intake',
      step: '01',
      badge: isOdia ? 'ବହୁମୁଖୀ ଗ୍ରହଣ' : isHindi ? 'मल्टीमॉडल प्रवेश' : 'Multimodal Intake',
      title: isOdia
        ? 'ଭଏସ୍‌, ଲ୍ୟାବ୍‌ ରିପୋର୍ଟ ଓ ଫର୍ମ ମାଧ୍ୟମରେ ସହଜ ରୋଗୀ ଗ୍ରହଣ'
        : isHindi
        ? 'वॉयस, लैब दस्तावेज़ और फॉर्म के माध्यम से निर्बाध मरीज़ इनटेक'
        : 'Zero-friction patient ingestion across voice, lab docs & forms',
      subtitle: isOdia
        ? 'ଇଂରାଜୀ, ହିନ୍ଦୀ ଏବଂ ଓଡ଼ିଆରେ ଦ୍ରୁତ ଭଏସ୍‌ ଟ୍ରାନ୍ସକ୍ରିପ୍ଟ ଏବଂ OCR'
        : isHindi
        ? 'अंग्रेजी, हिंदी और ओडिया में त्वरित वॉयस ट्रांसक्रिप्शन और दस्तावेज़ OCR'
        : 'Low-latency edge transcription and document OCR in English, Hindi, and Odia',
      description: isOdia
        ? 'ରୋଗୀ କିମ୍ବା ଆଶା କର୍ମୀ ସହଜରେ କଥା ହୋଇପାରିବେ କିମ୍ବା ଡାକ୍ତରୀ ପ୍ରେସକ୍ରିପସନ୍‌ ଓ ଲ୍ୟାବ୍‌ ରିପୋର୍ଟ ଫଟୋ ଅପଲୋଡ୍‌ କରିପାରିବେ। ଏହା ଠିକ୍‌ ଭାବରେ ପରୀକ୍ଷା ଫଳାଫଳ ଉଦ୍ଧାର କରେ।'
        : isHindi
        ? 'मरीज़ या स्वास्थ्य कार्यकर्ता आसानी से बोल सकते हैं या पर्चे और लैब रिपोर्ट की फोटो अपलोड कर सकते हैं। यह सटीक रूप से डेटा निकालता है।'
        : 'Patients or field health workers can speak naturally or upload mobile photos of handwritten prescriptions and lab reports. Audio is transcribed with medical phrase boosting; lab reports are extracted via OCR with strict tabular boundary parsing.',
      icon: Mic,
      highlights: isOdia
        ? [
            'ରିଅଲ୍‌-ଟାଇମ୍‌ ଅଡିଓ ତରଙ୍ଗ ଭିଜୁଆଲାଇଜର (Web Audio API)',
            'ଆଞ୍ଚଳିକ ଭାରତୀୟ ଭାଷା ପାଇଁ ଭଏସ୍‌ ଚିହ୍ନଟ ପ୍ରଣାଳୀ',
            'ଉଚ୍ଚ-ସଠିକତା ଲ୍ୟାବ୍‌ ପରୀକ୍ଷା ନିଷ୍କର୍ଷଣ (Hb, Platelets, TLC, Creatinine)',
          ]
        : isHindi
        ? [
            'रियल-टाइम ऑडियो वेवफॉर्म विज़ुअलाइज़र (Web Audio API)',
            'भारतीय क्षेत्रीय भाषाओं के लिए वाक् पहचान',
            'उच्च-सटीकता लैब मान निष्कर्षण (Hb, Platelets, TLC, Creatinine)',
          ]
        : [
            'Real-time audio waveform ingestion (16kHz PCM stream)',
            'Multilingual Indian language recognition (Odia / Hindi / English)',
            'Tabular boundary lab values OCR (Hb, Platelets, TLC, Creatinine)',
          ],
    },
    {
      id: 'step-safety',
      step: '02',
      badge: isOdia ? 'ସୁରକ୍ଷା ଓ ଜରୁରୀକାଳୀନ ଇଞ୍ଜିନ୍‌' : isHindi ? 'सुरक्षा एवं तात्कालिकता इंजन' : 'Deterministic Safety Engine',
      title: isOdia
        ? '୨୨-ନିୟମ ବିଶିଷ୍ଟ ନିର୍ଦ୍ଧାରିତ କ୍ଲିନିକାଲ୍‌ ସୁରକ୍ଷା ଯାଞ୍ଚ'
        : isHindi
        ? '22-नियम विशिष्ट निर्धारित नैदानिक सुरक्षा सत्यापन'
        : 'Deterministic 22-rule clinical boundary verification',
      subtitle: isOdia
        ? 'AI ନୋଟ୍‌ ପ୍ରସ୍ତୁତ ହେବା ପୂର୍ବରୁ ସୁରକ୍ଷା ଯାଞ୍ଚ ସ୍ୱୟଂଚାଳିତ ଭାବେ ଚାଲେ'
        : isHindi
        ? 'AI नोट्स से पहले नियम-आधारित रेड-फ्लैग गेटकीपर चलता है'
        : 'Hardcoded red-flag gatekeeper runs before any AI synthesis',
      description: isOdia
        ? 'କୌଣସି ବିପଦଜନକ ସ୍ଥିତି (ଯଥା ହୃଦଘାତ, ସେପସିସ୍‌, ଶିଶୁ ନିର୍ଜଳୀକରଣ) ତୁରନ୍ତ ଚିହ୍ନଟ କରି ଜରୁରୀକାଳୀନ ସମୟ ସୀମା (୧୫ମି / ୬୦ମି / ୨୪୦ମି) ନିର୍ଦ୍ଧାରଣ କରେ।'
        : isHindi
        ? 'घातक स्थितियों (हार्ट अटैक, सेप्सिस, बाल निर्जलीकरण) का पता लगाकर समय सीमा (15मि / 60मि / 240मि) निर्धारित करता है।'
        : 'Before generating clinical notes, a hardcoded 22-rule safety engine scans vitals and keywords for life-threatening conditions (STEMI, sepsis, pediatric dehydration, anaphylaxis). Urgency is mathematically categorized with hard SLA deadlines (15m / 60m / 240m).',
      icon: ShieldCheck,
      highlights: isOdia
        ? [
            'ନିର୍ଦ୍ଧାରିତ ତର୍କ LLM ଭ୍ରମକୁ ସମ୍ପୂର୍ଣ୍ଣ ରୋକିଥାଏ',
            'ରୋଗୀଙ୍କ ଜରୁରୀ ଅବସ୍ଥା ଅନୁଯାୟୀ SLA କାଉଣ୍ଟଡାଉନ୍‌ ଟାଇମର୍‌',
            'କଠୋର ଅଣ-ନିଦାନମୂଳକ ସୁରକ୍ଷା ନିୟମାବଳୀ ପ୍ରଯୁଜ୍ୟ',
          ]
        : isHindi
        ? [
            'हार्डकोडेड लॉजिक LLM के भ्रम को रोकता है',
            'मरीज़ की गंभीरता के आधार पर गतिशील SLA टाइमर',
            'सख्त गैर-निदानात्मक सुरक्षा सीमाएं लागू',
          ]
        : [
            'Hardcoded rule logic completely prevents AI hallucinations',
            'Dynamic SLA countdown timer (Urgent: 1h, Priority: 4h, Routine: 24h)',
            'Non-diagnostic boundary guardrails strictly enforced',
          ],
    },
    {
      id: 'step-synthesis',
      step: '03',
      badge: isOdia ? 'ପାରସ୍ପରିକ ତୁଳନାତ୍ମକ ସଂଶ୍ଳେଷଣ' : isHindi ? 'आमने-सामने संश्लेषण' : 'Provenance Grounding',
      title: isOdia
        ? '୧୦୦% ପ୍ରମାଣିକ ଆଧାର ସହିତ ମୂଳ ଉତ୍ସ ତଥ୍ୟ କାର୍ଡ'
        : isHindi
        ? '100% सटीक उद्धरणों के साथ मूल स्रोत कार्ड'
        : 'Original source provenance cards with 100% cited grounding',
      subtitle: isOdia
        ? 'ସମୀକ୍ଷକ ଡାକ୍ତର ମୂଳ ରୋଗୀ ବକ୍ତବ୍ୟ ଓ ଇଂରାଜୀ ସାରାଂଶ ଏକାଠି ଦେଖିପାରିବେ'
        : isHindi
        ? 'समीक्षक सारांश के साथ मूल मरीज़ के बयान का निरीक्षण करते हैं'
        : 'Reviewers inspect verbatim quotes alongside synthesized summaries',
      description: isOdia
        ? 'ଏହି ପ୍ଲାଟଫର୍ମ ମୂଳ ଆଞ୍ଚଳିକ ଭାଷା ଏବଂ ମାନକ ଇଂରାଜୀ ଅନୁବାଦକୁ ପାଖାପାଖି ରଖି ଡାକ୍ତରଙ୍କ ସମୀକ୍ଷାକୁ ସ୍ପଷ୍ଟ ଏବଂ ସହଜ କରିଥାଏ।'
        : isHindi
        ? 'यह मंच मूल भाषा और मानकीकृत अनुवाद को आमने-सामने प्रस्तुत करता है, जिससे समीक्षा में कोई अस्पष्टता नहीं रहती।'
        : 'The platform generates side-by-side translation and provenance cards. Every symptom, vital, and timeline point is hyperlinked directly to its source transcript span or OCR bounding box, eliminating ambiguity for the reviewing doctor.',
      icon: Layers,
      highlights: isOdia
        ? [
            'ମୂଳ ଆଞ୍ଚଳିକ ଭାଷା ବନାମ ମାନକ ଇଂରାଜୀ ଅନୁବାଦ',
            'ଦୃଶ୍ୟମାନ ଉତ୍ସ ବ୍ୟାଜ୍‌ ଚିପ୍‌ସ (ଭଏସ୍‌, ଫର୍ମ, OCR)',
            'ଲକ୍ଷଣ ବୃଦ୍ଧିର କାଳକ୍ରମିକ ସମୟରେଖା ସଂଶ୍ଳେଷଣ',
          ]
        : isHindi
        ? [
            'मूल भाषा बनाम मानकीकृत अंग्रेजी का सीधा मिलान',
            'दृश्य स्रोत बैज चिप्स (वॉयस, फॉर्म, OCR)',
            'लक्षणों की समयरेखा का स्पष्ट कालानुक्रम',
          ]
        : [
            'Side-by-side verbatim Odia/Hindi vs standardized English',
            'Visual provenance chips (Voice, Form, Lab OCR, AI Observation)',
            'Chronological timeline synthesis of symptom evolution',
          ],
    },
    {
      id: 'step-referral',
      step: '04',
      badge: isOdia ? 'ମାନବ ଅନୁମୋଦନ ଓ ରେଫରାଲ୍‌' : isHindi ? 'मानव प्रमाणीकरण एवं रेफरल' : 'Physician Authorization',
      title: isOdia
        ? 'QR-କୋଡ୍‌ ଯୁକ୍ତ ସୁରକ୍ଷିତ ଡାକ୍ତରୀ ଅନୁମୋଦନ ଏବଂ ରେଫରାଲ୍‌'
        : isHindi
        ? 'सत्यापित QR-कोड युक्त डॉक्टर अनुमोदन और रेफरल'
        : 'Qualified clinician sign-off with verified QR-coded referrals',
      subtitle: isOdia
        ? 'ଅଡିଟ୍‌ ଲଗ୍‌ ସହିତ ବିଶେଷଜ୍ଞ ଡାକ୍ତରଖାନାକୁ ସୁରକ୍ଷିତ ହସ୍ତାନ୍ତର'
        : isHindi
        ? 'ऑडिट ट्रेल के साथ विशेषज्ञ सुविधाओं को सुरक्षित स्थानांतरण'
        : 'Secure handoff to specialized facilities with audit trail persistence',
      description: isOdia
        ? 'ଯୋଗ୍ୟ ଡାକ୍ତର ନୋଟ୍‌ ଯାଞ୍ଚ କରି ଏକ କ୍ଲିକରେ QR-କୋଡ୍‌ ଯୁକ୍ତ ରେଫରାଲ୍‌ ପ୍ରଦାନ କରନ୍ତି, ଯାହା ସ୍ୱତନ୍ତ୍ର ହସ୍ପିଟାଲ୍‌ ସହିତ ସଂଯୁକ୍ତ।'
        : isHindi
        ? 'योग्य डॉक्टर नोट्स की जांच करते हैं और एक क्लिक में QR-कोड युक्त रेफरल अधिकृत करते हैं।'
        : 'A licensed healthcare professional reviews the structured dossier, edits notes with full audit logging, and authorizes one-click referral generation complete with verification QR codes and facility SLA tracking.',
      icon: Stethoscope,
      highlights: isOdia
        ? [
            'କୌଣସି ଡାକ୍ତରୀ ନିଷ୍ପତ୍ତି ପୂର୍ବରୁ କଠୋର ମାନବ ଯାଞ୍ଚ ବାଧ୍ୟତାମୂଳକ',
            'ଡାକ୍ତରଖାନା ତଲାସ ସହିତ QR ରେଫରାଲ୍‌ ପ୍ରେରଣ',
            'ସମୀକ୍ଷକ ସମୟ ଓ ପରିଚୟ ରେକର୍ଡ କରୁଥିବା ଅପରିବର୍ତ୍ତନୀୟ ଅଡିଟ୍‌ ଲଗ୍‌',
          ]
        : isHindi
        ? [
            'किसी भी निपटान से पहले सख्त मानव समीक्षा अनिवार्य',
            'आपातकालीन सुविधा खोज के साथ QR रेफरल प्रेषण',
            'अपरिवर्तनीय ऑडिट लॉग जो समय और क्रेडेंशियल ट्रैक करता है',
          ]
        : [
            'Strict Human-in-the-Loop requirement before any disposition',
            'Tamper-evident QR referral dispatch with destination hospital routing',
            'Immutable audit trail tracking clinician ID, timestamp & disposition',
          ],
    },
  ];

  // Set up GSAP ScrollTrigger for Awwwards-style section scrolling
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Find all step anchor elements
      const stepElements = containerRef.current?.querySelectorAll<HTMLElement>('.story-step-section');
      if (!stepElements || stepElements.length === 0) return;

      stepElements.forEach((el, index) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => setActiveStep(index),
          onEnterBack: () => setActiveStep(index),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollToStep = (index: number) => {
    setActiveStep(index);
    const stepEl = document.getElementById(`story-step-${index}`);
    if (stepEl) {
      stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const active = STEPS[activeStep];
  const IconComponent = active.icon;

  return (
    <div ref={containerRef} className="w-full relative space-y-12">
      {/* Top Floating Glass Stepper Navigator */}
      <div className="sticky top-20 z-30 flex items-center justify-center">
        <div className="glass-panel p-1.5 rounded-2xl flex flex-wrap items-center justify-center gap-1.5 shadow-xl border border-border bg-card/85 dark:bg-card/75">
          {STEPS.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = idx === activeStep;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => scrollToStep(idx)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all duration-300 text-xs font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.03] font-semibold ring-1 ring-primary/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <span className={`font-mono text-[11px] font-bold ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
                  {s.step}
                </span>
                <StepIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Column Storytelling Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Scrollable Narrative Steps with Animated Timeline Line */}
        <div ref={stepsTrackRef} className="lg:col-span-6 space-y-24 relative pl-6 sm:pl-8">
          {/* Vertical Glowing Progress Line */}
          <div className="absolute left-2.5 sm:left-3.5 top-4 bottom-4 w-[2px] bg-border">
            <div
              className="w-full bg-gradient-to-b from-primary via-accent to-primary transition-all duration-500 rounded-full"
              style={{
                height: `${((activeStep + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>

          {STEPS.map((step, idx) => {
            const isCurrent = idx === activeStep;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                id={`story-step-${idx}`}
                className={`story-step-section space-y-6 transition-all duration-500 relative scroll-mt-36 ${
                  isCurrent ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-75 scale-[0.98]'
                }`}
              >
                {/* Step Node Marker on Line */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md shadow-primary/30 scale-110'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold">{step.step}</span>
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center space-x-2 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                    <StepIcon className="w-3.5 h-3.5" />
                    <span>
                      {isOdia ? 'ପର୍ଯ୍ୟାୟ' : isHindi ? 'चरण' : 'Phase'} {step.step} • {step.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-medium text-primary dark:text-accent leading-snug">
                    {step.subtitle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                <div className="space-y-2.5 pt-2">
                  {step.highlights.map((h, i) => (
                    <div key={i} className="flex items-start space-x-2.5 text-xs text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => scrollToStep((idx + 1) % STEPS.length)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-primary dark:text-accent hover:underline"
                  >
                    <span>{idx === STEPS.length - 1 ? 'Back to Start (Phase 01)' : `Advance to Phase 0${idx + 2}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Sticky Interactive 3D Showcase Canvas */}
        <div className="lg:col-span-6 sticky top-36 z-20">
          <div className="glass-panel w-full rounded-2xl p-6 space-y-5 transition-all duration-500 relative overflow-hidden border border-border shadow-2xl bg-card/90 dark:bg-card/80">
            {/* Top Specular Accent Glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 dark:via-accent/60 to-transparent pointer-events-none" />

            {/* Stage Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary dark:text-accent">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-foreground">
                    STAGE {active.step}: {active.badge.toUpperCase()}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    Verified Execution State • Zero Hallucination
                  </div>
                </div>
              </div>

              <Badge variant="outline" className="font-mono text-[10px] bg-muted/60 text-primary dark:text-accent border-border">
                Live Simulation
              </Badge>
            </div>

            {/* Dynamic Stage Content based on activeStep */}
            <div className="min-h-[320px] flex flex-col justify-center">
              {activeStep === 0 && (
                /* Stage 01: Multimodal Intake */
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Audio Stream Ingestion Box */}
                  <div className="p-3.5 bg-muted/50 dark:bg-black/40 rounded-xl border border-border space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-primary dark:text-accent" />
                        <span>Odia Voice Ingestion • 16kHz</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Transcribing
                      </span>
                    </div>

                    <div className="h-8 flex items-center justify-between gap-1 px-1">
                      {[40, 75, 30, 90, 60, 45, 85, 100, 70, 50, 80, 65, 95, 40, 60, 85, 55, 70, 90, 45, 60, 75, 35].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="w-full bg-primary/70 dark:bg-accent rounded-full animate-pulse transition-all duration-300"
                            style={{ height: `${h}%`, animationDelay: `${(i % 5) * 150}ms` }}
                          />
                        )
                      )}
                    </div>

                    <div className="text-xs italic text-foreground/90 font-serif p-2 bg-card rounded-md border border-border/60">
                      &quot;ଛାତିରେ ବହୁତ ଯନ୍ତ୍ରଣା ହେଉଛି ୪୫ ମିନିଟ୍‌ ହେଲା, ବାମ ହାତକୁ ଯାଉଛି...&quot;
                    </div>
                  </div>

                  {/* OCR Document Scanner Box */}
                  <div className="p-3.5 bg-card rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <ScanLine className="w-3.5 h-3.5 text-primary dark:text-accent" />
                        <span>Lab Report OCR Parser</span>
                      </span>
                      <span className="text-primary dark:text-accent text-[10px]">CBC_Report_0926.pdf</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 bg-muted/60 rounded-lg border border-border/50 text-center">
                        <div className="text-muted-foreground text-[9px]">Hb Level</div>
                        <div className="font-bold text-foreground">11.2 g/dL</div>
                      </div>
                      <div className="p-2 bg-muted/60 rounded-lg border border-border/50 text-center">
                        <div className="text-muted-foreground text-[9px]">Platelets</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">240,000</div>
                      </div>
                      <div className="p-2 bg-muted/60 rounded-lg border border-border/50 text-center">
                        <div className="text-muted-foreground text-[9px]">TLC Count</div>
                        <div className="font-bold text-foreground">7,800 /uL</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                /* Stage 02: Deterministic Safety Guardrails */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>CRITICAL SAFETY TRIGGER</span>
                      </span>
                      <Badge variant="outline" className="font-mono text-[9px] bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40">
                        RULE-104 ACTIVATED
                      </Badge>
                    </div>
                    <p className="text-xs text-rose-950 dark:text-rose-200">
                      Acute Retrosternal Pain + Left Arm Radiation detected. Mandatory High Acuity assignment.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-xl border border-border space-y-1">
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                        <span>PRIORITY TIER</span>
                        <Clock className="w-3 h-3 text-rose-500" />
                      </div>
                      <div className="text-base font-mono font-bold text-rose-600 dark:text-rose-400">URGENT</div>
                      <div className="text-[10px] text-muted-foreground font-mono">1 Hour Target SLA</div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-xl border border-border space-y-1">
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                        <span>GUARDRAILS</span>
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      </div>
                      <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">22 / 22 Passed</div>
                      <div className="text-[10px] text-muted-foreground font-mono">0 Hallucinations</div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                /* Stage 03: Provenance Grounding */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Verbatim Source Matching</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-card rounded-lg border border-border/70 space-y-1">
                        <div className="font-mono text-[9px] text-muted-foreground">Original Patient Transcript</div>
                        <div className="italic text-foreground font-serif text-[11px]">
                          &quot;ଛାତିରେ ବହୁତ ଜୋରରେ କଷ୍ଟ ହେଉଛି...&quot;
                        </div>
                      </div>
                      <div className="p-2.5 bg-card rounded-lg border border-border/70 space-y-1">
                        <div className="font-mono text-[9px] text-primary dark:text-accent font-semibold">Verified Clinical English</div>
                        <div className="text-foreground font-sans text-[11px]">
                          Severe retrosternal pressure radiating to left extremity.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-mono text-[11px]">Exact Grounding Confidence</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">98.4% Match</span>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                /* Stage 04: Physician Authorization & QR Referral */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3.5 bg-card rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-primary dark:text-accent" />
                        <div>
                          <div className="font-bold text-foreground text-xs">Dr. Anita Sharma, MD</div>
                          <div className="text-[10px] font-mono text-muted-foreground">Reg: MCI-88392 • Verified Reviewer</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Signed & Dispatched
                      </Badge>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded-lg border border-border/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground">Destination Facility</div>
                        <div className="font-semibold text-foreground text-xs">District Cardiology Center, Cuttack</div>
                      </div>
                      <QrCode className="w-8 h-8 text-primary dark:text-accent p-1 bg-card rounded border border-border" />
                    </div>
                  </div>

                  <div className="p-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground text-[10px]">Tamper-Evident Referral Token</span>
                    <span className="text-primary dark:text-accent font-bold text-[11px]">REF-2026-OD-8812</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="pt-2 border-t border-border/80 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>PIPELINE PROGRESS</span>
              <span className="text-foreground font-bold">
                {activeStep + 1} of {STEPS.length} Stages Completed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
