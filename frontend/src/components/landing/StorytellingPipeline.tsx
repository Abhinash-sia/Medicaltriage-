'use client';

import React, { useState } from 'react';
import {
  Mic,
  ShieldCheck,
  Stethoscope,
  Layers,
  ArrowRight,
  CheckCircle2,
  Workflow,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export function StorytellingPipeline() {
  const { t, language } = useLanguage();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const isHindi = language === 'hi';
  const isOdia = language === 'or';

  const STEPS = [
    {
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
            'Real-time Audio waveform visualizer (Web Audio API)',
            'Multilingual speech recognition for Indian regional dialects',
            'High-confidence lab values extraction (Hb, Platelets, TLC, Creatinine)',
          ],
      mockData: {
        title: isOdia ? 'ଗ୍ରହଣ ଉତ୍ପତ୍ତି ତଥ୍ୟ ଫିଡ୍‌' : isHindi ? 'इनटेक स्रोत डेटा फ़ीड' : 'Ingestion Provenance Stream',
        items: [
          {
            k: isOdia ? 'ଭଏସ୍‌ ରେକର୍ଡିଂ' : isHindi ? 'वॉयस बफ़र' : 'Voice Buffer',
            v: isOdia ? 'ଓଡ଼ିଆ • 16kHz PCM • 42.1s' : isHindi ? 'हिंदी • 16kHz PCM • 42.1s' : 'Odia / Hindi • 16kHz PCM • 42.1s',
          },
          {
            k: isOdia ? 'OCR ଡକ୍ୟୁମେଣ୍ଟ' : isHindi ? 'OCR दस्तावेज़' : 'OCR Document',
            v: 'CBC_Report_0926.pdf (320 DPI)',
          },
          {
            k: isOdia ? 'ପ୍ରମାଣିକରଣ ID' : isHindi ? 'प्रमाणीकरण ID' : 'Grounding ID',
            v: 'IN-OD-2026-99218',
          },
        ],
      },
    },
    {
      step: '02',
      badge: isOdia ? 'ସୁରକ୍ଷା ଓ ଜରୁରୀକାଳୀନ ଇଞ୍ଜିନ୍‌' : isHindi ? 'सुरक्षा एवं तात्कालिकता इंजन' : 'Safety & Urgency Engine',
      title: isOdia
        ? '୨୨-ନିୟମ ବିଶିଷ୍ଟ ନିର୍ଦ୍ଧାରିତ କ୍ଲିନିକାଲ୍‌ ସୁରକ୍ଷା ଯାଞ୍ଚ'
        : isHindi
        ? '22-नियम विशिष्ट निर्धारित नैदानिक सुरक्षा सत्यापन'
        : 'Deterministic 22-rule clinical boundary verification',
      subtitle: isOdia
        ? 'AI ନୋଟ୍‌ ପ୍ରସ୍ତୁତ ହେବା ପୂର୍ବରୁ ସୁରକ୍ଷା ଯାଞ୍ଚ ସ୍ୱୟଂଚାଳିତ ଭାବେ ଚାଲେ'
        : isHindi
        ? 'AI नोट्स से पहले नियम-आधारित रेड-फ्लैग गेटकीपर चलता है'
        : 'Rule-based red-flag gatekeeper runs before any AI synthesis',
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
            'Hardcoded deterministic logic prevents LLM hallucinations',
            'Dynamic SLA countdown timer based on patient acuity',
            'Non-diagnostic boundary guardrails strictly enforced',
          ],
      mockData: {
        title: isOdia ? 'ସୁରକ୍ଷା ନିୟମ ମୂଲ୍ୟାୟନ ତାଲିକା' : isHindi ? 'नियम इंजन निष्पादन मैट्रिक्स' : 'Rule Engine Execution Matrix',
        items: [
          {
            k: isOdia ? 'ନିୟମ #୦୧ (ଆନାଫାଇଲାକ୍ସିସ୍‌)' : isHindi ? 'नियम #01 (एनाफिलेक्सिस)' : 'Rule #01 (Anaphylaxis)',
            v: isOdia ? 'ଉତ୍ତୀର୍ଣ୍ଣ (ନେଗେଟିଭ୍‌)' : isHindi ? 'उत्तीर्ण (नेगेटिव)' : 'PASSED (Negative)',
          },
          {
            k: isOdia ? 'ନିୟମ #୦୩ (ଛାତି ଯନ୍ତ୍ରଣା)' : isHindi ? 'नियम #03 (सीने में दर्द)' : 'Rule #03 (Chest Pain)',
            v: isOdia ? 'ଚିହ୍ନଟ (ଜରୁରୀ ଧ୍ୟାନ)' : isHindi ? 'ध्वजंकित (अति गंभीर)' : 'FLAGGED (Retrosternal)',
          },
          {
            k: isOdia ? 'ନିର୍ଦ୍ଧାରିତ SLA' : isHindi ? 'गणना की गई SLA' : 'Calculated SLA',
            v: isOdia ? '୧୫ ମିନିଟ୍‌ (ଜରୁରୀ ବର୍ଗ)' : isHindi ? '15 मिनट (तत्काल श्रेणी)' : '15 min (URGENT Tier)',
          },
        ],
      },
    },
    {
      step: '03',
      badge: isOdia ? 'ପାରସ୍ପରିକ ତୁଳନାତ୍ମକ ସଂଶ୍ଳେଷଣ' : isHindi ? 'आमने-सामने संश्लेषण' : 'Side-by-Side Synthesis',
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
            'Side-by-side original vernacular vs standardized English',
            'Visual provenance badge chips (Voice, Form, OCR)',
            'Timeline chronology synthesis of symptom progression',
          ],
      mockData: {
        title: isOdia ? 'ତଥ୍ୟ ପ୍ରମାଣିକରଣ ଲିଙ୍କ୍‌' : isHindi ? 'दस्तावेज़ साक्ष्य लिंक' : 'Dossier Grounding Links',
        items: [
          {
            k: isOdia ? 'ମୂଳ ଭଏସ୍‌ ଟ୍ରାନ୍ସକ୍ରିପ୍ଟ' : isHindi ? 'मूल ट्रांसक्रिप्ट' : 'Original Transcript',
            v: isOdia ? 'ଛାତିରେ ବହୁତ ଜୋରରେ କଷ୍ଟ ହେଉଛି... (Odia)' : 'छाती में बहुत तेज दर्द है... (Hindi)',
          },
          {
            k: isOdia ? 'ଇଂରାଜୀ ଅନୁବାଦ' : isHindi ? 'अंग्रेजी अनुवाद' : 'English Translation',
            v: 'Severe crushing chest pain radiating to left arm...',
          },
          {
            k: isOdia ? 'ସଠିକତା ସ୍କୋର' : isHindi ? 'सटीकता स्कोर' : 'Confidence Score',
            v: '98.4% (Verbatim Match)',
          },
        ],
      },
    },
    {
      step: '04',
      badge: isOdia ? 'ମାନବ ଅନୁମୋଦନ ଓ ରେଫରାଲ୍‌' : isHindi ? 'मानव प्रमाणीकरण एवं रेफरल' : 'Human Authorization & Referral',
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
            'ସମୀକ୍ଷା ସମୟ ଓ ପରିଚୟ ରେକର୍ଡ କରୁଥିବା ଅପରିବର୍ତ୍ତନୀୟ ଅଡିଟ୍‌ ଲଗ୍‌',
          ]
        : isHindi
        ? [
            'किसी भी निपटान से पहले सख्त मानव समीक्षा अनिवार्य',
            'आपातकालीन सुविधा खोज के साथ QR रेफरल प्रेषण',
            'अपरिवर्तनीय ऑडिट लॉग जो समय और क्रेडेंशियल ट्रैक करता है',
          ]
        : [
            'Strict Human-in-the-Loop requirement before any disposition',
            'Tamper-evident QR referral dispatch with emergency facility lookup',
            'Immutable audit log tracking review timestamp and credentials',
          ],
      mockData: {
        title: isOdia ? 'ଅନୁମୋଦନ ପ୍ରମାଣପତ୍ର' : isHindi ? 'प्राधिकरण प्रमाणपत्र' : 'Authorization Certificate',
        items: [
          {
            k: isOdia ? 'ସମୀକ୍ଷକ ଡାକ୍ତର' : isHindi ? 'समीक्षक चिकित्सक' : 'Reviewing Clinician',
            v: 'Dr. Anita Sharma, MD (Reg: MCI-88392)',
          },
          {
            k: isOdia ? 'ରେଫରାଲ୍‌ କେନ୍ଦ୍ର' : isHindi ? 'रेफरल सुविधा' : 'Escalation Facility',
            v: isOdia ? 'ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ' : isHindi ? 'जिला अस्पताल, कटक' : 'District Cardiology Center, Cuttack',
          },
          {
            k: isOdia ? 'ରେଫରାଲ୍‌ ଟୋକନ୍‌' : isHindi ? 'रेफरल टोकन' : 'Referral Token',
            v: 'REF-2026-OD-8812 (Active)',
          },
        ],
      },
    },
  ];

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
              className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? 'bg-primary text-primary-foreground border border-primary shadow-md shadow-primary/20 scale-[1.02]'
                  : 'glass-card text-muted-foreground hover:text-foreground'
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
      <div className="glass-panel grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl p-6 sm:p-10 shadow-xl transition-all duration-300 relative overflow-hidden">
        {/* Left Narrative Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
              <IconComponent className="w-3.5 h-3.5" />
              <span>
                {isOdia ? 'ପର୍ଯ୍ୟାୟ' : isHindi ? 'चरण' : 'Phase'} {active.step} • {active.badge}
              </span>
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
              <span>
                {isOdia ? 'ପରବର୍ତ୍ତୀ ପର୍ଯ୍ୟାୟ ଦେଖନ୍ତୁ' : isHindi ? 'अगला चरण देखें' : 'Explore Next Phase'} (
                {STEPS[(activeStepIndex + 1) % STEPS.length].badge})
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Interactive Mock Display */}
        <div className="lg:col-span-5 bg-muted/40 dark:bg-[#080E11] border border-border/80 dark:border-white/10 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs font-semibold text-foreground">{active.mockData.title}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {isOdia ? 'ଅଡିଟ୍‌ ତଥ୍ୟ' : isHindi ? 'ऑडिट डेटा' : 'AUDIT TELEMETRY'}
            </span>
          </div>

          <div className="space-y-2">
            {active.mockData.items.map((item, idx) => (
              <div
                key={idx}
                className="glass-card p-3 rounded-lg flex flex-col space-y-1"
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

          <div className="pt-2 border-t border-border/80 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>{isOdia ? 'ସୁରକ୍ଷା ଯାଞ୍ଚ' : isHindi ? 'सुरक्षा सत्यापन' : 'Cryptographic Integrity'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SHA-256 Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
