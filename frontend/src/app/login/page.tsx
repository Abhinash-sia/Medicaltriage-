'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, ShieldAlert, LogIn, Loader2, User, Lock, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/i18n/LanguageContext';

const SYNTHETIC_DEMO_ACCOUNTS = [
  {
    roleLabel: 'Doctor (District Hospital)',
    email: 'doctor.demo.001@example.test',
    password: 'Password123!',
    role: 'DOCTOR',
    targetRoute: '/reviewer',
    color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
  },
  {
    roleLabel: 'Nurse (Secondary Care)',
    email: 'nurse.demo.001@example.test',
    password: 'Password123!',
    role: 'NURSE',
    targetRoute: '/reviewer',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
  },
  {
    roleLabel: 'Patient (Hindi Speaking)',
    email: 'patient.demo.001@example.test',
    password: 'Password123!',
    role: 'PATIENT',
    targetRoute: '/patient',
    color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
  },
  {
    roleLabel: 'System Administrator',
    email: 'admin@hospital.org',
    password: 'HospitalAdmin2026!',
    role: 'ADMIN',
    targetRoute: '/admin',
    color: 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200',
  },
];

import { setAuthSession } from '@/lib/authSession';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="full" />
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 text-slate-900 font-bold text-xl">
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span>MedicalTriage</span>
          </Link>
          <p className="text-xs text-slate-500 font-medium">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-900">{t('auth.title')}</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {t('auth.personaSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionExpiredNotice && !error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Your session has expired. Please log in again to continue.</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('auth.email')}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.test"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                {t('auth.signIn')}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-semibold">{t('auth.quickRoles')}</span>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-1 gap-2">
              {SYNTHETIC_DEMO_ACCOUNTS.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-colors ${acc.color}`}
                >
                  <div>
                    <span className="font-bold block">
                      {acc.role === 'DOCTOR'
                        ? t('auth.doctorRole')
                        : acc.role === 'NURSE'
                        ? t('auth.nurseRole')
                        : acc.role === 'PATIENT'
                        ? t('auth.patientRole')
                        : t('auth.adminRole')}
                    </span>
                    <span className="text-[10px] opacity-80">{acc.email}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 text-center">
            <p className="text-xs text-slate-500 w-full">
              {t('auth.footerNotice')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
