'use client';

import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -8 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
    });

    lenisRef.current = lenis;
    if (typeof window !== 'undefined') {
      (window as any).__lenis = lenis;
    }

    // Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);

    // Allow GSAP lag smoothing to absorb frame drops gracefully
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      if (typeof window !== 'undefined' && (window as any).__lenis === lenis) {
        delete (window as any).__lenis;
      }
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
    };
  }, []);

  return <>{children}</>;
}

export function smoothScrollTo(
  targetSelectorOrId: string,
  options?: { offset?: number; duration?: number; highlight?: boolean }
) {
  if (typeof window === 'undefined') return;

  const id = targetSelectorOrId.startsWith('#')
    ? targetSelectorOrId.slice(1)
    : targetSelectorOrId;
  const target = document.getElementById(id) || document.querySelector(targetSelectorOrId);

  if (!target) return;

  const lenis = (window as any).__lenis as Lenis | undefined;
  const offset = options?.offset ?? -76;
  const duration = options?.duration ?? 1.25;

  if (lenis) {
    lenis.scrollTo(target as HTMLElement, {
      offset,
      duration,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
  } else {
    const y = (target as HTMLElement).getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  if (options?.highlight !== false) {
    // Elegant luminous focal pulse on destination section
    gsap.fromTo(
      target,
      {
        boxShadow: 'inset 0 0 0 2px hsl(var(--primary) / 0.6), 0 0 35px -5px hsl(var(--primary) / 0.35)',
      },
      {
        boxShadow: 'inset 0 0 0 2px hsl(var(--primary) / 0), 0 0 0px 0px hsl(var(--primary) / 0)',
        duration: 1.6,
        delay: 0.2,
        ease: 'power2.out',
        clearProps: 'boxShadow',
      }
    );
  }
}
