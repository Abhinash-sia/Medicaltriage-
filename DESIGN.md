# Sevansh — Design System & Visual Specification

This document details the redesigned visual, typographic, and motion system for the **Sevansh** clinical triage platform.

---

## 1. Design Philosophy

- **Quiet, Precise, Operational:** Inspired by systems like Linear, Vercel Dashboard, and Raycast.
- **Legibility & Calm Over Flair:** A clinical triage tool demands high contrast, zero distracting noise, and immediate operational clarity.
- **Strict Anti-"AI Slop" Guardrails:**
  - Zero purple-to-blue decorative gradients, gradient text, or glowing orbs.
  - No decorative emojis; all provenance badges use monochrome Lucide chips.
  - Hairline 1px borders (`border-border`), 6px to 8px border radii (`rounded-[6px]`), and minimal shadows (`shadow-2xs`).
  - Strict semantic reservation of red (`#D93C45`), amber (`#E8A33A`), and green (`#2E9E6B`) for clinical triage urgency only.

---

## 2. Design Tokens

### Light Theme
| Token | Hex | HSL Variable | Purpose |
| :--- | :--- | :--- | :--- |
| `background` | `#F2F6F7` | `195 20% 96%` | Base background |
| `foreground` | `#0C171B` | `196 38% 8%` | High-contrast body text |
| `card` | `#FFFFFF` | `0 0% 100%` | Card & surface background |
| `border` | `#D9E3E6` | `193 18% 88%` | Hairline dividers and borders |
| `muted-foreground` | `#5B6F76` | `195 13% 41%` | Subdued metadata and helper text |
| `primary` | `#0F6F73` | `182 77% 25%` | Deep teal primary actions & CTAs |
| `accent` | `#38D9C8` | `173 68% 54%` | Ice highlight for focus rings and subtle indicators |

### Dark Theme
| Token | Hex | HSL Variable | Purpose |
| :--- | :--- | :--- | :--- |
| `background` | `#090F12` | `200 33% 5%` | Base dark background |
| `foreground` | `#E6EEF0` | `192 23% 92%` | High-contrast dark text |
| `card` | `#0F181C` | `200 30% 8%` | Dark card surface |
| `border` | `#1C2B31` | `198 27% 15%` | Hairline dark borders |
| `muted-foreground` | `#7E9299` | `195 12% 55%` | Subdued dark metadata |
| `primary` | `#38D9C8` | `173 68% 54%` | Ice accent primary in dark mode |
| `accent` | `#7AE8DC` | `173 70% 69%` | Focus ring and hover highlights |

### Semantic Urgency Tokens (Desaturated)
| Urgency | Hex | HSL Variable | SLA Target | Styling |
| :--- | :--- | :--- | :--- | :--- |
| **URGENT** | `#D93C45` | `356 66% 55%` | 1 Hour | `10% alpha bg`, `30% alpha border`, solid text, subtle 1.4s pulse |
| **PRIORITY** | `#E8A33A` | `36 80% 57%` | 4 Hours | `12% alpha bg`, `30% alpha border`, solid text |
| **ROUTINE** | `#2E9E6B` | `152 55% 40%` | 24 Hours | `12% alpha bg`, `30% alpha border`, solid text |

---

## 3. Typography & Scale

Loaded via `next/font/google`:
- **UI & Headings:** `Instrument_Sans` (`var(--font-sans)`)
- **Data, Case IDs & Timers:** `JetBrains_Mono` (`var(--font-mono)`, `tabular-nums`)

### Scale Hierarchy
- **Case Reviewer & Admin Body:** Compact 12px to 13px (`text-xs`) with tight line heights.
- **Patient Intake Body:** Readable 14px to 16px (`text-sm` / `text-base`) with minimum 44px touch targets.
- **Headings:** `tracking-tight font-bold`.

---

## 4. Motion System (GSAP)

Located in [`frontend/src/lib/motion.ts`](file:///home/abhi/Medicaltriage-/frontend/src/lib/motion.ts):

```typescript
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
};
```

### Key Animations
1. **Reviewer Queue:** Staggered entrance (`y: 14, stagger: 0.03, ease: 'power3.out'`). When filter or queue order updates, **GSAP Flip** smoothly glides cards to new positions.
2. **Urgent Cards Pulse:** Slow subtle box-shadow pulse (`1.4s ease-in-out infinite`) applied only to `URGENT` status cards.
3. **Continuous SLA Meters:** Thin horizontal bars that transition continuously from teal to amber to red as remaining time drops.
4. **Intake Stepper:** Timeline transitions where outgoing steps slide -16px and fade, while incoming steps enter from +16px with focus management on the step heading.
5. **Audio Waveform Recorder:** Web Audio API `AnalyserNode` frequency bins animated into live waveform bars via GSAP `quickTo`.
6. **Accessibility & Reduced Motion:** All animations wrapped with `withMotion()` checking `(prefers-reduced-motion: reduce)`.

---

## 5. Component Patterns & Attributions

- **Sourced Patterns:**
  - 21st.dev reference designs: Command palette (`Cmd+K`), status chips, stepper progress, file dropzone.
  - Skiper UI patterns: Smooth caret input, animated count metrics, progressive blur on queue edges.
  - *Attribution:* UI components inspired by and structured following 21st.dev and Skiper UI design patterns.
