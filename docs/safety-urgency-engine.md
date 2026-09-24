# Phase 15 — Safety & Urgency Engine Architecture

## 1. Overview & Purpose

The **Safety & Urgency Engine** is a deterministic, auditable system component that evaluates configured safety and review signals from structured patient case data. Its sole objective is to assign an operational **workflow review priority** (`URGENT`, `PRIORITY`, `ROUTINE`) to prioritize human clinical review queues.

> **CRITICAL CLINICAL NEUTRALITY BOUNDARY**:
> - The Safety Engine is **NOT** a diagnostic system.
> - It does **NOT** independently diagnose medical conditions, prescribe treatments, recommend medications, calculate clinical risk scores, or project medical prognoses.
> - Human clinical reviewers maintain ultimate clinical authority and may override workflow priority at any time.

---

## 2. Priority Taxonomy & Baseline Invariants

### 2.1 Workflow Priority Hierarchy
Priority evaluation strictly follows the precedence hierarchy:

$$\text{URGENT} > \text{PRIORITY} > \text{ROUTINE}$$

- **`URGENT`**: Highest queue priority; assigned when a critical safety signal or explicit reviewer escalation is detected.
- **`PRIORITY`**: Elevated queue priority; assigned for persistent symptoms, reviewer requests, or processing uncertainty flags.
- **`ROUTINE`**: Standard queue priority; assigned when no higher-priority review signals are detected.

### 2.2 Meaning of `ROUTINE`
`ROUTINE` explicitly denotes: *"no configured higher-priority workflow review signal detected"*. It MUST NEVER be presented as *"patient is medically safe"*, *"no medical attention needed"*, or *"patient is fine"*.

---

## 3. Complete 22 Deterministic Rule Inventory

The Safety Engine executes 22 deterministic rules registered in `SafetyRegistry`:

| Rule ID | Name | Category | Priority | Trigger Condition |
| :--- | :--- | :--- | :--- | :--- |
| **URGENT RULES (10)** | | | | |
| `URGENT_HUMAN_ESCALATION` | Reviewer Escalation | `HUMAN_ESCALATION` | `URGENT` | Case flagged as escalated by reviewer. |
| `URGENT_SEVERE_BREATHING` | Severe Breathing Difficulty | `CLINICAL_URGENT` | `URGENT` | Structured `Symptom` breathing difficulty (`PRESENT` & `CURRENT` & `SEVERE`). |
| `URGENT_CHEST_PAIN_BREATHING` | Chest Pain + Breathing | `CLINICAL_URGENT` | `URGENT` | Structured `Symptom` chest pain AND breathing difficulty (`PRESENT` & `CURRENT`). |
| `URGENT_ALTERED_CONSCIOUSNESS` | Altered Consciousness | `CLINICAL_URGENT` | `URGENT` | Structured `Symptom` altered consciousness / confusion (`PRESENT` & `CURRENT`). |
| `URGENT_SEVERE_BLEEDING` | Severe Bleeding | `CLINICAL_URGENT` | `URGENT` | Structured `Symptom` bleeding (`PRESENT` & `CURRENT` & `SEVERE`). |
| `URGENT_SEIZURE` | Active/Recent Seizure | `CLINICAL_URGENT` | `URGENT` | Structured `Symptom` seizure / convulsions (`PRESENT` & `CURRENT`). |
| `URGENT_SELF_HARM` | Immediate Self-Harm Language | `CLINICAL_URGENT` | `URGENT` | AI extraction safety flag for explicit self-harm intent. |
| `URGENT_SEVERE_ALLERGY` | Severe Allergic Reaction | `CLINICAL_URGENT` | `URGENT` | Structured `Symptom` allergy (`PRESENT` & `CURRENT`) with airway swelling. |
| `URGENT_PEDIATRIC_CONFIGURED` | Pediatric Critical Case | `CLINICAL_URGENT` | `URGENT` | Matches facility-configured `PediatricSafetyRule`. |
| `URGENT_CLINICIAN_LAB` | Critical Lab Value | `CLINICAL_URGENT` | `URGENT` | Validated lab value matches configured `LabSafetyRule`. |
| **PRIORITY RULES (5)** | | | | |
| `PRIORITY_FEVER_PERSISTENT` | Persistent Fever > 3 Days | `CLINICAL_PRIORITY` | `PRIORITY` | Structured `Symptom` fever (`PRESENT` & `CURRENT` & `duration >= 3 days`). |
| `PRIORITY_REPEATED_VOMITING` | Repeated Vomiting | `CLINICAL_PRIORITY` | `PRIORITY` | Structured `Symptom` vomiting (`PRESENT` & `CURRENT` & persistent). |
| `PRIORITY_DEHYDRATION_CONCERN` | Dehydration Concern | `CLINICAL_PRIORITY` | `PRIORITY` | Structured `Symptom` dehydration / lethargy (`PRESENT` & `CURRENT`). |
| `PRIORITY_PERSISTENT_WEAKNESS` | Persistent Weakness | `CLINICAL_PRIORITY` | `PRIORITY` | Structured `Symptom` weakness (`PRESENT` & `CURRENT` & persistent). |
| `PRIORITY_REVIEWER_REQUESTED` | Reviewer Priority Request | `CLINICAL_PRIORITY` | `PRIORITY` | Reviewer explicitly requested PRIORITY review level. |
| **SYSTEM_UNCERTAINTY RULES (7)** | | | | |
| `UNCERTAINTY_AI_EXTRACTION` | AI Extraction Failure | `SYSTEM_UNCERTAINTY` | `PRIORITY` | Active extraction status is `FAILED`. |
| `UNCERTAINTY_LOW_CONFIDENCE` | Low Extraction Confidence | `SYSTEM_UNCERTAINTY` | `PRIORITY` | Active extraction confidence score $< 0.70$. |
| `UNCERTAINTY_OCR_FAILURE` | OCR Processing Uncertainty | `SYSTEM_UNCERTAINTY` | `PRIORITY` | Active `Report.ocrStatus === 'FAILED'` or confidence $< 0.60$. |
| `UNCERTAINTY_VOICE_STT_FAILURE`| Voice STT Processing Failure | `SYSTEM_UNCERTAINTY` | `PRIORITY` | Active `VoiceInput.status === 'FAILED'` or confidence $< 0.60$. |
| `UNCERTAINTY_VISUAL_FAILURE` | Visual Input Processing Error | `SYSTEM_UNCERTAINTY` | `PRIORITY` | Active `VisualInput.status === 'FAILED'`. |
| `UNCERTAINTY_MISSING_INFO` | Required Info Missing | `SYSTEM_UNCERTAINTY` | `PRIORITY` | Active `MissingInfoResult` has unresolved required information. |
| `UNCERTAINTY_UNSTRUCTURED_LAB` | Malformed Lab Evidence | `SYSTEM_UNCERTAINTY` | `PRIORITY` | OCR lab evidence present but unparseable or missing required units. |

---

## 4. Source Awareness & Temporal Evidence Representation

### 4.1 Temporal Status Enum
`Symptom.temporalStatus` explicitly categorizes clinical evidence:
- `'CURRENT'`: Active at presentation.
- `'RECENT'`: Occurred within immediate intake window.
- `'HISTORICAL'`: Past medical history (e.g. *"Seizure 2 years ago"*). **Does NOT trigger urgent rules**.
- `'UNKNOWN'`: Temporal context unverified. **Does NOT trigger positive urgent clinical rules**.

### 4.2 Translation Exclusion
`Translation` records exist solely for reviewer comprehension. The Safety Engine **NEVER** parses translated strings as independent clinical evidence.

---

## 5. Facility Rule Configuration & Evidence Safety

### 5.1 Zero Hardcoded Medical Thresholds
Application code contains no universal clinical lab reference ranges or pediatric thresholds. All thresholds are configured per facility via `LabSafetyRule` and `PediatricSafetyRule` models.

### 5.2 Retry & Stale Failure Resolution
Uncertainty rules evaluate **ONLY** active artifacts (`isLatest === true`). When a failed OCR upload or STT processing attempt is retried and succeeds, the prior failure is superseded, clearing the uncertainty signal on the subsequent safety evaluation.

---

## 6. Single Active Evaluation & Concurrency Control

Each case maintains **EXACTLY ONE ACTIVE** `SafetyEvaluation` record enforced via a MongoDB Partial Unique Index:

```typescript
SafetyEvaluationSchema.index(
  { caseId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
```

When a new safety evaluation completes, existing active evaluations are updated to `status = 'SUPERSEDED'` prior to creating the new `ACTIVE` evaluation with an incremented `evaluationVersion`.

### 6.1 Multi-Document Transaction Topology Invariant
- **Replica-Set & Sharded Deployments**: Full multi-document ACID transaction guarantees apply across version incrementing, active state transition (`ACTIVE` $\rightarrow$ `SUPERSEDED`), creation of the new `ACTIVE` evaluation, `Case.priority` + `slaDueAt` update, and `AuditLog` write. If any operation fails, the entire transaction is aborted, preventing priority desynchronization.
- **Standalone MongoDB Deployments**: Single-node standalone instances (e.g. local dev or unit test Mongo without a replica set topology) do not support multi-document transactions. In standalone mode, single-document operations execute sequentially, and the MongoDB partial unique index `{ caseId: 1, status: 1 }` (`partialFilterExpression: { status: 'ACTIVE' }`) acts as the database-level lock ensuring at most one `ACTIVE` evaluation exists per case.

---

## 7. Fail-Safe Fallback & Human Override Non-Demotion

If an unexpected exception occurs inside the Safety Engine:
1. **Human Override Check**: If `case.priorityOverride` exists, `Case.priority` remains locked to `priorityOverride`.
2. **Default Fallback**: Otherwise, `Case.priority` defaults to `PRIORITY` under `SYSTEM_UNCERTAINTY`.
3. **Fallback Failure**: If updating fallback state fails, a critical audit event (`SAFETY_FALLBACK_PERSISTENCE_FAILED`) is logged and an HTTP 500 exception is thrown. Success is **NEVER** reported to the client.

---

## 8. SLA Integration & Dynamic OVERDUE Calculation

Updating workflow priority automatically recalculates `slaDueAt`:

$$\text{slaDueAt} = \text{Case.createdAt} + \text{SLA\_POLICY}[\text{effectivePriority}]$$

If a case is escalated from `ROUTINE` to `URGENT` late in its intake window, `slaDueAt` will evaluate to a timestamp in the past, causing `SlaService` to flag the case as `OVERDUE` dynamically on the reviewer dashboard. Existing `escalatedAt` timestamps are preserved.

---

## 9. API Endpoints & Facility Isolation

- **`POST /api/reviewer/cases/:caseId/safety/evaluate`**: Triggers safety evaluation.
- **`GET /api/reviewer/cases/:caseId/safety`**: Retrieves active evaluation and version history.

> **Access Control**: Restricted strictly to authorized reviewer roles (`NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`) with facility isolation enforced. **Patient role access is strictly prohibited (HTTP 403)**.
