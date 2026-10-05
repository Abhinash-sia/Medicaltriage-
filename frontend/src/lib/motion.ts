import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

// Register Flip plugin safely in client environments
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Flip);
}

export { gsap, Flip };

export const MOTION = {
  duration: {
    fast: 0.2,
    base: 0.4,
    slow: 0.7,
  },
  ease: {
    entrance: 'power3.out',
    transition: 'power2.inOut',
    pulse: 'sine.inOut',
  },
} as const;

/**
 * Checks if the user prefers reduced motion.
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Wrapper to run GSAP animations respecting prefers-reduced-motion.
 * If reduced motion is preferred, callbacks receive an immediate completion mode.
 */
export function withMotion(animationCallback: () => void | gsap.core.Tween | gsap.core.Timeline) {
  if (isReducedMotion()) {
    return;
  }
  return animationCallback();
}
