# 🎬 MedicalTriage — Comprehensive Presentation Script

> **Format:** 10 Minutes | 4 Speakers | Live Interactive Demo Included  
> **Alignment:** 100% Compliant with Codebase & Capstone Engineering Report ([`main.tex`](file:///home/xandev/Programming/Projects/Medicaltriage-/docs/report/main.tex))  
> **Core Message:** A Human-in-the-Loop, non-diagnostic clinical triage and decision support system built for resource-constrained primary healthcare in India.

---

## 👥 Speaker Role Assignments

| Speaker | Role | Primary Segments & Specialization |
| :--- | :--- | :--- |
| **Person 1** | **Product Lead / Narrator** | Opens & closes, emotional public health hook, HITL non-diagnostic boundary, live demo narration. |
| **Person 2** | **Safety Architect** | Dual-engine isolation boundary, 22-rule deterministic safety engine, fail-safe hierarchy, monotonic priority arbitration. |
| **Person 3** | **Multimodal AI Engineer** | Sarvam AI Indic STT (10 languages + English), Gemini Vision OCR, audio/image validation, translation isolation. |
| **Person 4** | **Systems & Security Engineer** | Drives the live demo, atomic review concurrency locking, 17-event audit ledger, DPDP Act 2023 retention, 344 Vitest tests. |

---

## 📋 Timing Overview

```text
00:00 – 01:30  │  Person 1    │  Segment 1: The Hook — Rural Primary Care Realities
01:30 – 03:30  │  Person 2    │  Segment 2: Safety-First Architecture & 22-Rule Engine
03:30 – 05:30  │  Person 3    │  Segment 3: Multimodal Pipeline — Real Challenges, Real Solutions
05:30 – 08:00  │  Person 4+1  │  Segment 4: Live Demo — The Complete Golden Workflow
08:00 – 09:15  │  Person 4    │  Segment 5: Enterprise Security, Concurrency & Testing Evidence
09:15 – 10:00  │  Person 1    │  Segment 6: The Close — Engineering Philosophy & Vision
```

---

## ⏱️ SEGMENT 1 — THE HOOK: Rural Primary Care Realities
**Time:** 00:00 – 01:30 · **Speaker:** Person 1  
**Report Reference:** Chapter 1 (Introduction) & Chapter 2 (Literature Review)

> [!NOTE]
> Stand center stage. No slides for the first 30 seconds. Speak with direct eye contact to the judges. Establish emotional stakes immediately.

### Deliver:
> *"Imagine you are a medical officer at a Primary Health Centre in rural Odisha. It is Monday morning. There are over 80 walk-in patients waiting outside your door. A mother enters speaking Odia, holding a toddler with a burning fever that has not broken in four days. She hands you a crumpled, oil-stained paper blood report from a local lab. Behind her, an industrial worker is silently clutching his chest, unwilling to make a scene."*
>
> *"You have no digital intake, no registrar, no triaging nurse. Just a physical paper logbook. And you have less than three minutes to decide: who is decompensating, what does that lab slip say, and is that silent patient having an acute myocardial infarction?"*

**[Pause — 2 seconds for impact]**

> *"This is the reality of public primary care in India. Over 1,56,000 Sub-Centres. Over 30,000 PHCs. Two-thirds of the population lives in rural districts, but fewer than 27% of doctors serve there. At Community Health Centres, the government itself reported an 80% shortage of clinical specialists."*
>
> *"We engineered **MedicalTriage** to address this bottleneck. MedicalTriage is a full-stack, human-in-the-loop clinical decision support system designed specifically for high-throughput, resource-constrained clinics."*

**[SLIDE 1: Project Title, Architecture Overview & Core HITL Mandate]**

> *"Before we show you the code, let us state our most critical engineering boundary: **MedicalTriage is strictly non-diagnostic.** It never tells a patient 'you have pneumonia.' It never prescribes medication. It acts strictly as an operational cognitive accelerator: organizing multimodal complaints, parsing paper reports, evaluating deterministic clinical safety invariants, and surfacing prioritized data for qualified human review. The human medical officer retains absolute, final authority. Always."*

**[Hand off to Person 2]**

---

## ⏱️ SEGMENT 2 — SAFETY-FIRST ARCHITECTURE & THE 22-RULE ENGINE
**Time:** 01:30 – 03:30 · **Speaker:** Person 2  
**Report Reference:** Chapter 9 (AI-to-Safety Isolation) & Chapter 10 (Deterministic 22-Rule Safety Engine)

> [!NOTE]
> This segment proves algorithmic maturity. Emphasize why generative AI alone is medically dangerous and how the deterministic safety engine solves it.

### Deliver:
> *"Thank you. Judges, when our team designed this system, we confronted the most dangerous temptation in modern healthcare tech: asking a Large Language Model to assign patient triage priority."*
>
> *"In safety-critical emergency medicine, delegating triage to an LLM is a fatal design flaw. LLMs are probabilistic, stochastic, and prone to hallucination. An LLM might misinterpret a heart rate of 145 bpm in severe sepsis as mild anxiety and silently downgrade a patient to 'Routine.' In emergency care, an undetected undertriage is fatal."*
>
> *"So we established an uncompromised **Architectural Isolation Boundary**:"*

**[SLIDE 2: Architectural Isolation Boundary — Untrusted AI Realm vs. Deterministic Safety Domain]**

> *"We treat generative AI as an untrusted, advisory draft generator. Google Gemini structures free-text symptoms and transcribes context. But the AI has **zero authority** to set or downgrade patient acuity. Instead, all structured clinical data passes into an authoritative, hardcoded **Deterministic Safety Engine** consisting of 22 clinical rules codified in pure TypeScript."*

**[SLIDE 3: The 22 Deterministic Safety Rules Breakdown]**

> *"Our safety engine enforces a monotonic priority hierarchy: $\text{Final Priority} = \max(\text{Rule}_1, \dots, \text{Rule}_{22})$ across three strict clinical tiers: URGENT (1-hour SLA), PRIORITY (4-hour SLA), and ROUTINE (24-hour SLA):"*
>
> 1. *"**10 Clinical Urgent Invariants:** Acute respiratory distress ($\text{SpO}_2 < 90\%$), crushing chest pain with dyspnea, coma ($\text{GCS} \le 8$), active tonic-clonic seizures, arterial hemorrhage, pediatric vitals breaches, and panic laboratory thresholds like Platelets below 20,000."*
> 2. *"**5 Clinical Priority Invariants:** High-grade fever over 72 hours, intractable emesis, clinical dehydration, and explicit health worker escalation."*
> 3. *"**7 System Uncertainty & Degradation Rules:** What happens if the lab report photo is blurry? What if cloud speech transcription times out? What if the AI extraction confidence drops below 0.65? Most systems fail silently to Routine. **MedicalTriage fails upward to PRIORITY.** Because if the system is uncertain, a human doctor MUST visually inspect the patient immediately."*
>
> *"And notice our language: when a case has no red flags, our system does not falsely say 'Patient is healthy.' It explicitly displays: *'No configured higher-priority review signal detected.'* In clinical software, precise phrasing saves lives."*

**[Hand off to Person 3]**

---

## ⏱️ SEGMENT 3 — THE MULTIMODAL INGESTION PIPELINE
**Time:** 03:30 – 05:30 · **Speaker:** Person 3  
**Report Reference:** Chapter 8 (Patient Intake), Chapter 9 (Multimodal Processing), & Chapter 5 (Tech Stack)

> [!NOTE]
> Deliver developer war stories. Show technical grit: magic byte validation, Indic dialect normalization, and error handling.

### Deliver:
> *"Now let's talk about the real engineering hurdles of getting messy, raw data into that safety engine."*
>
> *"In rural primary care, data does not arrive as clean FHIR JSON. It arrives as spoken regional dialects, crumpled paper strips, and camera photos. We built a robust three-channel ingestion pipeline:"*

**[SLIDE 4: Multimodal Ingestion Pipeline Topology — Voice, OCR, Vitals]**

> *"**1. Indic Voice STT:** We integrated Sarvam AI’s foundation models, purpose-built for accented Indic speech across 10 Indian languages---Hindi, Odia, Bengali, Tamil, Telugu, Marathi, Kannada, Malayalam, Punjabi, and Gujarati---plus English.*
>
> *Here is a real edge case we hit: what if a patient uploads 20 seconds of OPD background noise with crying babies and ceiling fans? Our early build treated that as an empty transcription, and downstream LLM extractors hallucinated complaints from thin air! We engineered strict audio SNR checks and an explicit `Successful-but-Empty` state. If audio is unintelligible, the `UNCERTAINTY_LOW_CONFIDENCE` rule triggers, automatically escalating the case to PRIORITY."*
>
> *"**2. Diagnostic Lab OCR:** Patients bring physical CBC strips and serology reports. We leverage Google Cloud Vision and Gemini Vision to extract tabular matrices, analyte values, and reference boundaries. But we enforce strict defensive security: we validate binary magic bytes (RIFF/WAVE for audio, JPEG/PNG/PDF file signatures) to reject disguised payloads, and we strip all non-clinical EXIF metadata before processing."*
>
> *"**3. Translation Safety Boundary:** If an Odia patient says *'Chhati re bhari kasta hauchi'*, the original Odia string is preserved immutably in MongoDB. The English translation (*'Severe crushing chest pain'*) is rendered side-by-side with an `AI_GENERATED` provenance badge. Crucially, the Safety Engine evaluates the structured symptom entities, NOT the free-text English translation, guaranteeing that translation nuances never silently distort clinical urgency."*

**[Hand off to Person 4 + Person 1 for the Live Demo]**

---

## ⏱️ SEGMENT 4 — LIVE DEMO: THE GOLDEN WORKFLOW
**Time:** 05:30 – 08:00 · **Speakers:** Person 4 (Operating Laptop) + Person 1 (Narrating)  
**Report Reference:** Chapter 11 (Reviewer Cockpit), Chapter 16 (UI Workspaces), & Appendix D (Sample STN)

> [!IMPORTANT]
> Person 4 operates the browser. Person 1 speaks. Pre-seed database with `npm run seed:test-data`. Keep pre-loaded tabs ready at: `http://localhost:3000`, `/login`, `/patient`, `/reviewer`.

### Step 1 — Public Landing Page & Strict Safety Banner *(15s)*
**[Person 4 displays: `http://localhost:3000` — Hero & Top Navigation]**

> **Person 1:** *"Here is the production landing page. Notice the top bar navigation---it follows the exact chronological pipeline of our system: How It Works, Triage Sandbox, Core Capabilities, and India Context. Clicking any item smoothly scrolls with instant pill feedback. Right under the hero, notice our prominent regulatory disclaimer: Strictly non-diagnostic, human-in-the-loop."*

### Step 2 — Multimodal Patient Intake *(45s)*
**[Person 4 navigates to `/patient` — 4-Step Intake Wizard]**

> **Person 1:** *"Let's simulate a patient encounter. Step 1 mandates electronic informed consent and demographic registration. Step 2 captures chief complaints in regional languages. Step 3 allows uploading diagnostic lab scans. Step 4 validates physiological vitals against strict biological ranges---rejecting impossible values like negative blood pressure or $\text{SpO}_2 > 100\%$."*
>
> **Person 4 inputs:**
> - Age: 58, Gender: Male.
> - Chief Complaint: *"Severe crushing chest pressure radiating to left jaw, sweating."*
> - Vitals: HR 112 bpm, BP 154/96 mmHg, $\text{SpO}_2$ 91\%, RR 24 bpm.
> - Submits encounter.

### Step 3 — Reviewer Queue & SLA Countdown *(30s)*
**[Person 4 logs in as Doctor at `/reviewer`]**

> **Person 1:** *"Now we switch to the attending physician at SCB Medical College. Look at the Reviewer Queue. The newly created case (`CAS-2026-904281`) was evaluated instantaneously. Notice the red `URGENT` badge with a 1-hour countdown timer. If waiting time approaches 45 minutes, it flashes an amber 'Due Soon' alert. If it breaches 60 minutes, it automatically logs an `SLA_BREACH_TRIGGERED` event to the audit ledger."*

### Step 4 — Clinical Review Cockpit & Concurrency Lock *(40s)*
**[Person 4 clicks into the case dossier]**

> **Person 1:** *"The moment Dr. Sharma opens the chart, an atomic MongoDB lock is acquired using `Case.findOneAndUpdate`. If another doctor at the clinic attempts to claim this patient, they receive an immediate concurrency lock conflict notice."*
>
> *"Look at the split-screen cockpit: on the left, the raw multimodal dossier with provenance badges: `PATIENT_PROVIDED` in blue, `AI_GENERATED` in purple, and `HUMAN_VERIFIED` in green. On the right, the Deterministic Safety Engine findings: Rule `URGENT_CHEST_PAIN_BREATHING` triggered due to concurrent chest pressure and tachypnea. The system generated a Structured Triage Note (STN) draft and flagged missing clinical history---prompting the doctor to check cardiac medication history."*

### Step 5 — Human Review Sign-Off & Inter-Facility Referral *(20s)*
**[Person 4 clicks "Complete Review & Sign-Off" $\to$ selects "Inter-Facility Referral"]**

> **Person 1:** *"The physician verifies the findings, signs off on the STN note, and initiates an emergency Inter-Facility Referral to the District Cardiology Center. The referral state machine transitions to `INITIATED`, reserving monitored bed capacity via our atomic handshake protocol. The case is now finalized, locked, and permanently recorded in the audit trail."*

**[Hand off to Person 4]**

---

## ⏱️ SEGMENT 5 — ENTERPRISE SECURITY, CONCURRENCY & TESTING EVIDENCE
**Time:** 08:00 – 09:15 · **Speaker:** Person 4  
**Report Reference:** Chapter 6 (Database), Chapter 7 (RBAC), Chapter 12 (Threat Modeling), & Chapter 14 (Testing)

> [!NOTE]
> Deliver the hard technical proof: database architecture, security guarantees, and automated test metrics.

### Deliver:
> *"Thank you. Let me share three foundational engineering pillars that make this a production-grade system:"*

**[SLIDE 5: Architecture Proof — RBAC Matrix, Audit Ledger & DPDP Data Retention]**

> *"**1. Granular Security & Facility Isolation:** MedicalTriage enforces 6 distinct RBAC roles: `PATIENT`, `NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, and `ADMIN`. Reviewer queries are strictly scoped by `facilityId` at the database middleware layer---a medical officer at PHC A cannot leak or access records belonging to CHC B. Admin roles hold cross-facility operational governance."*
>
> *"**2. 17-Event Append-Only Audit Ledger:** In safety-critical healthcare, forensic non-repudiation is mandatory. Every login, symptom extraction, safety evaluation, acuity override, review claim, and referral emits an immutable event into MongoDB. Database-level and API-level permissions prohibit all `UPDATE` and `DELETE` operations on `auditlogs`."*
>
> *"**3. Privacy & DPDP Act 2023 Compliance:** We enforce automated data lifecycle management across 4 retention classes: `CLINICAL_CASE`, `MEDIA_BLOB`, `AI_DERIVED`, and `AUDIT_LOG`. Diagnostic scans and raw audio can be safely purged following retention expiration, while the signed STN note is permanently archived. And by design, we enforce a strict PII Minimization Invariant: **we never collect Aadhaar or PAN numbers**."*

**[SLIDE 6: Automated Testing & Verification Matrix — 24 Test Suites / 344 Tests]**

> *"**4. Empirical Test Verification:** We don't just assert safety---we mathematically verify it. Our backend is verified across **24 automated Vitest test suites comprising 344 individual unit and integration tests**! Every single one of our 22 deterministic safety rules has boundary fuzzing tests proving zero regressions and 100% fail-safe floor compliance."*

**[Hand off to Person 1 for the Close]**

---

## ⏱️ SEGMENT 6 — THE CLOSE: ENGINEERING PHILOSOPHY & VISION
**Time:** 09:15 – 10:00 · **Speaker:** Person 1  
**Report Reference:** Chapter 18 (Conclusion & Engineering Contributions)

> [!NOTE]
> Bring it back to the human story. Deliver the final punchy takeaway.

### Deliver:
> *"Judges, we are a team of four software engineering students. Across this project, we built a 24-module TypeScript backend, an ergonomic Next.js 16 frontend with 4 dedicated role workspaces, a complete 77-page engineering report, and an exhaustive 344-test verification suite."*
>
> *"We spent days debating what 'Routine' should mean. We rewrote the safety arbitration boundary three times because we refused to allow even a single edge-case undertriage. We engineered a synthetic dataset of 22 clinically realistic patient encounters because real patient privacy is non-negotiable."*
>
> ***"MedicalTriage does not try to replace the doctor. It ensures that the doctor sees the right patient, with the right information, at the right time. And when our system is uncertain? It fails upward, loudly and safely."***
>
> *"Thank you. We welcome your questions."*

---

## 🎯 Evaluation Criteria Coverage Matrix

| Evaluation Criteria | Weight | Presentation Alignment | Exact Report Chapter |
| :--- | :---: | :--- | :--- |
| **Safety-First Triage Workflow** | **20%** | Segment 2 (Person 2) | Chapter 10 (22 Rules, Monotonic Precedence, Safe Phrasing) |
| **Information Extraction \& STN** | **20%** | Segment 2 \& Demo Step 4 | Chapter 9, Chapter 11, Appendix D (Structured Triage Note) |
| **Multimodal Capability** | **15%** | Segment 3 (Person 3) | Chapter 8, Chapter 9 (Sarvam STT, Gemini Vision, Magic Bytes) |
| **India-Wide Relevance \& Dialects** | **15%** | Segment 1 \& Segment 3 | Chapter 1, Chapter 9, Chapter 16 (10 Indic Languages, PHCs) |
| **Human Review \& Escalation** | **15%** | Demo Steps 3--5 (Person 4+1) | Chapter 11 (Queue, SLA Timers, Concurrency Locking, Referrals) |
| **Privacy, RBAC \& Threat Defense** | **10%** | Segment 5 (Person 4) | Chapter 6, Chapter 7, Chapter 12 (STRIDE, 17-Event Audit, DPDP) |
| **Demo Quality \& Testing Depth** | **5%** | Live Demo \& Segment 5 | Chapter 14 (24 Suites / 344 Tests, Seed Dataset) |

---

## ❓ Anticipated Judge Questions & Hard Defense Answers

### Q1: *"What if the generative AI hallucinates a symptom that isn't real?"*
> **Answer:** "All AI outputs are explicitly tagged with `AI_GENERATED` provenance badges and treated strictly as unverified drafts. They cannot alter patient priority. The Deterministic Safety Engine evaluates structured clinical entities, and a human clinician must inspect and sign off on the Structured Triage Note before it becomes `HUMAN_VERIFIED`. A hallucinated symptom is visibly isolated and cannot trigger priority downgrades."

### Q2: *"Why not fine-tune an LLM or use Med-PaLM directly for triage decisions?"*
> **Answer:** "Because clinical triage requires mathematical invariance and legal explainability. If an LLM is prompted twice with the same vitals, temperature, or subtle variation, probabilistic sampling can produce divergent acuity tiers. In our Deterministic Safety Engine, $\text{Final Priority} = \max(\text{Rule}_1, \dots, \text{Rule}_{22})$ is a pure, auditable TypeScript function. Given the same inputs, it is mathematically guaranteed to produce the exact same priority tier every single time."

### Q3: *"How does your concurrency locking handle network disconnects or abandoned charts?"*
> **Answer:** "We execute atomic lease acquisition via MongoDB's `Case.findOneAndUpdate({ _id: caseId, assignedReviewerId: null })`. The lock assigns the reviewer exclusively. If a doctor closes their browser or experiences an outage, administrative supervisors can release the case back to the facility queue via `POST /api/reviewer/cases/:id/release`, which logs an `ENCOUNTER_LOCK_RELEASED` audit event."

### Q4: *"Why do you support 10 Indian languages rather than all 22 scheduled languages?"*
> **Answer:** "We targeted Sarvam AI’s production-grade GA foundation models (`saarika:v2` and `mayura:v1`), covering over 90% of the patient demographics across our primary target corridors (Odisha, West Bengal, Maharashtra, Gujarat, and the Hindi-speaking belt). Our backend uses a decoupled provider interface pattern (`SpeechToTextProvider`); adding more regional dialects requires zero architectural restructuring, simply updating the provider model configuration."

### Q5: *"How do you guarantee non-repudiation in the audit trail?"*
> **Answer:** "Our `auditlogs` collection is strictly append-only. The Express router exposes no `PUT`, `PATCH`, or `DELETE` endpoints for audit records, and Mongoose schemas prohibit document mutations. Each event captures the actor's authenticated ID, timestamp, IP address, resource type, and payload hash, enabling complete forensic reconstruction."

---

## 🔥 Memorable One-Liners (Deploy for Maximum Impact)

- *"In healthcare AI, the most dangerous word in the English language is 'probably.'"*
- *"Our system doesn't diagnose. It organizes. The human doctor decides."*
- *"When our AI fails, it never whispers 'Routine.' It shouts 'PRIORITY.'"*
- *"344 automated tests. 22 safety invariants. Zero autonomous diagnoses. That is our product."*

---

## 🛠️ Tech Stack & Key Metrics Quick Reference

| Dimension | Specification | Codebase Evidence |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16.3.8 (App Router), React 19, TypeScript 5.8 | [`frontend/package.json`](file:///home/xandev/Programming/Projects/Medicaltriage-/frontend/package.json) |
| **Styling & Motion** | Tailwind CSS 4, Lucide Icons, GSAP Micro-animations, Lenis | [`frontend/src/app/globals.css`](file:///home/xandev/Programming/Projects/Medicaltriage-/frontend/src/app/globals.css) |
| **Backend Architecture** | Node.js v22 LTS, Express.js, 24 Domain-Driven TypeScript Modules | [`backend/src/modules/`](file:///home/xandev/Programming/Projects/Medicaltriage-/backend/src/modules) |
| **Database & ODM** | MongoDB 7.0 & Mongoose ODM (`cases`, `reviews`, `triagenotes`, `auditlogs`) | [`backend/src/modules/cases/case.model.ts`](file:///home/xandev/Programming/Projects/Medicaltriage-/backend/src/modules/cases/case.model.ts) |
| **Speech STT & Translation** | Sarvam AI Indic Speech (`saarika:v2`, `mayura:v1`) across 10 Indic languages | [`backend/src/modules/voice/`](file:///home/xandev/Programming/Projects/Medicaltriage-/backend/src/modules/voice) |
| **Diagnostic Vision OCR** | Google Cloud Vision API & Gemini 1.5 Pro multimodal vision | [`backend/src/modules/ocr/`](file:///home/xandev/Programming/Projects/Medicaltriage-/backend/src/modules/ocr) |
| **Automated Testing** | 24 Vitest Test Suites, 344 Unit & Integration Tests, Playwright E2E | [`backend/tests/`](file:///home/xandev/Programming/Projects/Medicaltriage-/backend/tests) |
| **Synthetic Dataset** | 22 Seed Encounters (10 URGENT, 7 PRIORITY, 5 ROUTINE) across 3 facilities | [`backend/src/seed/synthetic-dataset.data.ts`](file:///home/xandev/Programming/Projects/Medicaltriage-/backend/src/seed/synthetic-dataset.data.ts) |
| **Security & Cryptography** | JWT (15m TTL), bcrypt (12 salt rounds), Helmet, Express Rate Limit | [`backend/src/middleware/`](file:///home/xandev/Programming/Projects/Medicaltriage-/backend/src/middleware) |
