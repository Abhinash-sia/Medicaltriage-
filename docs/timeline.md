# Patient Timeline Summarization (Phase 9 Documentation)

> **IMPORTANT SAFETY DISCLAIMER**  
> Timeline summarization is organizational assistance only. It organizes reported symptom events, timing phrases, encounters, and medications chronologically for human review. It does NOT diagnose, infer disease progression, calculate urgency, recommend treatments, or replace a qualified healthcare professional.

---

## 1. System Overview

Phase 9 introduces a structured, reviewer-facing chronological timeline derived deterministically from patient narratives and structured AI extraction.

### Core Pipeline

```text
Patient Narrative (chiefComplaint)
       │
       ▼
Phase 8 Information Extraction (Gemini 2.5 Flash)
       │
       ▼
Phase 9 Timeline Normalization (Deterministic Application Logic)
       │
       ├── Chronological event sorting (oldest → newest → intake)
       ├── Preserves relative/approximate wording ("~3 days ago", "around Monday")
       ├── Groups ambiguous/unknown dates under "Time unclear"
       ├── Deduplicates identical entries without losing distinct events
       └── Preserves contradictory timing statements (certainty: UNCERTAIN)
       │
       ▼
TriageNote.timelineEvents (MongoDB Persistence)
       │
       ▼
Reviewer Timeline UI (Dashboard)
```

---

## 2. Core Safety Invariants

1. **Non-Diagnostic**: The timeline organizes reported observations factually. It never infers causality, treatment efficacy, or disease progression (e.g. "Patient reported taking paracetamol" vs "Patient treated fever").
2. **Priority & SLA Independence**: Timeline processing NEVER modifies `Case.priority`, `assignedReviewerId`, or `slaDueAt`.
3. **No False Temporal Precision**: Relative timing ("3 days ago", "around Monday") is preserved as relative wording. The system NEVER invents exact calendar dates.
4. **Provenance**: Timeline events derived by AI have `source = AI_EXTRACTION` and `provenance = AI_GENERATED`. AI output is NEVER automatically marked `HUMAN_VERIFIED`.
5. **Fail-Safe Behavior**: If extraction or normalization fails, state becomes `FAILED`. The reviewer can still access original intake narrative and symptoms safely.

---

## 3. Timeline Event Schema

Every timeline event is represented by the `ITimelineEvent` structure:

```typescript
export interface ITimelineEvent {
  eventType?: 'SYMPTOM_ONSET' | 'SYMPTOM_CHANGE' | 'MEDICAL_ENCOUNTER' | 'REPORT' | 'MEDICATION' | 'OTHER';
  date?: string | null;           // Stated exact date (e.g. "2026-09-20") or null
  relativeTime?: string | null;   // Stated relative timing (e.g. "3 days ago", "around Monday")
  description: string;           // Concise event description
  source: 'PATIENT' | 'AI_EXTRACTION' | 'REPORT' | 'VOICE_TRANSCRIPT';
  provenance: 'AI_GENERATED' | 'HUMAN_VERIFIED';
  certainty: 'CERTAIN' | 'APPROXIMATE' | 'UNCERTAIN';
  sourceQuote?: string | null;   // Supporting quote from narrative
}
```

---

## 4. API Endpoints

- `POST /api/reviewer/cases/:caseId/extraction`: Extracts structured facts and persists normalized timeline events in `TriageNote.timelineEvents`.
- `GET /api/reviewer/cases/:caseId/timeline`: Retrieves persisted, normalized timeline events.

### Security & Scope
- Requires JWT authentication.
- Requires authorized reviewer role (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`).
- Enforces facility scope. Reviewers from Facility A cannot view timelines from Facility B.

---

## 5. Audit Events

- `TIMELINE_GENERATED` (Outcome: SUCCESS)
- `TIMELINE_GENERATION_FAILED` (Outcome: FAILURE)

Audit log metadata contains safe operational metrics (`provider`, `model`, `status`, `timelineEventCount`) and excludes raw narratives or API keys.
