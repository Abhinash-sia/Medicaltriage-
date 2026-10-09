# 🎙️ Sevansh — 10-Minute Master Presentation Script

> **Document Type:** Competition & Hackathon Presentation Script  
> **Target Duration:** Exactly 10 Minutes (600 Seconds)  
> **Target Slides:** 10 Slides (Aligned with `slide-idea.md` & `Problem_Statement_3.pdf`)  
> **Narrative Arch:** `WHY?` → `REAL PROBLEM` → `WHY IT MATTERS` → `SOLUTION` → `HOW IT WORKS` → `CAN IT WORK?` → `IS IT VIABLE?` → `WHAT IMPACT?` → `SHOW IT` → `PROVE SOURCES`

---

## 👥 Speaker Roster & Roles (Customizable Placeholders)

> _Adapt the speakers below based on your team size (1 to 4 members). If presenting solo, all segments merge into a single presenter._

| Speaker Role  | Name / Assignee Placeholder                         | Assigned Slides & Segments     | Primary Responsibilities                                                  |
| :------------ | :-------------------------------------------------- | :----------------------------- | :------------------------------------------------------------------------ |
| **Speaker 1** | `[INSERT SPEAKER 1 NAME / TEAM LEAD]`               | Slide 1, Slide 2, Slide 8      | Problem framing, human impact, non-diagnostic philosophy, closing vision  |
| **Speaker 2** | `[INSERT SPEAKER 2 NAME / AI & WORKFLOW LEAD]`      | Slide 3, Slide 4, Slide 5      | Solution architecture, multimodal intake pipeline, 7-step process flow    |
| **Speaker 3** | `[INSERT SPEAKER 3 NAME / SYSTEMS & SECURITY LEAD]` | Slide 6, Slide 7, Slide 10     | Engineering validation (344 tests), economic approach, research citations |
| **Speaker 4** | `[INSERT SPEAKER 4 NAME / DEMO DRIVER]`             | Slide 9 (Live Demo) + Q&A Lead | Live UI interaction, one-patient golden path demonstration, Q&A defense   |

**Team Name:** `[INSERT TEAM NAME]`  
**Institution / College:** `[INSERT INSTITUTION / UNIVERSITY / ORGANIZATION]`  
**Hackathon Track / Category:** Software / Healthcare Innovation  
**Problem Statement:** PS-01: Multimodal Healthcare Triage Assistant for Government and Institutional Health Facilities

---

## ⏱️ Master 10-Minute Timeline Breakdown

```text
====================================================================================================
TIME          SLIDE     TOPIC / MILESTONE                                    SPEAKER
====================================================================================================
00:00 – 00:55  Slide 1   The Problem: Triage Becomes a Bottleneck Before Care  Speaker 1
00:55 – 01:50  Slide 2   The Real Problem Is Lack of Structured Information    Speaker 1
01:50 – 02:50  Slide 3   Sevansh: Multimodal Triage Support Assistant          Speaker 2
02:50 – 03:50  Slide 4   System Architecture: How Sevansh Works               Speaker 2
03:50 – 04:50  Slide 5   Process Flow & Tech Stack: What Happens to 1 Patient  Speaker 2
04:50 – 05:50  Slide 6   Feasibility & Viability: Engineering Validation       Speaker 3
05:50 – 06:40  Slide 7   Economic Approach: Reduce Workflow Friction           Speaker 3
06:40 – 07:35  Slide 8   Impact & Benefits: Value Across the Ecosystem         Speaker 1
07:35 – 09:15  Slide 9   Live Demo: The Single Patient Golden Journey (100s)   Speaker 4 + 1
09:15 – 10:00  Slide 10  Research, Public Data & Academic Grounding            Speaker 3
----------------------------------------------------------------------------------------------------
10:00+         Post-Talk Judge Q&A Defense                                     All Speakers
====================================================================================================
```

---

## 📽️ SLIDE 1 — PROBLEM STATEMENT

### Title: The Problem: Triage Becomes a Bottleneck Before Care Begins

- **Timestamp:** `00:00 – 00:55` (55 Seconds · ~125 words)
- **Speaker:** `[INSERT SPEAKER 1 NAME]`

#### 🖥️ Slide Visual Structure:

- **Header:** Problem Statement Category: Software · Healthcare Delivery
- **Central Information Flow Bottleneck Diagram:**
  $$\text{Patient} \longrightarrow \text{Voice / Text / Reports / Visual Inputs} \longrightarrow \fbox{Unstructured Information} \longrightarrow \text{Staff} \longrightarrow \fbox{\textbf{The Problem}}$$
  - _Unstructured Information callouts:_ Different Languages · Incomplete Medical History · Scattered Physical Lab Reports · Crushing Patient Volume
  - _The Core Problem callout:_ "Important information can be difficult to collect, organize, prioritize, and hand over quickly."
- **Bottom Target Facilities Strip:**
  `Government Hospitals` · `Primary Health Centres (PHCs)` · `Public Health Camps` · `Company Clinics` · `Industrial Health Units` · `Campus Health Centers`

#### 🎬 Stage Directions & Cues:

> _Speaker 1 steps forward, stands center stage. Confident, grounded posture. Do not open with technology, databases, or algorithms. Make direct eye contact with the judges._

#### 🗣️ Verbatim Script:

> _"Respected judges and fellow innovators. Every single day across India—from rural Primary Health Centres in Odisha and Bihar to high-density government civil hospitals and industrial estate clinics—healthcare delivery breaks down long before a physician ever examines a patient._
>
> _The bottleneck is triage intake._
>
> _A patient arrives speaking a regional dialect. They carry a crumpled paper blood slip, report symptoms verbally, and wait in a corridor with eighty other walk-ins. Crucial information arrives fragmented across voice, paper reports, and unorganized conversations. Overworked nurses and community health workers are forced to manually collect, translate, decipher, and record this data on paper registers._
>
> _The consequence? Life-threatening red flags get buried beneath routine complaints, handover is delayed, and clinicians are forced to practice under acute cognitive overload._
>
> _Our target facilities—from rural PHCs to busy industrial units—do not suffer from a lack of care; they suffer because triage becomes an operational bottleneck before care can even begin."_

---

## 📽️ SLIDE 2 — WHAT IS THE REAL PROBLEM?

### Title: The Real Problem Is Not Lack of Data — It's Lack of Structured Information

- **Timestamp:** `00:55 – 01:50` (55 Seconds · ~130 words)
- **Speaker:** `[INSERT SPEAKER 1 NAME]`

#### 🖥️ Slide Visual Structure:

- **Four Distinct Information-Breakdown Blocks:**
  - `01 — Patient Information Is Fragmented:` Symptoms arrive haphazardly through spoken conversation, handwritten notes, paper pathology slips, or smartphone photos.
  - `02 — Information Is Incomplete:` Critical clinical timelines, prior medication histories, onset hours, and red-flag counter-indicators are routinely missing.
  - `03 — Language Creates Friction:` Patients and healthcare workers frequently speak different regional mother tongues, creating mutual translation friction.
  - `04 — Clinicians Face Prioritization Pressure:` High patient volumes make it impossible to rapidly identify which patients need immediate resuscitation versus routine care.
- **Anchor Punchline Banner (Bottom):**
  > **"Sevansh addresses the information and workflow bottleneck — not the clinical decision itself."**

#### 🎬 Stage Directions & Cues:

> _Advance to Slide 2. Point to the four blocks sequentially. Emphasize the punchline with deliberate pacing. This firmly establishes the safe, non-diagnostic boundary right from the beginning._

#### 🗣️ Verbatim Script:

> _"When we look deeper into this crisis, we realize something critical: the real problem in primary care is not a lack of patient data. It is a total lack of structured, prioritized information._
>
> _First, patient data is fragmented across speech, paper reports, and unorganized text. Second, it is fundamentally incomplete—vital baseline timelines and known allergies are rarely captured upfront. Third, language friction creates severe translation barriers between multilingual patients and facility staff. And fourth, clinicians face relentless prioritization pressure with zero dynamic visibility into who in the queue is deteriorating right now._
>
> _And this brings us to the core engineering boundary of our project:_
>
> _Sevansh addresses the information and workflow bottleneck—not the clinical decision itself. We do not diagnose. We do not prescribe. We structure chaotic intake so qualified clinicians can act with total clarity."_

---

## 📽️ SLIDE 3 — OUR SOLUTION

### Title: Sevansh — A Multimodal Triage Support Assistant

- **Timestamp:** `01:50 – 02:50` (60 Seconds · ~140 words)
- **Speaker:** `[INSERT SPEAKER 2 NAME]`

#### 🖥️ Slide Visual Structure:

- **Core End-to-End Pipeline Diagram:**
  $$\text{Patient Input} \longrightarrow \text{Information Processing} \longrightarrow \text{Structured Case} \longrightarrow \text{Safety \& Priority Layer} \longrightarrow \text{Human Reviewer} \longrightarrow \text{Action}$$
  - **Inputs:** Spoken Audio · Free Text · Medical Report Scans · Basic Visual Inputs
  - **Processing:** Multilingual STT · Vision OCR · Indian Language Translation · Clinical Entity Extraction
  - **Structured Case:** Standardized Symptoms · Chronological Timeline · Extracted Vitals · Missing Info Prompts
  - **Safety & Priority:** Deterministic Invariant Engine (`URGENT` / `PRIORITY` / `ROUTINE`)
  - **Reviewer:** Nurse · Community Health Worker · Medical Officer · Doctor
  - **Action:** Structured Triage Note (STN) Verification · Inter-Facility Referral Handover
- **Core Philosophy Callout:**
  > **"AI organizes information. Deterministic safety rules protect the boundary. Qualified professionals make the final decision."**

#### 🎬 Stage Directions & Cues:

> _Speaker 2 steps forward seamlessly. Voice shifts to engineering clarity and confidence. Hand gestures tracking the left-to-right flow of the architecture._

#### 🗣️ Verbatim Script:

> _"To solve this bottleneck, we engineered Sevansh: an accessible, human-in-the-loop triage support assistant tailored for Indian institutional facilities._
>
> _The system accepts patient complaints however they arrive: spoken regional audio, free-form text, scanned paper pathology slips, or basic visual inputs. It translates and transcribes the intake, extracts clinical entities, builds a chronological symptom timeline, and automatically identifies missing information._
>
> _It then passes this structured payload through an unbending, deterministic safety layer that assigns an actionable triage priority—URGENT, PRIORITY, or ROUTINE—bound to strict SLA response windows._
>
> _Finally, it delivers an auditable Structured Triage Note directly to a qualified reviewer—whether a triage nurse or medical officer—enabling rapid verification or escalation._
>
> _Our foundational philosophy is simple:_
> _AI organizes information. Deterministic safety rules protect the boundary. Qualified medical professionals make the final decision."_

---

## 📽️ SLIDE 4 — SYSTEM ARCHITECTURE

### Title: How Sevansh Works

- **Timestamp:** `02:50 – 03:50` (60 Seconds · ~140 words)
- **Speaker:** `[INSERT SPEAKER 2 NAME]`

#### 🖥️ Slide Visual Structure:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PATIENT INTAKE INTERFACE                        │
│             [Text]   │   [Voice]   │   [Reports]   │   [Visuals]       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      MULTIMODAL INGESTION LAYER                        │
│     Sarvam AI Speech-to-Text  │  Gemini Vision OCR  │  Translation     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CANONICAL STRUCTURED CASE                         │
│     Normalized Symptoms │ Timeline │ Extracted Vitals │ Missing Info   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DETERMINISTIC SAFETY ENGINE                        │
│          22 Hardcoded Safety Invariants (Zero LLM Inference)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DYNAMIC SLA PRIORITY QUEUES                        │
│           URGENT (1h SLA)  │  PRIORITY (4h SLA)  │  ROUTINE (24h SLA)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 HUMAN CLINICAL REVIEW & AUDIT LEDGER                   │
│   Distributed Concurrency Lock │ Structured Triage Note │ Referral PDF │
└────────────────────────────────────────────────────────────────────────┘
```

- **Technology Strip (Bottom):**
  `Next.js 16 (App Router)` · `React 19` · `TypeScript` · `Express.js` · `MongoDB / Mongoose` · `Docker`

#### 🎬 Stage Directions & Cues:

> _Advance to Slide 4. Point out the clear separation of concerns between non-deterministic AI ingestion and deterministic safety evaluation._

#### 🗣️ Verbatim Script:

> _"Here is how our system architecture achieves clinical safety without sacrificing multimodal flexibility._
>
> _At the ingestion boundary, we integrate Sarvam AI for fast Indian-language speech-to-text and Google Gemini Vision for robust optical character recognition on lab reports and prescriptions._
>
> _These inputs are normalized into a canonical Structured Case schema: extracting symptom severity, duration, vital signs, and uncollected fields._
>
> _Now comes our most critical architectural decision: we never allow generative AI to decide patient urgency._
>
> _Instead, the structured case is evaluated by our deterministic Safety Engine—a zero-hallucination rule validator containing twenty-two clinical invariants._
>
> _Cases are prioritized into First-In, First-Out queues with active countdown SLAs—one hour for Urgent, four hours for Priority, and twenty-four hours for Routine. Clinicians interact via a responsive Next.js review portal backed by distributed MongoDB concurrency locks and a tamper-evident audit ledger."_

---

## 📽️ SLIDE 5 — PROCESS FLOW & TECH STACK

### Title: What Actually Happens to One Patient?

- **Timestamp:** `03:50 – 04:50` (60 Seconds · ~145 words)
- **Speaker:** `[INSERT SPEAKER 2 NAME]`

#### 🖥️ Slide Visual Structure:

- **7-Step Patient Journey Horizontal Stepper:**
  - `01 — Intake:` Digital DPDP consent, regional language selection, audio/text complaints, lab report upload.
  - `02 — Understand:` Multimodal pipeline executes STT, OCR text extraction, and language normalization.
  - `03 — Structure:` LLM extracts timeline, standardized symptom entities, and detects missing critical details.
  - `04 — Safety:` 22 deterministic safety rules execute against clinical signals and system degradations.
  - `05 — Prioritize:` Triage tier assigned (`URGENT`, `PRIORITY`, or `ROUTINE`) with active SLA countdown.
  - `06 — Review:` Healthcare professional reviews structured intake with atomic concurrency lease lock.
  - `07 — Act:` Verifies STN, triggers human clinical escalation, or generates formal referral package.
- **Technology Mapping Badges:**
  `Next.js 16` · `Express` · `TypeScript` · `MongoDB` · `Sarvam AI` · `Gemini Flash` · `Docker`

#### 🎬 Stage Directions & Cues:

> _Advance to Slide 5. Walk through the 7 steps smoothly. Emphasize how each step builds verifiable evidence for the clinician._

#### 🗣️ Verbatim Script:

> _"To understand the practical impact, let us trace what happens when a single patient walks into a clinic._
>
> _Step One: Intake. The patient or health worker records their primary complaint—for instance, speaking Hindi into a smartphone mic—and uploads a cell phone photo of a local lab slip._
>
> _Step Two: Understand. Sarvam AI transcribes the audio, and Gemini Vision extracts the biochemical values from the report._
>
> _Step Three: Structure. The system organizes the encounter into a clean chronological timeline and flags what is missing—such as an unrecorded blood pressure reading._
>
> _Step Four & Five: Safety & Prioritize. The safety engine evaluates the structured signals against our invariant rules. If a red flag is detected, the case is assigned Urgent priority with a one-hour SLA._
>
> _Step Six & Seven: Review & Act. A medical officer reviews the pre-populated Structured Triage Note, verifies the evidence, and generates an immediate referral package with a single click."_

---

## 📽️ SLIDE 6 — FEASIBILITY & VIABILITY

### Title: Feasibility & Viability: Engineering Validation & Operational Reality

- **Timestamp:** `04:50 – 05:50` (60 Seconds · ~140 words)
- **Speaker:** `[INSERT SPEAKER 3 NAME]`

#### 🖥️ Slide Visual Structure:

- **Three Core Pillars:**
  - **Pillar 1: Technical Feasibility**
    - Modular TypeScript / Node.js microservices architecture
    - Containerized Docker deployment (`docker-compose up`)
    - 6 Role-Based Access Control (RBAC) tiers: `PATIENT`, `NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`
    - Sub-150ms p95 core API latency target across intake endpoints
  - **Pillar 2: Engineering Validation (Hard Evidence)**
    - **344 Automated Vitest Tests** across **24 comprehensive test suites**
    - **22 out of 22 Deterministic Safety Rules** mathematically verified with zero regressions
    - Distributed atomic concurrency locking tested against simultaneous reviewer race conditions
    - "Fail Upward to Priority" validation during artificial STT/OCR timeouts
  - **Pillar 3: Operational Feasibility & Risk Mitigation**
    - Graceful degradation: offline fallback mock drivers when cloud AI APIs disconnect
    - Deployable on low-spec hardware at PHCs, rural camps, and corporate occupational health clinics

#### 🎬 Stage Directions & Cues:

> _Speaker 3 steps forward. Tone is authoritative, data-driven, and rigorous. Highlight the 344 automated tests as concrete proof of engineering maturity._

#### 🗣️ Verbatim Script:

> _"A hackathon concept is only as good as its engineering rigor. We did not build a fragile mockup; we engineered a production-grade, hardened software platform._
>
> _On technical feasibility: the entire platform runs on a modular TypeScript stack, fully containerized in Docker, featuring six strictly enforced RBAC tiers and sub-150 millisecond p95 core API latency._
>
> _On engineering validation: our codebase is verified by 344 automated unit and integration tests across 24 Vitest test suites. Every single one of our twenty-two safety invariants has been verified against edge-case boundary conditions._
>
> _And on operational feasibility: recognizing rural India's connectivity challenges, we engineered defensive fallbacks. If cloud STT or OCR experiences API timeouts or low confidence, the system never drops the patient. It activates our 'Fail Upward' invariant, automatically elevating the case to Priority status so a human worker investigates immediately."_

---

## 📽️ SLIDE 7 — ECONOMIC APPROACH

### Title: Economic Approach: Reduce Workflow Friction, Not Clinical Responsibility

- **Timestamp:** `05:50 – 06:40` (50 Seconds · ~120 words)
- **Speaker:** `[INSERT SPEAKER 3 NAME]`

#### 🖥️ Slide Visual Structure:

- **Three Balanced Strategic Pillars (No Hallucinated Financial Projections):**
  - **Cost Drivers (Operational Expenditure):**
    - Cloud AI API consumption (metered per-audio-minute & per-image OCR tokens)
    - Lightweight compute & memory hosting (Node.js/Express containers)
    - Encrypted document storage & MongoDB replica set maintenance
  - **Efficiency Opportunities (Value Delivered):**
    - Drastic reduction in manual clerical transcription & documentation time
    - Accelerated patient handover between triage nurses and examining physicians
    - Elimination of duplicate patient interviews and missing lab test re-orders
    - Optimized queue utilization preventing avoidable emergency escalations
  - **Deployment Model:**
    - Facility-based institutional deployment model
    - Modular scaling based on: `Daily Patient Intake Volume` · `Facility Tier (PHC vs. District Hospital)` · `Storage Retention Period`

#### 🎬 Stage Directions & Cues:

> _Deliver Slide 7 with commercial realism. Do not invent fake ROI percentages or unverified market figures; keep the focus strictly on operational efficiency and sustainable cost structures._

#### 🗣️ Verbatim Script:

> _"From an economic standpoint, our approach is focused on reducing workflow friction rather than displacing clinical responsibility._
>
> _We deliberately avoid making up fictitious financial projections. Instead, we analyze the real operational economics:_
>
> _Our cost drivers are clear and bounded: metered cloud API calls for speech and OCR, lightweight containerized hosting, and secure data storage._
>
> _Against this, the economic return comes from eliminating massive clerical friction. By automating transcription, structuring lab data, and auto-flagging missing fields, we compress intake documentation time from ten minutes of handwriting to seconds of review. Triage nurses handle higher patient throughput without burnout, and duplicate lab investigations are prevented._
>
> _Our model scales modularly per facility—allowing a small rural PHC to operate on minimal compute while a district hospital scales out processing nodes on demand."_

---

## 📽️ SLIDE 8 — IMPACT & BENEFITS

### Title: Value Across the Healthcare Ecosystem

- **Timestamp:** `06:40 – 07:35` (55 Seconds · ~130 words)
- **Speaker:** `[INSERT SPEAKER 1 NAME]`

#### 🖥️ Slide Visual Structure:

- **4-Stakeholder Impact Grid:**
  - **For Patients:** Native regional language voice intake; elimination of repetitive symptom retellings; equitable access to rapid triage regardless of literacy level.
  - **For Health Workers:** Automated symptom structuring; missing-information prompt checklists; streamlined, rapid clinical handovers.
  - **For Clinicians:** Clean chronological timeline summaries; synthesized lab reports; automated Structured Triage Notes; queue sorted by urgency rather than arrival time.
  - **For Facilities:** Transparent SLA breach tracking; auditable referral package creation; DPDP-compliant data retention; enterprise audit logging.
- **Closing Principle Callout (Bottom):**
  > **"The goal is not to replace clinical judgment — it is to help the right information reach the right reviewer at the right time."**

#### 🎬 Stage Directions & Cues:

> _Speaker 1 takes over. Voice is warm, passionate, and visionary. Deliver the closing principle with strong emotional resonance._

#### 🗣️ Verbatim Script:

> _"When triage information flows smoothly, everyone in the healthcare ecosystem benefits._
>
> _For patients—especially non-literate or rural citizens—they can speak freely in their native dialect and upload physical paper slips without being alienated by digital complexity._
>
> _For community health workers and nurses, they are empowered with structured summaries and automated prompts that highlight missing vitals before the doctor sees the case._
>
> _For doctors, cognitive load is transformed. Instead of deciphering messy handwriting under severe time constraints, they receive a prioritized queue, a chronological symptom timeline, and extracted lab values ready for validation._
>
> _And for health facilities, management gains real-time visibility into queue SLAs, audit compliance, and referral safety._
>
> _Remember: our goal is never to replace clinical judgment—it is to help the right information reach the right reviewer at the right time."_

---

## 📽️ SLIDE 9 — LIVE DEMO & PROTOTYPE

### Title: Live Demonstration — The Single Patient Golden Workflow

- **Timestamp:** `07:35 – 09:15` (100 Seconds · 1 Minute 40 Seconds)
- **Speakers:** `[INSERT SPEAKER 4 NAME / DEMO DRIVER]` (Drives screen) + `[INSERT SPEAKER 1 NAME]` (Narrates)

#### 🖥️ Visual Screen Setup:

- Live Browser window open at `http://localhost:3000` (or `[INSERT SCREEN / RECORDING URL]`)
- Screen split or switching between:
  1. Patient Intake Portal (`/patient/intake`)
  2. Clinical Reviewer Dashboard (`/reviewer`)

#### 🎬 Detailed Live Action & Narration Script (Second-by-Second):

```text
+---------------------+---------------------------------------------------------------------------------+
| TIME (Demo Clock)   | DEMO DRIVER ACTION (Speaker 4)             | SPOKEN NARRATION (Speaker 1)                       |
+---------------------+---------------------------------------------------------------------------------+
| 00:00 – 00:20 (20s) | - Open Patient Intake Portal               | "Watch our golden workflow in real time.          |
|                     | - Check DPDP Consent checkbox              |  A patient arrives at a health camp. We capture   |
|                     | - Select Language: Hindi                   |  explicit digital consent, select Hindi, and      |
|                     | - Click Voice Input & play sample audio:   |  record their spoken audio: 'Mujhe 3 din se tez   |
|                     |   'Three days of high fever and vomiting'  |  bukhar hai aur ulti ho rahi hai.'"               |
+---------------------+---------------------------------------------------------------------------------+
| 00:20 – 00:40 (20s) | - Upload sample CBC blood report image     | "Next, the health worker uploads a photo of a     |
|                     |   (showing Platelet count 45,000 / μL)     |  crumpled CBC lab report and enters baseline      |
|                     | - Enter vitals: Temp 102.5°F, BP 110/70    |  vitals. We submit the intake.                    |
|                     | - Click 'Submit for Review'                |  Instantly, our background multimodal pipeline    |
|                     |                                            |  transcribes the voice and extracts the lab data."|
+---------------------+---------------------------------------------------------------------------------+
| 00:40 – 01:00 (20s) | - Show Structured Extraction card:         | "Notice what just happened: Sarvam STT and Gemini |
|                     |   Symptoms: Fever (Severity 8/10), Vomiting|  Vision structured the case into a chronological  |
|                     | - Missing Information Box highlighted:     |  timeline. It flagged 'Prior Medication History'   |
|                     |   'Missing: Fluid intake / hydration status|  as missing.                                     |
|                     | - Safety Engine badge triggers:            |  And then, Rule 10—Urgent Critical Lab—triggered   |
|                     |   'URGENT_CLINICIAN_LAB: Platelets < 50k'  |  because the extracted platelet count was 45,000!"|
+---------------------+---------------------------------------------------------------------------------+
| 01:00 – 01:25 (25s) | - Switch to Reviewer Dashboard             | "Now look at the Medical Officer's dashboard.     |
|                     | - Show the new case placed at the top of   |  The case jumped directly to the top of the Urgent|
|                     |   the URGENT queue with 1-hour SLA timer   |  queue with an active 60-minute countdown SLA.    |
|                     | - Click 'Review Case'                      |  When the doctor clicks 'Review', our atomic      |
|                     | - Concurrency lock banner appears:         |  MongoDB concurrency lock activates, preventing   |
|                     |   'Locked by Dr. [Name] (Active Lease)'    |  any other nurse from duplicate reviewing."       |
+---------------------+---------------------------------------------------------------------------------+
| 01:25 – 01:40 (15s) | - View pre-populated Structured Triage Note| "The doctor verifies the AI-extracted data, signs |
|                     | - Click 'Approve STN & Prepare Referral'   |  the Structured Triage Note, and with one click   |
|                     | - Referral PDF modal / handover card opens |  generates an inter-facility referral package for |
|                     |                                            |  the nearest district hospital. That is triage    |
|                     |                                            |  completed in under two minutes."                 |
+---------------------+---------------------------------------------------------------------------------+
```

---

## 📽️ SLIDE 10 — RESEARCH & REFERENCES

### Title: Research & References: Academic Grounding & Technical Foundations

- **Timestamp:** `09:15 – 10:00` (45 Seconds · ~110 words)
- **Speaker:** `[INSERT SPEAKER 3 NAME]`

#### 🖥️ Slide Visual Structure:

- **Four Clean Academic & Technical Quadrants:**
  - **1. Academic Research & Clinical Triage Literature:**
    - Emergency Triage & Rule-based Decision Systems: `[INSERT DOI: 10.xxxx/annemergmed.2023.xx]`
    - Human-in-the-Loop AI in Primary Healthcare: `[INSERT DOI: 10.xxxx/lancet.dh.2024.xx]`
    - Clinical NLP & Multilingual Health Processing: `[INSERT DOI: 10.xxxx/jmir.2023.xx]`
  - **2. Public Data Sources & Synthetic Methodology:**
    - Synthetic Patient Encounters Dataset (Synthea / Custom): `[INSERT SOURCE / URL]`
    - Open Government Data (OGD) Platform India — Facility Metrics: `[INSERT CITATION: data.gov.in]`
    - Zero Real Patient Records Used (Strict Compliance with Competition Guidelines)
  - **3. Market & Public Health Context:**
    - Rural Health Statistics (2022–2023), Ministry of Health & Family Welfare, Govt. of India: `[INSERT REPORT URL / CITATION]`
    - Digital Personal Data Protection (DPDP) Act, 2023 — Consent & Minimal Retention Guidelines
  - **4. Technical Documentation & Open Infrastructure:**
    - Sarvam AI Speech API (`saaras:v2`) · Google Gemini 2.5 Flash API · Next.js 16 · MongoDB 7.0 · Docker

#### 🎬 Stage Directions & Cues:

> _Advance to Slide 10. Speaker 3 stands tall, gesturing to the four pillars. Delivers final sentence with precision right as the timer reaches 10:00._

#### 🗣️ Verbatim Script:

> _"Everything we built is grounded in rigorous public health research and transparent technical foundations._
>
> _Our triage safety thresholds draw from established peer-reviewed emergency medicine protocols and human-in-the-loop clinical AI literature._
>
> _In accordance with competition rules, we utilized exclusively synthetic patient encounters and public datasets from the Open Government Data platform—zero private patient records were ever used._
>
> _Our privacy and consent safeguards align with India's Digital Personal Data Protection Act of 2023, and our architecture is built on robust open infrastructure including Sarvam AI, Google Gemini, and Next.js._
>
> _Sevansh bridges the gap between chaotic intake and qualified care. Thank you, and we welcome your questions!"_

---

## 🛡️ Judge Q&A Defense Quick-Reference (Post-10:00)

> _Keep this cheat sheet handy during the live Q&A session to deliver instant, airtight answers._

### Q1: "What if the AI hallucinates a symptom or misses a critical lab value?"

- **Answer (Speaker 2 / AI Lead):**
  > _"That is precisely why we enforced an architectural boundary: generative AI never makes the triage or priority decision. The LLM only structures entities. Furthermore, our safety engine contains dedicated 'Uncertainty Invariants'—if STT confidence drops below 0.60, or OCR is malformed, the system triggers `UNCERTAINTY_AI_EXTRACTION` and fails upward to Priority status. The clinician is shown the raw uploaded report side-by-side with the extraction for manual verification."_

### Q2: "Isn't this legally practicing medicine or diagnosing without a medical license?"

- **Answer (Speaker 1 / Lead):**
  > _"No. The system is explicitly non-diagnostic by design. It does not output diagnostic conclusions, differential diagnoses, or drug prescriptions. It functions as an administrative and workflow triage assistant that organizes patient-provided information into a standardized Structured Triage Note for a qualified human reviewer. All health-related outputs remain advisory and clinician-facing."_

### Q3: "How does this work in a remote PHC with intermittent or zero internet?"

- **Answer (Speaker 3 / Systems Lead):**
  > _"Our backend includes local fallback drivers. If cloud AI APIs become unreachable, the system queues the intake locally, executes local deterministic rule checks against raw user inputs, and flags the case with an `UNCERTAINTY_VOICE_STT_FAILURE` or network degradation signal. When connectivity resumes, background workers synchronize the audit ledger and cloud extractions."_

### Q4: "What prevents two doctors from reviewing and conflicting on the same patient simultaneously?"

- **Answer (Speaker 3 / Systems Lead):**
  > _"We implemented distributed atomic review locking using MongoDB `findOneAndUpdate`. When a reviewer opens a case, an exclusive 15-minute lease lock is acquired. If a second clinician opens that case, the UI displays a read-only lock banner indicating who is reviewing it. If the reviewer becomes inactive, the lock lease expires cleanly without corrupting the case state."_

### Q5: "How does this comply with the DPDP Act and patient privacy?"

- **Answer (Speaker 1 / Systems):**
  > _"Intake requires explicit digital consent. All uploaded audio and report media files are stored with random UUID identifiers, decoupled from patient identities, and governed by automated DPDP retention policies that purge or anonymize raw media post-review. Every action is permanently recorded in our 17-event immutable audit log."_
