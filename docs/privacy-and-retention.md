# Privacy & Data Retention Architecture (Phase 18)

## 1. Prototype Retention Disclaimer
> **IMPORTANT NOTICE:**
> The retention durations specified in this system (e.g. 180 days for clinical cases, 90 days for media blobs) are **engineering prototype defaults** designed for testing storage lifecycle mechanisms. They do **NOT** represent claims of compliance with statutory, legal, or regional healthcare data retention mandates (e.g. HIPAA, DISHA, GDPR).

---

## 2. Retention Class Metadata

Each record subject to retention tracking contains engineering lifecycle metadata:

```typescript
interface RetentionMetadata {
  retentionClass: 'CLINICAL_CASE' | 'MEDIA_BLOB' | 'AI_DERIVED' | 'AUDIT_LOG';
  configurableDurationDays: number;
  expiresAt: Date;
  purgeStatus: 'ACTIVE' | 'PURGE_PENDING' | 'FILE_CLEANUP_FAILED' | 'FILES_DELETED' | 'PURGED';
  purgedAt?: Date;
  purgedBy?: string;
  purgeAttempts?: number;
  lastPurgeError?: string;
}
```

### Engineering Prototype Defaults:
* `CLINICAL_CASE`: 180 days after case resolution (`CLOSED`).
* `MEDIA_BLOB`: 90 days post-resolution.
* `AI_DERIVED`: 180 days post-resolution.
* `AUDIT_LOG`: Configurable (defaults to retained for auditability).

---

## 3. Data Purge Workflow (Admin Only)

Purging resolved data is restricted exclusively to **ADMIN** users.

### Endpoints:
* `GET /api/admin/retention/status` — View retention statistics, eligible cases, and failed purges.
* `POST /api/admin/retention/purge` — Execute retention purge (supports `dryRun: true`).
* `POST /api/admin/retention/retry-failed-purges` — Re-attempt failed filesystem cleanups.

### Safe Purge Lifecycle:

```text
ACTIVE
   ↓ (Case closed & retention duration elapsed)
PURGE_PENDING
   ↓
FILE CLEANUP (Remove physical files from disk)
   ├── failure → FILE_CLEANUP_FAILED (Store lastPurgeError & purgeAttempts)
   │                  ↓
   │             RETRY (POST /api/admin/retention/retry-failed-purges)
   │
   └── success
          ↓
     FILES_DELETED
          ↓
   DB FINALIZATION (Anonymize/remove clinical records)
          ↓
       PURGED
```

### Safety & Path Traversal Guards:
1. **No False ACID Claims**: Filesystem operations remain non-transactional relative to MongoDB. Individual file cleanup failures do not crash the batch or cause DB inconsistency.
2. **Storage Root Sandbox**: Filesystem deletions check `filePath.startsWith(storageRoot)` to strictly prevent path traversal attacks.
3. **Auditability**: Every purge execution logs a `DATA_PURGE_EXECUTED` event into `AuditLog`.

---

## 4. Third-Party Provider Privacy Boundaries
External AI and ML service integrations operate under strict payload minimization:
* **Gemini (LLM)**: Receives clinical text narrative and symptom descriptions. Never receives patient PII, passwords, auth tokens, or raw credentials.
* **Sarvam (Voice/Translation)**: Receives audio streams for STT transcription.
* **Google Cloud Vision (OCR)**: Receives medical report image files.

All third-party provider retention behavior outside our API is treated as external-provider managed. Provider credentials and API keys are never exposed in application logs or audit metadata.
