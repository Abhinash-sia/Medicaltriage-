# Healthcare Triage Assistant — Authentication & Authorization Specification (Phase 3)

> [!NOTE]
> **Phase 3 Authentication Architecture**: This document specifies the user registration security policy, password hashing standards, JWT access token workflow, authentication middleware, role-based access control (RBAC), rate-limiting baselines, and test strategies.

---

## 1. Executive Summary & Security Boundaries

Authentication establishes **user identity**, while Role-Based Access Control (RBAC) enforces **authorization boundaries**.

> [!WARNING]
> **Clinical Security Invariant**: Authenticated status does **NOT** equal clinical qualification. A user holding a valid JWT with role `PATIENT` cannot perform reviewer actions, override triage notes, or escalate cases. Qualified reviewer operations require explicit `DOCTOR` or `MEDICAL_OFFICER` roles.

---

## 2. Authentication Flow & JWT Token Architecture

```
Client (Patient / Health Worker / Reviewer)
  │
  ├─► POST /api/auth/login { email/phone, password }
  │     │
  │     ▼
  │   Validate Zod Schema (Min 8 char password policy)
  │     │
  │     ▼
  │   Query User Document (include +passwordHash, verify isActive & !isDeleted)
  │     │
  │     ▼
  │   bcrypt.compare(password, passwordHash)
  │     │
  │     ▼ (Success)
  │   Issue Minimized JWT Access Token (Payload: { id, role }, Expiration: JWT_EXPIRES_IN)
  │     │
  │     ▼
  │   Return { success: true, data: { user: SafeProfile, accessToken } }
  │
  └─► Authenticated API Request (Header: Authorization: Bearer <accessToken>)
        │
        ▼
      authenticateJwt Middleware ──► Validate Signature & Expiration ──► Fetch User ──► Attach req.user
        │
        ▼
      requireRoles(...) Middleware ──► Validate req.user.role ──► Proceed to Controller
```

### Minimized Token Payload Policy
The JWT access token is signed with a strictly minimized payload:

```json
{
  "id": "60d5ec49b1234567890abcde",
  "role": "PATIENT",
  "iat": 1774254000,
  "exp": 1774254900
}
```

#### Explicitly Excluded Claims:
- `email`
- `phone`
- `name`
- `password`
- `passwordHash`
- `medical information`
- `patient information`
- `API keys`
- `secrets`

*Rationale*: The `authenticateJwt` middleware dynamically loads the user profile from the database, eliminating the need to embed contact or identity data in bearer tokens.

---

## 3. Password Storage & Policy

- **Hashing Algorithm**: `bcryptjs` with 10 salt rounds.
- **Database Schema Protection**: `passwordHash` field is configured with `select: false` on `UserSchema`. Plaintext passwords and hashes are **NEVER** returned in normal Mongoose queries, API JSON payloads, or application logs.
- **Password Policy**:
  - Minimum length: **8 characters**.
  - Maximum length: **128 characters**.
  - Rejects empty, whitespace-only, or malformed password inputs.

---

## 4. Public Registration Policy & Identity Protection

### 4.1 Restricted Public Self-Registration
- `POST /api/auth/register` allows unauthenticated public self-registration for the **`PATIENT`** role ONLY.
- Attempts to self-register with privileged roles (`ADMIN`, `DOCTOR`, `MEDICAL_OFFICER`, `NURSE`, `HEALTH_WORKER`) are automatically rejected (`400 AUTH_VALIDATION_ERROR`).
- Privileged staff accounts must be provisioned through administrative workflows.

### 4.2 Account Enumeration Protection & Generic Errors
- Failed login attempts return a generic response (`401 AUTH_INVALID_CREDENTIALS`, `"Invalid email/phone or password"`), regardless of whether the email/phone existed or the password was incorrect.
- Duplicate email/phone registrations return safe error messages (`AUTH_DUPLICATE_IDENTITY`) without exposing internal database details.

---

## 5. API Endpoint Specifications

### 5.1 `POST /api/auth/register`
Creates a new patient account and returns a JWT access token.
- **Payload**: `{ name, email?, phone?, password }`
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60d5ec49b1234567890abcde",
      "name": "Anita Verma",
      "email": "anita.verma@example.com",
      "role": "PATIENT",
      "createdAt": "2026-09-23T14:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5.2 `POST /api/auth/login`
Authenticates valid credentials against active accounts. Protected by login rate limiter (max 10 requests / 15 minutes per IP).
- **Payload**: `{ email?, phone?, password }`
- **Response (`200 OK`)**: Standard user profile and access token response.

### 5.3 `GET /api/auth/me`
Fetches the current authenticated user's safe public profile.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (`200 OK`)**: Safe user profile representation.

---

## 6. Middleware Architecture

### 6.1 `authenticateJwt` Middleware
1. Extracts `Authorization: Bearer <token>` header.
2. Verifies token signature using `JWT_SECRET`.
3. Checks user active status (`isActive: true`, `isDeleted: false`).
4. Rejects missing (`401 AUTH_TOKEN_MISSING`), invalid (`401 AUTH_TOKEN_INVALID`), or expired (`401 AUTH_TOKEN_EXPIRED`) tokens.
5. Populates `req.user` (`{ id, name, email, phone, role, facilityId }`).

### 6.2 `requireRoles(...allowedRoles)` Middleware
1. Evaluates `req.user.role` against authorized role whitelist.
2. Returns `403 Forbidden` (`AUTH_FORBIDDEN`) if permission is insufficient.

---

## 7. Supported Role Matrix

| Role | Target System Capabilities |
| :--- | :--- |
| **`PATIENT`** | Patient intake form submission, symptom reporting, self-case tracking. |
| **`NURSE`** | Intake review support, case queue visibility within facility. |
| **`HEALTH_WORKER`** | Frontline community patient data collection and intake management. |
| **`DOCTOR`** | Qualified clinical review, triage note verification, referral drafting, escalation. |
| **`MEDICAL_OFFICER`** | Senior clinical oversight, escalation review, facility triage supervision. |
| **`ADMIN`** | Facility administration, user provisioning, audit inspection, retention settings. |

---

## 8. Rate-Limiting Policy

- **General API Limiter**: Max 100 requests per 15 minutes per IP (`express-rate-limit`).
- **Auth Login Limiter**: Max 10 login attempts per 15 minutes per IP (`loginLimiter`) on `POST /api/auth/login`.

---

## 9. Environment Configuration

```env
JWT_SECRET=dev_jwt_secret_change_in_production_min_32_chars
JWT_EXPIRES_IN=15m
```
*Provider keys and secrets remain strictly server-side and are gitignored.*
