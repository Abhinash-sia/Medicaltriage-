# Referral Workflow Architecture (Phase 18)

## 1. Overview
Phase 18 implements a human-controlled referral workflow for inter-facility case handoffs.
A referral is **strictly a human review decision**. The AI engine never autonomously creates, approves, or executes a referral.

---

## 2. Canonical Referral Path
All referral creations must use exactly **ONE canonical mutation path**:
`POST /api/reviewer/cases/:caseId/review` with `reviewStatus: "REFERRED"`.

### Creation Request Payload:
```json
{
  "reviewStatus": "REFERRED",
  "reviewerNotes": "Clinical handoff note...",
  "referralFacilityId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "destinationDepartment": "Cardiology",
  "referralReason": "Requires specialist evaluation",
  "referralSummary": "Patient presenting with acute chest pain..."
}
```

### Handoff Control Flow:
```text
ReviewerController
      ↓
ReviewService.submitReviewDecision()
      ↓
ReferralService.createReferral()
      ↓
Review document saved (referralDecision)
Referral document created (status: PENDING)
Case.status updated to REFERRED
Case.assignedReviewerId set to null
AuditLog event written (REFERRAL_INITIATED)
```

No alternate creation route (e.g. `POST /api/referrals`) exists.

---

## 3. Referral State Machine

```text
               ┌──────────┐
               │  PENDING │
               └────┬─────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
   ┌──────────┐┌──────────┐┌──────────┐
   │ ACCEPTED ││ REJECTED ││CANCELLED │
   └────┬─────┘└──────────┘└──────────┘
        │
        ▼
   ┌──────────┐
   │COMPLETED │
   └──────────┘
```

### Valid State Transitions:
* `NONE → PENDING`: Initiated via `POST /api/reviewer/cases/:caseId/review` (`reviewStatus: "REFERRED"`).
* `PENDING → ACCEPTED`: Receiving facility accepts referral via `PATCH /api/referrals/:referralId/status`.
* `PENDING → REJECTED`: Receiving facility rejects referral.
* `PENDING → CANCELLED`: Originating facility reviewer cancels pending referral.
* `ACCEPTED → COMPLETED`: Receiving facility reviewer completes the referred care episode.

### Forbidden State Transitions (Return HTTP 400 Bad Request / 409 Conflict):
* `REJECTED → ACCEPTED`
* `CANCELLED → ACCEPTED`
* `COMPLETED → PENDING`
* `ACCEPTED → CANCELLED`

---

## 4. Case Status & Reviewer Assignment Mapping

| Transition / Event | Case.status | Case.assignedReviewerId | Access Rights |
| :--- | :--- | :--- | :--- |
| **Referral Initiated** (`PENDING`) | `REFERRED` | `null` | Originating facility & Destination facility |
| **Referral Accepted** (`ACCEPTED`) | `REFERRED` | Accepting Destination Reviewer | Originating facility & Destination facility |
| **Referral Rejected** (`REJECTED`) | `IN_REVIEW` | `null` (Returned to unassigned queue) | Originating facility only |
| **Referral Cancelled** (`CANCELLED`) | `IN_REVIEW` | Originating Referring Reviewer | Originating facility only |
| **Referral Completed** (`COMPLETED`) | `CLOSED` | Destination Reviewer | Originating facility (read-only history) |

---

## 5. Destination Facility Access Authorization
* **Originating Facility Invariant**: `Case.facilityId` is immutable and represents the originating facility. It is **never mutated** during referrals.
* **Destination Access Helper**: Active referrals (`PENDING` or `ACCEPTED`) grant destination facility reviewers read access to the referral case via `checkReferralFacilityAccess()`.
* **Access Lifetime**: When a referral transitions to `REJECTED`, `CANCELLED`, or `COMPLETED`, temporary destination facility access automatically expires.

---

## 6. Safety & SLA Invariants
Referrals MUST NEVER:
1. Reset or alter the `Case.slaDueAt` timer (`URGENT` = 1h, `PRIORITY` = 4h, `ROUTINE` = 24h).
2. Modify `SafetyEvaluation.calculatedPriority` or overwrite historical `SafetyEvaluation` documents.
3. Trigger an autonomous safety re-evaluation.
