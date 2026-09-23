# Healthcare Triage Assistant — Database Architecture Document

> [!NOTE]
> **Phase 2 Database Specification**: This document details the MongoDB/Mongoose data models, schema relationships, indexing strategy, data provenance tagging, and privacy-aware modeling rules for the **Healthcare Triage Assistant**.

---

## 1. High-Level Entity-Relationship (ER) Topology

```
User (Patient / Healthcare Worker / Doctor / Admin)
  │
  ├──► Case (Central Triage Case Record)
  │      │
  │      ├──► Symptom (Structured Symptoms & Clinical Presentation)
  │      │
  │      ├──► Report (Uploaded Medical/Lab Reports & OCR Data)
  │      │
  │      ├──► TriageNote (AI-Generated & Reviewer-Verified Summary)
  │      │
  │      ├──► Review (Human Reviewer Actions & Decisions)
  │      │
  │      ├──► Consent (Patient Consent Records)
  │      │
  │      └──► AuditLog (Immutable System & Event Audit Log)
```

---

## 2. Domain Models & Responsibilities

| Model | Module Path | Primary Responsibility | Key Indexes |
| :--- | :--- | :--- | :--- |
| **`User`** | `src/modules/users/` | Identity and role-based access for Patients, Nurses, Health Workers, Doctors, Medical Officers, and Admins. | `email` (sparse), `phone` (sparse), `role`, `facilityId` |
| **`Case`** | `src/modules/cases/` | Central record for a patient triage interaction containing workflow status, priority, and intake source. | `caseNumber` (unique), `status`, `priority`, `patientId`, `assignedReviewerId`, `facilityId`, `{status, priority, createdAt}` |
| **`Symptom`** | `src/modules/symptoms/` | Patient-reported and AI-extracted symptoms with location, onset, severity, and confidence metrics. | `caseId`, `source`, `normalizedLabel` |
| **`Report`** | `src/modules/reports/` | Metadata and processing status for uploaded medical lab reports, OCR text, and verification state. | `caseId`, `processingStatus`, `verificationRequired`, `uploadTimestamp` |
| **`TriageNote`** | `src/modules/triage/` | Decision-support summary containing presenting concerns, timelines, missing info, and safety signals. | `caseId`, `generationStatus`, `provenance`, `reviewedBy` |
| **`Review`** | `src/modules/reviews/` | Authoritative human review decisions, notes, priority changes, escalations, and referrals. | `caseId`, `reviewerId`, `reviewStatus`, `reviewedAt` |
| **`Consent`** | `src/modules/consent/` | Traceable patient consent records for triage processing, media uploads, and retention policies. | `caseId`, `patientId`, `status` |
| **`AuditLog`** | `src/modules/audit/` | Immutable append-only audit trail recording user, system, and AI lifecycle events. | `caseId`, `actorId`, `action`, `timestamp`, `{resourceType, resourceId, timestamp}` |

---

## 3. Human vs. AI Data Distinction & Safety Invariants

> [!WARNING]
> **Authoritative Healthcare Safety Rule**: AI-generated information must **NEVER** masquerade as human-authored or authoritative medical diagnoses. 
> The database schema strictly prohibits fields such as `diagnosis`, `prescription`, or `treatmentRecommendation` as patient-care outputs.

### Provenance Tracking Standards
1. **Raw Patient Inputs** (`InformationSource.PATIENT`, `InformationSource.VOICE_TRANSCRIPT`): Preserved in `Case.chiefComplaint`, `Symptom`, and `Report` records.
2. **AI-Generated Advisory Artifacts** (`NoteProvenance.AI_GENERATED`, `InformationSource.AI_EXTRACTION`): Stored in `TriageNote` and `Symptom` with model versioning (`generatedBy`, `modelVersion`) and confidence scores.
3. **Human Reviewer Decisions** (`NoteProvenance.HUMAN_VERIFIED`, `Review`): Authoritative records capturing final reviewer notes, priority overrides, escalations, and referral details.

---

## 4. Priority Model Specifications

The database represents three workflow priority categories (`CasePriority`):

1. **`URGENT`**: High-acuity workflow review signal detected (e.g. chest pain with breathing difficulty, acute severe bleeding). Mandates immediate reviewer attention.
2. **`PRIORITY`**: Moderate review signal, data gaps, persistent symptoms, low AI extraction confidence, or OCR ambiguity requiring verification.
3. **`ROUTINE`**: Defined strictly as *"No configured higher-priority review signal has been recorded at this point."*
   - **Database Rule**: `ROUTINE` must **NEVER** be interpreted or documented as *"the patient is medically fine."*

---

## 5. Indexing Strategy

Indexes are created based on explicit query access patterns:
- **Queue Query Optimization**: Compound index `{ status: 1, priority: 1, createdAt: -1 }` on `Case` allows high-performance sorting of active triage cases for clinical reviewer dashboards.
- **Sparse Unique Identifiers**: `User.email` and `User.phone` use sparse unique indexes to support flexible patient registration (either email or phone).
- **Audit Timeline Queries**: Compound index `{ resourceType: 1, resourceId: 1, timestamp: -1 }` on `AuditLog` supports efficient resource audit trail reconstruction.

---

## 6. Privacy & Data Retention Architecture

- **Data Minimization**: Only information required for triage decision support is stored. Real patient PII is excluded; synthetic demo IDs (`PT-1001`, `PT-1002`) are used for prototype data.
- **Secret & Content Protection**: MongoDB schema fields exclude secrets, API keys, JWT tokens, raw passwords, or un-hashed sensitive credentials.
- **Soft Delete Support**: `User` and `Case` schemas include `isDeleted` and `deletedAt` flags to support future data purging and retention workflows cleanly without breaking relational integrity.
