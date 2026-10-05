'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Globe,
  Building2,
  ShieldAlert,
  Flame,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/i18n/LanguageContext';
import { getAccessToken, clearAuthSession } from '@/lib/authSession';
import { gsap, Flip, MOTION, withMotion } from '@/lib/motion';

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

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
];

export default function ReviewerQueuePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [cases, setCases] = useState<ReviewerQueueItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [slaStatusFilter, setSlaStatusFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [facilityFilter, setFacilityFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingSla, setIsProcessingSla] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const queueContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = getAccessToken();
      if (!storedToken) {
        router.push('/login');
        return;
      }
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload) {
          if (payload.id) setCurrentUserId(payload.id);
          if (payload.role) setCurrentUserRole(payload.role);
        }
      } catch {
        clearAuthSession();
        router.push('/login');
      }
    }
  }, [router]);

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
      if (languageFilter) params.append('language', languageFilter);
      if (facilityFilter) params.append('facilityId', facilityFilter);

      // Record state for FLIP animation if cards exist
      const state = typeof window !== 'undefined' && queueContainerRef.current ? Flip.getState(queueContainerRef.current.querySelectorAll('.case-queue-card')) : null;

      const response = await fetch(`${apiBaseUrl}/reviewer/cases?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401) {
        clearAuthSession(true);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch reviewer cases queue.');
      }

      const nextCases = result.data || [];
      setCases(nextCases);
      if (result.pagination) {
        setPagination(result.pagination);
      }

      // Run GSAP Flip animation on card position updates or staggered entrance
      if (state) {
        requestAnimationFrame(() => {
          Flip.from(state, {
            duration: MOTION.duration.base,
            ease: MOTION.ease.transition,
            stagger: 0.02,
          });
        });
      } else {
        requestAnimationFrame(() => {
          if (queueContainerRef.current) {
            withMotion(() => {
              gsap.from(queueContainerRef.current!.querySelectorAll('.case-queue-card'), {
                y: 14,
                opacity: 0,
                stagger: 0.03,
                duration: MOTION.duration.base,
                ease: MOTION.ease.entrance,
              });
            });
          }
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while loading reviewer cases.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, priorityFilter, assignedToFilter, slaStatusFilter, languageFilter, facilityFilter]);

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

      fetchCases();
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

      fetchCases();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Release action failed.';
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const calculateSlaPercentage = (createdAt: string, dueAt: string | null, priority: string) => {
    if (!dueAt) return 100;
    const start = new Date(createdAt).getTime();
    const end = new Date(dueAt).getTime();
    const now = Date.now();
    const total = end - start;
    if (total <= 0) return 0;
    const remaining = end - now;
    const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
    return Math.round(pct);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <DemoBanner />

      <div className="py-6 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">
                <HeartPulse className="w-3 h-3" />
                <span>{t('reviewer.portalTitle')}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t('reviewer.queueTitle')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t('reviewer.queueSubtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
              <NotificationBell />

              {currentUserRole === 'ADMIN' && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/10 text-xs flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {t('reviewer.adminOps')}
                  </Button>
                </Link>
              )}

              {(currentUserRole === 'ADMIN' || currentUserRole === 'MEDICAL_OFFICER') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProcessSla}
                  disabled={isProcessingSla || isLoading}
                  className="text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isProcessingSla ? 'animate-spin' : ''}`} />
                  {t('reviewer.processSla')}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchCases}
                disabled={isLoading}
                className="text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                {t('reviewer.refreshQueue')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearAuthSession();
                  router.push('/login');
                }}
                className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Operational Safety Disclaimer Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[6px] text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[11px] uppercase tracking-wider">{t('reviewer.safetyNoticeTitle')}</p>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                {t('reviewer.safetyNoticeDesc')}
              </p>
            </div>
          </div>

          {processResult && (
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-[6px] text-xs font-medium font-mono">
              {processResult}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-card border border-border rounded-[6px] p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Queue Filters
              </span>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                Total Cases: {pagination.total}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs border border-border bg-card rounded-[5px] px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Priorities</option>
                <option value="URGENT">URGENT (1h SLA)</option>
                <option value="PRIORITY">PRIORITY (4h SLA)</option>
                <option value="ROUTINE">ROUTINE (24h SLA)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs border border-border bg-card rounded-[5px] px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Statuses</option>
                <option value="INTAKE_SUBMITTED">INTAKE_SUBMITTED</option>
                <option value="AI_EXTRACTED">AI_EXTRACTED</option>
                <option value="SAFETY_EVALUATED">SAFETY_EVALUATED</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="REVIEWED">REVIEWED</option>
                <option value="REFERRED">REFERRED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <select
                value={slaStatusFilter}
                onChange={(e) => {
                  setSlaStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs border border-border bg-card rounded-[5px] px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All SLA States</option>
                <option value="PENDING">PENDING</option>
                <option value="DUE_SOON">DUE SOON</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="ESCALATED">ESCALATED</option>
              </select>

              <select
                value={assignedToFilter}
                onChange={(e) => {
                  setAssignedToFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs border border-border bg-card rounded-[5px] px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Assignments</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned Only</option>
              </select>

              <select
                value={languageFilter}
                onChange={(e) => {
                  setLanguageFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs border border-border bg-card rounded-[5px] px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Languages</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPriorityFilter('');
                  setStatusFilter('');
                  setSlaStatusFilter('');
                  setAssignedToFilter('');
                  setLanguageFilter('');
                  setFacilityFilter('');
                  setPage(1);
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Queue List View with Progressive Blur Container */}
          <div className="relative">
            {/* Top/Bottom Progressive Blur Gradient Overlays */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-background to-transparent z-10 opacity-70" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-background to-transparent z-10 opacity-70" />

            {isLoading && cases.length === 0 ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-20 rounded-[6px] border border-border bg-card/50 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-card border border-destructive/30 rounded-[6px] space-y-2">
                <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
                <p className="text-xs text-destructive font-medium">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchCases}>
                  Retry Loading
                </Button>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-[6px] space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
                <h3 className="text-sm font-semibold text-foreground">No cases in queue</h3>
                <p className="text-xs text-muted-foreground">
                  Try adjusting filter criteria or submit a new case from the patient intake portal.
                </p>
              </div>
            ) : (
              <div ref={queueContainerRef} className="space-y-2">
                {cases.map((item) => {
                  const isUrgent = item.priority === 'URGENT';
                  const isPriority = item.priority === 'PRIORITY';
                  const slaRemainingPct = calculateSlaPercentage(item.createdAt, item.sla?.dueAt || null, item.priority);

                  return (
                    <div
                      key={item.id}
                      className={`case-queue-card bg-card border rounded-[6px] p-3.5 transition-all duration-150 shadow-2xs hover:border-border/80 ${
                        isUrgent
                          ? 'border-[hsl(var(--urgency-urgent)/0.4)] animate-urgent-pulse'
                          : isPriority
                          ? 'border-[hsl(var(--urgency-priority)/0.35)]'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Left Info Group */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Urgency Chip */}
                            <Badge
                              variant={
                                isUrgent
                                  ? 'urgent'
                                  : isPriority
                                  ? 'priority'
                                  : 'routine'
                              }
                            >
                              {isUrgent ? (
                                <Flame className="w-3 h-3 text-[hsl(var(--urgency-urgent))]" />
                              ) : isPriority ? (
                                <AlertTriangle className="w-3 h-3 text-[hsl(var(--urgency-priority))]" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-[hsl(var(--urgency-routine))]" />
                              )}
                              <span>{item.priority}</span>
                              <span className="font-mono text-[9px] opacity-75">
                                ({item.priority === 'URGENT' ? '1h' : item.priority === 'PRIORITY' ? '4h' : '24h'})
                              </span>
                            </Badge>

                            {/* Case Number */}
                            <span className="font-mono text-xs font-semibold text-foreground tracking-tight">
                              {item.caseNumber}
                            </span>

                            {/* Language Badge */}
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-[3px] border border-border">
                              {item.language.toUpperCase()}
                            </span>

                            {/* Status */}
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">
                              • {item.status}
                            </span>

                            {/* Assigned Reviewer */}
                            {item.isAssigned && (
                              <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-[3px] border border-primary/20 flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5" />
                                {item.assignedReviewerName || 'Assigned'}
                              </span>
                            )}
                          </div>

                          {/* Chief Complaint */}
                          <p className="text-xs text-foreground/90 font-medium truncate">
                            {item.chiefComplaint || 'No chief complaint specified'}
                          </p>

                          {/* SLA Timer Bar */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  slaRemainingPct < 25
                                    ? 'bg-[hsl(var(--urgency-urgent))]'
                                    : slaRemainingPct < 50
                                    ? 'bg-[hsl(var(--urgency-priority))]'
                                    : 'bg-primary'
                                }`}
                                style={{ width: `${slaRemainingPct}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                              SLA: {item.sla?.status || 'PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {item.isAssigned && item.assignedReviewerId === currentUserId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRelease(item.id)}
                              disabled={actionLoadingId === item.id}
                              className="text-[11px] h-7 px-2"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Release
                            </Button>
                          ) : !item.isAssigned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClaim(item.id)}
                              disabled={actionLoadingId === item.id}
                              className="text-[11px] h-7 px-2"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Claim
                            </Button>
                          ) : null}

                          <Link href={`/reviewer/cases/${item.id}`}>
                            <Button size="sm" className="text-[11px] h-7 px-2.5 gap-1">
                              <span>Review</span>
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="h-7 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || isLoading}
                  className="h-7 text-xs"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
