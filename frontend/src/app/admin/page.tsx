'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  Users,
  Building2,
  Trash2,
  Lock,
  LogOut,
} from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { FacilityManagementPanel } from '@/components/admin/FacilityManagementPanel';
import { RetentionPurgePanel } from '@/components/admin/RetentionPurgePanel';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { useLanguage } from '@/i18n/LanguageContext';
import { clearAuthSession } from '@/lib/authSession';

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'facilities' | 'retention'>(
    'dashboard'
  );
  const [authToken, setAuthToken] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || '';
      if (!token) {
        router.push('/login');
        return;
      }
      setAuthToken(token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.role) {
          setCurrentUserRole(payload.role);
          if (payload.role !== 'ADMIN') {
            router.push(payload.role === 'PATIENT' ? '/patient/intake' : '/reviewer');
          }
        }
      } catch {
        clearAuthSession();
        router.push('/login');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <DemoBanner />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/85 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/reviewer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.reviewerQueueLink')}
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground">{t('admin.dashboardTitle')}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageSelector variant="compact" />
          <ThemeToggle />
          <NotificationBell />
          {currentUserRole && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {t('admin.roleLabel')}: {currentUserRole}
            </span>
          )}
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
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dashboard')}
            className="text-xs flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            {t('admin.dashboardTab')}
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('users')}
            className="text-xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            {t('admin.usersTab')}
          </Button>
          <Button
            variant={activeTab === 'facilities' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('facilities')}
            className="text-xs flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            {t('admin.facilitiesTab')}
          </Button>
          <Button
            variant={activeTab === 'retention' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('retention')}
            className="text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('admin.retentionTab')}
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <UserManagementPanel />}
        {activeTab === 'facilities' && <FacilityManagementPanel />}
        {activeTab === 'retention' && <RetentionPurgePanel authToken={authToken} />}
      </main>

      {/* Footer Disclaimer */}
      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground bg-card/60">
        {t('landing.footerDisclaimer')}
      </footer>
    </div>
  );
}
