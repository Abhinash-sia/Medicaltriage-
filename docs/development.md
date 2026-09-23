# Healthcare Triage Assistant — Development Documentation

> [!NOTE]
> **Phase 1 Engineering Foundation**: This guide documents the setup, repository structure, environment configuration, database setup, development commands, and health monitoring for local development.

---

## 1. Repository Structure

```
medicalTriage/
├── frontend/                     # Next.js 15 App Router Frontend Application
│   ├── src/
│   │   ├── app/                  # App router pages, layouts, and providers
│   │   ├── components/           # UI components (shadcn/ui primitives)
│   │   ├── lib/                  # Utilities (cn helper, API client)
│   │   ├── hooks/                # React custom hooks
│   │   └── types/                # Global frontend TypeScript types
│   ├── public/                   # Static media and assets
│   ├── components.json           # shadcn/ui configuration
│   ├── next.config.ts            # Next.js configuration
│   ├── package.json              # Frontend dependencies and scripts
│   └── tsconfig.json             # Frontend TypeScript configuration
│
├── backend/                      # Express + TypeScript Backend API Service
│   ├── src/
│   │   ├── config/               # Environment (Zod) and database (Mongoose) modules
│   │   ├── modules/              # Mongoose Data Models & TypeScript Types
│   │   │   ├── auth/             # Authentication & Authorization module (Phase 3)
│   │   │   │   ├── auth.types.ts # Auth interfaces & JwtPayload
│   │   │   │   ├── auth.schemas.ts# Zod register/login validation schemas
│   │   │   │   ├── auth.utils.ts # bcryptjs & jsonwebtoken helpers
│   │   │   │   ├── auth.service.ts# AuthService register, login, getMe logic
│   │   │   │   ├── auth.controller.ts# Auth HTTP handlers
│   │   │   │   ├── auth.middleware.ts# authenticateJwt & requireRoles middleware
│   │   │   │   └── auth.routes.ts# Auth API routes (/api/auth)
│   │   │   ├── users/            # User model & types (PATIENT, DOCTOR, NURSE, ADMIN)
│   │   │   ├── cases/            # Case model & types
│   │   │   ├── symptoms/         # Symptom model & types
│   │   │   ├── reports/          # Report model & types
│   │   │   ├── triage/           # TriageNote model & types
│   │   │   ├── reviews/          # Review model & types
│   │   │   ├── consent/          # Consent model & types
│   │   │   └── audit/            # AuditLog model & types
│   │   ├── middleware/           # Security, request logger, error, and request-id middleware
│   │   ├── routes/               # Express API routes (health router)
│   │   ├── lib/                  # Structured Pino logger
│   │   ├── app.ts                # Express application factory
│   │   └── server.ts             # Server bootstrap & graceful shutdown handler
│   ├── tests/                    # Vitest test suite (health.test.ts, models.test.ts, auth.test.ts)
│   ├── package.json              # Backend dependencies and scripts
│   ├── tsconfig.json             # Backend TypeScript configuration
│   └── vitest.config.ts          # Vitest testing configuration
│
├── docs/                         # System Documentation
│   ├── product-requirements.md   # Phase 0 Product Requirements Document
│   ├── safety.md                 # Phase 0 Safety Contract & Fail-Safe Specification
│   ├── architecture.md           # Phase 0 System Architecture & Pipeline Diagrams
│   ├── database.md               # Phase 2 Database Schema & ER Topology
│   ├── authentication.md         # Phase 3 Authentication & Authorization Specification
│   └── development.md            # Developer Setup & Operational Guide
│
├── docker/                       # Docker & Compose Configurations
│   └── docker-compose.yml        # Development MongoDB service setup
│
├── docker-compose.yml            # Root Docker Compose link
├── .env.example                  # Environment template (Secrets excluded)
├── .gitignore                    # Git exclusion rules
└── README.md                     # Project landing and setup guide
```

---

## 2. Local Environment Setup

### Prerequisites
- **Node.js**: v18.0.0+ (Tested on v26.4.0)
- **npm**: v9.0.0+ (Tested on v12.0.2)
- **Docker & Docker Compose**: (Optional, for local MongoDB container execution)

### 1. Database Setup (MongoDB)
Start local MongoDB using Docker Compose:
```bash
docker compose up -d
```
*Alternatively, connect to an existing MongoDB instance at `mongodb://localhost:27017/medical_triage`.*

---

## 3. Backend Service Setup (`backend/`)

### Installation & Build
```bash
cd backend
npm install
npm run build
```

### Running Backend in Development Mode
```bash
npm run dev
```
*Backend listens at `http://localhost:5000`.*

### Testing Backend
```bash
npm test
```

---

## 4. Frontend Application Setup (`frontend/`)

### Installation & Build
```bash
cd frontend
npm install
npm run build
```

### Running Frontend in Development Mode
```bash
npm run dev
```
*Frontend application serves at `http://localhost:3000`.*

---

## 5. Environment Variables & Security Policy

Create `.env` in the root workspace based on `.env.example`:

```bash
cp .env.example .env
```

### Foundation Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `PORT` | Backend HTTP port | `5000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/medical_triage` |
| `FRONTEND_URL` | Allowed CORS frontend origin | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Safe public frontend API endpoint URL | `http://localhost:5000/api` |

> [!WARNING]
> **Secret Security Requirement**: Provider API keys (`GEMINI_API_KEY`, `SARVAM_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`) and `JWT_SECRET` must **NEVER** be committed to Git or exposed via `NEXT_PUBLIC_` variables.

---

## 6. Phase 1 API Endpoints

### Health Endpoint: `GET /api/health`
Monitors backend operational status and MongoDB connectivity.

#### Request
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "service": "healthcare-triage-backend",
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-09-23T13:20:00.000Z"
}
```

#### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route '/api/unknown' not found."
  },
  "requestId": "1eabd9ec-b2e4-427b-838c-5f49b0d89073"
}
```
