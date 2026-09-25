'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  HeartPulse,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  FileSearch,
  Eye,
  Globe,
  Building2,
  Lock,
  History,
  Workflow,
  Stethoscope,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/i18n/LanguageContext';

export default function PublicLandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl text-white shadow-md">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">MedicalTriage</span>
              <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                PROTOTYPE
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              How It Works
            </a>
            <a href="#capabilities" className="hover:text-blue-600 transition-colors">
              Capabilities
            </a>
            <a href="#safety" className="hover:text-blue-600 transition-colors">
              Safety Boundary
            </a>
            <a href="#india-context" className="hover:text-blue-600 transition-colors">
              India Context
            </a>
            <a href="#demo" className="hover:text-blue-600 transition-colors">
              Demo Access
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <LanguageSelector variant="full" />
            <Link href="/login">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex items-center gap-1.5">
                <LogIn className="w-4 h-4" />
                {t('common.login')}
              </Button>
            </Link>
            <Link href="/patient/intake">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                {t('landing.patientPortal')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-blue-50/30 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Human-in-the-Loop Clinical Triage Assistant</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Human-in-the-loop triage, <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                built for faster clinical review.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Organize symptoms, voice transcripts, lab OCR reports, visual observations, and timelines into structured information for qualified healthcare professionals.
            </p>

            {/* Non-Diagnostic Key Badges */}
            <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs font-semibold">
              <Badge variant="outline" className="bg-white/80 border-slate-300 text-slate-700 px-3 py-1">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Non-Diagnostic
              </Badge>
              <Badge variant="outline" className="bg-white/80 border-slate-300 text-slate-700 px-3 py-1">
                <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Qualified Human Review
              </Badge>
              <Badge variant="outline" className="bg-white/80 border-slate-300 text-slate-700 px-3 py-1">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Privacy-Conscious
              </Badge>
              <Badge variant="outline" className="bg-white/80 border-slate-300 text-slate-700 px-3 py-1">
                <Globe className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Multilingual India-Ready
              </Badge>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/patient/intake">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-base shadow-md">
                  Get Started (Patient Intake)
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/reviewer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-800 font-semibold px-8 py-6 text-base hover:bg-white shadow-xs">
                  Reviewer Workspace Queue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Non-Diagnostic Safety Disclaimer Banner */}
      <section className="bg-amber-500/10 border-y border-amber-300/60 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl border border-amber-300 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-slate-800">
            <h3 className="font-bold text-sm text-amber-900 tracking-wide uppercase">
              Strict Non-Diagnostic & Human-in-the-Loop Safety Boundary
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
              MedicalTriage is built to assist — not replace — qualified healthcare professionals. It organizes and surfaces structured patient information, timelines, and safety signals. It does <strong>not</strong> diagnose medical conditions, prescribe treatment, or independently make clinical decisions.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">How The System Works</h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A continuous, transparent workflow connecting patient intake to clinician decision-support and referral escalation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                step: '01',
                title: 'Patient Intake',
                desc: 'Text, voice transcript, lab PDF, or visual observations.',
                icon: FileText,
                color: 'text-blue-600 bg-blue-50 border-blue-200',
              },
              {
                step: '02',
                title: 'AI Extraction',
                desc: 'Structured symptom normalization & provenance hash.',
                icon: Workflow,
                color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
              },
              {
                step: '03',
                title: 'Timeline & Gaps',
                desc: 'Chronological timeline & missing information prompts.',
                icon: History,
                color: 'text-purple-600 bg-purple-50 border-purple-200',
              },
              {
                step: '04',
                title: 'Safety Signals',
                desc: '22-rule urgency evaluation (URGENT/PRIORITY/ROUTINE).',
                icon: ShieldAlert,
                color: 'text-amber-600 bg-amber-50 border-amber-200',
              },
              {
                step: '05',
                title: 'Reviewer Queue',
                desc: 'Facility isolation queue with operational SLA tracking.',
                icon: Users,
                color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              },
              {
                step: '06',
                title: 'Human Action',
                desc: 'Clinician verification, priority override, or tertiary referral.',
                icon: CheckCircle2,
                color: 'text-rose-600 bg-rose-50 border-rose-200',
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <Card key={idx} className="border border-slate-200 shadow-xs relative hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-400">{s.step}</span>
                      <div className={`p-2 rounded-lg border ${s.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-slate-600 leading-normal">{s.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="capabilities" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Core Capabilities</h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Comprehensive decision-support tools engineered for high-volume healthcare settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Multimodal Intake',
                desc: 'Supports text narratives, audio voice intake, PDF laboratory OCR reports, and visual clinical observations.',
                icon: Mic,
              },
              {
                title: '22-Rule Safety Engine',
                desc: 'Deterministic safety rules categorizing cases into URGENT, PRIORITY, or ROUTINE based on clinical red flags.',
                icon: ShieldAlert,
              },
              {
                title: 'Multilingual India Support',
                desc: 'Instant translation across 8 regional languages including Hindi, Odia, Bengali, Tamil, Telugu, Marathi, Gujarati.',
                icon: Globe,
              },
              {
                title: 'Structured Triage Notes',
                desc: 'Auto-generated notes highlighting chief complaints, pertinent positives, pertinent negatives, and red flags.',
                icon: FileText,
              },
              {
                title: 'Timeline & Gap Analysis',
                desc: 'Chronological clinical event timelines and automated missing information follow-up detection.',
                icon: History,
              },
              {
                title: 'Facility Isolation & Referrals',
                desc: 'Strict facility queue boundary with authorized cross-facility referral state machine (Pending -> Accepted -> Completed).',
                icon: Building2,
              },
            ].map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <Card key={idx} className="bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                  <CardHeader className="space-y-2">
                    <div className="p-2.5 bg-blue-50 text-blue-700 w-fit rounded-xl border border-blue-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">{cap.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{cap.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* India Context Section */}
      <section id="india-context" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-800">
              India Healthcare Setting Context
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Designed for Constrained Public Healthcare Environments
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Tailored for high-throughput public health settings across district hospitals, rural health centers, and community health camps.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              'Government Hospitals',
              'Primary Health Centres (PHCs)',
              'Public Health Camps',
              'Campus Clinics',
              'Occupational Health Units',
              'Referral Workflows',
              'Multilingual Populations',
              'Human-in-the-loop Review',
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-medium text-xs text-slate-800 flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Synthetic Demo Access CTA */}
      <section id="demo" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-slate-800 border border-slate-700 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Synthetic Demo</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Explore the Workflow with Deterministic Synthetic Cases
          </h2>

          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            See how a synthetic patient case moves seamlessly from intake narrative to structured extraction, timeline generation, 22-rule safety evaluation, and clinical reviewer escalation.
          </p>

          {/* Persona 1-Click Launch Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left pt-4">
            <Link href="/patient/intake">
              <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl hover:border-blue-500 transition-colors cursor-pointer space-y-2">
                <div className="flex items-center justify-between text-blue-400 font-bold text-sm">
                  <span>Patient Intake Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-400">Submit multi-step intake with symptoms, voice, or PDF reports.</p>
              </div>
            </Link>

            <Link href="/reviewer">
              <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl hover:border-emerald-500 transition-colors cursor-pointer space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
                  <span>Reviewer Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-400">Explore reviewer queue, SLA timers, triage notes & overrides.</p>
              </div>
            </Link>

            <Link href="/admin">
              <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl hover:border-purple-500 transition-colors cursor-pointer space-y-2">
                <div className="flex items-center justify-between text-purple-400 font-bold text-sm">
                  <span>Admin Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-400">View facility management, retention overview, and audit logs.</p>
              </div>
            </Link>
          </div>

          <div className="pt-4 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Seed Command:</span> Execute <code>npm run seed:test-data</code> in the backend to populate standard synthetic demo records.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-white font-bold text-sm">
              <HeartPulse className="w-4 h-4 text-blue-500" />
              <span>MedicalTriage</span>
            </div>
            <p className="max-w-md text-slate-500">
              Human-in-the-loop decision-support assistant. Prototype built for evaluation purposes only. Not for medical diagnosis or independent clinical decisions.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-slate-400 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#safety" className="hover:text-white transition-colors">Safety Boundary</a>
            <Link href="/patient/intake" className="hover:text-white transition-colors">Patient Intake</Link>
            <Link href="/reviewer" className="hover:text-white transition-colors">Reviewer Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

