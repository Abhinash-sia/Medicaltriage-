'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { HeartPulse, ShieldAlert, LogIn, Loader2, User, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/i18n/LanguageContext';
import { setAuthSession } from '@/lib/authSession';

const SYNTHETIC_DEMO_ACCOUNTS = [
  {
    roleLabel: 'Doctor (District Hospital)',
    email: 'doctor.demo.001@example.test',
    password: 'Password123!',
    role: 'DOCTOR',
    targetRoute: '/reviewer',
  },
  {
    roleLabel: 'Nurse (Secondary Care)',
    email: 'nurse.demo.001@example.test',
    password: 'Password123!',
    role: 'NURSE',
    targetRoute: '/reviewer',
  },
  {
    roleLabel: 'Patient (Hindi Speaking)',
    email: 'patient.demo.001@example.test',
    password: 'Password123!',
    role: 'PATIENT',
    targetRoute: '/patient',
  },
  {
    roleLabel: 'System Administrator',
    email: 'admin@hospital.org',
    password: 'HospitalAdmin2026!',
    role: 'ADMIN',
    targetRoute: '/admin',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState<string>('doctor.demo.001@example.test');
  const [password, setPassword] = useState<string>('Password123!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setSessionExpiredNotice(true);
      }
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSessionExpiredNotice(false);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      let json: any = null;
      if (contentType && contentType.includes('application/json')) {
        json = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Received non-JSON response from server.');
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Authentication failed');
      }

      const accessToken = json.data.accessToken || json.data.token;
      const refreshToken = json.data.refreshToken;
      const user = json.data.user;
      setAuthSession({ accessToken, refreshToken, user });

      if (user.role === 'PATIENT') {
        router.push('/patient');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/reviewer');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoAccount = (account: typeof SYNTHETIC_DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelector variant="full" />
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 text-foreground font-bold text-xl">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl border border-primary/40 shadow-sm">
              <HeartPulse className="w-6 h-6 text-accent" />
            </div>
            <span className="font-mono">MedicalTriage</span>
          </Link>
          <p className="text-xs text-muted-foreground font-medium">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground tracking-tight">{t('auth.title')}</h2>
            <p className="text-xs text-muted-foreground">
              {t('auth.personaSubtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {sessionExpiredNotice && !error && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Your session has expired. Please log in again to continue.</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">{t('auth.email')}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border bg-card/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="email@example.test"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-border bg-card/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 shadow-md"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                {t('auth.signIn')}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="glass-pill px-2.5 py-0.5 text-muted-foreground font-semibold text-[10px] font-mono">
                  {t('auth.quickRoles')}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-1 gap-2">
              {SYNTHETIC_DEMO_ACCOUNTS.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className="glass-card p-2.5 rounded-lg text-left flex items-center justify-between text-xs transition-colors group cursor-pointer"
                >
                  <div>
                    <span className="font-bold block text-foreground group-hover:text-primary dark:group-hover:text-accent">
                      {acc.role === 'DOCTOR'
                        ? t('auth.doctorRole')
                        : acc.role === 'NURSE'
                        ? t('auth.nurseRole')
                        : acc.role === 'PATIENT'
                        ? t('auth.patientRole')
                        : t('auth.adminRole')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{acc.email}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground group-hover:text-primary dark:group-hover:text-accent" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border text-center">
            <p className="text-[11px] text-muted-foreground">
              {t('auth.footerNotice')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
