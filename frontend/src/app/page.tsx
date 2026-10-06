'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ShieldAlert,
  HeartPulse,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Mic,
  Globe,
  Building2,
  Lock,
  History,
  Workflow,
  Stethoscope,
  LogIn,
  Activity,
  Cpu,
  Layers,
  FileCheck2,
  ShieldCheck,
  Zap,
  Clock,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/i18n/LanguageContext';
import { TriageSimulator } from '@/components/landing/TriageSimulator';
import { StorytellingPipeline } from '@/components/landing/StorytellingPipeline';
import { InteractiveTriageAssistant } from '@/components/landing/InteractiveTriageAssistant';

// Dynamically import smooth scroll and 3D constellation to ensure instant first paint
const SmoothScroll = dynamic(
  () => import('@/components/landing/SmoothScroll').then((m) => m.SmoothScroll),
  { ssr: false }
);

const TriageConstellation = dynamic(
  () => import('@/components/landing/TriageConstellation').then((m) => m.TriageConstellation),
  { ssr: false }
);

gsap.registerPlugin(ScrollTrigger);

export default function PublicLandingPage() {
  const { t } = useLanguage();
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !mainContainerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
      heroTl
        .from('.hero-badge', { opacity: 0, y: 15, delay: 0.1 })
        .from('.hero-headline', { opacity: 0, y: 25 }, '-=0.5')
        .from('.hero-subtitle', { opacity: 0, y: 20 }, '-=0.6')
        .from('.hero-chips', { opacity: 0, y: 15, stagger: 0.05 }, '-=0.5')
        .from('.hero-cta', { opacity: 0, y: 15, stagger: 0.1 }, '-=0.5')
        .from('.hero-cockpit', { opacity: 0, scale: 0.96, duration: 1 }, '-=0.8');

      // Scroll reveals for each section
      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
        gsap.from(section, {
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 35,
          duration: 0.8,
          ease: 'power3.out',
        });
      });

      // Bento cards staggered entrance
      gsap.utils.toArray<HTMLElement>('.bento-grid').forEach((grid) => {
        const cards = grid.querySelectorAll('.bento-card');
        gsap.from(cards, {
          scrollTrigger: {
            trigger: grid,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 30,
          stagger: 0.1,
          duration: 0.7,
          ease: 'power3.out',
        });
      });
    }, mainContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <SmoothScroll>
      <div
        ref={mainContainerRef}
        className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-300"
      >
        {/* Top Floating Glass Navigation */}
        <header className="sticky top-0 z-50 bg-background/85 dark:bg-background/80 backdrop-blur-md border-b border-border/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="bg-primary p-2 rounded-lg text-primary-foreground border border-primary/40 shadow-sm">
                <HeartPulse className="w-5 h-5 text-accent" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-foreground font-mono">MedicalTriage</span>
                <span className="text-[10px] bg-muted/80 text-primary dark:text-accent px-2.5 py-1 rounded-full font-semibold border border-border/80 leading-normal inline-flex items-center">
                  {t('landing.prototype')}
                </span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center space-x-5 text-xs font-medium text-muted-foreground">
              <a href="#how-it-works" className="hover:text-foreground transition-colors py-1">
                {t('landing.navHowItWorks')}
              </a>
              <a href="#simulator" className="hover:text-foreground transition-colors py-1">
                {t('landing.navDemo')}
              </a>
              <a href="#capabilities" className="hover:text-foreground transition-colors py-1">
                {t('landing.navCapabilities')}
              </a>
              <a href="#safety" className="hover:text-foreground transition-colors py-1">
                {t('landing.navSafety')}
              </a>
              <a href="#india-context" className="hover:text-foreground transition-colors py-1">
                {t('landing.navIndiaContext')}
              </a>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <LanguageSelector variant="full" />
              <ThemeToggle />
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex items-center gap-1.5 border-border/80 bg-card/60 backdrop-blur-md text-foreground hover:bg-muted text-xs min-h-[32px] px-3 py-1 whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  {t('common.login')}
                </Button>
              </Link>
              <Link href="/patient">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs min-h-[32px] px-3.5 py-1 shadow-sm font-semibold border border-primary/30 whitespace-nowrap"
                >
                  {t('landing.patientPortal')}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80">
          <TriageConstellation />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Mission & Actions */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Status Pill */}
                <div className="hero-badge inline-flex items-center space-x-2 bg-card/90 backdrop-blur-sm border border-border text-primary dark:text-accent px-3.5 py-1.5 rounded-full text-xs font-medium leading-normal shadow-xs ring-1 ring-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>{t('landing.badgeAssistant')}</span>
                </div>

                {/* H1 Heading */}
                <h1 className="hero-headline text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.25] sm:leading-[1.18]">
                  {t('landing.heroTitleLine1')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-foreground">
                    {t('landing.heroTitleLine2')}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="hero-subtitle text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  {t('landing.heroSubtitle')}
                </p>

                {/* Badges Grid */}
                <div className="hero-chips flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="bg-card/85 backdrop-blur-sm border-border text-foreground px-3 py-1.5 shadow-2xs leading-normal">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-[#E8A33A] shrink-0" />
                    {t('landing.badgeNonDiagnostic')}
                  </Badge>
                  <Badge variant="outline" className="bg-card/85 backdrop-blur-sm border-border text-foreground px-3 py-1.5 shadow-2xs leading-normal">
                    <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-primary dark:text-accent shrink-0" />
                    {t('landing.badgeHumanReview')}
                  </Badge>
                  <Badge variant="outline" className="bg-card/85 backdrop-blur-sm border-border text-foreground px-3 py-1.5 shadow-2xs leading-normal">
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-[#2E9E6B] shrink-0" />
                    {t('landing.badgePrivacy')}
                  </Badge>
                  <Badge variant="outline" className="bg-card/85 backdrop-blur-sm border-border text-foreground px-3 py-1.5 shadow-2xs leading-normal">
                    <Globe className="w-3.5 h-3.5 mr-1.5 text-primary dark:text-accent shrink-0" />
                    {t('landing.badgeMultilingual')}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="hero-cta pt-2 flex flex-col sm:flex-row gap-3.5">
                  <Link href="/patient/intake">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 py-3 min-h-[46px] text-sm shadow-lg shadow-primary/20 border border-primary/40 leading-normal"
                    >
                      {t('landing.getStarted')}
                      <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-border/80 bg-card/80 backdrop-blur-md text-foreground font-semibold px-7 py-3 min-h-[46px] text-sm hover:bg-muted/80 shadow-xs leading-normal"
                    >
                      {t('landing.navHowItWorks')}
                    </Button>
                  </a>
                </div>
              </div>

              {/* Right Column: Interactive Clinical Triage & Symptom Guide */}
              <div className="hero-cockpit lg:col-span-5">
                <InteractiveTriageAssistant />
              </div>
            </div>
          </div>
        </section>

        {/* Strict Non-Diagnostic & Safety Boundary Banner */}
        <section id="safety" className="reveal-section glass-panel !border-x-0 border-y border-amber-500/30 py-6 px-4 !bg-amber-500/10 dark:!bg-amber-500/5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-amber-500/20 text-amber-700 dark:text-amber-400 p-2.5 rounded-xl border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold font-mono text-xs text-amber-800 dark:text-amber-400 tracking-wider uppercase">
                {t('landing.disclaimerTitle')}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground/85">
                {t('landing.disclaimerBody')}
              </p>
            </div>
          </div>
        </section>

        {/* Live Interactive Triage Sandbox */}
        <section id="simulator" className="reveal-section py-24 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-muted/20">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                <Cpu className="w-3.5 h-3.5" />
                <span>{t('landing.navDemo')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {t('landing.capabilitiesTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('landing.capabilitiesSubtitle')}
              </p>
            </div>

            <TriageSimulator />
          </div>
        </section>

        {/* Storytelling Pipeline: How The System Works */}
        <section id="how-it-works" className="reveal-section py-24 px-4 sm:px-6 lg:px-8 border-b border-border/80">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                <Workflow className="w-3.5 h-3.5" />
                <span>{t('landing.navHowItWorks')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {t('landing.howItWorksTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('landing.howItWorksSubtitle')}
              </p>
            </div>

            <StorytellingPipeline />
          </div>
        </section>

        {/* Core Capabilities Section (Asymmetric Bento Grid) */}
        <section id="capabilities" className="reveal-section py-24 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-muted/10">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                <Layers className="w-3.5 h-3.5" />
                <span>{t('landing.navCapabilities')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {t('landing.capabilitiesTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('landing.capabilitiesSubtitle')}
              </p>
            </div>

            {/* Asymmetric Bento Grid */}
            <div className="bento-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Bento Card 1: Multimodal Intake (Span 2 cols on desktop) */}
              <div className="bento-card lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl flex flex-col justify-between group relative overflow-hidden border border-border hover:border-primary/40 transition-all duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-primary/10 text-primary dark:text-accent rounded-xl border border-primary/20 group-hover:scale-105 transition-transform">
                      <Mic className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] bg-card border-border text-foreground">
                      Voice + OCR + Tabular Ingestion
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                      {t('landing.cap1Title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2 max-w-xl">
                      {t('landing.cap1Desc')}
                    </p>
                  </div>

                  {/* Micro Visual Ingestion Sandbox Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2">
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                        <span>Multilingual Audio Processing</span>
                        <span className="text-emerald-500 font-semibold">16kHz PCM</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['ଓଡ଼ିଆ (Odia)', 'हिन्दी (Hindi)', 'English', 'বাংলা (Bengali)'].map((lang, i) => (
                          <span key={i} className="text-[10px] font-mono bg-card px-2 py-0.5 rounded border border-border text-foreground">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2">
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                        <span>Document Lab OCR</span>
                        <span className="text-primary dark:text-accent font-semibold">High Precision</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-foreground">
                        <span className="p-1 bg-card rounded border border-border">Hb: 11.2</span>
                        <span className="p-1 bg-card rounded border border-border">Plt: 240k</span>
                        <span className="p-1 bg-card rounded border border-border">TLC: 7.8k</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: 22 Deterministic Safety Rules (Span 1 col, Tall) */}
              <div className="bento-card glass-panel p-6 sm:p-8 rounded-2xl flex flex-col justify-between group relative overflow-hidden border border-border hover:border-primary/40 transition-all duration-300">
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-primary/10 text-primary dark:text-accent rounded-xl border border-primary/20 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] bg-rose-500/10 text-rose-500 border-rose-500/30">
                      Zero Hallucination
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {t('landing.cap2Title')}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      {t('landing.cap2Desc')}
                    </p>
                  </div>

                  {/* Rules checklist snippet */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>✓ Rule 104 (Cardiac ACS)</span>
                      <span className="text-[9px] bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>✓ Rule 208 (Pediatric Wheeze)</span>
                      <span className="text-[9px] bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>✓ Rule 301 (Outpatient Path)</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.2 rounded border border-border">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 3: 100% Grounded Citations (Span 1 col) */}
              <div className="bento-card glass-panel p-6 sm:p-8 rounded-2xl flex flex-col justify-between group relative overflow-hidden border border-border hover:border-primary/40 transition-all duration-300">
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-primary/10 text-primary dark:text-accent rounded-xl border border-primary/20 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] bg-card border-border text-foreground">
                      100% Grounded
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {t('landing.cap4Title')}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      {t('landing.cap4Desc')}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/70 text-xs font-mono space-y-1.5">
                    <div className="text-[10px] text-muted-foreground">Grounding Metadata:</div>
                    <div className="text-[11px] text-primary dark:text-accent font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Audio Span #01 ➔ Line 4 OCR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 4: Verified Physician Authorization & Emergency Referral (Span 2 cols on desktop) */}
              <div className="bento-card lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl flex flex-col justify-between group relative overflow-hidden border border-border hover:border-primary/40 transition-all duration-300">
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-primary/10 text-primary dark:text-accent rounded-xl border border-primary/20 group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] bg-card border-border text-foreground">
                      Clinician Sign-off • QR Referral
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                      {t('landing.cap6Title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2 max-w-xl">
                      {t('landing.cap6Desc')}
                    </p>
                  </div>

                  {/* Dispatch preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-1 text-xs">
                      <div className="text-[10px] font-mono text-muted-foreground">Emergency Facility Escalation:</div>
                      <div className="font-semibold text-foreground">District Cardiology Center, Cuttack</div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">SLA Response: &lt; 60 Minutes</div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border/70 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-mono text-muted-foreground">Tamper-Evident Token</div>
                        <div className="font-mono font-bold text-primary dark:text-accent">REF-2026-OD-8812</div>
                      </div>
                      <div className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
                        VERIFIED
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* India Context Section */}
        <section id="india-context" className="reveal-section py-24 px-4 sm:px-6 lg:px-8 border-b border-border/80">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                <Globe className="w-3.5 h-3.5" />
                <span>{t('landing.indiaBadge')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {t('landing.indiaTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('landing.indiaSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-6 rounded-2xl space-y-3">
                <div className="font-mono text-xs text-primary dark:text-accent font-bold">01 / ACCESS RATIO</div>
                <h3 className="text-lg font-bold text-foreground">{t('landing.stat1Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('landing.stat1Desc')}</p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-3">
                <div className="font-mono text-xs text-primary dark:text-accent font-bold">02 / MULTILINGUAL</div>
                <h3 className="text-lg font-bold text-foreground">{t('landing.stat2Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('landing.stat2Desc')}</p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-3">
                <div className="font-mono text-xs text-primary dark:text-accent font-bold">03 / TIMEFRAMES</div>
                <h3 className="text-lg font-bold text-foreground">{t('landing.stat3Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('landing.stat3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="bg-card/40 border-t border-border/80 py-12 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-4 h-4 text-primary dark:text-accent" />
              <span className="font-mono font-semibold text-foreground">MedicalTriage Clinical Decision Support</span>
            </div>

            <div className="flex items-center space-x-6 font-mono text-[11px]">
              <a href="tel:108" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
                Emergency: 108
              </a>
              <span>•</span>
              <a href="tel:112" className="hover:text-foreground transition-colors">
                National Helpline: 112
              </a>
              <span>•</span>
              <a href="tel:104" className="hover:text-foreground transition-colors">
                Health Info: 104
              </a>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
