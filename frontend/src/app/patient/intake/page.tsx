'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ShieldCheck, HeartPulse, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

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
      setSubmitError('Explicit patient consent is required to proceed.');
      return;
    }
    if (step === 2 && (!formData.primarySymptom.trim() || !formData.symptomDescription.trim())) {
      setSubmitError('Please enter both your primary symptom and a description.');
      return;
    }
    if (step === 3 && !formData.onset.trim()) {
      setSubmitError('Please specify when your symptoms started.');
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Healthcare Triage Assistant — Patient Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Patient Self-Intake Portal
          </h1>
          <p className="text-sm text-slate-600">
            Provide your symptom information to organize your case for qualified healthcare reviewer inspection.
          </p>
        </div>

        {/* Persistent Non-Diagnostic Safety Language Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Safety & System Boundary Disclaimer:</p>
            <p className="leading-relaxed">
              This system assists healthcare staff by organizing patient communications. It does not diagnose conditions or prescribe medication. If you are experiencing a severe emergency (such as severe chest pain or acute breathing difficulty), seek immediate medical assistance.
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
              <CardTitle className="text-xl text-slate-900">Intake Submitted Successfully</CardTitle>
              <CardDescription>Your information has been recorded for healthcare staff review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Case Reference Number:</span>
                  <span className="font-mono font-bold text-slate-900">{submittedCase.caseNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Workflow Status:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {submittedCase.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Queue Category:</span>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700">
                    {submittedCase.priority} (Awaiting Staff Review)
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Submission Time:</span>
                  <span className="text-slate-700">{new Date(submittedCase.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Please note your Case Number. A qualified healthcare reviewer will inspect your intake note.
              </p>
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
                Start New Intake
              </Button>
            </CardFooter>
          </Card>
        ) : (
          /* Multi-Step Intake Form */
          <Card className="shadow-md bg-white border border-slate-200">
            {/* Step Stepper Header */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-600">
              <span className={step === 1 ? 'text-blue-600 font-bold' : ''}>1. Consent</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step === 2 ? 'text-blue-600 font-bold' : ''}>2. Primary Symptom</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step === 3 ? 'text-blue-600 font-bold' : ''}>3. Details</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step === 4 ? 'text-blue-600 font-bold' : ''}>4. Review</span>
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
                      <span>Step 1: Patient Consent & Operational Notice</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Before submitting your healthcare information, please review and confirm consent.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
                    <p>
                      <strong>1. Purpose of Intake:</strong> The information you enter will be organized into a structured triage note for review by qualified doctors and healthcare workers at authorized facilities.
                    </p>
                    <p>
                      <strong>2. Non-Diagnostic System:</strong> This system assists with information workflow organization. It does not provide medical diagnoses or prescribe treatment.
                    </p>
                    <p>
                      <strong>3. Human Verification:</strong> A qualified human reviewer is responsible for inspecting your submitted case and taking appropriate healthcare actions.
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={handleConsentChange}
                        className="mt-1 h-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-800 font-medium leading-normal">
                        I have read the operational notice and affirmatively consent to submit my symptom information for healthcare triage review.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: PRIMARY SYMPTOM & LANGUAGE */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900">Step 2: Language & Reason for Visit</h2>
                    <p className="text-xs text-slate-500">Specify your preferred language and main symptom.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Preferred Language</label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="other">Other Regional Language</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Primary Symptom / Main Reason for Visit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="primarySymptom"
                        placeholder="e.g. Chest tightness, High fever, Severe knee pain"
                        value={formData.primarySymptom}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Detailed Symptom Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="symptomDescription"
                        rows={4}
                        placeholder="Describe how you feel, what worsens the symptom, and any relevant background..."
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
                    <h2 className="text-lg font-bold text-slate-900">Step 3: Symptom Details & Timeline</h2>
                    <p className="text-xs text-slate-500">Provide timeline details and patient-reported severity.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        When did symptoms start? (Onset) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="onset"
                        placeholder="e.g. 2 days ago, Yesterday morning"
                        value={formData.onset}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Duration (Optional)</label>
                      <input
                        type="text"
                        name="duration"
                        placeholder="e.g. Constant for 4 hours, Intermittent"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">
                        How severe does this feel to you? (1 to 10 scale)
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
                      <span>1 (Very Mild)</span>
                      <span>5 (Moderate)</span>
                      <span>10 (Severe Pain/Discomfort)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Body Location / Site</label>
                      <input
                        type="text"
                        name="bodyLocation"
                        placeholder="e.g. Lower back, Right forearm, Chest"
                        value={formData.bodyLocation}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Symptom Progress Course</label>
                      <select
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="UNCHANGED">Unchanged</option>
                        <option value="WORSENING">Worsening</option>
                        <option value="IMPROVING">Improving</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900">Step 4: Review & Submit Intake</h2>
                    <p className="text-xs text-slate-500">Inspect your entered information before submitting.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500 font-medium">Consent Status:</span>
                      <span className="text-green-700 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Affirmative Granted ({formData.consentVersion})</span>
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500 font-medium">Preferred Language:</span>
                      <span className="text-slate-800 uppercase font-mono">{formData.language}</span>
                    </div>
                    <div className="border-b pb-2 space-y-1">
                      <span className="text-slate-500 font-medium">Primary Symptom:</span>
                      <p className="text-slate-900 font-semibold">{formData.primarySymptom}</p>
                    </div>
                    <div className="border-b pb-2 space-y-1">
                      <span className="text-slate-500 font-medium">Detailed Description:</span>
                      <p className="text-slate-800 leading-relaxed">{formData.symptomDescription}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                      <div>
                        <span className="text-slate-500">Onset:</span> {formData.onset}
                      </div>
                      <div>
                        <span className="text-slate-500">Patient Severity:</span> {formData.severity} / 10
                      </div>
                      {formData.bodyLocation && (
                        <div>
                          <span className="text-slate-500">Location:</span> {formData.bodyLocation}
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Course:</span> {formData.course}
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
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button size="sm" onClick={nextStep} disabled={step === 1 && !formData.consent}>
                  Next Step <ChevronRight className="w-4 h-4 ml-1" />
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Intake'
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
