'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  HeartPulse,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Calendar,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { AudioWaveformRecorder } from '@/components/intake/AudioWaveformRecorder';
import { DocumentDropzone } from '@/components/intake/DocumentDropzone';
import { useLanguage } from '@/i18n/LanguageContext';
import { gsap, withMotion, MOTION } from '@/lib/motion';

interface IntakeFormData {
  consent: boolean;
  consentVersion: string;
  language: string;
  age: number | string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  primarySymptom: string;
  symptomDescription: string;
  onset: string;
  duration: string;
  severity: number;
  bodyLocation: string;
  course: 'IMPROVING' | 'UNCHANGED' | 'WORSENING';
}

const initialForm: IntakeFormData = {
  consent: false,
  consentVersion: 'v1.0-hackathon',
  language: 'en',
  age: '',
  gender: '',
  primarySymptom: '',
  symptomDescription: '',
  onset: '',
  duration: '',
  severity: 5,
  bodyLocation: '',
  course: 'UNCHANGED',
};

export default function PatientIntakePage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<IntakeFormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedVoiceFile, setAttachedVoiceFile] = useState<File | null>(null);
  const [submittedCase, setSubmittedCase] = useState<{
    caseId: string;
    caseNumber: string;
    status: string;
    priority: string;
    patientAge?: number;
    patientGender?: string;
    createdAt: string;
  } | null>(null);

  const stepContainerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, consent: e.target.checked }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const animateStepTransition = (nextStepNumber: number) => {
    if (stepContainerRef.current) {
      withMotion(() => {
        const tl = gsap.timeline();
        tl.to(stepContainerRef.current, {
          x: -16,
          opacity: 0,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            setStep(nextStepNumber);
            gsap.fromTo(
              stepContainerRef.current,
              { x: 16, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.25, ease: 'power3.out' }
            );
            if (headingRef.current) headingRef.current.focus();
          },
        });
      });
    } else {
      setStep(nextStepNumber);
    }
  };

  const nextStep = () => {
    setSubmitError(null);
    if (step === 1 && !formData.consent) {
      setSubmitError(t('patient.consentRequiredError'));
      return;
    }
    if (step === 2 && (!formData.primarySymptom.trim() || !formData.symptomDescription.trim())) {
      setSubmitError(t('patient.symptomRequiredError'));
      return;
    }
    if (step === 3 && !formData.onset.trim()) {
      setSubmitError(t('patient.onsetRequiredError'));
      return;
    }
    animateStepTransition(Math.min(step + 1, 4));
  };

  const prevStep = () => {
    setSubmitError(null);
    animateStepTransition(Math.max(step - 1, 1));
  };

  const handleSubmitIntake = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Idempotency-Key': `intake-${Date.now()}`,
        },
        body: JSON.stringify({
          consent: formData.consent,
          consentVersion: formData.consentVersion,
          language: formData.language,
          age: formData.age !== '' ? Number(formData.age) : undefined,
          gender: formData.gender || undefined,
          primarySymptom: formData.primarySymptom,
          symptomDescription: formData.symptomDescription,
          onset: formData.onset,
          duration: formData.duration || undefined,
          severity: Number(formData.severity),
          bodyLocation: formData.bodyLocation || undefined,
          course: formData.course,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to submit intake. Please try again.');
      }

      const caseData = {
        caseId: result.data.caseId,
        caseNumber: result.data.caseNumber,
        status: result.data.status,
        priority: result.data.priority,
        patientAge: result.data.patientAge,
        patientGender: result.data.patientGender,
        createdAt: result.data.createdAt,
      };

      setSubmittedCase(caseData);

      // Upload optional documents if attached
      if (attachedFile) {
        const fileData = new FormData();
        fileData.append('file', attachedFile);
        fileData.append('caseId', caseData.caseId);
        fetch(`${apiBaseUrl}/cases/${caseData.caseId}/reports`, {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: fileData,
        }).catch(() => {});
      }

      if (attachedVoiceFile) {
        const voiceData = new FormData();
        voiceData.append('file', attachedVoiceFile);
        fetch(`${apiBaseUrl}/cases/${caseData.caseId}/voice-inputs`, {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: voiceData,
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred during submission.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProgress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <DemoBanner />

      {/* Progress Line */}
      {!submittedCase && (
        <div className="w-full h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      )}

      <div className="py-8 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/patient"
              className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-[5px] hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>{t('patient.backToDashboard')}</span>
            </Link>
            <LanguageSelector />
          </div>

          {/* Header Branding */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase tracking-wider">
              <HeartPulse className="w-3 h-3" />
              <span>{t('patient.portalTitle')}</span>
            </div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-xl sm:text-2xl font-bold tracking-tight text-foreground focus:outline-none"
            >
              {t('patient.intakeTitle')}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('patient.intakeSubtitle')}
            </p>
          </div>

          {/* Persistent Non-Diagnostic Safety Language Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[6px] text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[11px] uppercase tracking-wider">{t('patient.safetyNoticeTitle')}</p>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                {t('patient.safetyNoticeDesc')}
              </p>
            </div>
          </div>

          {/* Confirmation State */}
          {submittedCase ? (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg text-foreground">
                  {t('patient.successTitle')}
                </CardTitle>
                <CardDescription>{t('patient.successSubtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3 border-t border-border/60">
                <div className="bg-muted/40 p-4 rounded-[6px] border border-border/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">{t('patient.caseNumberLabel')}:</span>
                    <span className="font-mono font-bold text-foreground text-sm tracking-tight">
                      {submittedCase.caseNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('patient.initialStatusLabel')}:</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {submittedCase.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('patient.initialPriorityLabel')}:</span>
                    <Badge
                      variant={
                        submittedCase.priority === 'URGENT'
                          ? 'urgent'
                          : submittedCase.priority === 'PRIORITY'
                          ? 'priority'
                          : 'routine'
                      }
                    >
                      {submittedCase.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  {t('patient.noticeCaseNumber')}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Link href="/patient" className="w-full sm:w-1/2">
                  <Button variant="outline" className="w-full text-xs">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    {t('patient.backToDashboard')}
                  </Button>
                </Link>
                <Button
                  className="w-full sm:w-1/2 text-xs"
                  onClick={() => {
                    setSubmittedCase(null);
                    setFormData(initialForm);
                    setStep(1);
                  }}
                >
                  {t('patient.startNewIntake')}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            /* Multi-Step Intake Form */
            <Card className="bg-card border border-border shadow-2xs">
              {/* Stepper Header */}
              <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                <span className={step === 1 ? 'text-primary font-bold' : ''}>
                  1. {t('patient.step1')}
                </span>
                <ChevronRight className="w-3 h-3 text-border" />
                <span className={step === 2 ? 'text-primary font-bold' : ''}>
                  2. {t('patient.step2')}
                </span>
                <ChevronRight className="w-3 h-3 text-border" />
                <span className={step === 3 ? 'text-primary font-bold' : ''}>
                  3. {t('patient.step3')}
                </span>
                <ChevronRight className="w-3 h-3 text-border" />
                <span className={step === 4 ? 'text-primary font-bold' : ''}>
                  4. {t('patient.step4')}
                </span>
              </div>

              <CardContent className="p-5 sm:p-6 space-y-5">
                {submitError && (
                  <div className="p-2.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-[5px] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div ref={stepContainerRef}>
                  {/* STEP 1: CONSENT */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <span>{t('patient.step1Title')}</span>
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {t('patient.step1Subtitle')}
                        </p>
                      </div>

                      <div className="bg-muted/40 p-3.5 rounded-[6px] border border-border text-xs text-muted-foreground space-y-2 leading-relaxed">
                        <p>{t('patient.consentPoint1')}</p>
                        <p>{t('patient.consentPoint2')}</p>
                        <p>{t('patient.consentPoint3')}</p>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={formData.consent}
                            onChange={handleConsentChange}
                            className="mt-1 h-4 w-4 text-primary rounded border-border focus:ring-accent"
                          />
                          <span className="text-xs text-foreground font-medium leading-normal">
                            {t('patient.consentCheckbox')}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PRIMARY SYMPTOM & LANGUAGE */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-foreground">{t('patient.step2Title')}</h2>
                        <p className="text-xs text-muted-foreground">{t('patient.step2Subtitle')}</p>
                      </div>

                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-foreground">
                            {t('patient.preferredLanguage')}
                          </label>
                          <select
                            name="language"
                            value={formData.language}
                            onChange={handleInputChange}
                            className="w-full text-xs p-2 h-9 border border-border bg-card rounded-[5px] text-foreground focus:ring-1 focus:ring-accent focus:outline-none"
                          >
                            <option value="en">English</option>
                            <option value="hi">हिन्दी (Hindi)</option>
                            <option value="or">ଓଡ଼ିଆ (Odia)</option>
                            <option value="bn">বাংলা (Bengali)</option>
                            <option value="ta">தமிழ் (Tamil)</option>
                            <option value="te">తెలుగు (Telugu)</option>
                            <option value="mr">मराठी (Marathi)</option>
                            <option value="gu">ગુજરાતી (Gujarati)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-foreground">
                            {t('patient.primarySymptom')} <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            name="primarySymptom"
                            value={formData.primarySymptom}
                            onChange={handleInputChange}
                            placeholder="e.g. Severe chest pain, persistent dry cough"
                            className="w-full text-xs p-2 h-9 border border-border bg-card rounded-[5px] text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-foreground">
                            {t('patient.symptomDescription')} <span className="text-destructive">*</span>
                          </label>
                          <textarea
                            name="symptomDescription"
                            rows={3}
                            value={formData.symptomDescription}
                            onChange={handleInputChange}
                            placeholder="Describe sensations, radiation, and circumstances..."
                            className="w-full text-xs p-2 border border-border bg-card rounded-[5px] text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        </div>

                        {/* Audio Waveform Recorder Option */}
                        <AudioWaveformRecorder onRecordingComplete={(f) => setAttachedVoiceFile(f)} />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: TIMELINE & OBSERVATIONS */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-foreground">{t('patient.step3Title')}</h2>
                        <p className="text-xs text-muted-foreground">{t('patient.step3Subtitle')}</p>
                      </div>

                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                              {t('patient.onset')} <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              name="onset"
                              value={formData.onset}
                              onChange={handleInputChange}
                              placeholder="e.g. 2 hours ago, yesterday night"
                              className="w-full text-xs p-2 h-9 border border-border bg-card rounded-[5px] text-foreground focus:ring-1 focus:ring-accent focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                              {t('patient.duration')}
                            </label>
                            <input
                              type="text"
                              name="duration"
                              value={formData.duration}
                              onChange={handleInputChange}
                              placeholder="e.g. Continuous, intermittent"
                              className="w-full text-xs p-2 h-9 border border-border bg-card rounded-[5px] text-foreground focus:ring-1 focus:ring-accent focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-foreground">{t('patient.severity')}</span>
                            <span className="font-mono text-primary font-bold tabular-nums">
                              {formData.severity} / 10
                            </span>
                          </div>
                          <input
                            type="range"
                            name="severity"
                            min="1"
                            max="10"
                            value={formData.severity}
                            onChange={handleInputChange}
                            className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                              {t('patient.bodyLocation')}
                            </label>
                            <input
                              type="text"
                              name="bodyLocation"
                              value={formData.bodyLocation}
                              onChange={handleInputChange}
                              placeholder="e.g. Left chest, epigastric"
                              className="w-full text-xs p-2 h-9 border border-border bg-card rounded-[5px] text-foreground focus:ring-1 focus:ring-accent focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                              {t('patient.course')}
                            </label>
                            <select
                              name="course"
                              value={formData.course}
                              onChange={handleInputChange}
                              className="w-full text-xs p-2 h-9 border border-border bg-card rounded-[5px] text-foreground focus:ring-1 focus:ring-accent focus:outline-none"
                            >
                              <option value="UNCHANGED">{t('patient.unchanged')}</option>
                              <option value="WORSENING">{t('patient.worsening')}</option>
                              <option value="IMPROVING">{t('patient.improving')}</option>
                            </select>
                          </div>
                        </div>

                        {/* OCR Document Dropzone */}
                        <DocumentDropzone onFileSelect={(f) => setAttachedFile(f)} />
                      </div>
                    </div>
                  )}

                  {/* STEP 4: REVIEW & SUBMIT */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-foreground">{t('patient.step4Title')}</h2>
                        <p className="text-xs text-muted-foreground">{t('patient.step4Subtitle')}</p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-[6px] border border-border space-y-3 text-xs">
                        <div className="border-b border-border/60 pb-2 flex justify-between">
                          <span className="text-muted-foreground">{t('patient.consentStatus')}:</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('patient.consentGranted')}
                          </span>
                        </div>

                        <div className="border-b border-border/60 pb-2 space-y-1">
                          <span className="text-muted-foreground">{t('patient.primarySymptom')}:</span>
                          <p className="text-foreground font-semibold">{formData.primarySymptom}</p>
                        </div>

                        <div className="border-b border-border/60 pb-2 space-y-1">
                          <span className="text-muted-foreground">{t('patient.symptomDescription')}:</span>
                          <p className="text-foreground/90 leading-relaxed">{formData.symptomDescription}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-foreground/90">
                          <div>
                            <span className="text-muted-foreground">{t('patient.onset')}:</span> {formData.onset}
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('patient.severity')}:</span>{' '}
                            <span className="font-mono tabular-nums">{formData.severity} / 10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Step Navigation Buttons */}
              <CardFooter className="bg-muted/30 px-5 py-3 border-t border-border flex justify-between">
                {step > 1 ? (
                  <Button variant="outline" size="sm" onClick={prevStep} disabled={isSubmitting} className="h-8 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> {t('common.previous')}
                  </Button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    disabled={step === 1 && !formData.consent}
                    className="h-8 text-xs gap-1"
                  >
                    <span>{t('common.next')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmitIntake}
                    disabled={isSubmitting}
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('patient.submitting')}</span>
                      </>
                    ) : (
                      <span>{t('patient.submitIntake')}</span>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
