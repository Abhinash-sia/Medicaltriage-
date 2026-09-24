'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  HeartPulse,
  ChevronLeft,
  Loader2,
  User,
  Calendar,
  Clock,
  MessageSquare,
  FileCheck,
  UserCheck,
  UserX,
  UserPlus,
  Mic,
  Volume2,
  Languages,
  Globe,
} from 'lucide-react';

interface ReviewerCaseSymptom {
  id: string;
  name: string;
  description?: string;
  onset?: string;
  duration?: string;
  severity?: number;
  bodyLocation?: string;
  source: string;
}

interface ReviewerCaseConsent {
  status: string;
  version?: string;
  capturedAt?: string;
}

interface ReviewerCaseReviewItem {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  reviewStatus: string;
  reviewerNotes: string;
  reviewedAt: string;
}

interface ReviewerCaseDetails {
  id: string;
  caseNumber: string;
  status: string;
  priority: string;
  chiefComplaint: string;
  intakeSource: string;
  language: string;
  assignedReviewerId?: string | null;
  assignedReviewerName?: string;
  isAssigned: boolean;
  sla?: {
    dueAt: string | null;
    status: string;
    escalatedAt: string | null;
    escalationLevel: number;
  };
  createdAt: string;
  patient: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  consent: ReviewerCaseConsent | null;
  symptoms: ReviewerCaseSymptom[];
  reviews: ReviewerCaseReviewItem[];
}

export default function ReviewerCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;

  const [caseDetails, setCaseDetails] = useState<ReviewerCaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Form State
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<string>('COMPLETED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // AI Extraction State
  const [aiExtractionData, setAiExtractionData] = useState<any | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [aiExtractionError, setAiExtractionError] = useState<string | null>(null);

  // Timeline State
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isFetchingTimeline, setIsFetchingTimeline] = useState<boolean>(false);

  // Missing Information & Follow-Up Questions State
  const [missingInfoItems, setMissingInfoItems] = useState<any[]>([]);
  const [followUpQuestionItems, setFollowUpQuestionItems] = useState<any[]>([]);
  const [isFetchingMissingInfo, setIsFetchingMissingInfo] = useState<boolean>(false);

  // Reports & OCR State
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [isFetchingReports, setIsFetchingReports] = useState<boolean>(false);
  const [isUploadingReport, setIsUploadingReport] = useState<boolean>(false);
  const [reportUploadError, setReportUploadError] = useState<string | null>(null);
  const [reportUploadSuccess, setReportUploadSuccess] = useState<string | null>(null);

  // Visual Inputs State
  const [visualInputsList, setVisualInputsList] = useState<any[]>([]);
  const [isFetchingVisualInputs, setIsFetchingVisualInputs] = useState<boolean>(false);
  const [isUploadingVisualInput, setIsUploadingVisualInput] = useState<boolean>(false);
  const [visualInputUploadError, setVisualInputUploadError] = useState<string | null>(null);
  const [visualInputUploadSuccess, setVisualInputUploadSuccess] = useState<string | null>(null);

  // Voice Inputs & Transcripts State
  const [voiceInputsList, setVoiceInputsList] = useState<any[]>([]);
  const [isFetchingVoiceInputs, setIsFetchingVoiceInputs] = useState<boolean>(false);
  const [isUploadingVoiceInput, setIsUploadingVoiceInput] = useState<boolean>(false);
  const [voiceInputUploadError, setVoiceInputUploadError] = useState<string | null>(null);
  const [voiceInputUploadSuccess, setVoiceInputUploadSuccess] = useState<string | null>(null);

  // Multilingual & Translation State
  const [translationsList, setTranslationsList] = useState<any[]>([]);
  const [isFetchingTranslations, setIsFetchingTranslations] = useState<boolean>(false);
  const [translationTargetLang, setTranslationTargetLang] = useState<string>('en');
  const [isTranslatingId, setIsTranslatingId] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Safety & Urgency Engine State
  const [safetyData, setSafetyData] = useState<any | null>(null);
  const [isFetchingSafety, setIsFetchingSafety] = useState<boolean>(false);
  const [isEvaluatingSafety, setIsEvaluatingSafety] = useState<boolean>(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);

  // Structured Triage Note State (Phase 16)
  const [triageNoteData, setTriageNoteData] = useState<any | null>(null);
  const [isFetchingTriageNote, setIsFetchingTriageNote] = useState<boolean>(false);
  const [isGeneratingTriageNote, setIsGeneratingTriageNote] = useState<boolean>(false);
  const [isVerifyingTriageNote, setIsVerifyingTriageNote] = useState<boolean>(false);
  const [triageNoteError, setTriageNoteError] = useState<string | null>(null);
  const [triageVerifySuccess, setTriageVerifySuccess] = useState<string | null>(null);
  const [verifierNotesInput, setVerifierNotesInput] = useState<string>('');

  // Phase 17 Human Review & Escalation State
  const [escalationTargetUserIdInput, setEscalationTargetUserIdInput] = useState<string>('');
  const [overridePriorityInput, setOverridePriorityInput] = useState<string>('URGENT');
  const [overrideReasonInput, setOverrideReasonInput] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState<boolean>(false);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Assignment Action State
  const [targetReviewerIdInput, setTargetReviewerIdInput] = useState<string>('');
  const [assignmentLoading, setAssignmentLoading] = useState<boolean>(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload) {
            setCurrentUserId(payload.id || null);
            setCurrentUserRole(payload.role || null);
          }
        } catch {
          // Token decode fallback
        }
      }
    }
  }, []);

  const fetchCaseDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch case details.');
      }

      setCaseDetails(result.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while loading case details.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  const fetchTimeline = useCallback(async () => {
    setIsFetchingTimeline(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/timeline`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (response.ok && result.success && result.data?.timelineEvents) {
        setTimelineEvents(result.data.timelineEvents);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingTimeline(false);
    }
  }, [caseId]);

  const fetchMissingInformation = useCallback(async () => {
    setIsFetchingMissingInfo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/missing-information`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (response.ok && result.success && result.data) {
        if (result.data.missingInformationItems) {
          setMissingInfoItems(result.data.missingInformationItems);
        }
        if (result.data.followUpQuestionItems) {
          setFollowUpQuestionItems(result.data.followUpQuestionItems);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingMissingInfo(false);
    }
  }, [caseId]);

  const fetchReports = useCallback(async () => {
    setIsFetchingReports(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/reports`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (response.ok && result.data?.reports) {
        setReportsList(result.data.reports);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingReports(false);
    }
  }, [caseId]);

  const fetchSafetyData = useCallback(async () => {
    setIsFetchingSafety(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/safety`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSafetyData(result.data.activeEvaluation || null);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingSafety(false);
    }
  }, [caseId]);

  const handleTriggerSafetyEvaluate = async () => {
    setIsEvaluatingSafety(true);
    setSafetyError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/safety/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Safety evaluation trigger failed.');
      }

      setSafetyData(result.data);
      fetchCaseDetails();
    } catch (err: any) {
      setSafetyError(err.message || 'Safety evaluation failed.');
    } finally {
      setIsEvaluatingSafety(false);
    }
  };

  const fetchTriageNote = useCallback(async () => {
    setIsFetchingTriageNote(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/triage-note`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTriageNoteData(result.data);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingTriageNote(false);
    }
  }, [caseId]);

  const handleGenerateTriageNote = async () => {
    setIsGeneratingTriageNote(true);
    setTriageNoteError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/triage-note/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Triage note generation failed.');
      }

      setTriageNoteData(result.data);
    } catch (err: any) {
      setTriageNoteError(err.message || 'Triage note generation failed.');
    } finally {
      setIsGeneratingTriageNote(false);
    }
  };

  const handleVerifyTriageNote = async () => {
    setIsVerifyingTriageNote(true);
    setTriageNoteError(null);
    setTriageVerifySuccess(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/triage-note/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reviewerNotes: verifierNotesInput }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Triage note verification failed.');
      }

      setTriageNoteData(result.data);
      setTriageVerifySuccess('Structured triage note verified for operational triage review.');
    } catch (err: any) {
      setTriageNoteError(err.message || 'Triage note verification failed.');
    } finally {
      setIsVerifyingTriageNote(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    fetchTimeline();
    fetchMissingInformation();
    fetchReports();
    fetchSafetyData();
    fetchTriageNote();
  }, [fetchCaseDetails, fetchTimeline, fetchMissingInformation, fetchReports, fetchSafetyData, fetchTriageNote]);

  const handleVerifyReport = async (reportId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reports/${reportId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (response.ok) {
        fetchReports();
      }
    } catch {
      // Fallback
    }
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReport(true);
    setReportUploadError(null);
    setReportUploadSuccess(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/reports`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Report upload failed.');
      }

      setReportUploadSuccess('Report uploaded and processed successfully.');
      fetchReports();
    } catch (err: any) {
      setReportUploadError(err.message || 'Report upload failed.');
    } finally {
      setIsUploadingReport(false);
    }
  };

  const fetchVisualInputs = useCallback(async () => {
    setIsFetchingVisualInputs(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/visual-inputs`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (response.ok && result.data?.visualInputs) {
        setVisualInputsList(result.data.visualInputs);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingVisualInputs(false);
    }
  }, [caseId]);

  const fetchVoiceInputs = useCallback(async () => {
    setIsFetchingVoiceInputs(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/voice-inputs`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (response.ok && result.data) {
        setVoiceInputsList(result.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingVoiceInputs(false);
    }
  }, [caseId]);

  const fetchTranslations = useCallback(async () => {
    setIsFetchingTranslations(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/translations`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (response.ok && result.data) {
        setTranslationsList(result.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsFetchingTranslations(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCaseDetails();
    fetchTimeline();
    fetchMissingInformation();
    fetchReports();
    fetchVisualInputs();
    fetchVoiceInputs();
    fetchTranslations();
  }, [fetchCaseDetails, fetchTimeline, fetchMissingInformation, fetchReports, fetchVisualInputs, fetchVoiceInputs, fetchTranslations]);

  const handleRequestTranslation = async (sourceType: string, sourceId?: string) => {
    const actionId = sourceId || sourceType;
    setIsTranslatingId(actionId);
    setTranslationError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/translations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sourceType,
          sourceId,
          targetLanguage: translationTargetLang,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Translation request failed');
      }

      fetchTranslations();
    } catch (err: any) {
      setTranslationError(err?.message || 'Translation failed');
    } finally {
      setIsTranslatingId(null);
    }
  };

  const handleVerifyTranslation = async (translationId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/translations/${translationId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        fetchTranslations();
      }
    } catch {
      // Fallback
    }
  };

  const handleVerifyVisualInput = async (visualInputId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/visual-inputs/${visualInputId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        fetchVisualInputs();
      }
    } catch {
      // Fallback
    }
  };

  const handleVisualInputUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVisualInput(true);
    setVisualInputUploadError(null);
    setVisualInputUploadSuccess(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/visual-inputs`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Visual input upload failed.');
      }

      setVisualInputUploadSuccess('Image uploaded and analyzed successfully.');
      fetchVisualInputs();
    } catch (err: any) {
      setVisualInputUploadError(err.message || 'Visual input upload failed.');
    } finally {
      setIsUploadingVisualInput(false);
    }
  };

  const handleVerifyVoiceInput = async (voiceInputId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/voice-inputs/${voiceInputId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        fetchVoiceInputs();
      }
    } catch {
      // Fallback
    }
  };

  const handleVoiceInputUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVoiceInput(true);
    setVoiceInputUploadError(null);
    setVoiceInputUploadSuccess(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiBaseUrl}/cases/${caseId}/voice-inputs`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Voice recording upload failed.');
      }

      setVoiceInputUploadSuccess('Voice recording uploaded and transcribed successfully.');
      fetchVoiceInputs();
    } catch (err: any) {
      setVoiceInputUploadError(err.message || 'Voice recording upload failed.');
    } finally {
      setIsUploadingVoiceInput(false);
    }
  };

  const handleClaim = async () => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();

      if (response.status === 409) {
        throw new Error('This case was already claimed by another reviewer.');
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to claim case.');
      }

      fetchCaseDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim action failed.';
      setAssignmentError(msg);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleRelease = async () => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to release case.');
      }

      fetchCaseDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Release action failed.';
      setAssignmentError(msg);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleAdminAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReviewerIdInput.trim()) {
      setAssignmentError('Target reviewer ID is required.');
      return;
    }

    setAssignmentLoading(true);
    setAssignmentError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reviewerId: targetReviewerIdInput.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to assign case.');
      }

      setTargetReviewerIdInput('');
      fetchCaseDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Administrative assignment failed.';
      setAssignmentError(msg);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleExtractInformation = async (forceReextract = false) => {
    setIsExtracting(true);
    setAiExtractionError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/extraction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ forceReextract }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'AI Information Extraction failed.');
      }

      setAiExtractionData(result.data);
      if (result.data?.timelineEvents) {
        setTimelineEvents(result.data.timelineEvents);
      }
      if (result.data?.missingInformationItems) {
        setMissingInfoItems(result.data.missingInformationItems);
      }
      if (result.data?.followUpQuestionItems) {
        setFollowUpQuestionItems(result.data.followUpQuestionItems);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Extraction request failed.';
      setAiExtractionError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerNotes.trim()) {
      setSubmitError('Reviewer notes cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reviewerNotes: reviewerNotes.trim(),
          reviewStatus,
          targetUserId: reviewStatus === 'ESCALATED' && escalationTargetUserIdInput ? escalationTargetUserIdInput.trim() : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to submit human review record.');
      }

      setSubmitSuccess('Human review record submitted successfully.');
      setReviewerNotes('');
      setEscalationTargetUserIdInput('');
      fetchCaseDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriorityOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReasonInput.trim()) {
      setOverrideError('Priority override reason cannot be empty.');
      return;
    }

    setIsSubmittingOverride(true);
    setOverrideError(null);
    setOverrideSuccess(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/cases/${caseId}/priority-override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          overridePriority: overridePriorityInput,
          reason: overrideReasonInput.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to apply priority override.');
      }

      setOverrideSuccess(`Priority successfully overridden to ${result.data.priority}.`);
      setOverrideReasonInput('');
      fetchCaseDetails();
      fetchSafetyData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to override priority.';
      setOverrideError(msg);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-slate-600 font-medium">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseDetails) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Link href="/reviewer">
            <Button variant="outline" size="sm" className="text-xs">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Queue
            </Button>
          </Link>
          <Card className="bg-white border-red-200">
            <CardHeader className="text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <CardTitle className="text-base text-slate-900">Case Not Found or Access Error</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {error || 'Unable to retrieve case details.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const isAssignedToMe = currentUserId && caseDetails.assignedReviewerId === currentUserId;
  const isAdmin = currentUserRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Case Reference */}
        <div className="flex items-center justify-between">
          <Link href="/reviewer">
            <Button variant="outline" size="sm" className="text-xs bg-white text-slate-700 border-slate-300">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Reviewer Queue
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 font-mono text-xs">
              {caseDetails.caseNumber}
            </Badge>
            <Badge
              variant="outline"
              className={
                caseDetails.status === 'OPEN'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }
            >
              {caseDetails.status}
            </Badge>
          </div>
        </div>

        {/* Persistent Safety Disclaimer */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Healthcare Staff Review Disclaimer:</p>
            <p className="leading-relaxed">
              Information in this record consists of patient-reported observations gathered during self-intake. Initial queue categories (ROUTINE) represent unassessed intake states. Reviewer notes entered below are human notes recorded by authorized staff.
            </p>
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Column (2/3 width) */}
          <div className="md:col-span-2 space-y-6">
            {/* Safety & Urgency Engine Card */}
            <Card className="bg-white border-emerald-200 shadow-sm">
              <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Safety & Urgency Engine (Phase 15)</span>
                    {safetyData && (
                      <Badge
                        variant="outline"
                        className={
                          safetyData.effectivePriority === 'URGENT'
                            ? 'bg-red-50 text-red-700 border-red-200 font-bold ml-2'
                            : safetyData.effectivePriority === 'PRIORITY'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold ml-2'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold ml-2'
                        }
                      >
                        Priority: {safetyData.effectivePriority}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Deterministic review priority evaluation based on structured case evidence.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTriggerSafetyEvaluate}
                  disabled={isEvaluatingSafety}
                  className="text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  {isEvaluatingSafety ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  )}
                  Re-evaluate Safety
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {safetyError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                    {safetyError}
                  </div>
                )}

                {isFetchingSafety && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Loading safety evaluation state...</span>
                  </div>
                )}

                {safetyData?.hasHumanOverride && (
                  <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-md text-xs text-purple-900 flex items-center justify-between">
                    <span className="font-semibold flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      <span>Human Priority Override Active</span>
                    </span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">
                      Locked to {safetyData.effectivePriority}
                    </Badge>
                  </div>
                )}

                {safetyData ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-1.5">
                      <span>Evaluated Version: #{safetyData.evaluationVersion}</span>
                      <span>Evaluated At: {new Date(safetyData.evaluatedAt).toLocaleString()}</span>
                    </div>

                    {safetyData.matchedSignals && safetyData.matchedSignals.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-slate-800 block">Matched Safety Signals ({safetyData.matchedSignals.length})</span>
                        <div className="space-y-2">
                          {safetyData.matchedSignals.map((sig: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{sig.ruleName}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    sig.category === 'CLINICAL_URGENT'
                                      ? 'bg-red-50 text-red-700 border-red-200 text-[10px]'
                                      : sig.category === 'SYSTEM_UNCERTAINTY'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]'
                                  }
                                >
                                  {sig.category}
                                </Badge>
                              </div>
                              <p className="text-slate-700 text-[11px] font-medium">{sig.evidenceSnippet}</p>
                              <p className="text-slate-500 text-[10px] italic">{sig.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-md text-xs text-emerald-800">
                        No higher-priority workflow review signals detected. Case review status is ROUTINE.
                      </div>
                    )}
                  </div>
                ) : !isFetchingSafety && (
                  <p className="text-xs text-slate-500 italic">
                    No safety evaluation recorded yet. Click &quot;Re-evaluate Safety&quot; above to run the Safety Engine.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Structured Triage Note Card (Phase 16) */}
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Structured Triage Note (Phase 16)</span>
                    {triageNoteData && (
                      <>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-bold ml-2">
                          v{triageNoteData.noteVersion}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            triageNoteData.provenance === 'HUMAN_VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold ml-1'
                              : 'bg-amber-50 text-amber-700 border-amber-300 font-bold ml-1'
                          }
                        >
                          {triageNoteData.provenance}
                        </Badge>
                      </>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Versioned compiled snapshot of eligible case evidence for clinical reviewer triage review
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateTriageNote}
                    disabled={isGeneratingTriageNote}
                    className="h-8 text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    {isGeneratingTriageNote ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Compiling...
                      </>
                    ) : (
                      'Re-compile Note'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {triageNoteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                    {triageNoteError}
                  </div>
                )}
                {triageVerifySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{triageVerifySuccess}</span>
                  </div>
                )}

                {isFetchingTriageNote ? (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Loading Structured Triage Note...</span>
                  </div>
                ) : triageNoteData ? (
                  <div className="space-y-4 text-xs">
                    {/* Reviewer Attention Banner */}
                    {triageNoteData.reviewerAttentionSection && (
                      <div
                        className={
                          triageNoteData.reviewerAttentionSection.safetyUrgent
                            ? 'p-3 bg-red-50 border border-red-200 rounded-lg'
                            : 'p-3 bg-slate-50 border border-slate-200 rounded-lg'
                        }
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                          <span className="flex items-center space-x-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                            <span>Reviewer Attention Summary</span>
                          </span>
                          <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            Action: {triageNoteData.reviewerAttentionSection.actionRequired}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-center text-[11px]">
                          <div className="p-1.5 bg-white rounded border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase">Critical Signals</span>
                            <span className="font-bold text-slate-900">{triageNoteData.reviewerAttentionSection.criticalCount}</span>
                          </div>
                          <div className="p-1.5 bg-white rounded border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase">Unverified Inputs</span>
                            <span className="font-bold text-slate-900">{triageNoteData.reviewerAttentionSection.unverifiedCount}</span>
                          </div>
                          <div className="p-1.5 bg-white rounded border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase">Uncertainties</span>
                            <span className="font-bold text-slate-900">{triageNoteData.reviewerAttentionSection.uncertaintiesCount}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Presenting Concern & Symptom Summary */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                        Presenting Concern & Summary
                      </div>
                      <p className="font-semibold text-slate-900 text-xs">{triageNoteData.presentingConcern}</p>
                      <p className="text-slate-700 text-xs">{triageNoteData.symptomSummary}</p>
                    </div>

                    {/* Structured Symptoms Section */}
                    {triageNoteData.symptomsSection && triageNoteData.symptomsSection.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="font-bold text-slate-900 text-[11px]">Compiled Structured Symptoms</div>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
                          {triageNoteData.symptomsSection.map((s: any, idx: number) => (
                            <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                              <div>
                                <span className="font-medium text-slate-900">{s.name}</span>
                                {s.severity && <span className="text-slate-500 ml-1.5 font-bold text-indigo-600">({s.severity})</span>}
                                {s.duration && <span className="text-slate-500 ml-1.5">[{s.duration}]</span>}
                                {s.bodySite && <span className="text-slate-500 ml-1.5">at {s.bodySite}</span>}
                              </div>
                              <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600">
                                {s.source}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verification Box / Action */}
                    <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
                      <div className="text-xs text-blue-900 space-y-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>Operational Information Verification</span>
                        </div>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          Verification confirms operational review of assembled triage data. It does NOT imply medical diagnosis, treatment recommendation, prescription, medical clearance, or referral.
                        </p>
                      </div>

                      {triageNoteData.provenance === 'HUMAN_VERIFIED' ? (
                        <div className="p-2.5 bg-white border border-emerald-300 rounded text-xs text-emerald-800 flex items-center justify-between font-medium">
                          <span className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Verified by Reviewer at {new Date(triageNoteData.reviewedAt).toLocaleString()}</span>
                          </span>
                          {triageNoteData.reviewerNotes && (
                            <span className="text-slate-500 italic text-[11px]">&quot;{triageNoteData.reviewerNotes}&quot;</span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            placeholder="Optional reviewer notes for verification audit log..."
                            value={verifierNotesInput}
                            onChange={(e) => setVerifierNotesInput(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                          <Button
                            size="sm"
                            onClick={handleVerifyTriageNote}
                            disabled={isVerifyingTriageNote}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                          >
                            {isVerifyingTriageNote ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Verifying...
                              </>
                            ) : (
                              'Verify Information (Operational Review)'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No active triage note compiled yet. Click &quot;Re-compile Note&quot; above to assemble the Structured Triage Note.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Patient Reported Symptoms Card */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <HeartPulse className="w-4 h-4 text-indigo-600" />
                  <span>Patient-Reported Observations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
                      Chief Complaint Narrative ({caseDetails.language ? caseDetails.language.toUpperCase() : 'UNKNOWN'})
                    </span>
                    <div className="flex items-center space-x-2">
                      <select
                        value={translationTargetLang}
                        onChange={(e) => setTranslationTargetLang(e.target.value)}
                        className="text-[11px] bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
                      >
                        <option value="en">Translate to English</option>
                        <option value="hi">Translate to Hindi (हिन्दी)</option>
                        <option value="or">Translate to Odia (ଓଡ଼ିଆ)</option>
                        <option value="bn">Translate to Bengali (বাংলা)</option>
                        <option value="ta">Translate to Tamil (தமிழ்)</option>
                        <option value="te">Translate to Telugu (తెలుగు)</option>
                        <option value="mr">Translate to Marathi (मराठी)</option>
                        <option value="kn">Translate to Kannada (କನ್ನಡ)</option>
                        <option value="ml">Translate to Malayalam (മലയാളം)</option>
                        <option value="pa">Translate to Punjabi (ਪੰਜਾਬੀ)</option>
                        <option value="gu">Translate to Gujarati (ગુજરાતી)</option>
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestTranslation('PATIENT_TEXT')}
                        disabled={isTranslatingId === 'PATIENT_TEXT'}
                        className="text-[11px] h-7 px-2 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      >
                        {isTranslatingId === 'PATIENT_TEXT' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Languages className="w-3.5 h-3.5 mr-1" />
                        )}
                        Translate Narrative
                      </Button>
                    </div>
                  </div>
                  <p className="text-slate-900 font-medium leading-relaxed">{caseDetails.chiefComplaint}</p>
                </div>

                {translationError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                    {translationError}
                  </div>
                )}

                {/* Patient Text Translation Cards */}
                {translationsList
                  .filter((t: any) => t.sourceType === 'PATIENT_TEXT')
                  .map((t: any) => (
                    <div key={t._id || t.id} className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                        <span className="font-bold text-indigo-950 flex items-center space-x-1.5">
                          <Globe className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Translation — {t.targetLanguage.toUpperCase()}</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                            Provenance: {t.provenance}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              t.verificationStatus === 'VERIFIED'
                                ? 'bg-green-50 text-green-700 border-green-200 text-[10px]'
                                : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                            }
                          >
                            {t.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFICATION REQUIRED'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-2 bg-white/80 rounded border border-indigo-100 space-y-1">
                          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Original ({t.sourceLanguage?.toUpperCase() || 'UNKNOWN'})</span>
                          <p className="text-slate-800 leading-relaxed font-medium">{t.originalText}</p>
                        </div>
                        <div className="p-2 bg-white rounded border border-indigo-200 space-y-1 shadow-sm">
                          <span className="text-[10px] font-semibold uppercase text-indigo-600 block">Translated ({t.targetLanguage.toUpperCase()})</span>
                          <p className="text-slate-900 leading-relaxed font-medium">{t.translatedText || t.processingError || 'No translation output.'}</p>
                        </div>
                      </div>
                      {t.verificationStatus !== 'VERIFIED' && (
                        <div className="pt-1 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyTranslation(t._id || t.id)}
                            className="text-[11px] h-6 px-2 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Verify Translation
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                {caseDetails.symptoms.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-700 block">Structured Symptoms Log</span>
                    {caseDetails.symptoms.map((s) => (
                      <div key={s.id} className="p-3 border border-slate-200 rounded-md text-xs space-y-2 bg-white">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{s.name}</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            Source: {s.source}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1">
                          {s.onset && <div><span className="text-slate-400">Onset:</span> {s.onset}</div>}
                          {s.severity && <div><span className="text-slate-400">Patient Severity:</span> {s.severity}/10</div>}
                          {s.bodyLocation && <div><span className="text-slate-400">Location:</span> {s.bodyLocation}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Information Extraction Card */}
            <Card className="bg-white border-purple-200 shadow-sm">
              <CardHeader className="bg-purple-50 border-b border-purple-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-purple-950 flex items-center space-x-2">
                    <HeartPulse className="w-4 h-4 text-purple-600" />
                    <span>AI Information Extraction</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] ml-2">
                      AI-assisted
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-purple-700">
                    Extract structured observations from narrative for human review.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExtractInformation(!!aiExtractionData)}
                  disabled={isExtracting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Extracting...
                    </>
                  ) : (
                    <>{aiExtractionData ? 'Re-extract Information' : 'Extract Information'}</>
                  )}
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {aiExtractionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{aiExtractionError}</span>
                  </div>
                )}

                {!aiExtractionData && !aiExtractionError && !isExtracting && (
                  <p className="text-xs text-slate-500 italic">
                    Click &quot;Extract Information&quot; to parse patient narrative into verified structured findings.
                  </p>
                )}

                {aiExtractionData && (
                  <div className="space-y-4 text-xs">
                    {/* Status & Model metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border rounded text-[11px]">
                      <div>
                        <span className="text-slate-500">Status: </span>
                        <span className="font-semibold text-green-700">{aiExtractionData.generationStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Model: </span>
                        <span className="font-mono text-purple-900">{aiExtractionData.model || 'Gemini 2.5 Flash'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Generated: </span>
                        <span className="text-slate-700">{new Date(aiExtractionData.generatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Extracted Symptoms */}
                    {aiExtractionData.symptoms && aiExtractionData.symptoms.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-semibold text-slate-800 block">Extracted Symptoms</span>
                        <div className="grid grid-cols-1 gap-2">
                          {aiExtractionData.symptoms.map((s: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-purple-50/50 border border-purple-100 rounded text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-purple-950">{s.name}</span>
                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-[9px]">
                                  Status: {s.status || 'PRESENT'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-600 pt-1">
                                {s.duration && <div><span className="text-slate-400">Duration:</span> {s.duration}</div>}
                                {s.onset && <div><span className="text-slate-400">Onset:</span> {s.onset}</div>}
                                {s.frequency && <div><span className="text-slate-400">Frequency:</span> {s.frequency}</div>}
                                {s.severity && <div><span className="text-slate-400">Severity:</span> {s.severity}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Negative Findings */}
                    {aiExtractionData.negativeFindings && aiExtractionData.negativeFindings.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-800 block">Explicitly Absent Findings</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1 text-[11px]">
                          {aiExtractionData.negativeFindings.map((item: string, idx: number) => (
                            <li key={idx}><span className="text-slate-800 font-medium">{item}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Uncertainties */}
                    {aiExtractionData.uncertainties && aiExtractionData.uncertainties.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-amber-900 block">Uncertainties & Ambiguities</span>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1 text-[11px]">
                          {aiExtractionData.uncertainties.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded">
                      <span className="font-semibold">Human Verification Notice:</span> AI extraction organizes patient narrative facts for human review. It does not diagnose or determine medical urgency.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Timeline Card */}
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50 border-b border-blue-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-blue-950 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>AI-Organized Patient Timeline</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] ml-2">
                      Chronological
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-700">
                    Chronological ordering of reported symptom events, timing, and encounters.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {isFetchingTimeline && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Loading patient timeline...</span>
                  </div>
                )}

                {timelineEvents.length === 0 && !isFetchingTimeline && (
                  <p className="text-xs text-slate-500 italic">
                    No timeline events available yet. Click &quot;Extract Information&quot; above to generate timeline.
                  </p>
                )}

                {timelineEvents.length > 0 && (
                  <div className="space-y-3">
                    <div className="relative border-l-2 border-blue-200 ml-3 pl-4 space-y-3">
                      {timelineEvents.map((evt: any, idx: number) => (
                        <div key={idx} className="relative group">
                          {/* Timeline Node Dot */}
                          <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />

                          <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs space-y-1 hover:border-blue-300 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 pb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-blue-950">
                                  {evt.relativeTime || evt.date || 'Time unclear'}
                                </span>
                                {evt.eventType && (
                                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[9px]">
                                    {evt.eventType}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5">
                                {evt.certainty && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      evt.certainty === 'CERTAIN'
                                        ? 'bg-green-50 text-green-700 border-green-200 text-[9px]'
                                        : evt.certainty === 'APPROXIMATE'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 text-[9px]'
                                        : 'bg-red-50 text-red-700 border-red-200 text-[9px]'
                                    }
                                  >
                                    {evt.certainty}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[9px]">
                                  [AI EXTRACTED]
                                </Badge>
                              </div>
                            </div>
                            <p className="text-slate-900 font-medium pt-0.5">{evt.description}</p>
                            {evt.sourceQuote && (
                              <p className="text-[10px] text-slate-500 italic">
                                &quot;{evt.sourceQuote}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 text-[11px] rounded flex items-center justify-between">
                      <span>
                        <span className="font-semibold">Timeline Safety Note:</span> Chronological ordering of reported observations for human verification.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Missing Information Card */}
            <Card className="bg-white border-amber-200 shadow-sm">
              <CardHeader className="bg-amber-50/70 border-b border-amber-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-amber-950 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Identified Information Gaps</span>
                    <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] ml-2">
                      Informational Completeness
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-800">
                    Important narrative details not specified in intake data.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {isFetchingMissingInfo && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>Analyzing narrative gaps...</span>
                  </div>
                )}

                {missingInfoItems.length === 0 && !isFetchingMissingInfo && (
                  <p className="text-xs text-slate-500 italic">
                    No configured narrative information gaps identified from available structured intake data.
                  </p>
                )}

                {missingInfoItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2.5">
                      {missingInfoItems.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-amber-50/40 border border-amber-200 rounded-md text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-950">{item.topic || item.field || 'Information Gap'}</span>
                            <Badge
                              variant="outline"
                              className={
                                item.importance === 'CRITICAL'
                                  ? 'bg-red-50 text-red-700 border-red-200 text-[9px]'
                                  : item.importance === 'IMPORTANT'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 text-[9px]'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 text-[9px]'
                              }
                            >
                              {item.importance || 'IMPORTANT'}
                            </Badge>
                          </div>
                          <p className="text-slate-800 font-medium pt-0.5">{item.description}</p>
                          {item.reason && <p className="text-[11px] text-slate-500 pt-0.5"><span className="font-semibold text-slate-600">Reason:</span> {item.reason}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded">
                      <span className="font-semibold">Completeness Safety Note:</span> Information gap labels describe data completeness only and do not indicate medical urgency.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested Follow-Up Questions Card */}
            <Card className="bg-white border-teal-200 shadow-sm">
              <CardHeader className="bg-teal-50/70 border-b border-teal-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-teal-950 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-teal-600" />
                    <span>Suggested Follow-Up Questions</span>
                    <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 text-[10px] ml-2">
                      Reviewer Suggestions
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-teal-800">
                    Neutral questions qualified health workers may consider asking to clarify gaps.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {followUpQuestionItems.length === 0 && !isFetchingMissingInfo && (
                  <p className="text-xs text-slate-500 italic">
                    No follow-up questions generated.
                  </p>
                )}

                {followUpQuestionItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2.5">
                      {followUpQuestionItems.map((q: any, idx: number) => (
                        <div key={idx} className="p-3 bg-teal-50/40 border border-teal-200 rounded-md text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-teal-950">Q{idx + 1}. &quot;{q.question}&quot;</span>
                            <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-200 text-[9px]">
                              Format: {q.answerType || 'TEXT'}
                            </Badge>
                          </div>
                          {q.reason && (
                            <p className="text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-500">Goal:</span> {q.reason}
                            </p>
                          )}
                          {q.linkedMissingInformationId && (
                            <div className="pt-0.5">
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[9px]">
                                Linked Gap: {q.linkedMissingInformationId}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-2 bg-teal-50 border border-teal-200 text-teal-900 text-[11px] rounded">
                      <span className="font-semibold">Reviewer Workflow Note:</span> Questions are suggestions for staff consideration. The system does not contact patients automatically.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reports & OCR Documents Card */}
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50/70 border-b border-blue-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-blue-950 flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Reports & OCR Documents</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] ml-2">
                      {reportsList.length} Attached
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-800">
                    Uploaded lab reports, imaging notes, and document text extractions.
                  </CardDescription>
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 py-1">
                    {isUploadingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
                    Upload Report
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleReportUpload}
                      disabled={isUploadingReport}
                      className="hidden"
                    />
                  </label>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {reportUploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reportUploadError}</span>
                  </div>
                )}
                {reportUploadSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{reportUploadSuccess}</span>
                  </div>
                )}

                {isFetchingReports && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Loading report attachments...</span>
                  </div>
                )}

                {reportsList.length === 0 && !isFetchingReports && (
                  <p className="text-xs text-slate-500 italic">
                    No clinical reports attached to this case.
                  </p>
                )}

                {reportsList.length > 0 && (
                  <div className="space-y-4">
                    {reportsList.map((report: any) => {
                      const reportId = report.id || report._id;
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
                      const downloadUrl = `${apiBaseUrl}/reports/${reportId}/file`;
                      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

                      return (
                        <div key={reportId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <div>
                              <span className="font-bold text-slate-900 block">{report.originalFilename}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {(report.fileSize / 1024).toFixed(1)} KB • {report.mimeType} • Uploaded {new Date(report.uploadTimestamp || report.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={
                                  report.processingStatus === 'PROCESSED'
                                    ? 'bg-green-50 text-green-700 border-green-200 text-[10px]'
                                    : report.processingStatus === 'FAILED'
                                    ? 'bg-red-50 text-red-700 border-red-200 text-[10px]'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                                }
                              >
                                {report.processingStatus}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  report.verificationStatus === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 text-[10px]'
                                }
                              >
                                {report.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFICATION REQUIRED'}
                              </Badge>
                            </div>
                          </div>

                          {/* Original Document Link */}
                          <div className="flex items-center justify-between pt-1">
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                // Add auth header via fetch download if needed or standard link
                                if (token) {
                                  e.preventDefault();
                                  fetch(downloadUrl, {
                                    headers: { Authorization: `Bearer ${token}` },
                                  })
                                    .then((res) => res.blob())
                                    .then((blob) => {
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = report.originalFilename;
                                      a.click();
                                    });
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 underline font-medium text-[11px] inline-flex items-center"
                            >
                              Download Original File
                            </a>

                            {report.verificationStatus !== 'VERIFIED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyReport(reportId)}
                                className="h-7 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Mark OCR as Verified
                              </Button>
                            )}
                          </div>

                          {/* Empty OCR Warning Banner */}
                          {report.processingStatus === 'PROCESSED' && !report.ocrUsable && (
                            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>OCR completed but produced no usable text.</span>
                            </div>
                          )}

                          {/* OCR Processing Failure Banner */}
                          {report.processingStatus === 'FAILED' && (
                            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>OCR Processing Error: {report.processingError || 'Extraction failed'}</span>
                            </div>
                          )}

                          {/* OCR Text Display */}
                          {report.ocrUsable && report.extractedText && (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">Extracted Document Text</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestTranslation('REPORT_OCR', reportId)}
                                  disabled={isTranslatingId === reportId}
                                  className="text-[10px] h-6 px-2 shrink-0 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                >
                                  {isTranslatingId === reportId ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Languages className="w-3 h-3 mr-1" />
                                  )}
                                  Translate OCR
                                </Button>
                              </div>
                              <pre className="p-2.5 bg-slate-900 text-slate-100 font-mono text-[11px] rounded overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-700">
                                {report.extractedText}
                              </pre>

                              {/* Report OCR Translation Cards */}
                              {translationsList
                                .filter((t: any) => t.sourceType === 'REPORT_OCR' && t.sourceId === reportId)
                                .map((t: any) => (
                                  <div key={t._id || t.id} className="p-2.5 bg-indigo-50/60 border border-indigo-200 rounded text-xs space-y-2">
                                    <div className="flex justify-between items-center border-b border-indigo-100 pb-1">
                                      <span className="font-bold text-indigo-950 text-[11px] flex items-center space-x-1">
                                        <Globe className="w-3 h-3 text-indigo-600" />
                                        <span>Translated OCR Text — {t.targetLanguage.toUpperCase()}</span>
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={
                                          t.verificationStatus === 'VERIFIED'
                                            ? 'bg-green-50 text-green-700 border-green-200 text-[9px]'
                                            : 'bg-amber-50 text-amber-700 border-amber-200 text-[9px]'
                                        }
                                      >
                                        {t.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'REQUIRED'}
                                      </Badge>
                                    </div>
                                    <p className="text-slate-900 leading-relaxed font-medium bg-white p-2 rounded border border-indigo-100">
                                      {t.translatedText || t.processingError}
                                    </p>
                                    {t.verificationStatus !== 'VERIFIED' && (
                                      <div className="flex justify-end">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleVerifyTranslation(t._id || t.id)}
                                          className="text-[10px] h-5 px-1.5 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                        >
                                          <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                                          Verify
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-2 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] rounded">
                  <span className="font-semibold">Storage & Retention Policy:</span> The original report is preserved according to the current prototype storage/retention policy and remains available for authorized reviewer verification.
                </div>
              </CardContent>
            </Card>

            {/* Visual Inputs & Observations Card */}
            <Card className="bg-white border-purple-200 shadow-sm">
              <CardHeader className="bg-purple-50/70 border-b border-purple-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-purple-950 flex items-center space-x-2">
                    <HeartPulse className="w-4 h-4 text-purple-600" />
                    <span>Visual Inputs & Observations</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] ml-2">
                      {visualInputsList.length} Uploaded
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-purple-800">
                    Patient-provided clinical images (JPEG/PNG) and structured non-diagnostic visual observations.
                  </CardDescription>
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-purple-600 hover:bg-purple-700 text-white h-8 px-3 py-1">
                    {isUploadingVisualInput ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
                    Upload Image
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleVisualInputUpload}
                      disabled={isUploadingVisualInput}
                      className="hidden"
                    />
                  </label>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {visualInputUploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{visualInputUploadError}</span>
                  </div>
                )}
                {visualInputUploadSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{visualInputUploadSuccess}</span>
                  </div>
                )}

                {isFetchingVisualInputs && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>Loading visual input records...</span>
                  </div>
                )}

                {visualInputsList.length === 0 && !isFetchingVisualInputs && (
                  <p className="text-xs text-slate-500 italic">
                    No visual images attached to this case.
                  </p>
                )}

                {visualInputsList.length > 0 && (
                  <div className="space-y-4">
                    {visualInputsList.map((input: any) => {
                      const inputId = input.id || input._id;
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
                      const downloadUrl = `${apiBaseUrl}/visual-inputs/${inputId}/file`;
                      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

                      return (
                        <div key={inputId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <div>
                              <span className="font-bold text-slate-900 block">{input.originalFilename}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {(input.fileSize / 1024).toFixed(1)} KB • {input.mimeType} • Uploaded {new Date(input.uploadedAt || input.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={
                                  input.processingStatus === 'PROCESSED'
                                    ? 'bg-green-50 text-green-700 border-green-200 text-[10px]'
                                    : input.processingStatus === 'FAILED'
                                    ? 'bg-red-50 text-red-700 border-red-200 text-[10px]'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                                }
                              >
                                {input.processingStatus}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  input.verificationStatus === 'VERIFIED'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300 text-[10px]'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 text-[10px]'
                                }
                              >
                                {input.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFICATION REQUIRED'}
                              </Badge>
                            </div>
                          </div>

                          {/* Image Link & Action */}
                          <div className="flex items-center justify-between pt-1">
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                if (token) {
                                  e.preventDefault();
                                  fetch(downloadUrl, {
                                    headers: { Authorization: `Bearer ${token}` },
                                  })
                                    .then((res) => res.blob())
                                    .then((blob) => {
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = input.originalFilename;
                                      a.click();
                                    });
                                }
                              }}
                              className="text-purple-600 hover:text-purple-800 underline font-medium text-[11px] inline-flex items-center"
                            >
                              View Original Image
                            </a>

                            {input.verificationStatus !== 'VERIFIED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyVisualInput(inputId)}
                                className="h-7 text-[11px] border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Observations as Verified
                              </Button>
                            )}
                          </div>

                          {/* Image Quality Failure Banner */}
                          {(input.qualityStatus === 'INSUFFICIENT' || input.processingStatus === 'FAILED') && (
                            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>Image quality is insufficient for reliable visual observation. ({input.processingError || input.qualityNotes || 'Unreadable image'})</span>
                            </div>
                          )}

                          {/* Empty Success State */}
                          {input.processingStatus === 'PROCESSED' && input.qualityStatus === 'SUFFICIENT' && (!input.observations || input.observations.length === 0) && (
                            <div className="p-2 bg-purple-50 border border-purple-200 text-purple-900 text-[11px] rounded flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
                              <span>No configured visual observations were identified.</span>
                            </div>
                          )}

                          {/* Observations Display */}
                          {input.processingStatus === 'PROCESSED' && input.observations && input.observations.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-semibold text-purple-900 uppercase tracking-wider block">AI Visual Observations ({input.observations.length})</span>
                              <div className="grid grid-cols-1 gap-2">
                                {input.observations.map((obs: any, idx: number) => (
                                  <div key={idx} className="p-2.5 bg-white border border-purple-100 rounded text-xs space-y-1 shadow-2xs">
                                    <div className="flex justify-between items-center">
                                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-[9px] font-bold">
                                        {obs.type}
                                      </Badge>
                                      <div className="flex items-center space-x-1.5">
                                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[9px]">
                                          Certainty: {obs.certainty}
                                        </Badge>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px]">
                                          {obs.provenance}
                                        </Badge>
                                      </div>
                                    </div>
                                    <p className="text-slate-800 font-medium pt-0.5">{obs.description}</p>
                                    {obs.location && (
                                      <p className="text-[10px] text-slate-500"><span className="font-semibold text-slate-600">Location:</span> {obs.location}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-2 bg-purple-50 border border-purple-200 text-purple-900 text-[11px] rounded">
                  <span className="font-semibold">Safety Disclaimer:</span> AI-generated visual observations for qualified staff review. These observations are descriptive and do not constitute a diagnosis or treatment recommendation.
                </div>
              </CardContent>
            </Card>

            {/* Voice Inputs & Transcripts Card */}
            <Card className="bg-white border-sky-200 shadow-sm">
              <CardHeader className="bg-sky-50 border-b border-sky-100 py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-sky-950 flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-sky-600" />
                    <span>Voice Inputs & Transcripts</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-sky-700">
                    Patient audio recordings and AI speech-to-text transcripts.
                  </CardDescription>
                </div>
                <div>
                  <label htmlFor="voice-upload-input" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 h-8 px-3 py-1 shadow-2xs transition-colors">
                      {isUploadingVoiceInput ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 mr-1.5" />
                          Upload Voice
                        </>
                      )}
                    </span>
                    <input
                      id="voice-upload-input"
                      type="file"
                      accept="audio/*,.wav,.mp3,.ogg,.webm"
                      className="hidden"
                      onChange={handleVoiceInputUpload}
                      disabled={isUploadingVoiceInput}
                    />
                  </label>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {voiceInputUploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{voiceInputUploadError}</span>
                  </div>
                )}
                {voiceInputUploadSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{voiceInputUploadSuccess}</span>
                  </div>
                )}

                {isFetchingVoiceInputs && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>Loading voice inputs...</span>
                  </div>
                )}

                {voiceInputsList.length === 0 && !isFetchingVoiceInputs && (
                  <p className="text-xs text-slate-500 italic">
                    No voice recordings attached to this case.
                  </p>
                )}

                {voiceInputsList.length > 0 && (
                  <div className="space-y-4">
                    {voiceInputsList.map((input: any) => {
                      const inputId = input.id || input._id;
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
                      const streamUrl = `${apiBaseUrl}/voice-inputs/${inputId}/file`;

                      return (
                        <div key={inputId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <div>
                              <span className="font-bold text-slate-900 block">{input.originalFilename}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {(input.fileSize / 1024).toFixed(1)} KB • {input.mimeType} • Language: {input.detectedLanguage || input.requestedLanguage || 'UNKNOWN'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={
                                  input.processingStatus === 'PROCESSED'
                                    ? 'bg-green-50 text-green-700 border-green-200 text-[10px]'
                                    : input.processingStatus === 'FAILED'
                                    ? 'bg-red-50 text-red-700 border-red-200 text-[10px]'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                                }
                              >
                                {input.processingStatus}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  input.verificationStatus === 'VERIFIED'
                                    ? 'bg-sky-100 text-sky-800 border-sky-300 text-[10px]'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 text-[10px]'
                                }
                              >
                                {input.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFICATION REQUIRED'}
                              </Badge>
                            </div>
                          </div>

                          {/* Audio Player */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-sky-900 uppercase tracking-wider block">Original Audio Player</span>
                            <audio controls className="w-full h-8 rounded" src={streamUrl}>
                              Your browser does not support the audio element.
                            </audio>
                          </div>

                          {/* Transcript Box */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-sky-900 uppercase tracking-wider">Transcript</span>
                              {input.transcript?.provenance && (
                                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[9px]">
                                  {input.transcript.provenance}
                                </Badge>
                              )}
                            </div>

                            {input.processingStatus === 'FAILED' && (
                              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                                Audio transcription could not be completed. ({input.processingError || 'Provider error'})
                              </div>
                            )}

                            {input.processingStatus === 'PROCESSED' && input.transcriptStatus === 'EMPTY' && (
                              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded italic">
                                No usable transcript was produced from this audio.
                              </div>
                            )}

                            {input.processingStatus === 'PROCESSED' && input.transcriptStatus === 'AVAILABLE' && input.transcript && (
                              <div className="space-y-2">
                                <div className="p-3 bg-white border border-sky-100 rounded text-xs text-slate-800 space-y-1 shadow-2xs flex justify-between items-start">
                                  <p className="leading-relaxed whitespace-pre-wrap font-sans">&quot;{input.transcript.text}&quot;</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRequestTranslation('VOICE_TRANSCRIPT', inputId)}
                                    disabled={isTranslatingId === inputId}
                                    className="text-[10px] h-6 px-2 shrink-0 ml-2 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                  >
                                    {isTranslatingId === inputId ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Languages className="w-3 h-3 mr-1" />
                                    )}
                                    Translate
                                  </Button>
                                </div>

                                {/* Voice Transcript Translation Cards */}
                                {translationsList
                                  .filter((t: any) => t.sourceType === 'VOICE_TRANSCRIPT' && t.sourceId === inputId)
                                  .map((t: any) => (
                                    <div key={t._id || t.id} className="p-2.5 bg-indigo-50/60 border border-indigo-200 rounded text-xs space-y-2">
                                      <div className="flex justify-between items-center border-b border-indigo-100 pb-1">
                                        <span className="font-bold text-indigo-950 text-[11px] flex items-center space-x-1">
                                          <Globe className="w-3 h-3 text-indigo-600" />
                                          <span>Translated Transcript — {t.targetLanguage.toUpperCase()}</span>
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={
                                            t.verificationStatus === 'VERIFIED'
                                              ? 'bg-green-50 text-green-700 border-green-200 text-[9px]'
                                              : 'bg-amber-50 text-amber-700 border-amber-200 text-[9px]'
                                          }
                                        >
                                          {t.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'REQUIRED'}
                                        </Badge>
                                      </div>
                                      <p className="text-slate-900 leading-relaxed font-medium bg-white p-2 rounded border border-indigo-100">
                                        {t.translatedText || t.processingError}
                                      </p>
                                      {t.verificationStatus !== 'VERIFIED' && (
                                        <div className="flex justify-end">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleVerifyTranslation(t._id || t.id)}
                                            className="text-[10px] h-5 px-1.5 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                          >
                                            <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                                            Verify
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Verification Action Button */}
                          {input.verificationStatus !== 'VERIFIED' && input.processingStatus === 'PROCESSED' && (
                            <div className="pt-1 flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyVoiceInput(inputId)}
                                className="h-7 text-[11px] border-sky-300 text-sky-700 hover:bg-sky-50"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Transcript as Verified
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-2 bg-sky-50 border border-sky-200 text-sky-900 text-[11px] rounded">
                  <span className="font-semibold">Safety Disclaimer:</span> Speech-to-text is a transcription capability only. It does not diagnose conditions, determine urgency, recommend treatment, or independently alter case priority.
                </div>
              </CardContent>
            </Card>

            {/* Human Review Form Card */}
            <Card className="bg-white border-indigo-200 shadow-sm">
              <CardHeader className="bg-indigo-50 border-b border-indigo-100 py-3 px-4">
                <CardTitle className="text-sm font-bold text-indigo-950 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Submit Human Review Record</span>
                </CardTitle>
                <CardDescription className="text-xs text-indigo-700">
                  Record staff review observations for this case.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmitReview}>
                <CardContent className="p-4 space-y-4">
                  {submitSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                      <span>{submitSuccess}</span>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Review Status Outcome
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="COMPLETED">COMPLETED (Mark Case Resolved)</option>
                      <option value="ADDITIONAL_INFO_REQUESTED">ADDITIONAL_INFO_REQUESTED (Request Info)</option>
                      <option value="ESCALATED">ESCALATED (Escalate / Handoff)</option>
                    </select>
                  </div>

                  {reviewStatus === 'ESCALATED' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-2">
                      <label className="text-xs font-semibold text-amber-900 block">
                        Target Reviewer User ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Target User ObjectId or leave blank for unassigned escalation queue"
                        value={escalationTargetUserIdInput}
                        onChange={(e) => setEscalationTargetUserIdInput(e.target.value)}
                        className="w-full text-xs p-2 border border-amber-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-amber-800 italic">
                        Leaving this blank transfers the case to the facility unassigned escalation queue. Preserves existing SLA timer.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Reviewer Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="Enter human review notes, observation summary, or follow-up instructions..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Submitting...
                      </>
                    ) : (
                      'Save Review Record'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Human Priority Override Card */}
            <Card className="bg-white border-amber-200 shadow-sm">
              <CardHeader className="bg-amber-50 border-b border-amber-100 py-3 px-4">
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Human Priority Override (Phase 17)</span>
                </CardTitle>
                <CardDescription className="text-xs text-amber-800">
                  Override effective workflow priority. Priority demotion requires Doctor, Medical Officer, or Admin authorization.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handlePriorityOverride}>
                <CardContent className="p-4 space-y-3">
                  {overrideSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{overrideSuccess}</span>
                    </div>
                  )}

                  {overrideError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{overrideError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Target Override Priority
                    </label>
                    <select
                      value={overridePriorityInput}
                      onChange={(e) => setOverridePriorityInput(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                    >
                      <option value="URGENT">URGENT (SLA: 1 hour)</option>
                      <option value="PRIORITY">PRIORITY (SLA: 4 hours)</option>
                      <option value="ROUTINE">ROUTINE (SLA: 24 hours)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Override Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={overrideReasonInput}
                      onChange={(e) => setOverrideReasonInput(e.target.value)}
                      placeholder="Enter clinical rationale for human priority override..."
                      className="w-full text-xs p-2 border border-slate-300 rounded text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="bg-amber-50/50 px-4 py-3 border-t border-amber-100 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                    disabled={isSubmittingOverride}
                  >
                    {isSubmittingOverride ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Applying Override...
                      </>
                    ) : (
                      'Apply Priority Override'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Historical Human Reviews Log */}
            {caseDetails.reviews && caseDetails.reviews.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-slate-600" />
                    <span>Human Review History ({caseDetails.reviews.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {caseDetails.reviews.map((r) => (
                    <div key={r.id} className="p-3 border border-slate-200 rounded-lg text-xs space-y-2 bg-slate-50">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-900">{r.reviewerName || 'Reviewer Staff'}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                            {r.reviewStatus}
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            {new Date(r.reviewedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-800 leading-relaxed pt-1">{r.reviewerNotes}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Column (1/3 width) */}
          <div className="space-y-6">
            {/* Case Assignment Card */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                <CardTitle className="text-xs font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Case Ownership</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-4">
                {assignmentError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{assignmentError}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block text-[10px] mb-1">Current Owner</span>
                  {caseDetails.isAssigned ? (
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-indigo-600 text-white text-xs">
                        {isAssignedToMe ? 'Assigned to You' : caseDetails.assignedReviewerName || 'Assigned Reviewer'}
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs">
                      Unassigned (Unclaimed)
                    </Badge>
                  )}
                </div>

                <div className="pt-2 flex flex-col space-y-2">
                  {!caseDetails.isAssigned && (
                    <Button
                      size="sm"
                      onClick={handleClaim}
                      disabled={assignmentLoading}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs w-full"
                    >
                      {assignmentLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                      )}
                      Claim Case
                    </Button>
                  )}

                  {(isAssignedToMe || isAdmin) && caseDetails.isAssigned && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRelease}
                      disabled={assignmentLoading}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs w-full"
                    >
                      {assignmentLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <UserX className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      )}
                      Release Assignment
                    </Button>
                  )}
                </div>

                {/* Admin Assignment Panel */}
                {isAdmin && (
                  <form onSubmit={handleAdminAssign} className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      Admin Reassignment
                    </label>
                    <input
                      type="text"
                      placeholder="Enter target reviewer User ID"
                      value={targetReviewerIdInput}
                      onChange={(e) => setTargetReviewerIdInput(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={assignmentLoading}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs w-full"
                    >
                      {assignmentLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                      )}
                      Reassign Case
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Patient Contact Info */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                <CardTitle className="text-xs font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Patient Identity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Full Name</span>
                  <span className="font-semibold text-slate-900">{caseDetails.patient.name}</span>
                </div>
                {caseDetails.patient.email && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email</span>
                    <span className="text-slate-800 font-mono text-[11px]">{caseDetails.patient.email}</span>
                  </div>
                )}
                {caseDetails.patient.phone && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone</span>
                    <span className="text-slate-800 font-mono text-[11px]">{caseDetails.patient.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case Metadata */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                <CardTitle className="text-xs font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Case Attributes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Case Number:</span>
                  <span className="font-mono font-semibold text-slate-900">{caseDetails.caseNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-indigo-700">{caseDetails.status}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Queue Category:</span>
                  <span className="text-slate-700">{caseDetails.priority} (Unassessed)</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Language:</span>
                  <span className="uppercase font-mono text-slate-700">{caseDetails.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created At:</span>
                  <span className="text-slate-700">{new Date(caseDetails.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Operational SLA Card */}
            {caseDetails.sla && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Operational SLA</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">SLA Status:</span>
                    {caseDetails.sla.status === 'ESCALATED' ? (
                      <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300 font-semibold text-[10px]">
                        ESCALATED
                      </Badge>
                    ) : caseDetails.sla.status === 'OVERDUE' ? (
                      <Badge variant="outline" className="bg-red-100 text-red-900 border-red-300 font-semibold text-[10px]">
                        OVERDUE
                      </Badge>
                    ) : caseDetails.sla.status === 'DUE_SOON' ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 font-semibold text-[10px]">
                        DUE SOON
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[10px]">
                        PENDING
                      </Badge>
                    )}
                  </div>

                  {caseDetails.sla.dueAt && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">SLA Due At:</span>
                      <span className="font-mono text-slate-800">{new Date(caseDetails.sla.dueAt).toLocaleString()}</span>
                    </div>
                  )}

                  {caseDetails.sla.escalatedAt ? (
                    <>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Escalated At:</span>
                        <span className="font-mono text-purple-900">{new Date(caseDetails.sla.escalatedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Escalation Level:</span>
                        <span className="font-semibold text-purple-900">Level {caseDetails.sla.escalationLevel}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Escalation:</span>
                      <span className="text-slate-600">Not Escalated</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Patient Consent Status */}
            {caseDetails.consent && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Consent Verification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-green-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Consent Status: {caseDetails.consent.status}</span>
                  </div>
                  {caseDetails.consent.version && (
                    <p className="text-slate-500 text-[11px]">Version: {caseDetails.consent.version}</p>
                  )}
                  {caseDetails.consent.capturedAt && (
                    <p className="text-slate-500 text-[11px]">
                      Captured: {new Date(caseDetails.consent.capturedAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
