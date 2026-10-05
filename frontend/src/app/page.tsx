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
import { HeroTelemetryCockpit } from '@/components/landing/HeroTelemetryCockpit';

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
        <header className="sticky top-0 z-50 bg-background/70 dark:bg-background/60 backdrop-blur-2xl border-b border-border/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg text-primary-foreground border border-primary/40 shadow-sm">
                <HeartPulse className="w-5 h-5 text-accent" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-foreground font-mono">MedicalTriage</span>
                <span className="text-[10px] font-mono bg-muted/80 text-primary dark:text-accent px-2 py-0.5 rounded-full font-semibold border border-border/80">
                  {t('landing.prototype')}
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-muted-foreground">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                {t('landing.navHowItWorks')}
              </a>
              <a href="#simulator" className="hover:text-foreground transition-colors">
                Live Simulator
              </a>
              <a href="#capabilities" className="hover:text-foreground transition-colors">
                {t('landing.navCapabilities')}
              </a>
              <a href="#safety" className="hover:text-foreground transition-colors">
                {t('landing.navSafety')}
              </a>
              <a href="#india-context" className="hover:text-foreground transition-colors">
                {t('landing.navIndiaContext')}
              </a>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <LanguageSelector variant="full" />
              <ThemeToggle />
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex items-center gap-1.5 border-border/80 bg-card/60 backdrop-blur-md text-foreground hover:bg-muted text-xs h-8"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {t('common.login')}
                </Button>
              </Link>
              <Link href="/patient/intake">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-3.5 shadow-sm font-semibold border border-primary/30"
                >
                  {t('landing.patientPortal')}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section: Asymmetrical Editorial Clinical Layout */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80">
          <TriageConstellation />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Mission & Actions */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Status Pill */}
                <div className="hero-badge inline-flex items-center space-x-2 bg-card/80 backdrop-blur-xl border border-border text-primary dark:text-accent px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase shadow-xs ring-1 ring-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>HUMAN-IN-THE-LOOP CLINICAL TRIAGE ASSISTANT</span>
                </div>

                {/* H1 Heading */}
                <h1 className="hero-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.12]">
                  Human-in-the-loop triage, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-foreground">
                    engineered for clinical certainty.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="hero-subtitle text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Organize symptoms, voice transcripts, lab OCR reports, visual observations, and timelines into structured information for qualified healthcare professionals.
                </p>

                {/* Badges Grid */}
                <div className="hero-chips flex flex-wrap gap-2 text-xs font-mono">
                  <Badge variant="outline" className="bg-card/70 backdrop-blur-md border-border text-foreground px-3 py-1 shadow-2xs">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-[#E8A33A]" />
                    Non-Diagnostic
                  </Badge>
                  <Badge variant="outline" className="bg-card/70 backdrop-blur-md border-border text-foreground px-3 py-1 shadow-2xs">
                    <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-primary dark:text-accent" />
                    Qualified Human Review
                  </Badge>
                  <Badge variant="outline" className="bg-card/70 backdrop-blur-md border-border text-foreground px-3 py-1 shadow-2xs">
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-[#2E9E6B]" />
                    Privacy-Conscious
                  </Badge>
                  <Badge variant="outline" className="bg-card/70 backdrop-blur-md border-border text-foreground px-3 py-1 shadow-2xs">
                    <Globe className="w-3.5 h-3.5 mr-1.5 text-primary dark:text-accent" />
                    Multilingual India-Ready
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="hero-cta pt-2 flex flex-col sm:flex-row gap-3.5">
                  <Link href="/patient/intake">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 py-5 text-sm shadow-lg shadow-primary/20 border border-primary/40"
                    >
                      Get Started (Patient Intake)
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/reviewer">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-border/80 bg-card/60 backdrop-blur-xl text-foreground font-semibold px-7 py-5 text-sm hover:bg-muted/80 shadow-xs"
                    >
                      Reviewer Workspace Queue
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Live Clinical Telemetry Cockpit */}
              <div className="hero-cockpit lg:col-span-5">
                <HeroTelemetryCockpit />
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
                STRICT NON-DIAGNOSTIC & HUMAN-IN-THE-LOOP SAFETY BOUNDARY
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground/85">
                MedicalTriage is built to assist — not replace — qualified healthcare professionals. It organizes and surfaces structured patient information, timelines, and safety signals. It does not diagnose medical conditions, prescribe treatment, or independently make clinical decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Live Interactive Triage Sandbox (21st.dev Style Bento Playground) */}
        <section id="simulator" className="reveal-section py-24 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-muted/20">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                <Cpu className="w-3.5 h-3.5" />
                <span>Interactive Demonstration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Experience the Triage Engine Live
              </h2>
              <p className="text-sm text-muted-foreground">
                Select clinical presentations below to observe real-time red-flag evaluation, SLA countdown computation, and verified provenance synthesis.
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
                <span>End-to-End Clinical Flow</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                How The System Works
              </h2>
              <p className="text-sm text-muted-foreground">
                A continuous, transparent workflow connecting patient intake to clinician decision-support and referral escalation.
              </p>
            </div>

            <StorytellingPipeline />
          </div>
        </section>

        {/* Core Capabilities Section (Bento Grid) */}
        <section id="capabilities" className="reveal-section py-24 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-muted/10">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                <Layers className="w-3.5 h-3.5" />
                <span>Clinical Capabilities</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Engineered for High-Acuity Reliability
              </h2>
              <p className="text-sm text-muted-foreground">
                Built specifically to solve high-pressure triage bottlenecks in busy hospitals, rural clinics, and emergency departments.
              </p>
            </div>

            <div className="bento-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Multimodal Ingestion',
                  desc: 'Ingest voice recordings in Indian regional languages, lab PDF reports via edge OCR, and guided intake forms seamlessly.',
                  icon: Mic,
                  badge: 'Voice + OCR + Vitals',
                },
                {
                  title: 'Safety & Urgency Engine',
                  desc: 'Evaluates 22 hardcoded clinical red flags before generating recommendations. Triages cases into URGENT, PRIORITY, or ROUTINE.',
                  icon: ShieldCheck,
                  badge: '22 Deterministic Rules',
                },
                {
                  title: 'Side-by-Side Provenance',
                  desc: 'Displays verbatim original patient statements and OCR report spans next to translated clinical notes for zero-hallucination verification.',
                  icon: FileText,
                  badge: '100% Grounded Citations',
                },
                {
                  title: 'SLA Countdown Monitor',
                  desc: 'Enforces clinical review SLA deadlines based on calculated urgency with audible alerts and continuous queue prioritization.',
                  icon: Activity,
                  badge: '15m / 60m / 240m SLA',
                },
                {
                  title: 'Immutable Audit Trail',
                  desc: 'Cryptographic SHA-256 hashed audit events record intake, extraction, review modifications, and referral authorizations.',
                  icon: History,
                  badge: 'Tamper-Evident Logs',
                },
                {
                  title: 'Facility Directory & Referrals',
                  desc: 'One-click referral escalation to specialized healthcare facilities with automated QR code verification cards.',
                  icon: Building2,
                  badge: 'Direct Facility Handoff',
                },
              ].map((cap, idx) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={idx}
                    className="bento-card glass-card p-6 rounded-2xl flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-primary/10 text-primary dark:text-accent rounded-xl border border-primary/20 group-hover:scale-105 transition-transform backdrop-blur-md">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/80">
                          {cap.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground tracking-tight">{cap.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* India Context Section */}
        <section id="india-context" className="reveal-section py-24 px-4 sm:px-6 lg:px-8 border-b border-border/80">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-primary dark:text-accent uppercase tracking-wider bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-md border border-primary/20 dark:border-accent/20">
                <Globe className="w-3.5 h-3.5" />
                <span>Regional Healthcare Infrastructure</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Built for the Realities of Indian Healthcare
              </h2>
              <p className="text-sm text-muted-foreground">
                Engineered from the ground up for diverse languages, varying network bandwidth, and ABDM-aligned public healthcare systems.
              </p>
            </div>

            <div className="bento-grid grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'English, Hindi & Odia Native',
                  desc: 'Immediate real-time language switching with persistent locale preservation for both patient intake and clinical reviewer dashboards.',
                  icon: Globe,
                },
                {
                  title: 'Low-Bandwidth Resilience',
                  desc: 'Optimized asset delivery, local offline audio recording, and minimal JSON payload payloads engineered for 2G/3G rural networks.',
                  icon: Cpu,
                },
                {
                  title: 'ABDM-Ready Architecture',
                  desc: 'Aligned with Ayushman Bharat Digital Mission (ABDM) standards, FHIR resource schemas, and privacy-conscious data retention protocols.',
                  icon: Building2,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bento-card glass-card p-6 rounded-2xl space-y-3"
                  >
                    <div className="p-2.5 bg-primary/10 text-primary dark:text-accent w-fit rounded-lg border border-primary/20 backdrop-blur-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Operational Footer */}
        <footer className="bg-card/80 backdrop-blur-xl border-t border-border/80 py-12 px-4 sm:px-6 lg:px-8 text-muted-foreground">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-1.5 rounded text-primary-foreground">
                <HeartPulse className="w-4 h-4 text-accent" />
              </div>
              <span className="font-mono text-sm font-bold text-foreground">MedicalTriage Clinical OS</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              A clinical decision-support and triage preparation tool. Strictly non-diagnostic. Human clinical oversight mandatory.
            </p>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <Link href="/patient/intake" className="hover:text-foreground transition-colors">
                Patient Intake
              </Link>
              <span>•</span>
              <Link href="/reviewer" className="hover:text-foreground transition-colors">
                Reviewer Portal
              </Link>
              <span>•</span>
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
