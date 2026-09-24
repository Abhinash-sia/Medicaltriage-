# Admin Operations & Facility Management Specification

## 1. Overview
This module introduces operational administration capabilities restricted to authenticated users holding the `ADMIN` role.

---

## 2. User Account Administration
- **User Listing (`GET /api/admin/users`)**: Returns paginated user accounts with role, status, and facility filters.
  - **Security Rule**: Password hashes are strictly excluded (`select('-passwordHash')`) from query projections.
  - **Self-Service Restrictions**: Admin users cannot deactivate their own active accounts.
- **Account Deactivation (`POST /api/admin/users/:userId/deactivate`)**: Sets `isActive: false` and emits `USER_DEACTIVATED` audit log.
- **Account Reactivation (`POST /api/admin/users/:userId/reactivate`)**: Sets `isActive: true` and emits `USER_REACTIVATED` audit log.

---

## 3. Facility Management & Language Readiness
Facilities represent operational triage and referral units.

### Schema Attributes:
- `name`: Facility title (e.g. Sambalpur District Hospital)
- `code`: Unique uppercase facility identifier (e.g. `DH-SBP`)
- `type`: Enum (`GOVERNMENT_HOSPITAL`, `PHC`, `PUBLIC_HEALTH_CAMP`, `COMPANY_CLINIC`, `INDUSTRIAL_HEALTH_UNIT`, `CAMPUS_HEALTH_CENTER`, `OTHER`)
- `district`: District location
- `state`: State location
- `supportedLanguages`: Array of language codes (validated against the 11 supported codes)
- `active`: Operational availability flag

### Facility Endpoints:
- `GET /api/facilities`: Authenticated facility listing.
- `GET /api/facilities/:facilityId`: Fetch single facility by ID or code.
- `POST /api/facilities`: Admin facility registration.
- `PATCH /api/facilities/:facilityId`: Admin facility details update.
- `PATCH /api/facilities/:facilityId/languages`: Admin language capabilities configuration.

---

## 4. Operational Metrics Dashboard (`GET /api/admin/dashboard`)
Returns real-time capacity and triage intake counts:
- `openCases`: Unclaimed intake submissions
- `inReviewCases`: Actively claimed reviewer cases
- `escalatedCases`: Escalated or senior-review cases
- `referredCases`: Cases transferred to partner facilities
- `overdueCases`: Cases exceeding SLA targets
- `unreadNotifications`: Pending operational notifications
- `activeReviewers`: Active clinical staff (Doctors, Nurses, Medical Officers)
- `activeFacilities`: Active operational healthcare centers

> Note: These metrics are strictly operational workflow volume counts. They do not constitute clinical quality metrics or automated medical analytics.

---

## 5. Audit Event Integration
All administrative actions emit append-only audit events in `AuditLog`:
- `USER_DEACTIVATED`
- `USER_REACTIVATED`
- `FACILITY_UPDATED`
- `FACILITY_LANGUAGE_UPDATED`
- `NOTIFICATION_CREATED`
- `NOTIFICATION_READ`
- `NOTIFICATION_READ_ALL`
