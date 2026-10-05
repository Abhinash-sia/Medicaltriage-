'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  UserPlus,
  Shield,
  Activity,
  Sun,
  Moon,
  LogOut,
  Command,
  Flame,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Dialog, DialogContent } from './dialog';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (action: () => void) => {
    setOpen(false);
    setSearch('');
    action();
  };

  const commands = [
    {
      id: 'reviewer-queue',
      title: 'Reviewer Queue',
      subtitle: 'Triage queue and active clinical cases',
      icon: Activity,
      action: () => router.push('/reviewer'),
      section: 'Navigation',
    },
    {
      id: 'patient-intake',
      title: 'Patient Intake Portal',
      subtitle: 'Multi-step patient symptom intake wizard',
      icon: UserPlus,
      action: () => router.push('/patient/intake'),
      section: 'Navigation',
    },
    {
      id: 'admin-panel',
      title: 'Admin Dashboard',
      subtitle: 'Facility metrics, users and data purge controls',
      icon: Shield,
      action: () => router.push('/admin'),
      section: 'Navigation',
    },
    {
      id: 'filter-urgent',
      title: 'Filter: URGENT Cases (1h SLA)',
      subtitle: 'Jump to high-priority emergency reviews',
      icon: Flame,
      action: () => router.push('/reviewer?priority=URGENT'),
      section: 'Quick Filters',
    },
    {
      id: 'filter-priority',
      title: 'Filter: PRIORITY Cases (4h SLA)',
      subtitle: 'Jump to priority clinical reviews',
      icon: AlertTriangle,
      action: () => router.push('/reviewer?priority=PRIORITY'),
      section: 'Quick Filters',
    },
    {
      id: 'filter-routine',
      title: 'Filter: ROUTINE Cases (24h SLA)',
      subtitle: 'Standard queue review',
      icon: CheckCircle2,
      action: () => router.push('/reviewer?priority=ROUTINE'),
      section: 'Quick Filters',
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Dark/Light Theme',
      subtitle: 'Switch between light and dark clinical themes',
      icon: Sun,
      action: () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
      },
      section: 'Preferences',
    },
  ];

  const filtered = search
    ? commands.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-7 px-2.5 rounded-[5px] border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
        aria-label="Open command palette"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search actions & cases...</span>
        <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-lg border-border bg-card text-foreground overflow-hidden shadow-2xl">
          <div className="flex items-center border-b border-border px-3.5 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command, page, or filter..."
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none caret-accent"
              autoFocus
            />
            <kbd className="pointer-events-none inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No commands or cases found.
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => runCommand(item.action)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[5px] hover:bg-muted/80 text-left text-xs transition-colors group focus:outline-none focus:bg-muted"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 rounded bg-muted text-muted-foreground group-hover:text-accent transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                      {item.section}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
