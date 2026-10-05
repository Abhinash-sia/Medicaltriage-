'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Volume2,
  FileCheck2,
  Stethoscope,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function HeroTelemetryCockpit() {
  const [pulse, setPulse] = useState(72);
  const [spo2, setSpo2] = useState(98);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => 70 + Math.floor(Math.random() * 6));
      setSpo2((prev) => 97 + Math.floor(Math.random() * 3));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel w-full rounded-2xl p-6 space-y-6 transition-all duration-300 relative overflow-hidden">
      {/* Specular Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent pointer-events-none" />

      {/* Top Cockpit Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-foreground">LIVE CLINICAL WORKSPACE</div>
            <div className="font-mono text-[10px] text-muted-foreground">ODISHA EMERGENCY NETWORK • NODE #442</div>
          </div>
        </div>
        <Badge variant="outline" className="glass-pill font-mono text-[10px] text-primary dark:text-accent">
          ESTABLISHED 24/7
        </Badge>
      </div>

      {/* Real-time Voice Audio Visualizer Mock */}
      <div className="space-y-2 bg-muted/40 dark:bg-black/40 p-3.5 rounded-xl border border-border/70 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-primary dark:text-accent" />
            Audio Stream (Odia / Hindi / English)
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">16kHz Ingesting</span>
        </div>

        {/* Animated Audio Bars */}
        <div className="h-9 flex items-center justify-between gap-1 px-1">
          {[40, 75, 30, 90, 60, 45, 85, 100, 70, 50, 80, 65, 95, 40, 60, 85, 55, 70, 90, 45, 60, 75, 35].map(
            (height, i) => (
              <div
                key={i}
                className="w-full bg-primary/70 dark:bg-accent rounded-full animate-pulse transition-all duration-300"
                style={{
                  height: `${height}%`,
                  animationDelay: `${(i % 5) * 150}ms`,
                }}
              />
            )
          )}
        </div>
      </div>

      {/* Live Vitals Gauge Grid (Glass Cards) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>HEART RATE</span>
            <Activity className="w-3 h-3 text-rose-500" />
          </div>
          <div className="text-lg font-mono font-bold text-foreground tabular-nums">{pulse} <span className="text-xs font-normal text-muted-foreground">bpm</span></div>
        </div>

        <div className="glass-card p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>SpO2 OXYGEN</span>
            <Sparkles className="w-3 h-3 text-sky-500" />
          </div>
          <div className="text-lg font-mono font-bold text-foreground tabular-nums">{spo2}% <span className="text-xs font-normal text-muted-foreground">Room Air</span></div>
        </div>

        <div className="glass-card p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>SLA TIMER</span>
            <Clock className="w-3 h-3 text-primary dark:text-accent" />
          </div>
          <div className="text-lg font-mono font-bold text-foreground tabular-nums">14:52 <span className="text-xs font-normal text-muted-foreground">min</span></div>
        </div>
      </div>

      {/* Deterministic Guardrail Status Pill */}
      <div className="glass-pill flex items-center justify-between p-3 rounded-xl">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-primary dark:text-accent shrink-0" />
          <span className="text-xs font-mono font-semibold text-foreground">22 Clinical Rules Guardrail</span>
        </div>
        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Zero Violations
        </span>
      </div>
    </div>
  );
}
