# Auditability Architecture (Phase 18)

## 1. Overview
The audit system uses the centralized, append-only `AuditLog` collection established in Phase 0. No duplicate audit collection or second audit system is created.

---

## 2. Audit Event Registry (Phases 0–18)

### Phase 18 Added Events:
* `REFERRAL_INITIATED`: Referral requested during human review (`reviewStatus: "REFERRED"`).
* `REFERRAL_ACCEPTED`: Destination facility accepted referral.
* `REFERRAL_REJECTED`: Destination facility rejected referral.
* `REFERRAL_CANCELLED`: Originating facility cancelled pending referral.
* `REFERRAL_COMPLETED`: Destination facility completed referred case.
* `RETENTION_POLICY_UPDATED`: Admin updated retention configuration.
* `DATA_PURGE_EXECUTED`: Admin executed data purge or retry.
* `AUDIT_LOG_VIEWED`: Reviewer or Admin accessed case audit trail.

---

## 3. Case Audit Trail API

### Endpoint:
`GET /api/cases/:caseId/audit-trail`

### Access Control & Authorization:
* **Allowed Roles**: `NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`.
* **Blocked Roles**: `PATIENT` (Returns HTTP 403 Forbidden).
* **Facility Isolation**: Requester must belong to the originating facility OR be an active destination facility reviewer for a referred case.

### Response Sanitization & Data Minimization:
Audit trail metadata is strictly sanitized before returning to clients:
* Passwords, JWTs, API keys, raw base64 data, full patient PII, and medical secrets are **stripped**.
* Includes structured metadata: `actorId`, `actorRole`, `action`, `facilityId`, `timestamp`, `requestId`.

---

## 4. Append-Only Immutability
Audit records in `AuditLog` are append-only. The application layer provides no update or delete routes for `AuditLog` documents.
