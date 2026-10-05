'use client';

import React from 'react';
import Link from 'next/link';
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
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/i18n/LanguageContext';
import { SmoothScroll } from '@/components/landing/SmoothScroll';
import { TriageConstellation } from '@/components/landing/TriageConstellation';
import { TriageSimulator } from '@/components/landing/TriageSimulator';
import { StorytellingPipeline } from '@/components/landing/StorytellingPipeline';

export default function PublicLandingPage() {
  const { t } = useLanguage();

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#080E11] text-[#E6EEF0] flex flex-col font-sans selection:bg-[#38D9C8]/20 selection:text-[#38D9C8]">
        {/* Top Floating Glass Navigation */}
        <header className="sticky top-0 z-50 bg-[#080E11]/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-[#0F6F73] to-[#0A4B4E] p-2 rounded-lg text-white border border-[#38D9C8]/30 shadow-md">
                <HeartPulse className="w-5 h-5 text-[#38D9C8]" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono">MedicalTriage</span>
                <span className="text-[10px] font-mono bg-white/[0.05] text-[#38D9C8] px-2 py-0.5 rounded-full font-medium border border-[#38D9C8]/20">
                  {t('landing.prototype')}
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-muted-foreground">
              <a href="#how-it-works" className="hover:text-white transition-colors">
                {t('landing.navHowItWorks')}
              </a>
              <a href="#simulator" className="hover:text-white transition-colors">
                Live Simulator
              </a>
              <a href="#capabilities" className="hover:text-white transition-colors">
                {t('landing.navCapabilities')}
              </a>
              <a href="#safety" className="hover:text-white transition-colors">
                {t('landing.navSafety')}
              </a>
              <a href="#india-context" className="hover:text-white transition-colors">
                {t('landing.navIndiaContext')}
              </a>
            </nav>

            <div className="flex items-center space-x-3">
              <LanguageSelector variant="full" />
              <ThemeToggle />
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex items-center gap-1.5 border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.08] text-xs h-8"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {t('common.login')}
                </Button>
              </Link>
              <Link href="/patient/intake">
                <Button
                  size="sm"
                  className="bg-[#0F6F73] hover:bg-[#148388] text-white text-xs h-8 px-3.5 shadow-sm border border-[#38D9C8]/30 font-semibold"
                >
                  {t('landing.patientPortal')}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section with Live Three.js 3D Constellation */}
        <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-36 border-b border-white/10">
          <TriageConstellation />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/[0.04] border border-[#38D9C8]/30 text-[#38D9C8] px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase backdrop-blur-md shadow-lg">
                <span className="h-2 w-2 rounded-full bg-[#38D9C8] animate-pulse" />
                <span>HUMAN-IN-THE-LOOP CLINICAL TRIAGE ASSISTANT</span>
              </div>

              {/* H1 Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
                Human-in-the-loop triage, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38D9C8] via-[#7AE8DC] to-[#E6EEF0]">
                  engineered for clinical certainty.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Organize symptoms, voice transcripts, lab OCR reports, visual observations, and timelines into structured information for qualified healthcare professionals.
              </p>

              {/* Non-Diagnostic Key Badges */}
              <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs font-medium font-mono">
                <Badge variant="outline" className="bg-white/[0.03] border-white/10 text-foreground px-3 py-1">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-[#E8A33A]" />
                  Non-Diagnostic
                </Badge>
                <Badge variant="outline" className="bg-white/[0.03] border-white/10 text-foreground px-3 py-1">
                  <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-[#38D9C8]" />
                  Qualified Human Review
                </Badge>
                <Badge variant="outline" className="bg-white/[0.03] border-white/10 text-foreground px-3 py-1">
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-[#2E9E6B]" />
                  Privacy-Conscious
                </Badge>
                <Badge variant="outline" className="bg-white/[0.03] border-white/10 text-foreground px-3 py-1">
                  <Globe className="w-3.5 h-3.5 mr-1.5 text-[#7AE8DC]" />
                  Multilingual India-Ready
                </Badge>
              </div>

              {/* CTAs */}
              <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/patient/intake">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#0F6F73] hover:bg-[#148388] text-white font-semibold px-8 py-6 text-sm border border-[#38D9C8]/40 shadow-xl shadow-[#0F6F73]/20"
                  >
                    Get Started (Patient Intake)
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/reviewer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/15 bg-white/[0.03] text-foreground font-semibold px-8 py-6 text-sm hover:bg-white/[0.08]"
                  >
                    Reviewer Workspace Queue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Strict Non-Diagnostic & Safety Boundary Banner */}
        <section id="safety" className="bg-[#E8A33A]/5 border-y border-[#E8A33A]/20 py-6 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-[#E8A33A]/10 text-[#E8A33A] p-2.5 rounded-xl border border-[#E8A33A]/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold font-mono text-xs text-[#E8A33A] tracking-wider uppercase">
                STRICT NON-DIAGNOSTIC & HUMAN-IN-THE-LOOP SAFETY BOUNDARY
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                MedicalTriage is built to assist — not replace — qualified healthcare professionals. It organizes and surfaces structured patient information, timelines, and safety signals. It does not diagnose medical conditions, prescribe treatment, or independently make clinical decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Live Interactive Triage Sandbox (21st.dev Style Bento) */}
        <section id="simulator" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-gradient-to-b from-[#080E11] to-[#0A1216]">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-[#38D9C8] uppercase tracking-wider bg-[#38D9C8]/10 px-3 py-1 rounded-md border border-[#38D9C8]/20">
                <Cpu className="w-3.5 h-3.5" />
                <span>Interactive Demonstration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
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
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#080E11]">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-[#38D9C8] uppercase tracking-wider bg-[#38D9C8]/10 px-3 py-1 rounded-md border border-[#38D9C8]/20">
                <Workflow className="w-3.5 h-3.5" />
                <span>End-to-End Clinical Flow</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
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
        <section id="capabilities" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-gradient-to-b from-[#080E11] via-[#0B1519] to-[#080E11]">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-[#38D9C8] uppercase tracking-wider bg-[#38D9C8]/10 px-3 py-1 rounded-md border border-[#38D9C8]/20">
                <Layers className="w-3.5 h-3.5" />
                <span>Clinical Capabilities</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Engineered for High-Acuity Reliability
              </h2>
              <p className="text-sm text-muted-foreground">
                Built specifically to solve high-pressure triage bottlenecks in busy hospitals, rural clinics, and emergency departments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:border-[#38D9C8]/30 flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-[#0F6F73]/30 text-[#38D9C8] rounded-xl border border-[#38D9C8]/20 group-hover:scale-105 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                          {cap.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{cap.title}</h3>
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
        <section id="india-context" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#080E11]">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center space-x-1.5 font-mono text-xs text-[#7AE8DC] uppercase tracking-wider bg-[#7AE8DC]/10 px-3 py-1 rounded-md border border-[#7AE8DC]/20">
                <Globe className="w-3.5 h-3.5" />
                <span>Regional Healthcare Infrastructure</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Built for the Realities of Indian Healthcare
              </h2>
              <p className="text-sm text-muted-foreground">
                Engineered from the ground up for diverse languages, varying network bandwidth, and ABDM-aligned public healthcare systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-3"
                  >
                    <div className="p-2.5 bg-[#0F6F73]/20 text-[#38D9C8] w-fit rounded-lg border border-[#38D9C8]/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Operational Footer */}
        <footer className="bg-[#05090B] border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 text-muted-foreground">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-[#0F6F73] p-1.5 rounded text-white">
                <HeartPulse className="w-4 h-4 text-[#38D9C8]" />
              </div>
              <span className="font-mono text-sm font-bold text-white">MedicalTriage Clinical OS</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              A clinical decision-support and triage preparation tool. Strictly non-diagnostic. Human clinical oversight mandatory.
            </p>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <Link href="/patient/intake" className="hover:text-white transition-colors">
                Patient Intake
              </Link>
              <span>•</span>
              <Link href="/reviewer" className="hover:text-white transition-colors">
                Reviewer Portal
              </Link>
              <span>•</span>
              <Link href="/admin" className="hover:text-white transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
