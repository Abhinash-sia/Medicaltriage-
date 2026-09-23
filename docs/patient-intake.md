# Healthcare Triage Assistant — Patient Intake Workflow Specification (Phase 4)

> [!NOTE]
> **Phase 4 Intake Architecture**: This document specifies the patient self-intake flow, API contracts, explicit consent enforcement, patient ownership security boundaries, symptom provenance modeling, atomic transaction behavior, audit logging, and strict non-diagnostic phase boundaries.

---

## 1. Executive Summary & Purpose

Phase 4 establishes the structured **Patient Intake Workflow**, enabling authenticated patients to submit health concerns safely and securely.

The goal of this phase is to construct a clean, validated, structured data foundation containing:
* Patient-reported reason for visit and detailed symptom narrative
* Symptom onset timeline, course (improving/unchanged/worsening), body location, and severity
* Explicit patient consent record linked to the case
* Automatic case numbering and routine initial priority assignment
* Patient ownership security enforcement
* Provenance metadata explicitly marking information as patient-entered (`PATIENT`)
* Immutable audit event generation

---

## 2. Intake Workflow & Architecture

```
Authenticated Patient (JWT: PATIENT role)
        │
        ▼
  POST /api/intake { consent, primarySymptom, description, onsetDate, course, severity, ... }
        │
        ▼
1. Authentication & Role Authorization (authenticateJwt + requireRole(PATIENT))
        │
        ▼
2. Request Validation (intakeSubmitSchema via Zod)
   - Must explicitly consent: true
   - Reject client-supplied patientId, priority, status, reviewerId, diagnosis
        │
        ▼
3. Server-Controlled Idempotency Check (Optional Idempotency-Key header)
        │
        ▼
4. Database Transaction / Atomic Execution
   ├─► Generate caseNumber (CT-YYYYMMDD-XXXX)
   ├─► Create Case (patientId = req.user.id, priority = ROUTINE, status = UNREVIEWED, source = PATIENT_SELF_INTAKE)
   ├─► Create Consent (granted = true, status = GRANTED, consentVersion = "1.0", IP & User-Agent logged)
   ├─► Create Symptom (source = PATIENT, confidence = 1.0, course, severity, onsetDate)
   └─► Create AuditLog (action = PATIENT_INTAKE_CREATED, non-sensitive metadata)
        │
        ▼
5. Return Case Confirmation ({ success: true, data: { caseId, caseNumber, status, createdAt } })
```

---

## 3. Endpoints & API Specification

### `POST /api/intake`
* **Access**: Authenticated users with role `PATIENT` strictly.
* **Headers**: `Authorization: Bearer <token>`, optional `Idempotency-Key: <unique-uuid>`.
* **Request Body**:
```json
{
  "consent": true,
  "language": "ENGLISH",
  "primarySymptom": "Severe headache and mild nausea",
  "description": "Started 2 days ago after working in direct sunlight. Worsening when moving.",
  "onsetDate": "2026-09-21T10:00:00.000Z",
  "course": "WORSENING",
  "severity": "MODERATE",
  "bodyLocation": "Head / Temples"
}
```

* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "caseId": "651a2b3c4d5e6f7a8b9c0d1e",
    "caseNumber": "CT-20260923-0001",
    "status": "UNREVIEWED",
    "createdAt": "2026-09-23T14:30:00.000Z"
  }
}
```

### `GET /api/intake/my-cases`
* **Access**: Authenticated users with role `PATIENT`.
* **Behavior**: Retrieves all cases created by the authenticated patient (`patientId === req.user.id`).

### `GET /api/intake/:caseId`
* **Access**: Authenticated users with role `PATIENT`.
* **Behavior**: Retrieves details for a specific case owned by the authenticated patient. Returns `404 Not Found` if case belongs to a different patient.

---

## 4. Security & Access Control Boundaries

> [!IMPORTANT]
> **Patient Ownership Security Invariant**: The `patientId` associated with any case or consent is strictly derived from the authenticated session (`req.user.id`). Client requests cannot supply a `patientId` payload to impersonate another patient or submit cases on behalf of others.

> [!WARNING]
> **No Client Override of Server State**: Payload fields such as `priority`, `status`, `reviewerId`, `assignedReviewerId`, `diagnosis`, or `treatment` are explicitly rejected by Zod validation if included in client intake payloads. Initial status is fixed to `UNREVIEWED`, priority defaults to `ROUTINE` (representing *awaiting review*, not a clinical conclusion), and source is fixed to `PATIENT_SELF_INTAKE`.

---

## 5. Explicit Consent Enforcement

* Consent must be affirmatively granted (`consent: true`).
* If `consent: false` or `consent` is missing, request is rejected with `400 Bad Request` validation error.
* A `Consent` model document is persisted linked to the `caseId` and `patientId`.
* `Consent` records include `status: "GRANTED"`, `consentVersion: "1.0"`, `consentedAt: Date`, and request IP/User-Agent.
* No patient health narrative or sensitive symptoms are recorded inside consent records.

---

## 6. Symptom Provenance & Data Modeling

* Symptom models strictly record `source: InformationSource.PATIENT`.
* Patient-entered symptoms do NOT contain AI confidence overrides or fake algorithmic scores.
* Fields captured:
  * `name`: Extracted from `primarySymptom`
  * `description`: Patient narrative
  * `onsetDate`: ISO 8601 date string (validated against future dates)
  * `course`: Enum (`IMPROVING`, `UNCHANGED`, `WORSENING`)
  * `severity`: Patient-reported perception (`MILD`, `MODERATE`, `SEVERE`)
  * `bodyLocation`: Free-text anatomical region

---

## 7. Audit Behavior & Data Privacy

* An append-only `AuditLog` entry is written with action `PATIENT_INTAKE_CREATED`.
* **Privacy Boundary**: Full patient symptom text is **NEVER** placed in the `AuditLog` metadata to prevent redundant sensitive data exposure across operational logs. Metadata includes only `{ caseNumber, language, intakeSource }`.

---

## 8. Idempotency & Transaction Safety

* **Transaction Handling**: In replica-set deployments, `IntakeService` wraps Case, Consent, Symptom, and AuditLog creation inside a single Mongoose session transaction (`startTransaction()`). If any document creation fails, all changes are rolled back.
* **Idempotency Strategy**: Patients sending an `Idempotency-Key` header receive the cached previous response if a duplicate request arrives within 24 hours.

---

## 9. Non-Diagnostic Safety Boundary

> [!CAUTION]
> **Safety Invariant**: This intake system collects patient-reported observations ONLY. It performs NO diagnosis, triage scoring, risk categorization, prescription, or clinical decision-making. The UI presents clear non-diagnostic disclaimers and emergency advice disclaimers at all steps.

---

## 10. Strict Phase 4 Boundaries (What is NOT Implemented)

The following systems are **intentionally excluded** from Phase 4 and reserved for later phases:
* AI extraction & summarization (Gemini, Sarvam)
* Speech-to-text / Voice upload / OCR / Cloud Vision
* Safety / Urgency engine & auto-prioritization
* Reviewer dashboard & case assignment queues
* Notifications & SLA timers
* Redis / BullMQ async jobs
