# Phase 10 — Missing Information & Follow-Up Questions Documentation

## Overview
Phase 10 introduces reviewer-facing analysis of information gaps and suggested neutral follow-up questions within the **Medical Triage Assistant**.

The primary objective is to assist qualified health workers in identifying missing intake narrative details before completing human case review.

---

## Primary Architectural & Safety Contracts

### 1. Single-Pass Pipeline (No Second AI Call)
- Integrates directly into the single Phase 8 extraction pipeline (`extractSymptoms`).
- Does **NOT** introduce a second Gemini request, secondary AI service, or redundant provider calls.
- Persists missing information items (`missingInformationItems`) and follow-up questions (`followUpQuestionItems`) atomically within `TriageNote`.

### 2. Strict Safety & Non-Diagnostic Invariants
- **No Diagnosis**: Never asserts diagnoses or infers disease conditions.
- **Strict Question Filtering**: Unsafe questions containing diagnostic terms (e.g. *pneumonia*, *infection*, *malaria*), leading phrasing (*"right?"*), treatment recommendations, or unsupported symptoms are **strictly rejected and dropped** by deterministic validation. They are never mechanically rewritten into safe questions.
- **Completeness vs. Urgency**: Missing information importance (`CRITICAL`, `IMPORTANT`, `OPTIONAL`) describes **data completeness only**. `missingInformation.importance === CRITICAL` has **zero effect** on `Case.priority` or medical triage urgency.
- **System-Owned Authoritative IDs**: System normalizer generates authoritative IDs (`gap-1`, `gap-2`) and validates that every `linkedMissingInformationId` resolves to an existing gap. Questions with invalid references are rejected.

### 3. Human-in-the-Loop & Non-Autonomous Communication
- Suggested follow-up questions are reviewer-facing suggestions only.
- The system does **NOT** communicate with patients automatically via SMS, email, chatbot, or push notifications.

---

## Data Models

### MissingInformationItem Schema
```typescript
export interface IMissingInformationItem {
  id: string; // System-authoritative ID (e.g. "gap-1")
  field?: string; // Information field (e.g. "fever_duration")
  topic?: string; // Display topic (e.g. "Fever Duration")
  description: string; // Descriptive gap statement
  importance: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL'; // Information completeness level
  reason?: string; // Reason why information is valuable
  source: 'PATIENT_NARRATIVE' | 'STRUCTURED_SYMPTOMS' | 'TIMELINE' | 'REPORT';
  provenance: 'AI_GENERATED' | 'HUMAN_VERIFIED';
}
```

### FollowUpQuestionItem Schema
```typescript
export interface IFollowUpQuestionItem {
  id: string; // Question ID (e.g. "q-1")
  question: string; // Neutral, non-leading question text
  linkedMissingInformationId?: string; // Validated link to IMissingInformationItem.id
  priority: 'HIGH' | 'MEDIUM' | 'LOW'; // Question priority
  reason?: string; // Goal of the question
  answerType: 'TEXT' | 'YES_NO' | 'DATE' | 'DURATION' | 'NUMBER' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'UNKNOWN';
  provenance: 'AI_GENERATED' | 'HUMAN_VERIFIED';
}
```

---

## Audit Logging

Phase 10 registers two new audit event types in `AuditEventType`:
- `MISSING_INFORMATION_GENERATED`: Emitted upon successful atomic persistence of `TriageNote` containing missing information and questions.
- `MISSING_INFORMATION_GENERATION_FAILED`: Emitted in the `catch` block if extraction or database persistence fails.

Audit metadata includes safe operational counters (`missingInformationCount`, `followUpQuestionCount`, `provider`, `model`) and **never contains** raw patient narrative, prompt text, or API credentials.

---

## Authorization & Facility Isolation

- **Authentication**: All endpoints require valid JWT credentials.
- **RBAC**: Restricted to reviewer roles (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`). `PATIENT` role requests return `403 FORBIDDEN`.
- **Facility Isolation**: Non-ADMIN reviewers attempting to fetch missing information for cases belonging to another facility receive `403 FORBIDDEN`.

---

## Endpoints

### 1. `POST /api/reviewer/cases/:caseId/extraction`
- Runs single-pass extraction, deterministic normalizers (timeline + missing info), persists findings in `TriageNote`, and returns `ExtractionResponse`.

### 2. `GET /api/reviewer/cases/:caseId/missing-information`
- Returns persisted `missingInformationItems` and `followUpQuestionItems` for a case with facility-level authorization.
