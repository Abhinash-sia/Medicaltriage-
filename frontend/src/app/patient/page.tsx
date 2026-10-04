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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5 animate-pulse" />
            {priority}
          </span>
        );
      case 'PRIORITY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />
            {priority}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Activity className="w-3 h-3 mr-1 text-blue-600" />
            {t('patient.statUnderReview')}
          </span>
        );
      case 'INTAKE_SUBMITTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 mr-1 text-sky-600" />
            {t('patient.statAwaiting')}
          </span>
        );
      case 'TRIAGE_COMPLETED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-slate-600" />
            {t('patient.statCompleted')}
          </span>
        );
      case 'REFERRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <MapPin className="w-3 h-3 mr-1 text-purple-600" />
            Referred
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <DemoBanner />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Identifier */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">MedicalTriage</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                  PATIENT PORTAL
                </Badge>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Human-in-the-Loop Clinical Support</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSelector />
            <NotificationBell />

            {/* User Profile Capsule */}
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200 text-sm">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium text-slate-800 leading-tight">{user?.name || 'Patient'}</div>
                <div className="text-[11px] text-slate-500">{user?.email || 'patient@example.com'}</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Emergency Alert Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-red-600 to-amber-600 p-1 text-white shadow-md shadow-rose-900/10">
          <div className="rounded-[14px] bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <span>{t('patient.emergencyAlertTitle')}</span>
                  <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase">
                    Immediate Action
                  </span>
                </h2>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  {t('patient.emergencyAlertDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <a
                href="tel:108"
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 108 (Ambulance)</span>
              </a>
              <a
                href="tel:112"
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                <span>Call 112</span>
              </a>
            </div>
          </div>
        </div>

        {/* Hero Quick Action Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>AI-Assisted Human Clinical Triage</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {t('patient.startNewAssessment')}
              </h1>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                {t('patient.startNewAssessmentDesc')}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-blue-200">
                <span className="bg-white/10 px-2.5 py-1 rounded-md">✓ Text or Regional Voice Audio</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-md">✓ Lab Report PDF OCR</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-md">✓ Reviewed by Qualified Clinicians</span>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <Link href="/patient/intake">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-6 text-sm sm:text-base rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  <span>{t('patient.beginIntakeBtn')}</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {t('patient.statTotalCases')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{cases.length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {t('patient.statUnderReview')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{underReviewCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {t('patient.statAwaiting')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                  {cases.filter((c) => c.status === 'INTAKE_SUBMITTED').length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {t('patient.statCompleted')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{completedCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cases Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {t('patient.myCasesTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('patient.myCasesSubtitle')}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchCases}
              disabled={isLoading}
              className="self-start sm:self-auto text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('patient.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('patient.filterAll')} ({cases.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('patient.filterActive')} ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('patient.filterCompleted')} ({completedCount})
              </button>
            </div>
          </div>

          {/* Cases Container */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-800 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold">{error}</p>
              <Button size="sm" onClick={fetchCases} variant="outline" className="text-xs">
                Try Again
              </Button>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">{t('patient.noCasesFound')}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {t('patient.noCasesDesc')}
                </p>
              </div>
              <Link href="/patient/intake">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-5 py-2.5 shadow-sm">
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
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.caseNumber}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.caseNumber)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                          title="Copy Case Number"
                        >
                          {copiedId === item.caseNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t('patient.chiefComplaintLabel')}
                      </h4>
                      <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-relaxed">
                        {item.chiefComplaint || 'No narrative provided'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Info & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold px-2.5 py-1.5 h-auto rounded-lg flex items-center space-x-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">{t('patient.caseDetailsTitle')}</h3>
                  {caseDetail && renderPriorityBadge(caseDetail.priority)}
                </div>
                <p className="text-xs text-slate-500">{t('patient.caseDetailsSubtitle')}</p>
              </div>
              <button
                onClick={() => setSelectedCaseId(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-800">
              {isLoadingDetail ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <p className="text-xs">{t('common.loading')}</p>
                </div>
              ) : detailError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-xs">
                  {detailError}
                </div>
              ) : caseDetail ? (
                <div className="space-y-6">
                  {/* Meta Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5">{t('patient.caseNumberLabel')}</span>
                      <span className="font-mono font-bold text-slate-900">{caseDetail.caseNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">{t('patient.submittedOn')}</span>
                      <span className="font-medium text-slate-800">
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
                      <span className="text-slate-500 block mb-0.5">{t('patient.reviewStatus')}</span>
                      <div>{renderStatusBadge(caseDetail.status)}</div>
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      {t('patient.chiefComplaintLabel')}
                    </h4>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium leading-relaxed">
                      {caseDetail.chiefComplaint}
                    </div>
                  </div>

                  {/* Symptoms & Clinical Timeline Breakdown */}
                  {caseDetail.symptoms && caseDetail.symptoms.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {t('patient.reportedSymptoms')}
                      </h4>
                      <div className="space-y-3">
                        {caseDetail.symptoms.map((symptom, idx) => (
                          <div
                            key={symptom.id || idx}
                            className="p-4 border border-slate-200 rounded-xl space-y-2 bg-white shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">{symptom.name}</span>
                              {symptom.severity && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                  Severity: {symptom.severity}/10
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                              {symptom.onset && (
                                <div>
                                  <span className="text-slate-400 font-medium">{t('patient.onsetLabel')}:</span>{' '}
                                  <span className="text-slate-800 font-medium">{symptom.onset}</span>
                                </div>
                              )}
                              {symptom.duration && (
                                <div>
                                  <span className="text-slate-400 font-medium">{t('patient.durationLabel')}:</span>{' '}
                                  <span className="text-slate-800 font-medium">{symptom.duration}</span>
                                </div>
                              )}
                              {symptom.bodyLocation && (
                                <div>
                                  <span className="text-slate-400 font-medium">{t('patient.locationLabel')}:</span>{' '}
                                  <span className="text-slate-800 font-medium">{symptom.bodyLocation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical Notice Box */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                    <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-blue-600" />
                      <span>Reviewer Escalation Protocol:</span>
                    </p>
                    <p className="leading-relaxed text-blue-900/80">
                      Your intake information has been organized into a structured clinical summary. Attending physicians and nursing officers at the healthcare facility review incoming cases in priority sequence.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
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
