# MedicalTriage REST API Specification

> **Prototype API Documentation**
> Base URL: `http://localhost:5000/api`
> Authentication: HTTP Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)

---

## Overview

MedicalTriage exposes a structured RESTful API supporting patient self-intake, multimodal data capture (OCR, Voice STT, Vision), AI extraction, deterministic safety evaluation, structured reviewer workspace operations, inter-facility referrals, admin controls, retention, and immutable audit trails.

---

## 1. System & Health

### `GET /api/health`
- **Auth**: Public
- **Description**: Health check endpoint returning server status, database connection, and environment mode.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-25T14:15:00.000Z",
    "environment": "development",
    "database": "connected"
  }
  ```

---

## 2. Authentication & Identity (`/api/auth`)

### `POST /api/auth/register`
- **Auth**: Public
- **Description**: Self-registration for patient accounts (always assigns `PATIENT` role).
- **Body**:
  ```json
  {
    "name": "Synthetic Patient",
    "email": "patient@example.test",
    "phone": "+919000000001",
    "password": "Password123!"
  }
  ```
- **Response**: `201 Created` — Returns user profile and access token.

### `POST /api/auth/login`
- **Auth**: Public
- **Description**: Authenticates user credentials (`PATIENT`, `NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`).
- **Body**:
  ```json
  {
    "email": "doctor.demo.001@example.test",
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "678...",
        "name": "Dr. Alok Mohanty",
        "email": "doctor.demo.001@example.test",
        "role": "DOCTOR",
        "facilityId": "FAC-DH-CUTTACK"
      },
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```

### `GET /api/auth/me`
- **Auth**: Bearer Token
- **Description**: Retrieves current authenticated user session data.

### `PATCH /api/auth/preferences`
- **Auth**: Bearer Token
- **Description**: Updates user preferred language or contact details.

---

## 3. Patient Intake (`/api/intake`)

### `POST /api/intake`
- **Auth**: Bearer Token (`PATIENT` role)
- **Header**: `Idempotency-Key` (Optional)
- **Description**: Submits multi-step patient self-intake narrative.
- **Body**:
  ```json
  {
    "consent": true,
    "consentVersion": "v1.0-hackathon",
    "language": "en",
    "primarySymptom": "Severe chest pressure",
    "symptomDescription": "Crushing retrosternal chest pain radiating to left jaw with diaphoresis",
    "onset": "45 minutes ago",
    "duration": "45 minutes",
    "severity": 8,
    "bodyLocation": "Substernal chest",
    "course": "WORSENING"
  }
  ```
- **Response**: `201 Created` — Returns case details and generated `CAS-XXXXXX-XXXX` case number.

### `GET /api/intake/my-cases`
- **Auth**: Bearer Token (`PATIENT` role)
- **Description**: Lists cases submitted by the authenticated patient.

---

## 4. Reviewer Queue & Cases (`/api/reviewer/cases`)

### `GET /api/reviewer/cases`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Query Params**: `page`, `limit`, `status`, `priority`, `slaStatus`, `facilityId`, `search`
- **Description**: Retrieves reviewer queue cases filtered by facility isolation and priority.

### `GET /api/reviewer/cases/:caseId`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Retrieves complete case detail workspace data, narrative, timeline, missing info, and review history.

### `POST /api/reviewer/cases/:caseId/claim`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Claims ownership of an unassigned case.

### `POST /api/reviewer/cases/:caseId/release`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Releases case ownership back to facility queue.

### `POST /api/reviewer/cases/:caseId/assign`
- **Auth**: Bearer Token (`ADMIN` role)
- **Body**: `{ "reviewerId": "678..." }`
- **Description**: Administrative assignment of case to a specific reviewer.

---

## 5. AI Information Extraction & Timeline (`/api/reviewer/cases/:caseId`)

### `POST /api/reviewer/cases/:caseId/extraction`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Runs AI provider normalization on patient narrative to extract structured symptoms, clinical observations, and entity tags.

### `GET /api/reviewer/cases/:caseId/timeline`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Generates chronological event timeline from intake narrative, report uploads, voice notes, and review logs.

### `GET /api/reviewer/cases/:caseId/missing-information`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Surfaces completeness gaps and neutral reviewer follow-up question suggestions.

---

## 6. Safety & Urgency Engine (`/api/reviewer/cases/:caseId/safety`)

### `POST /api/reviewer/cases/:caseId/safety/evaluate`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Executes 22 deterministic safety rules (`URGENT > PRIORITY > ROUTINE`). Defaults fail-safe to `PRIORITY` on processing errors or schema uncertainties.

### `GET /api/reviewer/cases/:caseId/safety`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Retrieves current safety evaluation record and triggered rule signals.

---

## 7. Structured Triage Note (`/api/reviewer/cases/:caseId/triage-note`)

### `POST /api/reviewer/cases/:caseId/triage-note/generate`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Generates or updates the structured reviewer note combining extracted findings, missing info, OCR, STT, and safety flags.

### `GET /api/reviewer/cases/:caseId/triage-note`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Retrieves active compiled structured triage note.

### `POST /api/reviewer/cases/:caseId/triage-note/verify`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Marks structured triage note section as human-verified.

### `GET /api/reviewer/cases/:caseId/triage-note/history`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Retrieves historical versions of compiled triage notes.

---

## 8. Human Review & Referral Authorization

### `POST /api/reviewer/cases/:caseId/review`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Body (Standard Resolution / Escalation)**:
  ```json
  {
    "reviewStatus": "COMPLETED",
    "reviewerNotes": "Verified clinical presentation; acute coronary syndrome signals flagged.",
    "priorityOverride": "URGENT",
    "overrideReason": "Clinical review overrides initial queue category"
  }
  ```
- **Body (Canonical Inter-Facility Referral Creation)**:
  ```json
  {
    "reviewStatus": "REFERRED",
    "reviewerNotes": "Initiating emergency transfer to tertiary cardiology unit.",
    "referralFacilityId": "65f1a2b3c4d5e6f7a8b9c0d1",
    "destinationDepartment": "Cardiology",
    "referralReason": "Requires specialist evaluation and catheterization lab",
    "referralSummary": "Patient presenting with acute retrosternal chest pressure and dyspnea."
  }
  ```
- **Description**: Submits human review decision. When `reviewStatus` is `"REFERRED"`, delegates canonical referral creation to `ReferralService.createReferral()` and updates case status to `REFERRED`.

### `GET /api/reviewer/cases/:caseId/reviews`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Retrieves human review history records for a case.

---

## 9. Referral Lifecycle & Management (`/api/referrals`)

### `GET /api/referrals/cases/:caseId`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Retrieves referral history for a specific case.

### `GET /api/referrals/incoming`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Description**: Lists incoming pending and accepted referrals targeted to the reviewer's facility.

### `PATCH /api/referrals/:referralId/status`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`)
- **Body**: `{ "status": "ACCEPTED" }` (`ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`)
- **Description**: Updates referral state machine. Grant/expires destination facility reviewer access.

---

## 10. Multimodal Uploads (Reports, Vision, Voice, Translation)

### `POST /api/cases/:caseId/reports`
- **Auth**: Bearer Token — Accepts PDF, PNG, JPEG medical report files for OCR extraction.

### `POST /api/cases/:caseId/visual-inputs`
- **Auth**: Bearer Token — Uploads clinical photos for reviewer inspection.

### `POST /api/cases/:caseId/voice-inputs`
- **Auth**: Bearer Token — Uploads WAV/WebM audio recordings for STT transcription.

### `POST /api/cases/:caseId/translations/request`
- **Auth**: Bearer Token — Requests translation for regional dialect text or voice transcripts into English.

---

## 11. Audit, Admin & Retention

### `GET /api/cases/:caseId/audit-trail`
- **Auth**: Bearer Token (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`) — Retrieves immutable chronological event log.

### `GET /api/admin/audit-logs`
- **Auth**: Bearer Token (`ADMIN` role) — System-wide audit query.

### `GET /api/admin/retention/status`
- **Auth**: Bearer Token (`ADMIN` role) — Retention status report across retention classes (`CLINICAL_CASE`, `MEDIA_BLOB`, `AI_DERIVED`, `AUDIT_LOG`).

### `POST /api/admin/retention/purge`
- **Auth**: Bearer Token (`ADMIN` role) — Triggers automated retention purge job.
