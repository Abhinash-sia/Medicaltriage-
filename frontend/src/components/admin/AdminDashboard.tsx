'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Send,
  Users,
  Building2,
  Bell,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface DashboardMetrics {
  openCases: number;
  inReviewCases: number;
  escalatedCases: number;
  referredCases: number;
  overdueCases: number;
  unreadNotifications: number;
  activeReviewers: number;
  activeFacilities: number;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const getAuthHeader = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/admin/dashboard`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMetrics(json.data);
        }
      } else {
        setError('Failed to load operational dashboard metrics');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operational Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Real-time workload, reviewer capacity, and SLA tracking counts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMetrics}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Open Cases</span>
                <FolderOpen className="w-4 h-4 text-blue-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {isLoading ? '-' : metrics?.openCases ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              Awaiting review claim
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>In-Review Cases</span>
                <Activity className="w-4 h-4 text-indigo-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                {isLoading ? '-' : metrics?.inReviewCases ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              Actively claimed by reviewers
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Escalated Cases</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-400">
                {isLoading ? '-' : metrics?.escalatedCases ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              Requires senior/MO review
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Referred Cases</span>
                <Send className="w-4 h-4 text-purple-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {isLoading ? '-' : metrics?.referredCases ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              Transfer to partner facilities
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Overdue Cases</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {isLoading ? '-' : metrics?.overdueCases ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              SLA deadline exceeded
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Active Reviewers</span>
                <Users className="w-4 h-4 text-teal-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                {isLoading ? '-' : metrics?.activeReviewers ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              Doctors, Nurses, MOs
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Active Facilities</span>
                <Building2 className="w-4 h-4 text-emerald-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {isLoading ? '-' : metrics?.activeFacilities ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              Hospitals, PHCs, Clinics
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-sky-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs flex items-center justify-between">
                <span>Operational Alerts</span>
                <Bell className="w-4 h-4 text-sky-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-sky-700 dark:text-sky-400">
                {isLoading ? '-' : metrics?.unreadNotifications ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-slate-500">
              Pending operational events
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
