# MedicalTriage — System Limitations & Prototype Boundaries

> **Technical & Operational Limitations Document**
> *This document provides a factual disclosure of current software boundaries, technical trade-offs, and prototype limitations.*

---

## 1. Clinical & Regulatory Limitations

- **Non-Diagnostic Prototype**: MedicalTriage is a research and evaluation prototype. It has not undergone clinical trials, clinical validation studies, or medical device conformity assessments.
- **No Independent Decision-Making**: The system does not independently diagnose medical conditions, recommend drug dosages, prescribe treatments, or override human clinical judgement.
- **Configured Rule Scope**: The safety engine implements 22 deterministic red-flag rules. It is not an exhaustive clinical expert system and cannot evaluate unconfigured medical conditions.
- **Advisory AI Outputs**: Natural language summaries, entity extractions, and OCR text are AI-generated suggestions requiring mandatory human inspection.

---

## 2. Infrastructure & Storage Limitations

- **Local Filesystem Media Storage**: Audio recordings, visual photos, and report PDFs are stored on local disk (`REPORT_STORAGE_DIR`) rather than distributed encrypted cloud object stores (e.g., AWS S3 with KMS or Google Cloud Storage).
- **Single-Node Execution**: Background tasks (SLA checking, retention purge, notifications) execute in-process rather than via distributed message queues (e.g., Redis + BullMQ).
- **Embedded Rate-Limiting**: Express rate-limiting uses memory-store counters rather than distributed Redis stores, making it single-instance bound.
- **Database Architecture**: Multi-tenancy and facility isolation are enforced at the Mongoose query level rather than physical database-per-tenant or PostgreSQL RLS.

---

## 3. External API & Multimodal Limitations

- **API Provider Dependency**: Real-world OCR, STT, and Vision processing rely on external third-party API availability (Google Cloud Vision, Sarvam AI, Google Gemini). Network outages or rate limits impact live processing.
- **Mock Provider Defaults**: In offline development and automated test environments, mock providers generate synthetic outputs.
- **Audio & Image Quality**: STT transcription accuracy depends on clear audio input, low ambient noise, and supported regional accents. OCR document extractions require legible scan resolution.

---

## 4. Security & Compliance Disclaimers

```text
Prototype/hackathon implementation for research and evaluation purposes.

This project has not undergone an independent security audit, clinical validation,
medical-device conformity assessment, or regulatory certification.

Real-world deployment would require appropriate legal, clinical, privacy,
security, infrastructure, and regulatory review for the target jurisdiction.
```

- **Secrets Management**: Secrets (JWT secret, API keys) are configured via environment variables rather than dedicated cloud secret managers (e.g., AWS Secrets Manager, HashiCorp Vault).
- **Synthetic Data Baseline**: All demo and test data consist strictly of fictional synthetic patient cases (`.test` email domains). No real patient data or Protected Health Information (PHI) is present.
