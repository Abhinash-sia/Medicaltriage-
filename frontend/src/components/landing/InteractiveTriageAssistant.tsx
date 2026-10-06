'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HeartPulse,
  AlertTriangle,
  PhoneCall,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';

interface TriageOption {
  id: string;
  icon: string;
  label: { en: string; hi: string; or: string };
  urgency: 'EMERGENCY' | 'PRIORITY' | 'ROUTINE';
  badgeColor: string;
  alertColor: string;
  timeframe: { en: string; hi: string; or: string };
  advice: { en: string; hi: string; or: string };
  firstAid: { en: string; hi: string; or: string };
  isEmergency: boolean;
}

const TRIAGE_OPTIONS: TriageOption[] = [
  {
    id: 'chest-pain',
    icon: '⚡',
    label: {
      en: 'Chest Pressure / Pain',
      hi: 'सीने में दर्द या भारीपन',
      or: 'ଛାତିରେ ଯନ୍ତ୍ରଣା ବା ଚାପ',
    },
    urgency: 'EMERGENCY',
    badgeColor: 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10',
    alertColor: 'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200',
    timeframe: {
      en: 'Immediate Evaluation (< 15 mins)',
      hi: 'तत्काल जांच (< 15 मिनट)',
      or: 'ତୁରନ୍ତ ଡାକ୍ତରୀ ଯାଞ୍ଚ (< ୧୫ ମିନିଟ୍‌)',
    },
    advice: {
      en: 'Potential cardiac red flag. Do not drive yourself. Keep the patient seated and calm.',
      hi: 'संभावित हृदय आपातकाल। स्वयं वाहन न चलाएं। मरीज़ को शांत और बैठाकर रखें।',
      or: 'ସମ୍ଭାବ୍ୟ ହୃଦଘାତ ସଙ୍କେତ। ନିଜେ ଗାଡ଼ି ଚଲାନ୍ତୁ ନାହିଁ। ରୋଗୀଙ୍କୁ ବସାଇ ରଖନ୍ତୁ।',
    },
    firstAid: {
      en: 'Loosen tight clothing. Call 108 ambulance immediately.',
      hi: 'तंग कपड़े ढीले करें। तुरंत 108 एम्बुलेंस को कॉल करें।',
      or: 'ଚିପା ପୋଷାକ ଢିଲା କରନ୍ତୁ। ତୁରନ୍ତ ୧୦୮ ଆମ୍ବୁଲାନ୍ସ ଡାକନ୍ତୁ।',
    },
    isEmergency: true,
  },
  {
    id: 'breathing',
    icon: '🫁',
    label: {
      en: 'Breathing Difficulty / Wheezing',
      hi: 'सांस लेने में तकलीफ / घरघराहट',
      or: 'ଶ୍ୱାସକଷ୍ଟ ବା ଘରଘର ଶବ୍ଦ',
    },
    urgency: 'PRIORITY',
    badgeColor: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    alertColor: 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200',
    timeframe: {
      en: 'Urgent Care (< 1 - 2 hours)',
      hi: 'त्वरित देखभाल (< 1 - 2 घंटे)',
      or: 'ଜରୁରୀ ଯତ୍ନ (< ୧ - ୨ ଘଣ୍ଟା)',
    },
    advice: {
      en: 'Respiratory distress protocol active. Monitor SpO2 and check for chest indrawing.',
      hi: 'श्वसन कष्ट प्रोटोकॉल सक्रिय। ऑक्सीजन स्तर (SpO2) की जांच करें।',
      or: 'ଶ୍ୱାସକ୍ରିୟା ସମସ୍ୟା ଚିହ୍ନଟ। SpO2 ଅମ୍ଳଜାନ ସ୍ତର ଯାଞ୍ଚ କରନ୍ତୁ।',
    },
    firstAid: {
      en: 'Sit upright in well-ventilated area. Prepare inhaler if prescribed.',
      hi: 'खुली हवा में सीधे बैठें। यदि निर्धारित हो तो इनहेलर का उपयोग करें।',
      or: 'ଖୋଲା ପବନରେ ସିଧା ବସନ୍ତୁ। ଆବଶ୍ୟକ ହେଲେ ଇନହେଲର ବ୍ୟବହାର କରନ୍ତୁ।',
    },
    isEmergency: false,
  },
  {
    id: 'fever',
    icon: '🤒',
    label: {
      en: 'High Fever & Severe Fatigue',
      hi: 'तेज बुखार और अत्यधिक थकान',
      or: 'ପ୍ରବଳ ଜ୍ୱର ଓ ଅତ୍ୟଧିକ ଦୁର୍ବଳତା',
    },
    urgency: 'PRIORITY',
    badgeColor: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    alertColor: 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200',
    timeframe: {
      en: 'Clinical Review (< 4 hours)',
      hi: 'चिकित्सकीय समीक्षा (< 4 घंटे)',
      or: 'ଡାକ୍ତରୀ ସମୀକ୍ଷା (< ୪ ଘଣ୍ଟା)',
    },
    advice: {
      en: 'Check for hydration, chills, or headache. Upload lab tests if available for OCR analysis.',
      hi: 'जलयोजन, ठंड या सिरदर्द की जांच करें। यदि उपलब्ध हो तो लैब रिपोर्ट अपलोड करें।',
      or: 'ପ୍ରଚୁର ପାଣି ପିଅନ୍ତୁ। ପୂର୍ବ ପରୀକ୍ଷା ରିପୋର୍ଟ ଥିଲେ ଅପଲୋଡ୍‌ କରନ୍ତୁ।',
    },
    firstAid: {
      en: 'Stay hydrated with ORS/water. Use cool cloth compress on forehead.',
      hi: 'ओआरएस/पानी से हाइड्रेटेड रहें। माथे पर ठंडे कपड़े की पट्टी रखें।',
      or: 'ORS ଓ ପାଣି ପିଅନ୍ତୁ। ମୁଣ୍ଡରେ ଓଦା କନା ପଟି ଦିଅନ୍ତୁ।',
    },
    isEmergency: false,
  },
  {
    id: 'rash',
    icon: '🩹',
    label: {
      en: 'Skin Rash or Joint Aches',
      hi: 'त्वचा पर चकत्ते या जोड़ों का दर्द',
      or: 'ଚର୍ମରେ ଘାଆ ବା ଗଣ୍ଠି ଯନ୍ତ୍ରଣା',
    },
    urgency: 'ROUTINE',
    badgeColor: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    alertColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200',
    timeframe: {
      en: 'Standard Outpatient (< 24 hours)',
      hi: 'सामान्य ओपीडी परामर्श (< 24 घंटे)',
      or: 'ସାଧାରଣ ଡାକ୍ତରୀ ପରାମର୍ଶ (< ୨୪ ଘଣ୍ଟା)',
    },
    advice: {
      en: 'Non-emergency condition. Submit voice or text intake for physician structured evaluation.',
      hi: 'गैर-आपातकालीन स्थिति। डॉक्टर समीक्षा के लिए वॉयस या फॉर्म इनटेक जमा करें।',
      or: 'ଅଣ-ଜରୁରୀକାଳୀନ ଅବସ୍ଥା। ଡାକ୍ତରୀ ପରାମର୍ଶ ପାଇଁ ଭଏସ୍‌ ବା ଫର୍ମ ଦାଖଲ କରନ୍ତୁ।',
    },
    firstAid: {
      en: 'Avoid scratching affected area. Rest joint and maintain hygiene.',
      hi: 'प्रभावित जगह को न खुजलाएं। आराम करें और स्वच्छता बनाए रखें।',
      or: 'ପ୍ରଭାବିତ ସ୍ଥାନକୁ କୁଣ୍ଡାନ୍ତୁ ନାହିଁ। ବିଶ୍ରାମ ନିଅନ୍ତୁ।',
    },
    isEmergency: false,
  },
];

export function InteractiveTriageAssistant() {
  const { language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>('chest-pain');

  const langKey = language === 'hi' ? 'hi' : language === 'or' ? 'or' : 'en';
  const selected = TRIAGE_OPTIONS.find((o) => o.id === selectedId) || TRIAGE_OPTIONS[0];

  return (
    <div className="glass-panel w-full rounded-2xl p-5 sm:p-6 space-y-4 border border-border shadow-xl bg-card/90 dark:bg-card/80 relative overflow-hidden transition-all duration-300">
      {/* Specular Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary dark:text-accent shadow-xs">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <span>{langKey === 'or' ? 'ଜରୁରୀକାଳୀନ ଟ୍ରାୟାଜ୍‌ ଗାଇଡ୍‌' : langKey === 'hi' ? 'त्वरित लक्षण जांच एवं आपातकालीन गाइड' : 'Instant Triage & Symptom Guide'}</span>
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              {langKey === 'or' ? 'ନିୟମ-ଆଧାରିତ ସୁରକ୍ଷା ଯାଞ୍ଚ • ୨୪/୭ ଉପଲବ୍ଧ' : langKey === 'hi' ? 'नियम-आधारित सुरक्षा सत्यापन • 24/7 सक्रिय' : 'Rule-Based Safety Triaging • 24/7 Available'}
            </p>
          </div>
        </div>

        <Badge variant="outline" className={`font-mono text-[10px] font-bold px-2.5 py-1 leading-normal ${selected.badgeColor}`}>
          {selected.urgency}
        </Badge>
      </div>

      {/* Interactive Symptom Selector Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
          {langKey === 'or' ? 'ଲକ୍ଷଣ ଚୟନ କରନ୍ତୁ:' : langKey === 'hi' ? 'लक्षण चुनें:' : 'Select Primary Symptom:'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TRIAGE_OPTIONS.map((opt) => {
            const isSelected = opt.id === selectedId;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedId(opt.id)}
                className={`text-left p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs min-h-[44px] ${
                  isSelected
                    ? 'bg-primary/10 dark:bg-accent/10 border-primary/40 dark:border-accent/40 text-foreground font-semibold shadow-xs ring-1 ring-primary/20'
                    : 'bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <span className="text-base shrink-0">{opt.icon}</span>
                <span className="text-[11px] leading-snug line-clamp-2">{opt.label[langKey]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clinical Assessment Box */}
      <div className={`p-4 rounded-xl border space-y-3 transition-all duration-300 ${selected.alertColor}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              {selected.isEmergency ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>{selected.timeframe[langKey]}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed mt-1">
              {selected.advice[langKey]}
            </p>
          </div>
        </div>

        <div className="p-2.5 bg-card/80 dark:bg-card/60 rounded-lg border border-border/60 text-xs text-foreground space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-primary dark:text-accent" />
            <span>{langKey === 'or' ? 'ସୁପାରିଶ କରାଯାଇଥିବା ତୁରନ୍ତ ପଦକ୍ଷେପ:' : langKey === 'hi' ? 'अनुशंसित तत्काल कदम:' : 'Recommended Immediate Step:'}</span>
          </div>
          <p className="text-[11px] leading-snug">{selected.firstAid[langKey]}</p>
        </div>
      </div>

      {/* Emergency Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        {selected.isEmergency && (
          <a
            href="tel:108"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs shadow-md shadow-rose-600/20 transition-colors font-mono"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
            <span>{langKey === 'or' ? '୧୦୮ କଲ୍‌ କରନ୍ତୁ (ଆମ୍ବୁଲାନ୍ସ)' : langKey === 'hi' ? '108 कॉल करें (एम्बुलेंस)' : 'Call 108 (Ambulance)'}</span>
          </a>
        )}

        <Link href="/patient/intake" className={`w-full ${selected.isEmergency ? 'sm:w-1/2' : ''}`}>
          <Button
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 shadow-sm border border-primary/30 flex items-center justify-center gap-1.5"
          >
            <span>{langKey === 'or' ? 'ରୋଗୀ ଇନଟେକ୍‌ ଆରମ୍ଭ କରନ୍ତୁ' : langKey === 'hi' ? 'मरीज़ इनटेक शुरू करें' : 'Start Patient Intake'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
