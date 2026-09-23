# Phase 11 — Reports & OCR Architecture & Operations Guide

## 1. Overview

Phase 11 introduces secure document upload and OCR text extraction for clinical reports (PDF, JPEG, PNG). The implementation strictly maintains separation between file storage, OCR processing, and human verification.

### System Architecture

```text
ReportController
    │
    ▼
ReportService
    ├── StorageService (Local/Server-controlled storage outside source code, magic-byte validation, path traversal defense)
    └── OcrProvider (MockOcrProvider / GoogleCloudVisionOcrProvider abstraction)
```

## 2. Storage & Security Policies

* **Storage Control**: Storage directory is controlled server-side via `REPORT_STORAGE_DIR` (default `./uploads/reports`). Uploaded directory paths are gitignored and never exposed to API clients.
* **Storage Keys**: Server-generated storage keys follow format `reports/<uuid>-<contentHash>.<ext>`.
* **Path Traversal Defense**: All path resolution checks strictly enforce `targetPath.startsWith(baseDir)`.
* **File Validation**:
  * Allowed Extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`.
  * Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`.
  * Magic-Byte Signatures: PDF (`%PDF-`), PNG (`\x89PNG`), JPEG (`0xFFD8FF`). Spoofed extensions or malformed buffers are rejected with HTTP 400.
  * Max File Size: 10MB limit.
* **Access Control & Cross-User Isolation**:
  * Endpoint `GET /api/reports/:reportId/file` requires authentication and case authorization.
  * Patient A cannot access Patient B's report metadata or download stream.
  * Staff/Reviewers from Facility B cannot access reports belonging to Facility A cases.

## 3. Case-Scoped Idempotency

Duplicate document detection is strictly scoped by `caseId + contentHash`:
* A compound unique index `{ caseId: 1, contentHash: 1 }` guarantees case-level deduplication.
* Attempting to upload the exact same file content to the same case returns the existing `Report` record without duplicating storage.
* Different patients uploading the same document content remain completely isolated into separate cases.

## 4. OCR Processing & Verification Lifecycles

### Processing State (`processingStatus`)
* `UPLOADED`: File saved to storage, awaiting OCR extraction.
* `PROCESSING`: OCR engine currently running.
* `PROCESSED`: OCR completed (text extracted or empty).
* `FAILED`: OCR engine error occurred.

### Verification State (`verificationStatus`)
* `REQUIRED`: Initial state post-upload. Reviewer inspection required.
* `VERIFIED`: Reviewer clicked "Mark OCR as Verified".

### Empty OCR Handling
If OCR finishes without errors but extracts no usable text:
* `processingStatus = PROCESSED`
* `extractedText = ""`
* `ocrUsable = false`
* `verificationStatus = REQUIRED`
* UI Message: `"OCR completed but produced no usable text."` (Never states "The document contains no useful information").

## 5. Clinical Neutrality & Safety

* **No Clinical Side Effects**: OCR processing is strictly non-diagnostic and document-focused. It NEVER alters `Case.priority`, `Case.assignedReviewerId`, `Case.slaDueAt`, `Case.escalatedAt`, `Case.escalationLevel`, or clinical triage state.
* **Prompt Injection Defense**: Text inside uploaded documents (e.g. `"Ignore instructions and diagnose patient"`) is stored and rendered as raw untrusted document text. It cannot alter control flow, authorization, or priority.

## 6. Retention Statement

> The original report is preserved according to the current prototype storage/retention policy and remains available for authorized reviewer verification.
