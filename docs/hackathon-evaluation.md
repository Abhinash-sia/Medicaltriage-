# MedicalTriage — Hackathon Evaluation Criteria Mapping

> **Factual System Capabilities & Evaluation Mapping**
> *Note: This document maps implemented software features and modules to standard evaluation criteria for hackathon judges and evaluators.*

---

## 1. Safety-First Triage

| Criterion | Implementation Status | Technical Evidence & Module Location |
| :--- | :--- | :--- |
| **Non-Diagnostic Boundary** | Implemented | System outputs advisory information only; never generates diagnoses or prescriptions. Covered by disclaimers across UI, API, and [`docs/safety.md`](./safety.md). |
| **Deterministic Precedence** | Implemented | 22-rule safety engine enforces strict precedence: `URGENT > PRIORITY > ROUTINE`. Implemented in [`backend/src/modules/safety/`](../backend/src/modules/safety/). |
| **Fail-Safe Precedence** | Implemented | System errors, AI provider timeouts, or schema uncertainties automatically default fail-safe to `PRIORITY`. Tested in [`backend/tests/safety.test.ts`](../backend/tests/safety.test.ts). |
| **Safe Phrasing** | Implemented | Routine cases display *"No configured higher-priority review signal detected"* rather than false guarantees of patient health. |

---

## 2. Information Extraction & Summarization

| Criterion | Implementation Status | Technical Evidence & Module Location |
| :--- | :--- | :--- |
| **Structured Entity Extraction** | Implemented | Parses unstructured symptom narratives into structured symptom logs, severity ratings, and body locations. Implemented in [`backend/src/modules/reviewer/`](../backend/src/modules/reviewer/). |
| **Timeline Assembly** | Implemented | Constructs chronological timelines combining intake text, report dates, voice notes, and clinical events. Implemented in [`backend/src/modules/reviewer/timeline.service.ts`](../backend/src/modules/reviewer/timeline.service.ts). |
| **Missing Information Detection** | Implemented | Identifies completeness gaps (e.g., missing onset, unstated duration) and suggests neutral reviewer follow-up questions. Implemented in [`backend/src/modules/reviewer/missing-information.service.ts`](../backend/src/modules/reviewer/missing-information.service.ts). |

---

## 3. Multimodal Handling (Text, Speech, Reports, Vision)

| Criterion | Implementation Status | Technical Evidence & Module Location |
| :--- | :--- | :--- |
| **Medical Report OCR** | Implemented | Accepts PDF and image report uploads; extracts text via Google Cloud Vision API or Mock provider. Implemented in [`backend/src/modules/reports/`](../backend/src/modules/reports/). |
| **Visual Observations** | Implemented | Uploads clinical photos for reviewer inspection with vision observations. Implemented in [`backend/src/modules/vision/`](../backend/src/modules/vision/). |
| **Speech-To-Text (STT)** | Implemented | Accepts audio voice recordings (WAV/WebM) and generates transcriptions via Sarvam AI API or Mock provider. Implemented in [`backend/src/modules/voice/`](../backend/src/modules/voice/). |
| **Multilingual Translation** | Implemented | Translates Indian regional language input (Hindi, Odia, Bengali, Tamil, Gujarati) into English with side-by-side verification cards. Implemented in [`backend/src/modules/translation/`](../backend/src/modules/translation/). |

---

## 4. India Relevance & Accessibility

| Criterion | Implementation Status | Technical Evidence & Module Location |
| :--- | :--- | :--- |
| **Public Health Setting Alignment** | Implemented | Designed for resource-constrained environments: PHCs, District Hospitals, Health Camps, Occupational Units. |
| **Low-Bandwidth & Resilient UI** | Implemented | Next.js frontend built with responsive layouts, lightweight bundles, and clear loading/error feedback. |
| **Accessibility & Contrast** | Implemented | Keyboard navigation, high-contrast priority badges, and explicit ARIA labels. |

---

## 5. Human Review, SLA & Inter-Facility Referrals

| Criterion | Implementation Status | Technical Evidence & Module Location |
| :--- | :--- | :--- |
| **Reviewer Queue & Ownership** | Implemented | Case queue with claim/release/assign semantics and multi-tenant facility isolation. Implemented in [`backend/src/modules/reviewer/`](../backend/src/modules/reviewer/). |
| **SLA Operational Tracking** | Implemented | Tracks SLA status (`PENDING`, `DUE SOON`, `OVERDUE`, `ESCALATED`) based on priority thresholds (`URGENT`=1h, `PRIORITY`=4h, `ROUTINE`=24h). Implemented in [`backend/src/modules/reviewer/sla.service.ts`](../backend/src/modules/reviewer/sla.service.ts). |
| **Explicit Provenance** | Implemented | Workspace displays clear badges (`PATIENT PROVIDED`, `AI GENERATED`, `HUMAN VERIFIED`). |
| **Inter-Facility Referrals** | Implemented | Formal referral creation, facility-to-facility transfer tracking, and status lifecycle (`PENDING` -> `ACCEPTED` / `REJECTED` -> `COMPLETED`). Implemented in [`backend/src/modules/referrals/`](../backend/src/modules/referrals/). |

---

## 6. Privacy, Governance & Responsible AI

| Criterion | Implementation Status | Technical Evidence & Module Location |
| :--- | :--- | :--- |
| **Authentication & RBAC** | Implemented | JWT Bearer authentication with strict role checks (`PATIENT`, `NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`). Implemented in [`backend/src/modules/auth/`](../backend/src/modules/auth/). |

| **Immutable Audit Trail** | Implemented | Chronological log tracking all intake, extraction, evaluation, review, and referral events. Implemented in [`backend/src/modules/audit/`](../backend/src/modules/audit/). |
| **Privacy & Retention** | Implemented | Data classification retention policies (`CLINICAL_CASE`, `MEDIA_BLOB`, `AI_DERIVED`, `AUDIT_LOG`) with automated purge engine. Implemented in [`backend/src/modules/retention/`](../backend/src/modules/retention/). |

---

## 7. Demo Reliability & E2E Validation

| Criterion | Implementation Status | Technical Evidence & Module Location |
| :--- | :--- | :--- |
| **Deterministic Synthetic Dataset** | Implemented | Seed service (`npm run seed:test-data`) creates 22 fictional cases across 3 facilities with zero real patient data. |
| **Playwright Golden E2E Test** | Implemented | Automated E2E test ([`frontend/e2e/golden-triage-workflow.spec.ts`](../frontend/e2e/golden-triage-workflow.spec.ts)) validates end-to-end pipeline in 6.4 seconds. |
| **Backend Integration Test Suite** | Implemented | 339 passing integration tests in [`backend/tests/`](../backend/tests/). |
