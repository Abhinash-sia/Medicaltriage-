# Healthcare Triage Assistant — Reviewer Assignment & Ownership Specification (Phase 6)

> [!NOTE]
> **Phase 6 Assignment Architecture**: This document specifies the operational case ownership workflow, atomic claim concurrency controls, release permissions, administrative assignment rules, workload queue filtering, audit logging, and strict non-diagnostic boundaries for Phase 6.

---

## 1. Executive Summary & Purpose

Phase 6 establishes the **Reviewer Assignment & Ownership Workflow**, enabling authorized healthcare staff to claim unassigned cases, manage personal case workload queues, release owned assignments, and enable administrative staff to reassign cases safely.

> [!IMPORTANT]
> **Non-Clinical Boundary Statement**: Assignment represents workflow operational ownership ONLY. It does NOT represent a medical diagnosis, clinical approval, prescription, or urgency reclassification. `Case.priority` and `Case.status` remain strictly independent of assignment actions.

---

## 2. Assignment Semantics & Data Model

* **Single Source of Truth**: `Case.assignedReviewerId` (Mongoose `ObjectId`, ref `'User'`, default `null`) is the sole current ownership field. No secondary assignment collection or model is created.
* **States**:
  * `assignedReviewerId = null` → Unassigned / unclaimed case
  * `assignedReviewerId = reviewerId` → Case assigned to specified reviewer
* **Audit History**: Historical ownership transitions are recorded in the append-only `AuditLog` collection.

---

## 3. Reviewer Authorization & Role Access Control

| User Role | Assignment Actions | Authorization Result |
| :--- | :--- | :--- |
| `PATIENT` | Claim, Release, Assign, Unassign | **REJECTED (`403 Forbidden`)** |
| `NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER` | Claim unassigned case, Release own assigned case | **ALLOWED (`200 OK`)** |
| `ADMIN` | Claim, Release any case, Assign/Reassign, Unassign | **ALLOWED (`200 OK`)** |

---

## 4. Endpoints & API Specifications

### `POST /api/reviewer/cases/:caseId/claim`
* **Access**: Authorized reviewer roles (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`).
* **Concurrency Protection**: Executes an atomic MongoDB mutation:
  ```ts
  Case.findOneAndUpdate(
    { _id: caseId, assignedReviewerId: null, isDeleted: false },
    { $set: { assignedReviewerId: new mongoose.Types.ObjectId(reviewerUserId) } },
    { new: true }
  )
  ```
* **Conflict Resolution**: If the case is already claimed by another reviewer, the query condition fails and the API returns `409 Conflict` (`ASSIGNMENT_CONFLICT`).
* **Audit Logging**: Logs `AuditEventType.CASE_CLAIMED` with metadata `{ previousReviewerId: null, newReviewerId: reviewerUserId }`.

---

### `POST /api/reviewer/cases/:caseId/release`
* **Access**: Authorized reviewer roles.
* **Ownership Check**: Normal reviewers can release **only** cases assigned to themselves (`assignedReviewerId === req.user.id`). If a non-admin reviewer attempts to release another reviewer's case, returns `403 Forbidden` (`AUTH_FORBIDDEN`).
* **Behavior**: Clears assignment (`assignedReviewerId = null`).
* **Audit Logging**: Logs `AuditEventType.CASE_RELEASED` with metadata `{ previousReviewerId, newReviewerId: null }`.

---

### `POST /api/reviewer/cases/:caseId/assign`
* **Access**: `ADMIN` role strictly (`requireRoles(UserRole.ADMIN)`).
* **Request Payload**:
  ```json
  {
    "reviewerId": "651a2b3c4d5e6f7a8b9c0d10"
  }
  ```
* **Server-Side Target Verification**: Verifies target user exists in DB, `isDeleted: false`, `isActive: true`, and role is an authorized reviewer role (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`). Rejects `PATIENT` targets (`400 Bad Request`).
* **Behavior**: Updates `Case.assignedReviewerId = targetReviewerId`.
* **Audit Logging**: Logs `AuditEventType.CASE_ASSIGNED` preserving both `{ previousReviewerId, newReviewerId: targetReviewerId }`.

---

### `POST /api/reviewer/cases/:caseId/unassign`
* **Access**: `ADMIN` role strictly.
* **Behavior**: Clears assignment (`assignedReviewerId = null`).
* **Audit Logging**: Logs `AuditEventType.CASE_UNASSIGNED` with metadata `{ previousReviewerId, newReviewerId: null }`.

---

## 5. Workload Queue Filtering (`GET /api/reviewer/cases`)

Queue queries support the `assignedTo` filter parameter:
* `assignedTo=me`: Returns cases assigned to the authenticated user (`assignedReviewerId = req.user.id`).
* `assignedTo=unassigned`: Returns unclaimed cases (`assignedReviewerId = null`).
* `assignedTo=all` (or omitted): Returns all cases within the user's facility and authorization scope.

---

## 6. Strict Phase 6 Boundaries (Systems Not Implemented)

The following capabilities remain **intentionally excluded** from Phase 6:
* AI extraction, summarization, OCR, voice, vision
* Automated urgency / risk classification engine
* SLA timers & automated queue routing / load balancing
* Notifications (Email/SMS)
* Referral & escalation workflows
* Redis / BullMQ async job queues
