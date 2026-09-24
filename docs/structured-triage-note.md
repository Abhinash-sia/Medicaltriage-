# Phase 16 — Structured Triage Note Architecture

## 1. Overview & Core Objective

The **Structured Triage Note** module compiles a versioned, reviewer-facing structured snapshot of all accumulated case evidence (symptoms, lab/OCR reports, voice transcripts, visual observations, translations, missing information, and active safety evaluation signals).

Its primary objective is to present clinical reviewers with an organized, evidence-linked summary to streamline human clinical review and decision making.

> **CRITICAL CLINICAL NEUTRALITY BOUNDARY**:
> - The Structured Triage Note is a **compiled versioned snapshot**, NEVER the canonical source of evidence. Canonical evidence resides in underlying models (`Case`, `Symptom`, `Report`, `VoiceInput`, `VisualInput`, `Translation`, `SafetyEvaluation`).
> - Triage Note generation and human verification are strictly operational and information review procedures.
> - Verification explicitly confirms that information has been reviewed for triage review purposes. It **NEVER** implies diagnosis, treatment recommendation, prescription, medical clearance, referral, or discharge authorization.
> - Triage Note generation and verification MUST NEVER mutate:
>   - `Case.priority`
>   - `Case.slaDueAt`
>   - `SafetyEvaluation` states
>   - Case assignment or escalation state

---

## 2. Deterministic Evidence Assembly & Fingerprinting

### 2.1 100% Deterministic Fingerprinting (`sourceEvidenceHash`)

Triage Note generation is 100% deterministic (0 LLM or external AI calls). Evidence fingerprinting computes a canonical SHA-256 hash over case metadata, sorted symptoms, reports, voice transcripts, visual observations, translations, and the ACTIVE `SafetyEvaluation`:

$$\text{sourceEvidenceHash} = \text{SHA256}(\text{JSON.stringify}(\text{CanonicalEvidence}))$$

### 2.2 Idempotency & Versioning Rules

1. **Unchanged Evidence**: If evidence assembly produces a `sourceEvidenceHash` matching the existing ACTIVE note, the service returns the existing ACTIVE note with `isNew: false` without creating a database version increment or audit event.
2. **Changed Evidence**: If evidence has changed (new symptom, uploaded report, new translation, active safety evaluation change), the existing note transitions from `ACTIVE` to `SUPERSEDED`, `Case.currentNoteVersion` increments, and a new `ACTIVE` note is created (`isNew: true`).

---

## 3. Database Schema & Partial Unique Index

`TriageNote` schema includes:
- `caseId`: Reference to `Case`
- `noteVersion`: Version number (1, 2, 3...)
- `status`: `'ACTIVE' | 'SUPERSEDED'`
- `sourceEvidenceHash`: SHA-256 evidence fingerprint
- `symptomsSection`: Structured array of symptoms with severity, duration, body site, and provenance
- `reportsSection`: Structured array of uploaded reports, OCR status, and key findings
- `voiceSection`: Voice transcripts and duration
- `visualSection`: Visual observation descriptions and key findings
- `translationsSection`: Multi-language translation pairs and verification status
- `safetyReviewSection`: Active Safety Evaluation priority and triggered rule summary
- `reviewerAttentionSection`: Counts of critical signals, unverified inputs, uncertainties, and required actions
- `provenance`: `'AI_GENERATED' | 'HUMAN_VERIFIED'`
- `reviewedBy`: Reviewer User ID
- `reviewedAt`: Verification timestamp
- `reviewerNotes`: Operational reviewer comments

### Partial Unique Index
To prevent concurrent duplicate active notes:
```ts
TriageNoteSchema.index(
  { caseId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
```

---

## 4. Transaction & Fallback Versioning Strategy

Following Phase 15 architectural patterns:
- **Replica Set / Sharded Deployments**: Enclosed in multi-document MongoDB ACID session transactions. Version increment, note superseding, active note creation, and audit logging execute atomically.
- **Standalone MongoDB Deployments**: Single-document atomic operations execute with partial unique index protection.

---

## 5. Security & Isolation Controls

1. **Patient Access Blocked (HTTP 403)**: All triage note routes (`/api/reviewer/cases/:caseId/triage-note/*`) require reviewer JWT credentials (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`). Patient JWT requests return HTTP 403.
2. **Facility Isolation**: Cases are scoped to `facilityId`. Requests from reviewers belonging to a different facility return HTTP 403 (`"Unauthorized access to case from another facility"`).

---

## 6. Audit Logging

Four dedicated audit events track triage note lifecycle:
- `TRIAGE_NOTE_GENERATED`: Logged when an initial active note is compiled.
- `TRIAGE_NOTE_REGENERATED`: Logged when new evidence creates a superseded prior version and a new active version.
- `TRIAGE_NOTE_VERIFIED`: Logged when a clinical reviewer completes operational information review.
- `TRIAGE_NOTE_GENERATION_FAILED`: Logged if an unhandled error occurs during note compilation.
