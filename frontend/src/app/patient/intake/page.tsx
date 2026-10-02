'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ShieldCheck, HeartPulse, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { useLanguage } from '@/i18n/LanguageContext';

interface IntakeFormData {
  consent: boolean;
  consentVersion: string;
  language: string;
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
  const [submittedCase, setSubmittedCase] = useState<{
    caseId: string;
    caseNumber: string;
    status: string;
    priority: string;
    createdAt: string;
  } | null>(null);

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, consent: e.target.checked }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setSubmitError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitIntake = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Fetch token from localStorage or token state if available in Phase 3
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

      setSubmittedCase({
        caseId: result.data.caseId,
        caseNumber: result.data.caseNumber,
        status: result.data.status,
        priority: result.data.priority,
        createdAt: result.data.createdAt,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during submission.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <DemoBanner />
      <div className="py-10 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>{t('patient.portalTitle')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('patient.intakeTitle')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('patient.intakeSubtitle')}
          </p>
        </div>

        {/* Persistent Non-Diagnostic Safety Language Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{t('patient.safetyNoticeTitle')}</p>
            <p className="leading-relaxed">
              {t('patient.safetyNoticeDesc')}
            </p>
          </div>
        </div>

        {/* Confirmation State */}
        {submittedCase ? (
          <Card className="border-green-200 bg-white shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl text-slate-900">{t('patient.successTitle')}</CardTitle>
              <CardDescription>{t('patient.successSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('patient.caseRefNumber')}</span>
                  <span className="font-mono font-bold text-slate-900">{submittedCase.caseNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('patient.workflowStatus')}</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {submittedCase.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('patient.queueCategory')}</span>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700">
                    {submittedCase.priority} ({t('patient.awaitingReview')})
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('patient.submissionTime')}</span>
                  <span className="text-slate-700">{new Date(submittedCase.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                {t('patient.noticeCaseNumber')}
              </p>

              {/* Optional Report Attachment Section */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-2">
                <span className="font-semibold text-blue-950 block">{t('patient.attachDoc')}</span>
                <p className="text-[11px] text-blue-800">
                  {t('patient.attachDocDesc')}
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !submittedCase) return;
                    try {
                      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('caseId', submittedCase.caseId);

                      const res = await fetch(`${apiBaseUrl}/cases/${submittedCase.caseId}/reports`, {
                        method: 'POST',
                        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: formData,
                      });
                      if (res.ok) {
                        alert('Report attached successfully!');
                      } else {
                        alert('Report upload failed.');
                      }
                    } catch {
                      alert('Report upload failed.');
                    }
                  }}
                  className="text-xs text-slate-700 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              {/* Optional Voice Recording Attachment */}
              <div className="bg-sky-50 border border-sky-200 rounded-md p-3 space-y-2 text-left">
                <span className="text-xs font-semibold text-sky-900 block">
                  {t('patient.attachVoice')}
                </span>
                <p className="text-[11px] text-sky-800">
                  {t('patient.attachVoiceDesc')}
                </p>
                <input
                  type="file"
                  accept="audio/*,.wav,.mp3,.ogg,.webm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !submittedCase) return;
                    try {
                      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
                      const formData = new FormData();
                      formData.append('file', file);

                      const res = await fetch(`${apiBaseUrl}/cases/${submittedCase.caseId}/voice-inputs`, {
                        method: 'POST',
                        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: formData,
                      });
                      if (res.ok) {
                        alert('Voice recording attached and transcribed successfully!');
                      } else {
                        const errData = await res.json().catch(() => ({}));
                        alert(errData.error || 'Voice recording upload failed.');
                      }
                    } catch {
                      alert('Voice recording upload failed.');
                    }
                  }}
                  className="text-xs text-slate-700 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
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
          <Card className="shadow-md bg-white border border-slate-200">
            {/* Step Stepper Header */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-600">
              <span className={step === 1 ? 'text-blue-600 font-bold' : ''}>{t('patient.step1')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step === 2 ? 'text-blue-600 font-bold' : ''}>{t('patient.step2')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step === 3 ? 'text-blue-600 font-bold' : ''}>{t('patient.step3')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step === 4 ? 'text-blue-600 font-bold' : ''}>{t('patient.step4')}</span>
            </div>

            <CardContent className="p-6 space-y-6">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* STEP 1: CONSENT */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <span>{t('patient.step1Title')}</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t('patient.step1Subtitle')}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
                    <p>{t('patient.consentPoint1')}</p>
                    <p>{t('patient.consentPoint2')}</p>
                    <p>{t('patient.consentPoint3')}</p>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={handleConsentChange}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-800 font-medium leading-normal">
                        {t('patient.consentCheckbox')}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: PRIMARY SYMPTOM & LANGUAGE */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900">{t('patient.step2Title')}</h2>
                    <p className="text-xs text-slate-500">{t('patient.step2Subtitle')}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">{t('patient.preferredLanguage')}</label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="or">Odia (ଓଡ଼ିଆ)</option>
                        <option value="bn">Bengali (বাংলা)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="mr">Marathi (मराठी)</option>
                        <option value="kn">Kannada (ಕನ್ನಡ)</option>
                        <option value="ml">Malayalam (മലയാളം)</option>
                        <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                        <option value="gu">Gujarati (ગુજરાતી)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        {t('patient.primarySymptom')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="primarySymptom"
                        placeholder={t('patient.primarySymptomPlaceholder')}
                        value={formData.primarySymptom}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        {t('patient.symptomDescription')} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="symptomDescription"
                        rows={4}
                        placeholder={t('patient.symptomDescriptionPlaceholder')}
                        value={formData.symptomDescription}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SYMPTOM DETAILS */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900">{t('patient.step3Title')}</h2>
                    <p className="text-xs text-slate-500">{t('patient.step3Subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        {t('patient.onset')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="onset"
                        placeholder={t('patient.onsetPlaceholder')}
                        value={formData.onset}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">{t('patient.duration')}</label>
                      <input
                        type="text"
                        name="duration"
                        placeholder={t('patient.durationPlaceholder')}
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">
                        {t('patient.severity')}
                      </label>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {formData.severity} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      name="severity"
                      min={1}
                      max={10}
                      value={formData.severity}
                      onChange={handleInputChange}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1 (Mild)</span>
                      <span>5 (Moderate)</span>
                      <span>10 (Severe)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">{t('patient.bodyLocation')}</label>
                      <input
                        type="text"
                        name="bodyLocation"
                        placeholder={t('patient.bodyLocationPlaceholder')}
                        value={formData.bodyLocation}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">{t('patient.course')}</label>
                      <select
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="UNCHANGED">{t('patient.unchanged')}</option>
                        <option value="WORSENING">{t('patient.worsening')}</option>
                        <option value="IMPROVING">{t('patient.improving')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900">{t('patient.step4Title')}</h2>
                    <p className="text-xs text-slate-500">{t('patient.step4Subtitle')}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500 font-medium">{t('patient.consentStatus')}:</span>
                      <span className="text-green-700 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('patient.consentGranted')} ({formData.consentVersion})</span>
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500 font-medium">{t('patient.preferredLanguage')}:</span>
                      <span className="text-slate-800 uppercase font-mono">{formData.language}</span>
                    </div>
                    <div className="border-b pb-2 space-y-1">
                      <span className="text-slate-500 font-medium">{t('patient.primarySymptom')}:</span>
                      <p className="text-slate-900 font-semibold">{formData.primarySymptom}</p>
                    </div>
                    <div className="border-b pb-2 space-y-1">
                      <span className="text-slate-500 font-medium">{t('patient.symptomDescription')}:</span>
                      <p className="text-slate-800 leading-relaxed">{formData.symptomDescription}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                      <div>
                        <span className="text-slate-500">{t('patient.onset')}:</span> {formData.onset}
                      </div>
                      <div>
                        <span className="text-slate-500">{t('patient.severity')}:</span> {formData.severity} / 10
                      </div>
                      {formData.bodyLocation && (
                        <div>
                          <span className="text-slate-500">{t('patient.bodyLocation')}:</span> {formData.bodyLocation}
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">{t('patient.course')}:</span> {formData.course}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Step Navigation Buttons */}
            <CardFooter className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between">
              {step > 1 ? (
                <Button variant="outline" size="sm" onClick={prevStep} disabled={isSubmitting}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> {t('common.previous')}
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button size="sm" onClick={nextStep} disabled={step === 1 && !formData.consent}>
                  {t('common.next')} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSubmitIntake}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('patient.submitting')}
                    </>
                  ) : (
                    t('patient.submitIntake')
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

