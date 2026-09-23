# Healthcare Triage Assistant

> [!IMPORTANT]
> **Clinical Safety & Scope Disclaimer**: The Healthcare Triage Assistant is a **human-in-the-loop decision-support platform** designed to organize patient-provided information and prepare structured summaries for review by qualified healthcare professionals. **It is NOT a doctor, diagnostic tool, medical treatment system, or prescription platform.** Final clinical decisions and workflow actions are strictly the responsibility of authorized human reviewers.

---

## Current Status
**Phase 1 — Engineering Foundation**  
The foundational engineering infrastructure for the frontend, backend, database connectivity, security middleware, structured logging, health checks, and Docker environment has been initialized. *Business functionality, AI provider calls, authentication, and case models will be implemented in subsequent phases.*

---

## Project Overview
The **Healthcare Triage Assistant** helps healthcare workers and qualified clinical reviewers process high volumes of patient cases across Government Hospitals, Primary Health Centres (PHCs), Public Health Camps, Company Clinics, Industrial Health Units, and Campus Health Centres.

### Information Pipeline
$$\text{Patient Input (Text/Voice/Report/Visual)} \longrightarrow \text{AI Structuring & Normalization} \longrightarrow \text{Safety & Risk Rules Engine} \longrightarrow \text{Qualified Human Reviewer} \longrightarrow \text{Human Action}$$

---

## Approved Technology Stack

### Frontend
- **Framework**: Next.js 15+ (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS, shadcn/ui components
- **State & Form**: React Hook Form, TanStack Query (React Query), Zod

### Backend
- **Runtime**: Node.js, Express, TypeScript
- **Database & ODM**: MongoDB, Mongoose
- **Security & Logging**: Helmet, `express-rate-limit`, CORS, Pino logger, Zod schema validation

### AI & Media Integration Services (Planned for Later Phases)
- **LLM Engine**: Google Gemini 2.5 Flash (Symptom extraction & triage note summarization)
- **Voice & Translation**: Sarvam AI (Speech-to-Text & Hindi translation)
- **Document OCR**: Google Cloud Vision OCR (Lab report structuring)

### Infrastructure & Testing
- **DevOps**: Docker, Docker Compose
- **Testing**: Vitest

---

## Getting Started & Development Workflow

### Prerequisites
- Node.js v18+ and npm v9+
- Docker Compose (optional, for local MongoDB container)

### Step 1: Clone & Configure Environment Variables
Create a local `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
*Never commit real secrets or provider keys to Git.*

### Step 2: Start MongoDB Database
```bash
docker compose up -d
```
*Launches MongoDB on port `27017`.*

### Step 3: Run Backend Development Server
```bash
cd backend
npm install
npm run dev
```
*Backend API runs at `http://localhost:5000`.*
*Health Check: `http://localhost:5000/api/health`*

### Step 4: Run Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend Application serves at `http://localhost:3000`.*

---

## Testing & Verification Commands

### Backend Verification & Tests
```bash
cd backend
npm run build     # Verify TypeScript compilation
npm test          # Run Vitest health check test suite
```

### Frontend Verification
```bash
cd frontend
npm run build     # Verify Next.js production build
npm run lint      # Run ESLint checks
```

---

## Documentation Index
- [`docs/product-requirements.md`](file:///home/abhi/medicalTriage/docs/product-requirements.md): System goals, RBAC matrix, input channels, and MVP boundary.
- [`docs/safety.md`](file:///home/abhi/medicalTriage/docs/safety.md): Safety contract, visual AI policy, fail-safe invariant, and priority definitions.
- [`docs/architecture.md`](file:///home/abhi/medicalTriage/docs/architecture.md): Conceptual diagrams, state machine, SLA engine, and audit log schemas.
- [`docs/development.md`](file:///home/abhi/medicalTriage/docs/development.md): Detailed developer environment and API setup instructions.
