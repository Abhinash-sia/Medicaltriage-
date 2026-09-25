# Quality & Testing Strategy (Phase 20)

## 1. Overview & Objectives

The testing strategy prioritizes **clinical safety invariants, authorization boundaries, multimodal failure resilience, and regression prevention** over arbitrary percentage targets.

---

## 2. Test Architecture & Pyramids

### 2.1 Test Directory Structure
```text
backend/tests/
├── fixtures/
│   └── factories.ts             # Centralized test document & token factories
├── auth.test.ts                 # JWT claims invariant, authentication, role verification
├── intake.test.ts               # Patient self-intake, consent validation, provenance
├── safety.test.ts               # Phase 15 Safety & Urgency Engine unit and integration tests
├── triage-note.test.ts          # Structured triage note generation, hashing, and versioning
├── reviewer.test.ts             # Clinician triage queue, reviews, and priority overrides
├── referral.test.ts             # Cross-facility referral state machine & authorization
├── notifications.test.ts        # In-app notifications, deduplication, fail-safe side effects
├── privacy-retention.test.ts    # Retention overview, purge execution, physical unlinking
├── admin-operations.test.ts     # User and facility administration, language configuration
├── india-readiness.test.ts      # Multilingual support, regional language preferences
├── ai-extraction.test.ts        # LLM structured extraction, prompt injection handling
├── reports-ocr.test.ts          # Medical report upload, OCR extraction, fallback behavior
├── voice-input.test.ts          # Audio upload, STT transcription, noise handling
├── visual-input.test.ts         # Clinical image upload, vision analysis, fallbacks
├── translation.test.ts          # Multi-language translation pipeline and fallback
├── timeline.test.ts             # Chronological clinical event timeline construction
├── missing-information.test.ts  # Clinical intake gap analysis and follow-up prompts
├── sla.test.ts                  # SLA policy enforcement (1h/4h/24h) and escalation
├── auditability.test.ts         # Immutable audit logging and actor attribution
├── models.test.ts               # Mongoose schema constraints, indices, and defaults
├── health.test.ts               # Healthcheck probe endpoint verification
└── security-hardening.test.ts   # Comprehensive Phase 20 security & regression suite
```

---

## 3. Core Testing Dimensions

### 3.1 Safety Engine 22-Rule Complete Coverage
All 22 deterministic safety rules implemented in Phase 15 are systematically tested with positive, negative, and combined scenarios:
* **10 Urgent Rules**: Reviewer escalation, severe dyspnea, chest pain + dyspnea, altered consciousness, severe hemorrhage, active seizure, self-harm language, severe anaphylaxis, configured pediatric threshold, critical clinician lab threshold.
* **5 Priority Rules**: Persistent fever > 3 days, repeated vomiting, dehydration concern, persistent weakness, reviewer requested priority.
* **7 System Uncertainty Rules**: AI extraction failure, low confidence score (<0.70), OCR processing failure/uncertainty, Voice STT failure/uncertainty, Visual input processing error, unresolved missing info, unstructured lab report.
* **Precedence Invariant**: `URGENT > PRIORITY > ROUTINE`.

### 3.2 Authorization & IDOR Matrix
* Verified that patients cannot access other patients' records or clinician queues.
* Verified facility isolation: Reviewers cannot access cases from other facilities unless an active referral exists targeting their facility.
* Verified that non-admin roles cannot invoke retention purge or user management APIs.

### 3.3 Multimodal Provider Fail-Safe Resilience
* External AI services (Gemini, Google Vision OCR, Sarvam STT/Translation) are fully mocked during automated tests.
* Tested scenarios where provider returns network timeout, 500 error, malformed JSON, or empty output.
* **Safety Invariant**: In all failure scenarios, the system never silently defaults to `ROUTINE`; it elevates to `PRIORITY` for human review.

### 3.4 Concurrency & Idempotency
* Verified that concurrent or repeated submissions with identical idempotency keys do not produce duplicate cases or notifications.
* Verified that background SLA transitions and notification side effects do not race or double-escalate.

### 3.5 Playwright Golden End-to-End Suite (Phase 21)
* **Canonical Multi-Role E2E**: Validates complete workflow end-to-end:
  1. Public landing page rendering and non-diagnostic disclaimer assertion.
  2. Patient self-intake form completion, explicit consent, narrative submission, and `CAS-` case number generation.
  3. Doctor login, queue inspection, case claiming, AI extraction, 22-rule safety evaluation, structured triage note compilation, human review, and immutable audit trail API event verification.
* **Location**: `frontend/e2e/golden-triage-workflow.spec.ts`

---

## 4. Test & Verification Commands

### Run All Backend Tests (339 Vitest Tests):
```bash
cd backend
npm test
```

### Build Backend:
```bash
cd backend
npm run build
```

### Lint Frontend:
```bash
cd frontend
npm run lint
```

### Build Frontend:
```bash
cd frontend
npm run build
```

### Run Playwright Golden E2E Test Suite:
```bash
cd frontend
npx playwright test
```

### Seed Synthetic Dataset:
```bash
cd backend
npm run seed:test-data
```

