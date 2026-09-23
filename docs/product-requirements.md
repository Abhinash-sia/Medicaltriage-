# Healthcare Triage Assistant — Product Requirements Document (Phase 0)

> [!IMPORTANT]
> **System Purpose & Scope Disclaimer**: The Healthcare Triage Assistant is a **human-in-the-loop decision-support system** designed to organize patient-provided information and prepare structured summaries for review by qualified healthcare professionals. **It is NOT a doctor, diagnostic tool, medical treatment system, or prescription system.** Final clinical decisions and workflow actions are strictly the responsibility of authorized human reviewers.

---

## 1. Executive Summary & Purpose

The **Healthcare Triage Assistant** addresses high patient volume, limited specialist availability, and variable digital literacy across public and primary healthcare settings. The system ingests, normalizes, and structures unstructured patient communications—including text, voice recordings, medical lab reports, and visual observations—to accelerate and standardize pre-review triage by qualified healthcare workers.

### Primary Purpose & Operational Goal
- **Summarize & Extract**: Structure patient-reported symptoms, onset timelines, and chief complaints.
- **Detect Gaps**: Identify missing clinical context and generate targeted follow-up questions.
- **Process Reports & Visuals**: Perform OCR on uploaded lab/imaging reports and generate objective, descriptive visual observations.
- **Normalize Language**: Translate and normalize regional language inputs (e.g., Hindi to English) into structured clinical summaries.
- **Assign Priority & Workflow**: Evaluate signals against configured safety rules to assign workflow review priorities (`URGENT`, `PRIORITY`, `ROUTINE`).
- **Support Workflow & Audit**: Track SLAs, facilitate reviewer assignment, prepare referral drafts, maintain tamper-evident audit logs, and enforce data retention rules.

---

## 2. Core Design Principle & Information Flow

The architecture enforces a strictly linear, human-authoritative pipeline:

```
PATIENT
  │
  ▼
AI-ASSISTED INFORMATION ORGANIZATION
  │
  ▼
STRUCTURED TRIAGE INFORMATION
  │
  ▼
SAFETY / REVIEW PRIORITY ENGINE
  │
  ▼
QUALIFIED HUMAN REVIEW
  │
  ▼
HUMAN ACTION & WORKFLOW DECISION
```

1. **AI Output is Advisory**: AI components assist solely in organizing, extracting, and summarizing data.
2. **Human Review is Authoritative**: A qualified human reviewer must review, edit, verify, and authorize any final clinical or workflow action.

---

## 3. Target User Roles & RBAC Matrix

Permissions and role-based access control (RBAC) are strictly enforced at the backend level.

| Role | Description | Key System Capabilities |
| :--- | :--- | :--- |
| `PATIENT` | Individuals seeking triage assessment. | - Provide symptom text and voice recordings.<br>- Upload supported lab reports and visual images.<br>- Answer generated follow-up questions.<br>- View appropriate status/summaries of their own case. |
| `HEALTH_WORKER` | Frontline healthcare staff, intake nurses, community health workers. | - Collect patient information on behalf of patients.<br>- Inspect active triage cases within authorized facility scope.<br>- Review AI-organized summaries and request missing info.<br>- Escalate cases based on facility workflow rules. |
| `DOCTOR` / `MEDICAL_OFFICER` | Qualified clinical reviewers and medical officers. | - Perform authoritative clinical review of organized cases.<br>- Inspect, correct, or override AI summaries, OCR data, and visual observations.<br>- Add clinical workflow notes and verify referral drafts.<br>- Escalate cases, request additional information, or complete reviews. |
| `ADMIN` | System and facility administrators. | - Manage user accounts, facility scopes, and reviewer availability.<br>- Configure safety rules, urgency signals, and language settings.<br>- Inspect audit logs and configure data retention policies. |

---

## 4. Supported Facility Types

The product architecture is designed for adaptability across diverse healthcare deployment tiers:

- **`GOVERNMENT_HOSPITAL`**: High-throughput tertiary and district hospital emergency/outpatient departments.
- **`PHC` (Primary Health Centre)**: Rural/semi-urban frontline health centers with limited specialist availability.
- **`PUBLIC_HEALTH_CAMP`**: Temporary or mobile health screening drives with high patient volume.
- **`COMPANY_CLINIC`**: Occupational health centres in corporate or industrial settings.
- **`INDUSTRIAL_HEALTH_UNIT`**: On-site medical units in manufacturing and industrial complexes.
- **`CAMPUS_HEALTH_CENTER`**: Educational institution student and staff health facilities.

---

## 5. Multi-Channel Input Specifications

The system ingests patient communication across four distinct input channels:

### 5.1 Text Input Channel
- Direct text entry of chief complaints, symptom descriptions, duration, and medical history.
- Enforces strict input validation and length bounds.

### 5.2 Voice Input Channel
- Ingestion of patient voice recordings for accessibility across varying digital literacy levels.
- Pipeline: `Audio Input` → `Speech-to-Text (STT)` → `Raw Transcript` → `Language Identification` → `Translation / Normalization` → `Structured Extraction`.

### 5.3 Medical Reports Channel
- Ingestion of uploaded lab reports, discharge summaries, or prescriptions (PDF, PNG, JPEG).
- Pipeline: `Uploaded File` → `File Type & Security Validation` → `OCR Processing` → `Extracted Text` → `Structured Value Extraction` → `Confidence & Verification Flagging` → `Human Reviewer`.

### 5.4 Visual Input Channel
- Ingestion of basic external visual images (e.g., skin rashes, visible wounds, localized swelling).
- **Safety Restriction**: Visual processing is strictly non-diagnostic and generates descriptive physical observations only.
- Pipeline: `Image File` → `Validation & Quality Check` → `Vision Processing` → `Descriptive Physical Observation` → `Quality/Confidence Assessment` → `Human Reviewer`.

---

## 6. AI System Capabilities & Non-Goals

### 6.1 Authorized AI Capabilities
1. **Symptom & Timeline Extraction**: Parsing unstructured text/voice into structured timelines and symptom lists.
2. **Missing-Information Identification**: Highlighting incomplete history (e.g., missing onset time, unstated duration).
3. **Follow-Up Question Generation**: Formulating targeted questions for patient clarification.
4. **Multilingual Translation & Normalization**: Converting regional language communications into standardized clinical terminology.
5. **OCR-Assisted Report Structuring**: Parsing numerical values, units, and reference ranges from documents.
6. **Descriptive Visual Observation**: Cataloging physical attributes (e.g., color, size, illumination) without diagnostic labelling.
7. **Structured Triage Note Preparation**: Formatting patient data into standardized clinical summaries.
8. **Configured Priority Signal Detection**: Flagging pre-configured risk phrases against safety rules.
9. **Referral Draft Generation**: Drafting initial referral notes for reviewer editing.

### 6.2 Mandatory AI Prohibitions (Non-Goals)
The AI engine must **NEVER**:
- Diagnose any disease or clinical condition.
- Claim a patient has a specific illness or syndrome.
- Prescribe medication or recommend specific dosages.
- Recommend medical treatment or therapeutic interventions.
- Replace a qualified doctor or healthcare worker.
- Independently make a final clinical or workflow decision.
- Hide uncertainty or low confidence scores.
- Fabricate missing patient data, OCR values, or medical history.
- Convert an uncertain extraction into a confident result.
- Silently classify failed or ambiguous processing as `ROUTINE`.

---

## 7. Case Lifecycle & Workflow States

Cases move through a deterministic state machine:

```
[DRAFT]
   │
   ▼
[SUBMITTED] ──► [PROCESSING] ──► [READY_FOR_REVIEW]
                                       │
                                       ▼
                                   [ASSIGNED]
                                       │
                                       ▼
                                 [ACKNOWLEDGED]
                                       │
                                       ▼
                                 [UNDER_REVIEW]
                                  │   │   │   │
             ┌────────────────────┘   │   │   └────────────────────┐
             ▼                        ▼   ▼                        ▼
        [REVIEWED]              [MORE_INFO] [ESCALATED]        [REFERRED]
             │                        │       │                    │
             └────────────────────────┴───────┴────────────────────┘
                                      │
                                      ▼
                                 [COMPLETED]
```

---

## 8. Approved Technology Stack

### Frontend Stack
- **Framework**: Next.js 15+ (App Router), TypeScript.
- **Styling & UI**: Tailwind CSS, shadcn/ui.
- **Form & State Management**: React Hook Form, TanStack Query (React Query), Zod schema validation.

### Backend Stack
- **Runtime & Framework**: Node.js, Express, TypeScript.
- **Database & ORM**: MongoDB, Mongoose.
- **Security & Utilities**: JWT authentication, Helmet, `express-rate-limit`, Pino logger, Zod schema validation.

### AI & Media Integration Service Providers
- **Large Language Model (LLM)**: Google Gemini 2.5 Flash.
- **Voice & Speech-to-Text**: Sarvam AI (specialized for Indian regional languages).
- **Document OCR**: Google Cloud Vision OCR.

### Infrastructure & DevOps
- **Containerization**: Docker, Docker Compose.
- **Testing**: Vitest.

---

## 9. MVP vs. Stretch Scope Boundary

### MUST HAVE (MVP Scope)
- Complete Next.js frontend & Express backend with TypeScript.
- MongoDB database schema with Mongoose models & JWT/RBAC security.
- Patient multi-channel intake interfaces (Text, Voice, Report upload, Image upload).
- Reviewer dashboard with queue management, filtering, and detail modal.
- Gemini 2.5 Flash integration for structured symptom extraction and triage notes.
- Sarvam AI integration for Hindi voice STT and translation.
- Google Cloud Vision integration for lab report OCR.
- Deterministic Safety & Review-Priority Engine (`URGENT`, `PRIORITY`, `ROUTINE`).
- Human reviewer editing, approval, referral drafting, and escalation workflow.
- Reviewer assignment engine and SLA tracking with expiration triggers.
- Privacy compliance (synthetic demo data `PT-1001`, consent recording, data purge/retention framework).
- Security baseline (Helmet, rate limiting, Zod validation, server-side secret protection).

### STRETCH Scope (Post-MVP Extensions)
- Redis and BullMQ background task queue infrastructure.
- Playwright End-to-End (E2E) automated testing suite.
- Advanced offline-first synchronization for low-connectivity PHCs.
- Support for additional regional languages beyond English and Hindi.
- Advanced population health and facility workload analytics.
