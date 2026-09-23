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

  useEffect(() => {
    fetchCaseDetails();
  }, [fetchCaseDetails]);

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
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to submit human review record.');
      }

      setSubmitSuccess('Human review submitted successfully.');
      setReviewerNotes('');
      fetchCaseDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
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
            {/* Patient Reported Symptoms Card */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <HeartPulse className="w-4 h-4 text-indigo-600" />
                  <span>Patient-Reported Observations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                  <span className="text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
                    Chief Complaint Narrative
                  </span>
                  <p className="text-slate-900 font-medium leading-relaxed">{caseDetails.chiefComplaint}</p>
                </div>

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
                      <option value="COMPLETED">COMPLETED (Review Finished)</option>
                      <option value="IN_PROGRESS">IN_PROGRESS (Review Underway)</option>
                      <option value="ADDITIONAL_INFO_REQUESTED">ADDITIONAL_INFO_REQUESTED</option>
                    </select>
                  </div>

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
