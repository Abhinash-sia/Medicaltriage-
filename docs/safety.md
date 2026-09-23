# Healthcare Triage Assistant — Safety Contract & Risk Rules (Phase 0)

> [!WARNING]
> **SAFETY CONTRACT BINDING SPECIFICATION**: This document establishes the non-negotiable safety rules, fail-safe invariants, visual AI constraints, and human-in-the-loop requirements for the **Healthcare Triage Assistant**. All system components, AI prompts, backend services, and UI elements MUST strictly adhere to this safety contract.

---

## 1. Primary Design Principle & Information Pipeline

The system operates strictly as an **information organization and triage decision-support tool**. It does not perform autonomous diagnosis or treatment.

```
PATIENT
  │ (Provides Text, Voice, Reports, Images)
  ▼
AI-ASSISTED INFORMATION ORGANIZATION
  │ (Summarizes, Extracts, Normalizes, Performs OCR & Visual Description)
  ▼
STRUCTURED TRIAGE INFORMATION
  │ (Presents Structured Note, Timeline, Gaps, Confidence)
  ▼
SAFETY / REVIEW PRIORITY ENGINE
  │ (Evaluates Configured Signals & Deterministic Rules)
  ▼
QUALIFIED HUMAN REVIEW
  │ (Inspects, Corrects, Overrides, Verifies Drafts)
  ▼
HUMAN ACTION
  │ (Workflow Decision: Review, Refer, Escalate, Request Info)
```

**Human Authority Rule**: The qualified human reviewer remains 100% responsible for all final workflow and clinical decisions. AI outputs are strictly advisory.

---

## 2. Mandatory AI Prohibitions (Absolute Non-Goals)

The AI engine and underlying components MUST NEVER:

1. **Diagnose a Disease**: Never declare or infer a medical diagnosis (e.g., "Patient has appendicitis").
2. **Claim Disease Presence**: Never assert that a patient suffers from a specific clinical condition.
3. **Prescribe Medication**: Never recommend specific pharmaceutical drugs or therapeutic agents.
4. **Recommend Dosage**: Never suggest medication amounts, frequencies, or administration routes.
5. **Recommend Treatment**: Never suggest surgical, medical, or home treatments.
6. **Replace Healthcare Professionals**: Never act as a substitute for a qualified doctor, nurse, or health worker.
7. **Make Autonomous Final Decisions**: Never make unreviewed clinical or workflow decisions.
8. **Hide Uncertainty**: Never suppress or conceal low confidence scores, model ambiguity, or processing failures.
9. **Fabricate Missing Data**: Never hallucinate missing symptoms, lab values, OCR text, or patient history.
10. **Invent OCR Values**: Never guess unreadable or corrupted text in uploaded medical reports.
11. **Invent Patient History**: Never extrapolate unstated medical background or pre-existing conditions.
12. **Escalate Confidence Arbitrarily**: Never convert an uncertain extraction into a confident result.
13. **Silently Default to ROUTINE**: Never classify failed, ambiguous, or unverified processing as `ROUTINE`.

---

## 3. Visual AI Safety Contract

Visual image processing (e.g., skin rashes, lesions, wounds, swelling) MUST adhere to a strict descriptive observation policy.

### 3.1 Allowed Descriptive Observations
Visual AI models are limited to objective, physical attribute descriptions:
- *"Localized visible redness is present on the forearm."*
- *"Apparent localized swelling is visible near the joint."*
- *"Image appears adequately illuminated and in focus."*
- *"Image quality may be insufficient for reliable observation due to blur."*

### 3.2 Disallowed Diagnostic & Prescriptive Claims
Visual AI models must **NEVER** generate claims such as:
- ❌ *"This is cellulitis."*
- ❌ *"This is a fungal infection."*
- ❌ *"This wound is infected."*
- ❌ *"This is eczema."*
- ❌ *"Apply hydrocortisone cream to this rash."*
- ❌ *"Take antibiotics for this wound."*

### 3.3 Visual Pipeline Control Flow
Visual models MUST NOT directly assign final review priorities. Instead:

$$\text{Image Input} \longrightarrow \text{Quality Check} \longrightarrow \text{Descriptive Observation} \longrightarrow \text{Safety Rules Engine} \longrightarrow \text{Human Reviewer}$$

The original uploaded image MUST always remain accessible to the authorized reviewer for independent verification.

---

## 4. Workflow Review-Priority Categories

Priority categories govern **reviewer queue ordering and workflow velocity**. They are **NOT** diagnoses, medical severity metrics, or clinical treatment classifications.

```
       ┌─────────────────────────────────────────────────┐
       │                URGENT (Tier 1)                  │
       │ High-acuity workflow review signal detected.    │
       └─────────────────────────────────────────────────┘
                                │
                                ▼
       ┌─────────────────────────────────────────────────┐
       │               PRIORITY (Tier 2)                 │
       │ Moderate review signal or system uncertainty.   │
       └─────────────────────────────────────────────────┘
                                │
                                ▼
       ┌─────────────────────────────────────────────────┐
       │                ROUTINE (Tier 3)                 │
       │ Complete info, no signals, acceptable confidence│
       └─────────────────────────────────────────────────┘
```

### 4.1 URGENT (Review Priority Tier 1)
Assigned when pre-configured critical workflow signals are detected, requiring immediate human reviewer attention.
- **Configured Workflow Signals**:
  - Explicitly reported severe breathing difficulty or respiratory distress.
  - Chest pain combined with acute shortness of breath.
  - Altered consciousness, new onset confusion, or unresponsiveness.
  - Severe or uncontrolled active bleeding.
  - Seizure activity or active convulsions.
  - Immediate self-harm or suicidal intent language.
  - Severe allergic reaction signals (facial/airway swelling with breathing difficulty).
  - Configured critical pediatric alert signals.
  - Critical laboratory values flagged by clinician rules.
  - Manual escalation by a health worker or reviewer.

*Note: These are workflow queue management signals, NOT clinical diagnostic thresholds.*

### 4.2 PRIORITY (Review Priority Tier 2)
Assigned when elevated review is needed due to symptom persistence, data gaps, or AI uncertainty.
- **Configured Workflow Signals**:
  - Persistent fever exceeding configured duration threshold (e.g., >3 days).
  - Repeated or persistent vomiting with dehydration risk.
  - Significant persistent or worsening muscular/neurological weakness.
  - Concerning lab report value requiring clinical verification.
  - Incomplete patient input or missing critical contextual information.
  - Low AI extraction confidence (<0.70 threshold).
  - OCR extraction ambiguity or unreadable document segments.
  - Sub-optimal visual image quality or model uncertainty.
  - Reviewer-raised priority level.

### 4.3 ROUTINE (Review Priority Tier 3)
Strictly defined as:

> *"No configured higher-priority review signal was detected, required information was sufficiently available, and processing completed with acceptable confidence."*

#### Mandatory Definition Enforcement
`ROUTINE` must **NEVER** be described, displayed, or communicated as:
- ❌ *"The patient is medically fine."*
- ❌ *"The patient does not have a serious condition."*
- ❌ *"The patient does not need medical attention."*

---

## 5. HARD SYSTEM INVARIANT: The Fail-Safe Principle

> [!CAUTION]
> **HARD SYSTEM INVARIANT**: The system must **NEVER** silently classify uncertain, incomplete, or failed processing as `ROUTINE`. Any failure mode MUST default the case to `PRIORITY` or higher to mandate qualified human review.

### Fail-Safe Decision Matrix

| Trigger / Failure Scenario | Default Safety Handling | Resulting Priority |
| :--- | :--- | :--- |
| **LLM Provider API Failure / Timeout** | Catch error, log system alert, flag case as un-summarized. | `PRIORITY` |
| **Invalid LLM JSON / Output Format** | Automatic retry (max 1); if still invalid, log parse error. | `PRIORITY` |
| **Low Extraction Confidence (<0.70)** | Highlight low-confidence fields for mandatory verification. | `PRIORITY` |
| **OCR Text Ambiguity / Blur** | Mark unreadable text blocks with verification flags. | `PRIORITY` |
| **Vision Model Uncertainty / Blur** | Flag image as uninterpretable; mandate reviewer inspection. | `PRIORITY` |
| **Safety Engine Processing Failure** | Fallback to default safety state. | `PRIORITY` |
| **Missing Critical Information** | Generate follow-up questions; request patient/worker input. | `PRIORITY` |
| **STT Voice Transcription Failure** | Retain raw audio link; mark transcript as unverified. | `PRIORITY` |

---

## 6. Human-in-the-Loop & Attribution Tagging

To prevent AI-generated data from masquerading as human-authored or patient-provided data, all information blocks in the database and user interface MUST maintain strict provenance tags:

1. **`PATIENT-PROVIDED`**: Raw text, voice audio, uploaded lab documents, and images directly supplied by the patient or health worker.
2. **`AI-GENERATED`**: Structured symptom lists, timeline summaries, generated follow-up questions, OCR extractions, and descriptive visual observations created by Gemini, Sarvam, or Vision OCR.
3. **`SYSTEM-GENERATED`**: Automatically calculated SLA deadlines, risk priority flags, and system state transition audit logs.
4. **`REVIEWER-CORRECTED`**: AI-generated content that has been edited, corrected, or overridden by a qualified human reviewer.
5. **`REVIEWER-AUTHORED`**: Original clinical notes, referral comments, and disposition decisions written directly by a doctor or medical officer.

---

## 7. Privacy, Consent & Auditability

### 7.1 Synthetic Data & Privacy Compliance
- The prototype uses **synthetic/anonymous demo data ONLY** (e.g., Patient IDs `PT-1001`, `PT-1002`).
- Real patient identifiers (PGI, Aadhar, SSN, real names) must never be used in dev or demo environments.

### 7.2 Patient Consent
Every case intake MUST record explicit consent metadata:
- `consentGiven`: Boolean (`true`).
- `consentTimestamp`: ISO 8601 UTC timestamp.
- `consentVersion`: Policy version reference string (e.g., `"v1.0-hackathon"`).

### 7.3 Data Retention & Purge Policy
Cases maintain configurable lifecycle fields: `createdAt`, `completedAt`, `expiresAt`.
- Upon reaching `expiresAt`, raw patient text, voice audio files, uploaded lab reports, and visual images are permanently purged.
- System audit records are retained separately under an immutable audit retention policy.

### 7.4 Immutable Audit Logging
The system records all lifecycle actions in an append-only audit trail:
- **Logged Events**: `CASE_CREATED`, `CONSENT_RECORDED`, `REPORT_UPLOADED`, `OCR_COMPLETED`, `VOICE_TRANSCRIBED`, `IMAGE_ANALYZED`, `AI_SUMMARY_GENERATED`, `SAFETY_FLAG_CREATED`, `CASE_ASSIGNED`, `CASE_ACKNOWLEDGED`, `SLA_WARNING`, `SLA_EXPIRED`, `CASE_ESCALATED`, `REVIEWER_EDITED`, `REFERRAL_CREATED`, `CASE_COMPLETED`, `CASE_PURGED`.
- **Required Audit Context**: *WHAT happened*, *WHO performed it* (User ID / System), *WHEN did it happen* (Timestamp), and *PROVENANCE* (AI vs. Human vs. System).
- **Prohibitions**: Secrets, API keys, and un-hashed sensitive patient payloads MUST NEVER be written to audit logs.

---

## 8. Backend Security Baseline

1. **HTTP Headers & Rate Limiting**: Enforce `Helmet` for secure headers and `express-rate-limit` for API endpoint protection.
2. **Authentication & RBAC**: Enforce JWT token verification and role-based endpoint access on all backend API routes.
3. **Facility-Level Authorization**: Ensure health workers and reviewers can only access cases belonging to their authorized facility scope (`facilityId`).
4. **Input Sanitization**: Validate all incoming API request payloads with `Zod` schemas. Enforce file MIME-type whitelist (PDF, PNG, JPEG) and strict size limits (e.g., max 10MB per report).
5. **Server-Side AI API Keys**: API keys for Google Gemini, Sarvam AI, and Google Cloud Vision MUST remain on the backend server. **Never expose provider keys to client browsers.**
