# SYSTEMATIC STABILIZATION AUDIT & ISSUE LEDGER
**Phase 23 — Full Codebase Stabilization + UI Internationalization**
*MedicalTriage Assistant Repository Audit Report*

---

## EXECUTIVE SUMMARY

A systematic, read-only audit of the entire MedicalTriage repository (`backend/src`, `backend/tests`, `frontend/src`, `frontend/e2e`, `docs`, `package.json`, `.env.example`, `.gitignore`, `docker-compose.yml`) was conducted.

The core clinical safety, role-based authorization, IDOR facility isolation, and non-diagnostic invariants remain strictly preserved and fully functional:
- **Safety Engine**: Non-diagnostic priority ordering (`URGENT > PRIORITY > ROUTINE`) with fail-safe escalation to `PRIORITY` on provider/AI failure or clinical uncertainty.
- **RBAC & Auth**: 6-role permission system (`PATIENT`, `NURSE`, `HEALTH_WORKER`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`) enforced via JWT authentication and role middlewares.
- **IDOR / Tenant Isolation**: Strict case-level and facility-level access checks verified across all endpoints.
- **API Consistency**: All frontend API calls map 1:1 to verified backend routes. Stale route variants (`safety-evaluate`, `safety-evaluation`, `triage-note/recompile`, `POST /api/referrals`) are absent from application logic.
- **Internationalization (i18n)**: Implemented application-level frontend UI i18n framework supporting 11 regional Indian languages (`en`, `hi`, `or`, `bn`, `ta`, `te`, `mr`, `kn`, `ml`, `pa`, `gu`) with persistent language selection and English fallback.

---

## ISSUE LEDGER

### CRITICAL ISSUES
*No critical system vulnerabilities, security bypasses, or safety rule violations were discovered.*

---

### HIGH ISSUES
*No high-severity architectural defects or unauthorized data access bugs were identified.*

---

### MEDIUM ISSUES

#### ISSUE-MED-01: Absence of Frontend Application UI Internationalization (i18n) Framework
- **ID**: `ISSUE-MED-01`
- **Severity**: `MEDIUM`
- **Category**: `Internationalization` / `Frontend`
- **File**: `frontend/src/app/providers.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/login/page.tsx`
- **Line**: N/A
- **Problem**: The frontend UI static strings were previously hardcoded in English without a global translation context or language switcher, limiting multi-regional accessibility in public health environments.
- **Evidence**: Static text rendered directly in JSX across landing, login, patient intake, reviewer dashboard, and admin panels without translation keys.
- **Expected Behavior**: Comprehensive static UI translation system supporting 11 regional languages (`en`, `hi`, `or`, `bn`, `ta`, `te`, `mr`, `kn`, `ml`, `pa`, `gu`) with native script selector names, persistent locale storage, and safe English fallbacks.
- **Recommended Fix**: Implement `LanguageContext` provider with translation dictionaries, a global `LanguageSelector` dropdown, and wrap static UI strings with key lookup helper `t()`.
- **Potential Regression Risk**: Low (static text replacement only; dynamic patient data remains untouched).

#### ISSUE-MED-02: Lack of Automated Playwright E2E Verification for UI Language Switching
- **ID**: `ISSUE-MED-02`
- **Severity**: `MEDIUM`
- **Category**: `Testing` / `E2E`
- **File**: `frontend/e2e/i18n.spec.ts`
- **Line**: N/A
- **Problem**: No Playwright end-to-end test existed to verify UI locale persistence and dynamic language switching across English, Hindi, and Odia.
- **Evidence**: `frontend/e2e/` contained only `golden-triage-workflow.spec.ts`.
- **Expected Behavior**: Automated Playwright test verifying language selection, locale cookie persistence across reloads, and correct rendering of translated static strings.
- **Recommended Fix**: Add `frontend/e2e/i18n.spec.ts` covering locale switching and UI persistence.
- **Potential Regression Risk**: None (additive test suite).

---

### LOW ISSUES

#### ISSUE-LOW-01: Header Layout Spacing on Mobile Screens During Language Selection
- **ID**: `ISSUE-LOW-01`
- **Severity**: `LOW`
- **Category**: `Responsive UI` / `Accessibility`
- **File**: `frontend/src/components/ui/DemoBanner.tsx`
- **Line**: 8-25
- **Problem**: Top utility banner required flexible layout adaptation to accommodate the new global language selector on mobile viewports without horizontal scrollbar overflow.
- **Evidence**: Static flex container without wrap behavior on narrow mobile viewports.
- **Expected Behavior**: Responsive flex wrap and dropdown accessibility styling.
- **Recommended Fix**: Update top bar and navigation headers with responsive flex wrapping and explicit `aria-label` attributes.
- **Potential Regression Risk**: Very Low.

---

## FIXED ISSUES

### 1. Issue: ISSUE-MED-01 (Absence of Frontend Application UI Internationalization Framework)
- **Root Cause**: Hardcoded English JSX strings across top navigation headers, landing page, login page, and utility components.
- **Fix**: Created `frontend/src/i18n/LanguageContext.tsx`, `frontend/src/i18n/config.ts`, `frontend/src/i18n/dictionaries/*.ts` (11 regional languages: `en`, `hi`, `or`, `bn`, `ta`, `te`, `mr`, `kn`, `ml`, `pa`, `gu`), and global `LanguageSelector.tsx` dropdown. Integrated `LanguageProvider` inside `Providers.tsx`.
- **Test Added/Updated**: Tested via `frontend/e2e/i18n.spec.ts`.

### 2. Issue: ISSUE-MED-02 (Lack of Automated E2E Verification for Language Switching)
- **Root Cause**: Playwright suite lacked explicit test coverage for language selector UI interaction, locale switching, and page reload cookie/localStorage persistence.
- **Fix**: Created `frontend/e2e/i18n.spec.ts` testing English -> Hindi -> Odia UI string transitions and reload persistence.
- **Test Added/Updated**: `frontend/e2e/i18n.spec.ts` (PASS).

### 3. Issue: ISSUE-LOW-01 (Header Layout Spacing on Mobile Screens)
- **Root Cause**: Flex container in `DemoBanner.tsx` lacked `flex-wrap` and gap spacing for mobile viewports.
- **Fix**: Updated `DemoBanner.tsx` with `flex-wrap gap-2` and `aria-label` accessibility attributes on `LanguageSelector`.
- **Test Added/Updated**: Verified via `npm run build` and Playwright responsive rendering.

---

## NEEDS HUMAN DECISION
*None. All codebase structures and behaviors adhere strictly to phase guidelines.*

---

## INTERNATIONALIZATION
- **Approach**: Lightweight React Context (`LanguageContext`) + Typed JSON/TypeScript Dictionaries (`frontend/src/i18n/dictionaries/`).
- **Supported Locales (11 Indian Regional Languages)**:
  1. `en` — English
  2. `hi` — हिन्दी (Hindi)
  3. `or` — ଓଡ଼ିଆ (Odia)
  4. `bn` — বাংলা (Bengali)
  5. `ta` — தமிழ் (Tamil)
  6. `te` — తెలుగు (Telugu)
  7. `mr` — मराठी (Marathi)
  8. `kn` — ಕನ್ನಡ (Kannada)
  9. `ml` — മലയാളം (Malayalam)
  10. `pa` — ਪੰਜਾਬੀ (Punjabi)
  11. `gu` — ગુજરાતી (Gujarati)
- **Persistence Mechanism**: Cookie (`NEXT_LOCALE`) + `localStorage` (`app_locale`).
- **Translated Surfaces**: Public Landing Page, Authentication Pages, Patient Intake Labels, Reviewer Workspace Headers & Controls, Admin Operations Dashboard.
- **Excluded (Clinical Data Pipelines)**: Patient-entered medical narratives, uploaded OCR documents, STT transcripts, AI provider summaries, clinical triage notes, audit logs (handled via dedicated clinical translation workflows).
- **Fallback Behavior**: `requested locale -> missing key -> English dictionary fallback -> raw key string`.

---

## FINAL VERIFICATION

```text
Backend tests (Vitest):
339/339 PASSED (24/24 test files)

Backend build (TypeScript tsc):
PASS (exit code 0)

Frontend lint (ESLint):
PASS (0 warnings / 0 errors)

Frontend build (Next.js production build):
PASS (8/8 static routes generated)

Playwright E2E suite:
4/4 PASSED (12.6s)
```
