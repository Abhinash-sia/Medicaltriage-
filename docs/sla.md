# Service-Level Agreement (SLA) & Escalation System

## 1. Overview & Safety Boundaries

The Healthcare Triage Assistant implements an operational Service-Level Agreement (SLA) and escalation tracking system.

> [!IMPORTANT]
> **OPERATIONAL SAFETY DISCLAIMER**:
> SLA status is strictly an **operational workflow indicator** tracking staff review timeliness. It is **NOT** a medical urgency classification.
> 
> Prototype SLA durations are workflow prototype defaults and are **NOT** clinically validated recommendations.

The clinical priority (`Case.priority`: `URGENT`, `PRIORITY`, `ROUTINE`) and operational SLA (`slaDueAt`, `escalatedAt`, derived display status) remain completely independent:

```text
┌─────────────────────────┐           ┌─────────────────────────┐
│    CLINICAL PRIORITY    │           │     OPERATIONAL SLA     │
│                         │           │                         │
│ URGENT / PRIORITY /     │     ≠     │ dueAt / overdue /       │
│ ROUTINE                 │           │ escalated / level       │
└─────────────────────────┘           └─────────────────────────┘
```

An overdue or escalated SLA **never** mutates `Case.priority` or implies clinical emergency.

---

## 2. Prototype SLA Policy & Timestamps

### Durations
SLA deadlines are calculated deterministically at case creation based on the initial queue category:

* **`URGENT`**: 1 hour (3,600,000 ms)
* **`PRIORITY`**: 4 hours (14,400,000 ms)
* **`ROUTINE`**: 24 hours (86,400,000 ms) — *Default intake category*

### Clock Start & Persistence
* SLA begins at server-side case creation (`createdAt`).
* Client clocks and client-provided timestamps are strictly ignored.
* `slaDueAt` and `escalatedAt` are persisted as native MongoDB `Date` objects.

---

## 3. SLA Derived Display States & Precedence

SLA display status is derived dynamically on query following strict precedence:

```text
ESCALATED > OVERDUE > DUE_SOON > PENDING
```

1. **`ESCALATED`**: Case has undergone operational escalation (`escalatedAt !== null`).
2. **`OVERDUE`**: SLA deadline has expired (`slaDueAt <= now`) and case is not yet escalated.
3. **`DUE_SOON`**: Less than 25% (`SLA_DUE_SOON_RATIO = 0.25`) of total SLA duration remains.
4. **`PENDING`**: More than 25% of SLA duration remains.

---

## 4. Automatic Escalation Processor & Concurrency

### Execution Endpoint
* **`POST /api/reviewer/sla/process`**

### Access Control & Facility Scope
* Access is restricted to `ADMIN` and `MEDICAL_OFFICER` roles.
* `MEDICAL_OFFICER` processing is strictly scoped to cases within their authorized `facilityId`.
* `ADMIN` has system-wide administrative processing scope.

### Atomic Idempotency & Audit Logging
The processor evaluates overdue un-escalated cases (`slaDueAt <= now` and `escalatedAt == null`) and executes atomic Mongoose mutations:

```ts
Case.findOneAndUpdate(
  { _id: caseId, slaDueAt: { $lte: now }, escalatedAt: null, isDeleted: false },
  { $set: { escalatedAt: now, escalationLevel: 1 } },
  { new: true }
);
```

* Only the single request that successfully transitions `escalatedAt` creates a `CASE_SLA_ESCALATED` audit event.
* Concurrent batch processing calls against the same case produce exactly **1** state transition and **1** audit log entry.
* Escalation does **not** alter `assignedReviewerId` or `Case.priority`.

---

## 5. API Endpoints

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviewer/cases?slaStatus=overdue` | Reviewer Roles | Query queue cases filtered by derived SLA status (`pending`, `due_soon`, `overdue`, `escalated`) with database-level timestamp filtering and facility isolation. |
| `GET` | `/api/reviewer/cases/:caseId` | Reviewer Roles | Fetch case detail including operational `sla` state block (`dueAt`, `status`, `escalatedAt`, `escalationLevel`). |
| `POST` | `/api/reviewer/sla/process` | `ADMIN`, `MEDICAL_OFFICER` | Batch process overdue cases, apply atomic escalation mutations, and write audit events. |

---

## 6. Audit Event Structure

When SLA escalation occurs, an audit record is created:

```json
{
  "action": "CASE_SLA_ESCALATED",
  "resourceType": "Case",
  "resourceId": "650c1f2e9b1d2e001f8a4b12",
  "actorId": "650c1f2e9b1d2e001f8a4b00",
  "actorRole": "MEDICAL_OFFICER",
  "metadata": {
    "slaDueAt": "2026-09-23T18:00:00.000Z",
    "escalationLevel": 1,
    "escalatedAt": "2026-09-23T18:05:00.000Z"
  }
}
```
