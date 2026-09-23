'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  HeartPulse,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  FileText,
  ArrowUpRight,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';

interface ReviewerQueueItem {
  id: string;
  caseNumber: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
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
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ReviewerQueuePage() {
  const [cases, setCases] = useState<ReviewerQueueItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [slaStatusFilter, setSlaStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingSla, setIsProcessingSla] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Read current user token / ID from window if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload) {
            if (payload.id) setCurrentUserId(payload.id);
            if (payload.role) setCurrentUserRole(payload.role);
          }
        } catch {
          // Token decode fallback
        }
      }
    }
  }, []);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assignedToFilter) params.append('assignedTo', assignedToFilter);
      if (slaStatusFilter) params.append('slaStatus', slaStatusFilter);

      const response = await fetch(`${apiBaseUrl}/reviewer/cases?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch reviewer cases queue.');
      }

      setCases(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while loading reviewer cases.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, priorityFilter, assignedToFilter, slaStatusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleProcessSla = async () => {
    setIsProcessingSla(true);
    setError(null);
    setProcessResult(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBaseUrl}/reviewer/sla/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to process SLA escalations.');
      }

      const resData = result.data;
      setProcessResult(
        `SLA Processing Complete: Evaluated ${resData.processed} cases, escalated ${resData.escalated} newly overdue cases.`
      );
      fetchCases();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SLA processing failed.';
      setError(msg);
    } finally {
      setIsProcessingSla(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleClaim = async (caseId: string) => {
    setActionLoadingId(caseId);
    setError(null);
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

      fetchCases(); // Refresh queue
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim action failed.';
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRelease = async (caseId: string) => {
    setActionLoadingId(caseId);
    setError(null);
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

      fetchCases(); // Refresh queue
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Release action failed.';
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Branding */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Healthcare Reviewer Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Triage Intake Case Queue & Ownership
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review patient-submitted healthcare intake records and manage reviewer case assignments.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {(currentUserRole === 'ADMIN' || currentUserRole === 'MEDICAL_OFFICER') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessSla}
                disabled={isProcessingSla || isLoading}
                className="border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100 font-medium text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isProcessingSla ? 'animate-spin' : ''}`} />
                Process Overdue SLAs
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchCases}
              disabled={isLoading}
              className="border-slate-300 text-slate-700 bg-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </Button>
          </div>
        </div>

        {/* Operational Safety Disclaimer */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Reviewer Operational Notice & Ownership Semantics:</p>
            <p className="leading-relaxed">
              Case assignment represents operational staff workload ownership only. It does not imply medical diagnosis, clinical approval, or urgency reclassification. Initial queue categories (ROUTINE) represent unassessed intake states. Operational SLA status tracks review timeliness and does not indicate medical urgency.
            </p>
          </div>
        </div>

        {processResult && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-medium">
            {processResult}
          </div>
        )}

        {/* Filter Controls Bar */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Assigned Workload</label>
                <select
                  value={assignedToFilter}
                  onChange={(e) => {
                    setAssignedToFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All Cases</option>
                  <option value="me">Assigned to Me</option>
                  <option value="unassigned">Unassigned (Unclaimed)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Workflow Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">OPEN (Unreviewed)</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Queue Category</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="ROUTINE">ROUTINE (Unassessed)</option>
                  <option value="PRIORITY">PRIORITY</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Operational SLA</label>
                <select
                  value={slaStatusFilter}
                  onChange={(e) => {
                    setSlaStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All SLA States</option>
                  <option value="pending">PENDING</option>
                  <option value="due_soon">DUE_SOON</option>
                  <option value="overdue">OVERDUE</option>
                  <option value="escalated">ESCALATED</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {cases.length} of {pagination.total} cases
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Queue Case List */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p>Loading reviewer cases queue...</p>
          </div>
        ) : cases.length === 0 ? (
          <Card className="bg-white border-slate-200 p-8 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <CardTitle className="text-base text-slate-800">No Cases In Queue</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              No intake cases currently match the selected workflow, SLA, and assignment filters.
            </CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => {
              const isAssignedToMe = currentUserId && c.assignedReviewerId === currentUserId;

              return (
                <Card
                  key={c.id}
                  className="bg-white border-slate-200 hover:border-indigo-300 transition-all shadow-sm"
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {c.caseNumber}
                        </span>

                        <Badge
                          variant="outline"
                          className={
                            c.status === 'OPEN'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : c.status === 'IN_REVIEW'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }
                        >
                          {c.status}
                        </Badge>

                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px]">
                          Category: {c.priority} (Unassessed)
                        </Badge>

                        {/* Operational SLA Badge */}
                        {c.sla?.status === 'ESCALATED' ? (
                          <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300 font-semibold text-[11px]">
                            SLA: Escalated (L1)
                          </Badge>
                        ) : c.sla?.status === 'OVERDUE' ? (
                          <Badge variant="outline" className="bg-red-100 text-red-900 border-red-300 font-semibold text-[11px]">
                            SLA: Overdue
                          </Badge>
                        ) : c.sla?.status === 'DUE_SOON' ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 font-semibold text-[11px]">
                            SLA: Due Soon
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[11px]">
                            SLA: Pending
                          </Badge>
                        )}

                        {/* Assignment Badge */}
                        {isAssignedToMe ? (
                          <Badge className="bg-green-600 text-white border-green-700 text-[11px] flex items-center space-x-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Assigned to You</span>
                          </Badge>
                        ) : c.isAssigned ? (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[11px] flex items-center space-x-1">
                            <User className="w-3 h-3 text-indigo-600" />
                            <span>Assigned: {c.assignedReviewerName || 'Reviewer'}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[11px] flex items-center space-x-1">
                            <UserX className="w-3 h-3 text-amber-600" />
                            <span>Unassigned</span>
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-slate-900 line-clamp-1">{c.chiefComplaint}</h2>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="flex items-center space-x-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.patientName}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(c.createdAt).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-2 sm:self-center">
                      {!c.isAssigned && (
                        <Button
                          size="sm"
                          onClick={() => handleClaim(c.id)}
                          disabled={actionLoadingId === c.id}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          {actionLoadingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                          )}
                          Claim
                        </Button>
                      )}

                      {isAssignedToMe && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRelease(c.id)}
                          disabled={actionLoadingId === c.id}
                          className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                        >
                          {actionLoadingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <UserX className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          )}
                          Release
                        </Button>
                      )}

                      <Link href={`/reviewer/cases/${c.id}`}>
                        <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs">
                          Inspect <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            <span className="text-slate-600 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page >= pagination.totalPages || isLoading}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
