# India Readiness & Accessibility Specification

## 1. Scope & Objective
This system is designed to provide operational healthcare triage intake and reviewer queue workflow support in Indian healthcare contexts, including:
- Government Hospitals & District Hospitals
- Primary Health Centres (PHCs) and Community Health Centres (CHCs)
- Public Health Camps & Outreach Clinics
- Company Clinics & Occupational Health Units
- Industrial-Estate First-Aid & Health Posts
- University and Campus Health Centres

> **IMPORTANT DISCLAIMER**: This system is designed for India-oriented workflow support but is not presented as a legal, regulatory, clinical, or healthcare certification/compliance system. It does not perform autonomous diagnosis, medical treatment, or prescription issuance.

---

## 2. Centralized Language Registry & Display Mapping
All language handling relies on a centralized language registry with 11 supported Indian language codes. No secondary registry is permitted.

| Code | Language Name | Native Script Display | Provider Locale Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| `en` | English | English | `en-IN` | Active |
| `hi` | Hindi | हिन्दी | `hi-IN` | Active |
| `or` | Odia | ଓଡ଼ିଆ | `or-IN` | Active |
| `bn` | Bengali | বাংলা | `bn-IN` | Active |
| `ta` | Tamil | தமிழ் | `ta-IN` | Active |
| `te` | Telugu | తెలుగు | `te-IN` | Active |
| `mr` | Marathi | मराठी | `mr-IN` | Active |
| `kn` | Kannada | ಕನ್ನಡ | `kn-IN` | Active |
| `ml` | Malayalam | മലയാളം | `ml-IN` | Active |
| `pa` | Punjabi | ਪੰਜਾਬੀ | `pa-IN` | Active |
| `gu` | Gujarati | ગુજરાતી | `gu-IN` | Active |

### Key Invariants:
1. **Explicit Selection**: User and case language preferences are explicitly selected. The system **never** infers language from names, locations, ethnicity, or demographic assumptions.
2. **Original Intake Preservation**: Patient intake content is recorded and preserved in its original language without silent destructive replacement.
3. **User Profile Preference**: Extended user profile with `preferredLanguage` (default: `en`), manageable via `PATCH /api/auth/preferences`.

---

## 3. Accessibility Readiness
The UI is engineered for accessibility across low-resource clinics and field devices:
- **Keyboard Navigation**: All interactive elements (buttons, inputs, select menus, modal dialogs) are keyboard-focusable with visible focus rings (`focus:ring-2 focus:ring-blue-500`).
- **Semantic HTML & ARIA**: Standard HTML5 semantic elements used with descriptive `aria-label`, `aria-expanded`, and `role` attributes for dialogs and popovers.
- **Multimodal Status & Badges**: Status indicators and urgency badges never rely solely on color. They contain unambiguous text labels (e.g. `ROUTINE (Unassessed)`, `PRIORITY`, `URGENT`) alongside distinct icons.
- **Contrast & Responsive Layout**: Styled with accessible contrast ratios and flexible grid layouts that function on low-resolution mobile/tablet screens in camp settings.

---

## 4. Privacy & Identity Non-Goals
To protect patient and health worker privacy in prototype deployments:
- **No Aadhaar Collection**: Aadhaar numbers are never collected or stored.
- **No PAN / Biometric Storage**: No financial identifiers or biometric data are captured.
- **No ABDM/EHR Claims**: The system does not claim ABDM sandbox or production certification.
