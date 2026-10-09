'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  HeartPulse,
  ShieldAlert,
  LogIn,
  Loader2,
  User,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  Stethoscope,
  Activity,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  UserPlus,
  Phone,
  Mail,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/i18n/LanguageContext';
import { setAuthSession } from '@/lib/authSession';
import { TriageConstellation } from '@/components/landing/TriageConstellation';

interface DemoAccount {
  roleKey: string;
  roleLabel: string;
  email: string;
  password: string;
  role: string;
  targetRoute: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const SYNTHETIC_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleKey: 'doctor',
    roleLabel: 'Doctor',
    email: 'doctor.demo.001@example.test',
    password: 'Password123!',
    role: 'DOCTOR',
    targetRoute: '/reviewer',
    icon: Stethoscope,
    tag: 'District Hospital',
  },
  {
    roleKey: 'nurse',
    roleLabel: 'Nurse',
    email: 'nurse.demo.001@example.test',
    password: 'Password123!',
    role: 'NURSE',
    targetRoute: '/reviewer',
    icon: Activity,
    tag: 'Secondary Care',
  },
  {
    roleKey: 'patient',
    roleLabel: 'Patient',
    email: 'patient.demo.001@example.test',
    password: 'Password123!',
    role: 'PATIENT',
    targetRoute: '/patient',
    icon: User,
    tag: 'Self Intake',
  },
  {
    roleKey: 'admin',
    roleLabel: 'Admin',
    email: 'admin@hospital.org',
    password: 'HospitalAdmin2026!',
    role: 'ADMIN',
    targetRoute: '/admin',
    icon: ShieldCheck,
    tag: 'Sys Admin',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<string>('doctor');
  const [email, setEmail] = useState<string>('doctor.demo.001@example.test');
  const [password, setPassword] = useState<string>('Password123!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<boolean>(false);

  // Sign up fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setSessionExpiredNotice(true);
      }
      if (params.get('mode') === 'signup' || params.get('tab') === 'register' || params.get('tab') === 'signup') {
        setAuthMode('signup');
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

      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');

      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === 'PATIENT') {
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

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!regName.trim() || regName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!regEmail.trim() && !regPhone.trim()) {
      setError('Please provide at least an email address or a phone number.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

    try {
      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim() || undefined,
          phone: regPhone.trim() || undefined,
          password: regPassword,
          role: 'PATIENT',
        }),
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
        throw new Error(json.error?.message || 'Registration failed');
      }

      const accessToken = json.data.accessToken || json.data.token;
      const refreshToken = json.data.refreshToken;
      const user = json.data.user;
      setAuthSession({ accessToken, refreshToken, user });

      router.push('/patient');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoAccount = (account: DemoAccount) => {
    setSelectedRole(account.roleKey);
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden font-sans selection:bg-accent/20">
      {/* Dynamic 3D Constellation Mesh in Background */}
      <TriageConstellation />

      {/* Ambient Gradient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hover:border-accent/40"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSelector variant="compact" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Cockpit */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl border-border/80 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md mb-1 ring-4 ring-primary/10">
              <HeartPulse className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {t('auth.title')}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {t('auth.subtitle')}
              </p>
            </div>
          </div>

          {/* Alert States */}
          {sessionExpiredNotice && !error && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>Your session has expired. Please log in again to continue.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Segmented Mode Selector: Sign In vs Sign Up */}
          <div className="flex p-1 bg-muted/70 rounded-xl border border-border/80">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-card text-foreground shadow-xs border border-border/70'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-primary dark:text-accent" />
              <span>{t('auth.signIn')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-card text-foreground shadow-xs border border-border/70'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-primary dark:text-accent" />
              <span>{t('auth.register')}</span>
            </button>
          </div>

          {authMode === 'signin' ? (
            <>
              {/* Quick Persona Switcher Segment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    {t('auth.quickRoles')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Select to auto-fill</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SYNTHETIC_DEMO_ACCOUNTS.map((acc) => {
                    const Icon = acc.icon;
                    const isSelected = selectedRole === acc.roleKey;
                    const localizedLabel =
                      acc.role === 'DOCTOR'
                        ? t('auth.doctorRole')
                        : acc.role === 'NURSE'
                        ? t('auth.nurseRole')
                        : acc.role === 'PATIENT'
                        ? t('auth.patientRole')
                        : t('auth.adminRole');

                    return (
                      <button
                        key={acc.roleKey}
                        type="button"
                        onClick={() => selectDemoAccount(acc)}
                        className={`relative p-2.5 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/40'
                            : 'bg-card/70 border-border text-muted-foreground hover:text-foreground hover:bg-card hover:border-accent/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          ) : (
                            <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border">
                              {acc.tag}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={`font-bold text-xs ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {localizedLabel}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                            {acc.email}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>{t('auth.email')}</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-border bg-card/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground transition-all placeholder:text-muted-foreground"
                      placeholder="email@example.test"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>{t('auth.password')}</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-border bg-card/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground transition-all placeholder:text-muted-foreground font-mono"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{t('auth.signIn')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setError(null);
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Don&apos;t have an account? Sign up as a Patient
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Patient Self-Registration Form */
            <form onSubmit={handleRegister} className="space-y-3.5 pt-1">
              <div className="p-2.5 bg-primary/10 border border-primary/25 rounded-xl text-xs text-foreground flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  Self-registration creates a <strong className="text-foreground font-semibold">Patient Account</strong> for personal symptom intake and report tracking. Clinical staff accounts are provisioned by hospital administrators.
                </span>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-border bg-card/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground transition-all placeholder:text-muted-foreground"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-border bg-card/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground transition-all placeholder:text-muted-foreground"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-border bg-card/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground transition-all placeholder:text-muted-foreground font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Password <span className="text-muted-foreground text-[10px] font-normal">(min 8 characters)</span> <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-border bg-card/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground transition-all placeholder:text-muted-foreground font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Patient Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Patient Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError(null);
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {/* Security Notice */}
          <div className="pt-3 border-t border-border/80 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>{t('auth.footerNotice')}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Subtle Footer */}
      <footer className="relative z-20 text-center py-3 text-[11px] text-muted-foreground/70">
        Sevansh Clinical Decision Support • Human-in-the-Loop Architecture
      </footer>
    </div>
  );
}
