# MedicalTriage Demo & Golden Workflow Guide

> **IMPORTANT DISCLAIMER**
> MedicalTriage is a non-diagnostic prototype built for human-in-the-loop clinical workflow assistance. It does NOT independently diagnose conditions, prescribe treatment, or make clinical decisions. All demo data and test cases are fictional and synthetic.

---

## 1. Overview & Setup

MedicalTriage is a human-in-the-loop triage support system designed for resource-constrained healthcare settings (e.g., PHCs, government hospitals, health camps, occupational health units). It organizes patient narratives, speech, reports (OCR), and visual observations into structured reviewer artifacts while calculating deterministic safety signals.

### Prerequisites

- **Node.js**: v18+ or v20+
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/medical_triage`) or Docker instance (`docker compose up -d mongo`)
- **Environment Configuration**: Ensure `.env` is populated in `backend/` and `frontend/`.

---

## 2. Quick Start & Seeding

### Step 1: Start the Backend Server

```bash
cd backend
npm run dev
```
*(Backend runs on `http://localhost:5000`)*

### Step 2: Start the Frontend Application

```bash
cd frontend
npm run dev
```
*(Frontend runs on `http://localhost:3000`)*

### Step 3: Seed Synthetic Test Data

To populate the system with deterministic synthetic patients, cases, reviewers, facilities, and audit entries, run:

```bash
cd backend
npm run seed:test-data
```

This creates standard test personas for evaluation.

---

## 3. Synthetic Demo Credentials

All test accounts use legitimate authentication and RBAC. The password for all seeded accounts is:

**Default Password**: `Password123!`

| Role | Email | Name | Facility | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Reviewer (Doctor)** | `doctor@example.com` | Dr. Aris Thorne | General Hospital | Case Review, Queue, Overrides, Referrals |
| **Reviewer (Nurse)** | `nurse@example.com` | Nurse Sarah Jenkins | General Hospital | Case Intake, Review, Escalation |
| **Patient** | `patient@example.com` | Synthetic Patient | N/A | Intake Submission, Case Status Tracking |
| **Admin** | `admin@example.com` | System Admin | All Facilities | Facility Mgmt, Audit Logs, System Config |

*Note: In the web UI login screen (`http://localhost:3000/login`), quick-fill buttons allow 1-click login using these exact accounts.*

---

## 4. The Golden Workflow

```text
[ Patient Intake ]
       │  (Narrative + Voice + Reports + Visual Observations)
       ▼
[ AI Extraction & Processing ]
       │  (Timeline, Missing Info, OCR Processing)
       ▼
[ Deterministic Safety Engine ]
       │  (Rule Engine + Safety Signals: URGENT / PRIORITY / ROUTINE)
       ▼
[ Reviewer Dashboard & Queue ]
       │  (SLA Tags, Priority Sorting, Facility Filtering)
       ▼
[ Structured Reviewer Workspace ]
       │  (Information Provenance, Triage Note, Verification Checkboxes)
       ▼
[ Qualified Human Review ]
       │  (Accept AI / Override Priority / Add Clinical Review Notes)
       ▼
[ Referral & Escalation / Audit Trail ]
       │  (Inter-facility Referral, Complete Immutable Audit Logging)
```

---

## 5. 3–5 Minute Hackathon Demo Script

Follow this concise sequence during live evaluation:

### 00:00 – 00:30 | Landing Page & Safety Boundary (`/`)
1. Open `http://localhost:3000/`.
2. Highlight the **Hero Banner** and stress the explicit **Non-Diagnostic Boundary** badge ("Built to assist — not replace — qualified healthcare staff").
3. Point out the India relevance (PHCs, Government Hospitals, Occupational Health Units) and the transparent 6-step workflow.

### 00:30 – 01:15 | Patient Self-Intake (`/patient/intake`)
1. Click **"Explore Demo"** or navigate to `/login` and select **"Log in as Patient"**.
2. Navigate to **"Patient Intake"**.
3. Fill out patient details:
   - **Age**: 45, **Gender**: Male, **Language**: English
   - **Chief Complaint**: Severe shortness of breath and chest pressure after walking up stairs.
   - **Duration**: 2 hours.
4. Upload a sample medical report / lab report.
5. Click **"Submit Triage Request"**.

### 01:15 – 02:00 | Reviewer Dashboard & SLA Queue (`/reviewer`)
1. Log out and click **"Log in as Reviewer (Doctor)"** (`doctor@example.com`).
2. Point out the top **Synthetic Demo Data Banner** indicating safe fictional evaluation.
3. Show the **Reviewer Queue**:
   - Note the **Priority Badges** (`URGENT` in red with icon, `PRIORITY` in amber, `ROUTINE` in blue).
   - Point out **SLA Timers** (`PENDING`, `DUE SOON`, `OVERDUE`) and emphasize that SLA measures operational timeliness, not direct clinical risk.
4. Filter by Facility or Status, then click on the newly created case (`CT-202609...`).

### 02:00 – 03:30 | Reviewer Case Workspace (`/reviewer/cases/[caseId]`)
1. **Claim Case**: Click "Claim Case" to assign yourself.
2. **Provenance & Information Grid**:
   - Highlight clear badges distinguishing **`PATIENT PROVIDED`**, **`AI GENERATED`**, and **`HUMAN VERIFIED`**.
3. **Structured Triage Note**:
   - Review AI-extracted symptoms, timeline, and identified missing information.
   - Point out **Safety Evaluation**: Show triggered safety rules (e.g. `Severe respiratory symptom detected -> URGENT`).
   - Emphasize safety phrasing: Routine cases state *"No configured higher-priority review signal detected"* rather than making false health guarantees.
4. **Human Verification & Decision**:
   - Check the **"Mark Information Verified"** checkbox.
   - Enter Reviewer Clinical Notes: *"Reviewed intake and safety signals. Immediate referral to Cardiology required."*
   - Set Human Decision: **Accept AI Priority** or perform **Priority Override**.
   - Click **"Complete Human Review"**.

### 03:30 – 04:30 | Inter-facility Referral & Audit Logging
1. In the Referral panel, select Destination Facility (**"District Hospital"**), Department (**"Cardiology"**), and reason.
2. Click **"Initiate Referral"**.
3. Navigate to **Audit Trail** (or Admin Panel `/admin`):
   - Show the immutable chronological audit log tracking every action: `CASE_CREATED` -> `CASE_CLAIMED` -> `EXTRACTION_RUN` -> `SAFETY_EVALUATED` -> `REVIEW_COMPLETED` -> `REFERRAL_INITIATED`.

---

## 6. Safety & Compliance Verification Checklist

When presenting or testing MedicalTriage, confirm that all non-diagnostic safety constraints are preserved:

- [x] **No Diagnostic Output**: The system surfaces extracted facts and safety flags, but never provides a diagnosis or diagnostic confidence percentage.
- [x] **No Prescriptions / Treatment**: The system does not recommend medication or therapeutic interventions.
- [x] **Strict Safety Precedence**: `URGENT > PRIORITY > ROUTINE`. Any system failure, uncertainty, or unhandled input defaults safely to `PRIORITY`.
- [x] **Transparent Provenance**: AI outputs are clearly labeled `AI GENERATED` and require qualified human review before final disposition.
- [x] **Synthetic Labeling**: All demo cases bear prominent `SYNTHETIC DEMO DATA` markers.
