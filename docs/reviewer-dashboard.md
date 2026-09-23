# Healthcare Triage Assistant — Reviewer Dashboard & Case Review Workflow Specification (Phase 5)

> [!NOTE]
> **Phase 5 Reviewer Architecture**: This document specifies the reviewer queue API, pagination rules, status/priority filtering, case detail structure, human review recording, RBAC authorization, privacy data minimization, and strict non-diagnostic boundaries for Phase 5.

---

## 1. Executive Summary & Purpose

Phase 5 establishes the **Reviewer Dashboard & Case Review Workflow**, providing authorized healthcare staff with a dedicated interface to inspect patient-submitted self-intake records, review structured symptoms and explicit consent, and record human staff review notes.

The goal of this phase is to establish the human review surface that later AI and safety engines will consume.

---

## 2. Reviewer Authorization & Role Access Control

Access to reviewer endpoints and dashboard UI is strictly restricted to authorized healthcare roles:

| User Role | Access Allowed | Description |
| :--- | :--- | :--- |
| `PATIENT` | **REJECTED (`403 Forbidden`)** | Patients are strictly forbidden from viewing reviewer queues or case details of other patients. |
| `NURSE` | **ALLOWED (`200 OK`)** | Staff nurse inspecting intake queue and recording observations. |
| `HEALTH_WORKER` | **ALLOWED (`200 OK`)** | Field health worker / ASHA worker inspecting patient cases. |
| `DOCTOR` | **ALLOWED (`200 OK`)** | Attending physician reviewing intake cases. |
| `MEDICAL_OFFICER` | **ALLOWED (`200 OK`)** | Facility medical officer reviewing cases. |
| `ADMIN` | **ALLOWED (`200 OK`)** | System administrative reviewer. |

---

## 3. Endpoints & API Specification

### `GET /api/reviewer/cases`
* **Access**: Authorized healthcare roles (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`).
* **Query Parameters**:
  * `page`: integer (>= 1, default `1`)
  * `limit`: integer (1-100, default `20`)
  * `status`: optional enum (`OPEN`, `IN_REVIEW`, `RESOLVED`)
  * `priority`: optional enum (`ROUTINE`, `PRIORITY`, `URGENT`)
* **Sorting**: Deterministic `createdAt` descending (newest cases first).
* **Response Payload (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "651a2b3c4d5e6f7a8b9c0d1e",
      "caseNumber": "CAS-20260923-0001",
      "patientId": "651a2b3c4d5e6f7a8b9c0d10",
      "patientName": "Anil Gupta",
      "status": "OPEN",
      "priority": "ROUTINE",
      "chiefComplaint": "Severe headache: Throbbing pain for 2 days",
      "intakeSource": "TEXT",
      "language": "en",
      "createdAt": "2026-09-23T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### `GET /api/reviewer/cases/:caseId`
* **Access**: Authorized healthcare roles.
* **Response Payload (`200 OK`)**:
  * Case metadata (`caseNumber`, status, priority, language, timestamps)
  * Patient contact info (`id`, `name`, `email`, `phone`) — excluding `passwordHash` and authentication credentials
  * Structured symptoms (`name`, `onset`, `severity`, `bodyLocation`, `source = PATIENT`)
  * Explicit patient consent status and version
  * Historical human review records (`reviewerName`, `reviewStatus`, `reviewerNotes`, `reviewedAt`)

---

### `POST /api/reviewer/cases/:caseId/review`
* **Access**: Authorized healthcare roles.
* **Request Payload**:
```json
{
  "reviewerNotes": "Patient notes severe frontal headache. Advised quiet resting and hydration while awaiting clinical consult.",
  "reviewStatus": "COMPLETED"
}
```
* **Behavior**:
  * Validates case existence.
  * Records a `Review` document with `reviewerId` set to the authenticated user ID (`req.user.id`).
  * Executes minimal server-controlled `Case.status` transition (`OPEN` → `IN_REVIEW`).
  * Does **NOT** set `Case.assignedReviewerId` (ownership assignment is reserved for Phase 6).
  * Writes an `AuditLog` entry (`action = REVIEW_STARTED`) with non-sensitive operational metadata.

---

## 4. Security, Data Privacy & Non-Diagnostic Invariants

> [!IMPORTANT]
> **Data Minimization Security Policy**: Reviewer endpoints expose patient identity (`name`, `email`, `phone`) solely to enable healthcare staff inspection. Under no circumstances are `passwordHash`, JWT secret keys, API credentials, or internal database metadata returned.

> [!NOTE]
> **Phase 6 Assignment Architecture**: Operational case assignment and ownership (`Case.assignedReviewerId`), atomic case claiming (`POST /api/reviewer/cases/:caseId/claim`), releasing (`POST /api/reviewer/cases/:caseId/release`), administrative reassignment (`POST /api/reviewer/cases/:caseId/assign`), and workload filtering (`assignedTo=me`) are specified in [`docs/assignment.md`](file:///home/abhi/medicalTriage/docs/assignment.md).

> [!CAUTION]
> **Non-Diagnostic System Boundary**: Initial queue categories (`ROUTINE`) represent unassessed intake states awaiting human evaluation, not clinical conclusions. The reviewer UI presents clear "Patient-Reported Observations" labels and operational safety disclaimers.

---

## 5. Strict Phase 6 Boundaries (Systems Not Implemented)

The following capabilities remain **intentionally excluded** from Phase 6:
* AI extraction & summarization (Gemini, Sarvam)
* OCR / Speech-to-text / Vision processing
* Automated urgency / risk classification engine
* SLA timers & automated queue prioritization / predictive routing
* Notifications (Email/SMS) & referral workflows
* Redis / BullMQ async background jobs
