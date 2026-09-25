# Synthetic Healthcare Dataset & Seed Strategy (Phase 20)

## 1. Purpose & Synthetic Data Policy

To enable safe, deterministic testing, evaluation, and demonstrations without risking real patient privacy or exposing Protected Health Information (PHI), this repository uses a completely synthetic dataset.

### Strict Invariants:
1. **No Real Patient Data**: No real patient records, names, phone numbers, email addresses, Aadhaar numbers, or medical record numbers are used.
2. **Reserved Domains**: All synthetic email addresses utilize reserved `.test` or `.example.test` domains.
3. **Explicit Labeling**: Every seed artifact and record is marked as `SYNTHETIC / NON-CLINICAL / DEMO DATA`.
4. **Production Block**: The seed runner refuses execution if `NODE_ENV === 'production'`.

---

## 2. Dataset Composition

The synthetic dataset consists of **3 facilities**, **10 users**, and **20 diverse clinical cases** covering the entire spectrum of triage workflows.

### 2.1 Facilities
* `FAC-PHC-BALASORE`: Balasore Primary Health Centre (Primary Care)
* `FAC-DH-CUTTACK`: Cuttack District Headquarters Hospital (Secondary Care)
* `FAC-SCB-MCH`: SCB Medical College & Hospital (Tertiary Referral Facility)

### 2.2 User Personas
* **5 Patients**: Multilingual speakers representing Hindi (`hi`), Odia (`or`), Bengali (`bn`), Tamil (`ta`), and Gujarati (`gu`).
* **4 Clinicians / Officers**: Nurses, Medical Officers, and Doctors mapped to specific facilities.
* **1 System Administrator**: Operational admin persona for facility/user governance and retention management.

### 2.3 Case Scenarios
* **Routine (5 Cases)**:
  - Low-risk mild viral rhinitis without fever or dyspnea.
  - Mild localized forearm dermatitis.
  - Stable chronic hypertension medication renewal.
  - Mild ankle sprain with full weight-bearing capacity.
  - Tension headache relieved by rest.
* **Priority (7 Cases)**:
  - Persistent high fever (>3 days) with rigors.
  - Repeated vomiting (>5 episodes) with mild dehydration risk.
  - Severe progressive fatigue and conjunctival pallor.
  - Incomplete intake missing critical clinical onset and vitals.
  - Complex abdominal pain with low-confidence AI extraction.
  - Blurry unstructured OCR laboratory report.
  - Odia voice intake with background noise / partial STT confidence.
* **Urgent (8 Cases — All Phase 15 Safety Rules)**:
  - Severe respiratory distress with stridor / gasping.
  - Crushing retrosternal chest pain radiating to left jaw.
  - Sudden altered mental status / acute neurological deficit (suspected stroke).
  - Pulsatile arterial hemorrhage from machinery cut.
  - Active continuous generalized tonic-clonic seizure (>5 minutes).
  - Explicit suicidal intent / acute psychiatric distress.
  - Acute anaphylactic angioedema with airway involvement.
  - Post-stabilization emergency cardiology referral to tertiary center.

---

## 3. Seed Command & CLI Execution

### Running the Seed Script:
```bash
npm run seed:test-data
```

### Execution Output:
```text
Connecting to database: mongodb://localhost:27017/medical_triage...
Database connected successfully.

--- SEEDING DETERMINISTIC SYNTHETIC DATASET ---

======================================================
       SYNTHETIC DATASET SEEDED SUCCESSFULLY          
======================================================
 Facilities:           3
 Users:                10
 Cases:                20
 Safety Evaluations:   20
 Triage Notes:         20
 Reviews:              2
 Referrals:            1
 Notifications:        16
 Audit Logs:           20
======================================================
```

---

## 4. Idempotency & Database Safety

* **Upsert Semantics**: All facilities, users, and cases are identified by unique deterministic keys (`code`, `email`, `caseNumber`, `idempotencyKey`).
* **Safe Re-runs**: Running `npm run seed:test-data` repeatedly updates existing records in place without creating duplicate cases or notifications.
* **Non-destructive**: Does not drop the database; safely ensures required demo entities are in a predictable baseline state.
