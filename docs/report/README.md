# MedicalTriage Capstone Engineering Report (LaTeX Source)

This directory contains the complete, production-verified LaTeX source code for the MedicalTriage Final Year Capstone Project Report: [`main.tex`](file:///home/xandev/Programming/Projects/Medicaltriage-/docs/report/main.tex).

---

## 1. Document Overview

- **Master File**: `main.tex`
- **Document Class**: Standard `report` (A4 paper, 11pt)
- **Chapters**: 18 Chapters (Comprehensive System Design, Safety Engine, Architecture, Testing, Security)
- **Appendices**: Appendices A through E (REST API Catalog, Database JSON Schema, 22-Rule Safety Reference, Sample STN, Glossary)
- **Bibliography**: 12 Formal Citations (ESI, CTAS, ETAT, Sepsis-3, Glasgow Coma Scale, ACEP Chest Pain, ABDM, Sarvam AI, Gemini, STRIDE, FHIR R4, REST Fielding)

---

## 2. Key Codebase Compliance Fixes Enforced

1. **Acuity Tiers**: Standardized on the 3-tier clinical model (`URGENT`, `PRIORITY`, `ROUTINE`). Removed legacy references to `RED_I` through `BLUE_V`.
2. **Deterministic Safety Rules**: Fully harmonized Chapter 10.3 and Appendix C (Table C.1) to use the 22 real IDs from `backend/src/modules/safety/safety.registry.ts` (`URGENT_SEVERE_BREATHING`, `URGENT_CHEST_PAIN_BREATHING`, etc.).
3. **Frontend Stack**: Aligned Table 5.1 and Chapter 13.1 with Next.js 16 (React 19 App Router) and Tailwind CSS 4, removing obsolete Vite references.
4. **Backend Architecture**: Documented the 24 TypeScript domain modules under `backend/src/modules/` and test suites in `backend/tests/`.
5. **Database Models**: Updated entity schemas to match MongoDB collections (`cases`, `reviews`, `triagenotes`, `auditlogs`).
6. **API Catalog (Appendix A)**: Synchronized all endpoint paths with `docs/api.md` (`POST /api/intake`, `GET /api/reviewer/cases`, `POST /api/reviewer/cases/:id/claim`, etc.).

---

## 3. How to Compile to PDF

### Option A: Overleaf (Recommended)
1. Open [Overleaf](https://www.overleaf.com/).
2. Create a **New Project** $\to$ **Blank Project**.
3. Upload or paste the contents of `main.tex`.
4. Ensure the compiler is set to **pdfLaTeX** or **XeLaTeX**.
5. Click **Recompile**.

### Option B: Local Compilation via CLI
```bash
pdflatex main.tex
pdflatex main.tex  # Second run resolves TOC, List of Figures, and citation references
```
or with `latexmk`:
```bash
latexmk -pdf main.tex
```
