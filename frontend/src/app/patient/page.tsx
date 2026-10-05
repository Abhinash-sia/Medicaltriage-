'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  HeartPulse,
  PlusCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  LogOut,
  User,
  ShieldAlert,
  Loader2,
  RefreshCw,
  PhoneCall,
  Activity,
  FileText,
  Copy,
  Check,
  X,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/i18n/LanguageContext';
import { clearAuthSession, authFetch } from '@/lib/authSession';

interface PatientCaseSummary {
  id: string;
  caseNumber: string;
  status: string;
  priority: string;
  chiefComplaint: string;
  language: string;
  createdAt: string;
}

interface PatientCaseDetail {
  id: string;
  caseNumber: string;
  patientId: string;
  status: string;
  priority: string;
  chiefComplaint: string;
  language: string;
  patientAge?: number;
  patientGender?: string;
  consent?: {
    status: string;
    version: string;
    capturedAt: string;
  } | null;
  symptoms?: Array<{
    id: string;
    name: string;
    onset?: string;
    duration?: string;
    severity?: number;
    bodyLocation?: string;
    source?: string;
  }>;
  createdAt: string;
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [user, setUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null);
  const [cases, setCases] = useState<PatientCaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Case Details Modal
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<PatientCaseDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auth check & load user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          if (parsed.role && parsed.role !== 'PATIENT') {
            if (parsed.role === 'ADMIN') {
              router.push('/admin');
              return;
            } else {
              router.push('/reviewer');
              return;
            }
          }
        }
      } catch {
        // Continue
      }
    }
  }, [router]);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
      const response = await authFetch(`${apiBaseUrl}/intake/my-cases`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        clearAuthSession();
        router.push('/login?expired=true');
        return;
      }

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to retrieve patient consultations');
      }

      setCases(json.data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching your consultations.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  const handleOpenDetail = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setIsLoadingDetail(true);
    setDetailError(null);
    setCaseDetail(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
      const response = await fetch(`${apiBaseUrl}/intake/${caseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to load case details');
      }

      setCaseDetail(json.data);
    } catch (err: any) {
      setDetailError(err.message || 'Could not load consultation details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered cases calculation
  const filteredCases = cases.filter((item) => {
    const matchesQuery =
      item.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    if (statusFilter === 'ACTIVE') {
      return item.status !== 'CLOSED' && item.status !== 'TRIAGE_COMPLETED';
    }
    if (statusFilter === 'COMPLETED') {
      return item.status === 'CLOSED' || item.status === 'TRIAGE_COMPLETED';
    }
    return true;
  });

  // Urgency badge helper
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'EMERGENCY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5 animate-pulse" />
            {priority}
          </span>
        );
      case 'PRIORITY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            {priority}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            {priority || 'ROUTINE'}
          </span>
        );
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_REVIEW':
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Activity className="w-3 h-3 mr-1 text-primary" />
            {t('patient.statUnderReview')}
          </span>
        );
      case 'INTAKE_SUBMITTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Clock className="w-3 h-3 mr-1 text-sky-600 dark:text-sky-400" />
            {t('patient.statAwaiting')}
          </span>
        );
      case 'TRIAGE_COMPLETED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <CheckCircle2 className="w-3 h-3 mr-1 text-muted-foreground" />
            {t('patient.statCompleted')}
          </span>
        );
      case 'REFERRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <MapPin className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" />
            Referred
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  // Metrics
  const activeCount = cases.filter((c) => c.status !== 'CLOSED' && c.status !== 'TRIAGE_COMPLETED').length;
  const underReviewCount = cases.filter((c) => c.status === 'IN_REVIEW' || c.status === 'ASSIGNED').length;
  const completedCount = cases.filter((c) => c.status === 'CLOSED' || c.status === 'TRIAGE_COMPLETED').length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent/20">
      <DemoBanner />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-card/85 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Identifier */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base font-bold text-foreground tracking-tight">MedicalTriage</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 text-[10px] px-1.5 py-0 font-mono">
                  PATIENT PORTAL
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">Human-in-the-Loop Clinical Support</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <LanguageSelector />
            <ThemeToggle />
            <NotificationBell />

            {/* User Profile Capsule */}
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-border text-sm">
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-foreground">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium text-foreground text-xs leading-tight">{user?.name || 'Patient'}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{user?.email || 'patient@example.com'}</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Emergency Alert Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/10 p-1 text-foreground shadow-sm">
          <div className="rounded-[14px] bg-card/90 backdrop-blur-xs p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-destructive/20">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-destructive flex items-center gap-2">
                  <span>{t('patient.emergencyAlertTitle')}</span>
                  <span className="text-[10px] font-semibold bg-destructive/20 text-destructive px-2 py-0.5 rounded-full uppercase">
                    Immediate Action
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                  {t('patient.emergencyAlertDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <a
                href="tel:108"
                className="inline-flex items-center space-x-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 108 (Ambulance)</span>
              </a>
              <a
                href="tel:112"
                className="inline-flex items-center space-x-2 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs border border-border transition-colors"
              >
                <span>Call 112</span>
              </a>
            </div>
          </div>
        </div>

        {/* Hero Quick Action Banner */}
        <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8 text-foreground shadow-md border-border">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-primary">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>AI-Assisted Human Clinical Triage</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t('patient.startNewAssessment')}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('patient.startNewAssessmentDesc')}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                <span className="glass-pill px-2.5 py-1 rounded-md text-[11px] font-medium">✓ Text or Regional Voice Audio</span>
                <span className="glass-pill px-2.5 py-1 rounded-md text-[11px] font-medium">✓ Lab Report PDF OCR</span>
                <span className="glass-pill px-2.5 py-1 rounded-md text-[11px] font-medium">✓ Reviewed by Qualified Clinicians</span>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <Link href="/patient/intake">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-5 text-sm sm:text-base rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>{t('patient.beginIntakeBtn')}</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t('patient.statTotalCases')}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">{cases.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center border border-border">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t('patient.statUnderReview')}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-primary font-mono">{underReviewCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t('patient.statAwaiting')}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {cases.filter((c) => c.status === 'INTAKE_SUBMITTED').length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t('patient.statCompleted')}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{completedCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Cases Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {t('patient.myCasesTitle')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('patient.myCasesSubtitle')}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchCases}
              disabled={isLoading}
              className="self-start sm:self-auto text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="glass-card rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('patient.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-muted/60 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent transition-all text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  statusFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {t('patient.filterAll')} ({cases.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {t('patient.filterActive')} ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {t('patient.filterCompleted')} ({completedCount})
              </button>
            </div>
          </div>

          {/* Cases Container */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center text-destructive space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold">{error}</p>
              <Button size="sm" onClick={fetchCases} variant="outline" className="text-xs">
                Try Again
              </Button>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">{t('patient.noCasesFound')}</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {t('patient.noCasesDesc')}
                </p>
              </div>
              <Link href="/patient/intake">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl px-5 py-2.5 shadow-sm">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  <span>{t('patient.startNewIntake')}</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-5 hover:border-accent/40 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                          {item.caseNumber}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.caseNumber)}
                          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                          title="Copy Case Number"
                        >
                          {copiedId === item.caseNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderPriorityBadge(item.priority)}
                        {renderStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Chief Complaint Description */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {t('patient.chiefComplaintLabel')}
                      </h4>
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed">
                        {item.chiefComplaint || 'No narrative provided'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Info & Action */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetail(item.id)}
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 text-xs font-semibold px-2.5 py-1.5 h-auto rounded-lg flex items-center space-x-1"
                    >
                      <span>{t('patient.caseDetailsTitle')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Case Details Modal */}
      {selectedCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-card/60">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-foreground">{t('patient.caseDetailsTitle')}</h3>
                  {caseDetail && renderPriorityBadge(caseDetail.priority)}
                </div>
                <p className="text-xs text-muted-foreground">{t('patient.caseDetailsSubtitle')}</p>
              </div>
              <button
                onClick={() => setSelectedCaseId(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-foreground">
              {isLoadingDetail ? (
                <div className="py-16 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <p className="text-xs">{t('common.loading')}</p>
                </div>
              ) : detailError ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-xs">
                  {detailError}
                </div>
              ) : caseDetail ? (
                <div className="space-y-6">
                  {/* Meta Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-muted/50 rounded-xl border border-border text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">{t('patient.caseNumberLabel')}</span>
                      <span className="font-mono font-bold text-foreground">{caseDetail.caseNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">{t('patient.submittedOn')}</span>
                      <span className="font-medium text-foreground">
                        {new Date(caseDetail.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">{t('patient.reviewStatus')}</span>
                      <div>{renderStatusBadge(caseDetail.status)}</div>
                    </div>
                    {(caseDetail.patientAge !== undefined || caseDetail.patientGender) && (
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Demographics</span>
                        <span className="font-semibold text-foreground">
                          {caseDetail.patientAge !== undefined ? `${caseDetail.patientAge} yrs` : ''}
                          {caseDetail.patientAge !== undefined && caseDetail.patientGender ? ' • ' : ''}
                          {caseDetail.patientGender || ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Chief Complaint */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      {t('patient.chiefComplaintLabel')}
                    </h4>
                    <div className="p-3.5 bg-muted/40 border border-border rounded-xl text-foreground font-medium leading-relaxed">
                      {caseDetail.chiefComplaint}
                    </div>
                  </div>

                  {/* Symptoms & Clinical Timeline Breakdown */}
                  {caseDetail.symptoms && caseDetail.symptoms.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        {t('patient.reportedSymptoms')}
                      </h4>
                      <div className="space-y-3">
                        {caseDetail.symptoms.map((symptom, idx) => (
                          <div
                            key={symptom.id || idx}
                            className="p-4 border border-border rounded-xl space-y-2 bg-card shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground text-sm">{symptom.name}</span>
                              {symptom.severity && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground border border-border font-mono">
                                  Severity: {symptom.severity}/10
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                              {symptom.onset && (
                                <div>
                                  <span className="text-muted-foreground font-medium">{t('patient.onsetLabel')}:</span>{' '}
                                  <span className="text-foreground font-medium">{symptom.onset}</span>
                                </div>
                              )}
                              {symptom.duration && (
                                <div>
                                  <span className="text-muted-foreground font-medium">{t('patient.durationLabel')}:</span>{' '}
                                  <span className="text-foreground font-medium">{symptom.duration}</span>
                                </div>
                              )}
                              {symptom.bodyLocation && (
                                <div>
                                  <span className="text-muted-foreground font-medium">{t('patient.locationLabel')}:</span>{' '}
                                  <span className="text-foreground font-medium">{symptom.bodyLocation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical Notice Box */}
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-foreground space-y-1">
                    <p className="font-semibold text-primary flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-primary" />
                      <span>Reviewer Escalation Protocol:</span>
                    </p>
                    <p className="leading-relaxed text-muted-foreground">
                      Your intake information has been organized into a structured clinical summary. Attending physicians and nursing officers at the healthcare facility review incoming cases in priority sequence.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-card/60 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCaseId(null)}
                className="text-xs font-semibold px-4"
              >
                {t('patient.closeModal')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
