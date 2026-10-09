'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  UserPlus,
  Shield,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Menu,
  X,
  Stethoscope,
  Building,
} from 'lucide-react';
import { DemoBanner } from '../ui/DemoBanner';
import { ThemeToggle } from '../ui/ThemeToggle';
import { CommandPalette } from '../ui/CommandPalette';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useLanguage } from '../../i18n/LanguageContext';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    facilityName?: string;
  } | null;
}

export function AppShell({ children, user: initialUser }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(initialUser || null);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {
        // Ignore
      }
    }
  }, [user]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    router.push('/login');
  };

  const navItems = [
    {
      href: '/reviewer',
      label: 'Reviewer Queue',
      icon: Activity,
      roles: ['NURSE', 'DOCTOR', 'MEDICAL_OFFICER', 'ADMIN'],
    },
    {
      href: '/patient/intake',
      label: 'Patient Intake',
      icon: UserPlus,
      roles: ['PATIENT', 'NURSE', 'HEALTH_WORKER', 'DOCTOR', 'ADMIN'],
    },
    {
      href: '/admin',
      label: 'Admin Operations',
      icon: Shield,
      roles: ['ADMIN'],
    },
  ];

  const visibleNav = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <DemoBanner user={user} />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/95 border-b border-border h-12 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-1.5 rounded-[4px] border border-border text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link href="/" className="flex items-center gap-2 text-foreground font-semibold text-xs tracking-tight">
            <div className="w-6 h-6 rounded-[4px] bg-primary text-primary-foreground flex items-center justify-center">
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline">Sevansh</span>
          </Link>

          <div className="hidden md:flex items-center text-xs text-muted-foreground">
            <span className="mx-2 text-border">/</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-foreground">
              {pathname === '/reviewer'
                ? 'Reviewer Workspace'
                : pathname.startsWith('/reviewer/cases')
                ? 'Case Detail Review'
                : pathname.startsWith('/patient/intake')
                ? 'Patient Intake'
                : pathname.startsWith('/admin')
                ? 'Admin Operations'
                : 'Workspace'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CommandPalette />
          <LanguageSelector variant="compact" />
          <ThemeToggle />

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-medium text-foreground leading-tight">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                  {user.role}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-[4px] border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main App Body with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar for Desktop */}
        <aside
          className={`hidden md:flex flex-col border-r border-border bg-card/60 transition-all duration-200 ${
            collapsed ? 'w-14' : 'w-52'
          }`}
        >
          <div className="p-2 flex items-center justify-end border-b border-border/60">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="p-1 rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-muted text-[10px]"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          <nav className="p-2 space-y-1 flex-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[5px] text-xs font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {!collapsed && (
            <div className="p-3 border-t border-border/60 text-[10px] text-muted-foreground space-y-0.5">
              <div className="font-mono uppercase tracking-wider text-[9px] text-foreground font-semibold">
                SLA Operational Mode
              </div>
              <div>Strict Human-in-the-Loop</div>
            </div>
          )}
        </aside>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
