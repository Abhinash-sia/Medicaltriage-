# Operational Notification Subsystem Specification

## 1. Overview
The Notification subsystem provides operational alerts and event signaling across clinical workflows (case claims, assignments, escalations, SLA deadlines, and referrals).

> **CRITICAL ARCHITECTURAL RULE**: Notifications are strictly secondary operational side-effects. Notification creation or provider dispatch failures MUST NEVER fail, roll back, or block primary clinical case mutations.

---

## 2. Architecture & Provider Abstraction
```
                    NotificationService
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
 InAppNotification  MockEmailNotification MockSmsNotification
     Provider             Provider            Provider
        │                    │                   │
  MongoDB Store       Simulated Mail      Simulated SMS
```

- **Pluggable Interface**: `INotificationProvider` interface with `send(notification): Promise<NotificationProviderResult>`.
- **Factory Registration**: `NotificationProviderFactory` manages channel resolution (`IN_APP`, `EMAIL`, `SMS`) with fallback to local in-app persistence.
- **Mock Implementations**: Real SMS/email credentials are not required in this phase; safe structured log simulations are used.

---

## 3. Notification Model Schema
Mongoose collection `notifications`:
- `_id`: ObjectId
- `userId`: ObjectId (recipient reference)
- `facilityId`: String (optional facility boundary)
- `caseId`: ObjectId (optional associated case)
- `type`: Enum `NotificationType`
- `channel`: Enum `NotificationChannel` (`IN_APP`, `EMAIL`, `SMS`)
- `title`: String (sanitized summary)
- `body`: String (operational text only — NO full patient narratives, NO OCR reports, NO credentials)
- `status`: Enum `NotificationStatus` (`PENDING`, `SENT`, `FAILED`, `READ`)
- `readAt`: Date (timestamp when marked as read)
- `sentAt`: Date (timestamp when dispatched)
- `provider`: String (identifies dispatch provider)
- `providerMessageId`: String (provider transaction ID)
- `idempotencyKey`: String (unique, sparse index)
- `metadata`: Object (case numbers, escalation level, referral ID)
- `createdAt`, `updatedAt`: Timestamps

---

## 4. Centralized Notification Events
| Notification Type | Trigger Event | Target Recipient | Content Rule |
| :--- | :--- | :--- | :--- |
| `CASE_ASSIGNED` | Case claimed or assigned | Assigned Reviewer | Operational notice only |
| `CASE_ESCALATED` | Reviewer escalates case | Destination Reviewer/Queue | Escalation level & notice |
| `CASE_SLA_DUE_SOON` | SLA approaches target threshold | Assigned Reviewer | Timeliness reminder |
| `CASE_SLA_OVERDUE` | SLA deadline exceeded | Assigned Reviewer / Admin | Overdue operational flag |
| `CASE_REFERRED` | Referral created | Destination facility reviewers | Incoming transfer notice |
| `REFERRAL_ACCEPTED` | Referral accepted | Originating reviewer | Confirmation alert |
| `REFERRAL_REJECTED` | Referral rejected | Originating reviewer | Decline reason |
| `REFERRAL_COMPLETED` | Referral completed | Originating reviewer | Completion signal |
| `REVIEW_MORE_INFO_REQUESTED` | Reviewer requests intake details | Patient / Intake staff | Information request notice |
| `SYSTEM_ANNOUNCEMENT` | Administrative notice | User / Facility group | Maintenance notice |

---

## 5. Idempotency & Duplicate Prevention Strategy
To guarantee safety under retries, concurrency, and client refreshes:
- Deterministic key generation: `${caseId}:${eventType}:${userId}:${sourceEventId}`.
- Unique sparse index on `idempotencyKey` in MongoDB.
- `NotificationService.createNotification()` returns the existing record on duplicate key collision without duplicating entries.

---

## 6. Notification APIs
- `GET /api/notifications`: Retrieves paginated notifications for authenticated user inbox (`createdAt DESC`).
- `GET /api/notifications/unread-count`: Returns `{ unreadCount: number }`.
- `POST /api/notifications/:notificationId/read`: Marks specified notification as read.
- `POST /api/notifications/read-all`: Marks all unread notifications for caller as read.
