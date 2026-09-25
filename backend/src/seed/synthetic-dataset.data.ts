/**
 * SYNTHETIC / NON-CLINICAL / DEMO DATASET
 * 
 * DISCLAIMER:
 * ALL DATA IN THIS FILE IS STRICTLY SYNTHETIC, FICTIONAL, AND GENERATED FOR
 * DEVELOPMENT, TESTING, AND DEMONSTRATION PURPOSES ONLY.
 * NO REAL PATIENT DATA, IDENTIFIERS, NAMES, MEDICAL RECORDS, OR PII ARE USED.
 * ALL DOMAINS USE RESERVED .test DOMAINS.
 */

import { UserRole } from '../modules/users/user.types.js';
import { CasePriority, CaseStatus } from '../modules/cases/case.types.js';
import { ReviewStatus } from '../modules/reviews/review.types.js';
import { ReferralStatus } from '../modules/referrals/referral.types.js';
import { NotificationType, NotificationChannel, NotificationStatus } from '../modules/notifications/notification.types.js';

import { FacilityType } from '../modules/facilities/facility.types.js';

export interface SyntheticFacilityData {
  facilityId: string;
  name: string;
  type: FacilityType;
  state: string;
  district: string;
  isActive: boolean;
}

export interface SyntheticUserData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  facilityId?: string;
  preferredLanguage: string;
  isActive: boolean;
}

export interface SyntheticCaseData {
  caseNumber: string;
  patientEmail: string;
  facilityId: string;
  chiefComplaint: string;
  narrativeText?: string;
  priority: CasePriority;
  status: CaseStatus;
  category: 'ROUTINE' | 'PRIORITY' | 'URGENT';
  ruleTrigger?: string;
  language: string;
  assignedReviewerEmail?: string;
  hoursAgo: number;
  review?: {
    reviewerEmail: string;
    reviewStatus: ReviewStatus;
    reviewerNotes: string;
    priorityOverride?: CasePriority;
    overrideReason?: string;
  };
  referral?: {
    fromFacilityId: string;
    toFacilityId: string;
    destinationDepartment: string;
    reason: string;
    clinicalSummary: string;
    status: ReferralStatus;
  };
}

export const SYNTHETIC_FACILITIES: SyntheticFacilityData[] = [
  {
    facilityId: 'FAC-PHC-BALASORE',
    name: 'Balasore Primary Health Centre',
    type: FacilityType.PHC,
    state: 'Odisha',
    district: 'Balasore',
    isActive: true,
  },
  {
    facilityId: 'FAC-DH-CUTTACK',
    name: 'Cuttack District Headquarters Hospital',
    type: FacilityType.GOVERNMENT_HOSPITAL,
    state: 'Odisha',
    district: 'Cuttack',
    isActive: true,
  },
  {
    facilityId: 'FAC-SCB-MCH',
    name: 'SCB Medical College & Hospital',
    type: FacilityType.GOVERNMENT_HOSPITAL,
    state: 'Odisha',
    district: 'Cuttack',
    isActive: true,
  },
];

export const SYNTHETIC_USERS: SyntheticUserData[] = [
  // Patients (Synthetic .test accounts)
  {
    name: 'Anita Verma',
    email: 'patient.demo.001@example.test',
    phone: '+919000000001',
    role: UserRole.PATIENT,
    preferredLanguage: 'hi',
    isActive: true,
  },
  {
    name: 'Biren Mohapatra',
    email: 'patient.demo.002@example.test',
    phone: '+919000000002',
    role: UserRole.PATIENT,
    preferredLanguage: 'or',
    isActive: true,
  },
  {
    name: 'Farida Begum',
    email: 'patient.demo.003@example.test',
    phone: '+919000000003',
    role: UserRole.PATIENT,
    preferredLanguage: 'bn',
    isActive: true,
  },
  {
    name: 'Karthik Raja',
    email: 'patient.demo.004@example.test',
    phone: '+919000000004',
    role: UserRole.PATIENT,
    preferredLanguage: 'ta',
    isActive: true,
  },
  {
    name: 'Ramesh Patel',
    email: 'patient.demo.005@example.test',
    phone: '+919000000005',
    role: UserRole.PATIENT,
    preferredLanguage: 'gu',
    isActive: true,
  },
  // Clinical Reviewers & Officers
  {
    name: 'Nurse Sunita Das',
    email: 'nurse.demo.001@example.test',
    phone: '+919000000011',
    role: UserRole.NURSE,
    facilityId: 'FAC-DH-CUTTACK',
    preferredLanguage: 'or',
    isActive: true,
  },
  {
    name: 'Dr. Alok Mohanty',
    email: 'doctor.demo.001@example.test',
    phone: '+919000000012',
    role: UserRole.DOCTOR,
    facilityId: 'FAC-DH-CUTTACK',
    preferredLanguage: 'en',
    isActive: true,
  },
  {
    name: 'Dr. Priyanka Sen',
    email: 'doctor.demo.002@example.test',
    phone: '+919000000013',
    role: UserRole.DOCTOR,
    facilityId: 'FAC-SCB-MCH',
    preferredLanguage: 'en',
    isActive: true,
  },
  {
    name: 'Dr. Debasis Rout',
    email: 'officer.demo.001@example.test',
    phone: '+919000000014',
    role: UserRole.MEDICAL_OFFICER,
    facilityId: 'FAC-PHC-BALASORE',
    preferredLanguage: 'or',
    isActive: true,
  },
  // System Administrator
  {
    name: 'System Administrator',
    email: 'admin.demo.001@example.test',
    phone: '+919000000099',
    role: UserRole.ADMIN,
    preferredLanguage: 'en',
    isActive: true,
  },
];

export const SYNTHETIC_CASES: SyntheticCaseData[] = [
  // ==========================================
  // ROUTINE CASES (5 examples)
  // ==========================================
  {
    caseNumber: 'CASE-SYN-ROUTINE-001',
    patientEmail: 'patient.demo.001@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Mild runny nose and sneezing for two days without fever',
    narrativeText: 'Patient reports clear nasal discharge and mild throat tickle starting yesterday. No fever, no cough, no difficulty breathing, eating normally.',
    priority: CasePriority.ROUTINE,
    status: CaseStatus.OPEN,
    category: 'ROUTINE',
    language: 'hi',
    assignedReviewerEmail: 'nurse.demo.001@example.test',
    hoursAgo: 2,
  },
  {
    caseNumber: 'CASE-SYN-ROUTINE-002',
    patientEmail: 'patient.demo.002@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Localized itchy rash on right forearm after gardening',
    narrativeText: 'Red erythema with mild pruritus on flexor forearm surface. No facial swelling, no breathing difficulty, no systemic symptoms.',
    priority: CasePriority.ROUTINE,
    status: CaseStatus.IN_REVIEW,
    category: 'ROUTINE',
    language: 'or',
    assignedReviewerEmail: 'nurse.demo.001@example.test',
    hoursAgo: 4,
  },
  {
    caseNumber: 'CASE-SYN-ROUTINE-003',
    patientEmail: 'patient.demo.003@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Follow-up for chronic hypertension medication renewal',
    narrativeText: 'Regular follow-up. Blood pressure reading at home 128/82 mmHg. Asking for routine prescription refill schedule.',
    priority: CasePriority.ROUTINE,
    status: CaseStatus.RESOLVED,
    category: 'ROUTINE',
    language: 'bn',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 12,
    review: {
      reviewerEmail: 'doctor.demo.001@example.test',
      reviewStatus: ReviewStatus.COMPLETED,
      reviewerNotes: 'Stable chronic case verified. Routine OPD follow-up scheduled.',
    },
  },
  {
    caseNumber: 'CASE-SYN-ROUTINE-004',
    patientEmail: 'patient.demo.004@example.test',
    facilityId: 'FAC-PHC-BALASORE',
    chiefComplaint: 'Mild ankle strain after brisk walk, able to bear full weight',
    narrativeText: 'Slight soreness over lateral malleolus. No deformity, no significant edema or bruising. Able to ambulate comfortably.',
    priority: CasePriority.ROUTINE,
    status: CaseStatus.OPEN,
    category: 'ROUTINE',
    language: 'ta',
    hoursAgo: 6,
  },
  {
    caseNumber: 'CASE-SYN-ROUTINE-005',
    patientEmail: 'patient.demo.005@example.test',
    facilityId: 'FAC-PHC-BALASORE',
    chiefComplaint: 'Mild bilateral tension headache after screen work',
    narrativeText: 'Band-like tension over forehead for 4 hours. Relieved by resting in dark room. No visual aura, no nausea, normal neurological responses.',
    priority: CasePriority.ROUTINE,
    status: CaseStatus.OPEN,
    category: 'ROUTINE',
    language: 'gu',
    hoursAgo: 8,
  },

  // ==========================================
  // PRIORITY CASES (7 examples)
  // ==========================================
  {
    caseNumber: 'CASE-SYN-PRIORITY-001',
    patientEmail: 'patient.demo.001@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Persistent fever (102°F) for 4 days with body aches and rigors',
    narrativeText: 'High temperature persisting for four days despite paracetamol. Moderate generalized malaise and loss of appetite. No respiratory distress.',
    priority: CasePriority.PRIORITY,
    status: CaseStatus.IN_REVIEW,
    category: 'PRIORITY',
    ruleTrigger: 'Persistent fever > 3 days',
    language: 'hi',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 3,
  },
  {
    caseNumber: 'CASE-SYN-PRIORITY-002',
    patientEmail: 'patient.demo.002@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Repeated vomiting (6 episodes) in last 12 hours with mild dehydration',
    narrativeText: 'Unable to tolerate solid food. Dry mouth and reduced urine output. Mild postural dizziness. Hemodynamically stable.',
    priority: CasePriority.PRIORITY,
    status: CaseStatus.IN_REVIEW,
    category: 'PRIORITY',
    ruleTrigger: 'Repeated vomiting with dehydration risk',
    language: 'or',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 2,
  },
  {
    caseNumber: 'CASE-SYN-PRIORITY-003',
    patientEmail: 'patient.demo.003@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Severe progressive fatigue and progressive pallor over two weeks',
    narrativeText: 'Exertional dyspnea on climbing one flight of stairs. Noticeable conjunctival and palmar pallor. Suspected severe anemia awaiting urgent lab evaluation.',
    priority: CasePriority.PRIORITY,
    status: CaseStatus.IN_REVIEW,
    category: 'PRIORITY',
    ruleTrigger: 'Severe progressive weakness with anemia signs',
    language: 'bn',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 1,
  },
  {
    caseNumber: 'CASE-SYN-PRIORITY-004',
    patientEmail: 'patient.demo.004@example.test',
    facilityId: 'FAC-PHC-BALASORE',
    chiefComplaint: 'Fever reported but duration, vitals, and temperature unstated in intake',
    narrativeText: 'Patient entered: "Fever and feeling sick". Missing critical duration, medication history, and red flags. System flagged for priority human review.',
    priority: CasePriority.PRIORITY,
    status: CaseStatus.OPEN,
    category: 'PRIORITY',
    ruleTrigger: 'Missing critical clinical information',
    language: 'ta',
    hoursAgo: 2,
  },
  {
    caseNumber: 'CASE-SYN-PRIORITY-005',
    patientEmail: 'patient.demo.005@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Complex abdominal pain with low confidence structured AI extraction',
    narrativeText: 'Multi-quadrant abdominal discomfort. AI extraction returned low confidence score (0.42). Safety engine elevated case to PRIORITY.',
    priority: CasePriority.PRIORITY,
    status: CaseStatus.IN_REVIEW,
    category: 'PRIORITY',
    ruleTrigger: 'AI extraction low confidence fallback',
    language: 'gu',
    assignedReviewerEmail: 'nurse.demo.001@example.test',
    hoursAgo: 3,
  },
  {
    caseNumber: 'CASE-SYN-PRIORITY-006',
    patientEmail: 'patient.demo.001@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Uploaded lab report with blurry OCR scan requiring clinician verification',
    narrativeText: 'Biochemistry report upload with 3 low-confidence OCR text lines. Safety evaluation marked for priority verification.',
    priority: CasePriority.PRIORITY,
    status: CaseStatus.IN_REVIEW,
    category: 'PRIORITY',
    ruleTrigger: 'Uncertain unstructured lab OCR evaluation',
    language: 'hi',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 1,
  },
  {
    caseNumber: 'CASE-SYN-PRIORITY-007',
    patientEmail: 'patient.demo.002@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Voice intake in Odia with background noise resulting in partial STT confidence',
    narrativeText: 'Spoken intake recorded via voice module with partial confidence flag. Safely preserved as PRIORITY for human auditory check.',
    priority: CasePriority.PRIORITY,
    status: CaseStatus.IN_REVIEW,
    category: 'PRIORITY',
    ruleTrigger: 'Voice STT uncertainty fallback',
    language: 'or',
    assignedReviewerEmail: 'nurse.demo.001@example.test',
    hoursAgo: 2,
  },

  // ==========================================
  // URGENT CASES (8 examples — Phase 15 Rules)
  // ==========================================
  {
    caseNumber: 'CASE-SYN-URGENT-001',
    patientEmail: 'patient.demo.001@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Severe acute shortness of breath, gasping, unable to speak full sentences',
    narrativeText: 'Sudden onset respiratory distress with audible wheeze and stridor. Intercostal indrawing noted. SpO2 88% on room air.',
    priority: CasePriority.URGENT,
    status: CaseStatus.IN_REVIEW,
    category: 'URGENT',
    ruleTrigger: 'Severe breathing difficulty / stridor',
    language: 'hi',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 1,
  },
  {
    caseNumber: 'CASE-SYN-URGENT-002',
    patientEmail: 'patient.demo.002@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Crushing central chest pain radiating to left jaw with cold sweats',
    narrativeText: 'Substernal pressure ongoing for 45 minutes with diaphoresis, nausea, and shortness of breath. Classical acute coronary syndrome red flag.',
    priority: CasePriority.URGENT,
    status: CaseStatus.IN_REVIEW,
    category: 'URGENT',
    ruleTrigger: 'Chest pain with radiation and breathing difficulty',
    language: 'or',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 0.5,
  },
  {
    caseNumber: 'CASE-SYN-URGENT-003',
    patientEmail: 'patient.demo.003@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Sudden confusion, slurred speech, and weakness on right side of body',
    narrativeText: 'Acute neurological deficit with facial droop and right arm pronator drift starting 30 minutes ago. GCS 13. Suspected acute stroke.',
    priority: CasePriority.URGENT,
    status: CaseStatus.IN_REVIEW,
    category: 'URGENT',
    ruleTrigger: 'Altered consciousness / acute neurological deficit',
    language: 'bn',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 0.4,
  },
  {
    caseNumber: 'CASE-SYN-URGENT-004',
    patientEmail: 'patient.demo.004@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Pulsatile arterial bleeding from deep forearm laceration following machinery cut',
    narrativeText: 'Active bright red spurting blood not responding to simple dressing pressure. Pallor and tachycardia (pulse 124 bpm).',
    priority: CasePriority.URGENT,
    status: CaseStatus.IN_REVIEW,
    category: 'URGENT',
    ruleTrigger: 'Severe uncontrolled hemorrhage',
    language: 'ta',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 0.3,
  },
  {
    caseNumber: 'CASE-SYN-URGENT-005',
    patientEmail: 'patient.demo.005@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Continuous generalized tonic-clonic seizure for over 6 minutes',
    narrativeText: 'Active involuntary limb spasms, loss of consciousness, upward eye deviation, and cyanosis around lips. Status epilepticus protocol.',
    priority: CasePriority.URGENT,
    status: CaseStatus.IN_REVIEW,
    category: 'URGENT',
    ruleTrigger: 'Active continuous seizure activity',
    language: 'gu',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 0.2,
  },
  {
    caseNumber: 'CASE-SYN-URGENT-006',
    patientEmail: 'patient.demo.001@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Explicit suicidal statements and acute agitation',
    narrativeText: 'Patient text intake contains explicit statements of self-harm intent with acute agitation. Red-flag triggered immediately.',
    priority: CasePriority.URGENT,
    status: CaseStatus.IN_REVIEW,
    category: 'URGENT',
    ruleTrigger: 'Self-harm / acute psychiatric crisis',
    language: 'hi',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 0.6,
  },
  {
    caseNumber: 'CASE-SYN-URGENT-007',
    patientEmail: 'patient.demo.002@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Acute facial swelling, lip edema, and stridor after wasp sting',
    narrativeText: 'Rapidly progressive angioedema with diffuse urticarial rash and respiratory difficulty within 15 minutes of insect sting. Anaphylaxis.',
    priority: CasePriority.URGENT,
    status: CaseStatus.IN_REVIEW,
    category: 'URGENT',
    ruleTrigger: 'Severe allergic reaction with airway compromise',
    language: 'or',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 0.5,
  },
  {
    caseNumber: 'CASE-SYN-URGENT-008',
    patientEmail: 'patient.demo.003@example.test',
    facilityId: 'FAC-DH-CUTTACK',
    chiefComplaint: 'Severe chest pain requiring tertiary cardiology catheterization referral',
    narrativeText: 'Post-stabilization urgent referral to tertiary hospital SCB Medical College for emergent percutaneous coronary intervention.',
    priority: CasePriority.URGENT,
    status: CaseStatus.REFERRED,
    category: 'URGENT',
    ruleTrigger: 'Human clinical escalation & tertiary referral',
    language: 'bn',
    assignedReviewerEmail: 'doctor.demo.001@example.test',
    hoursAgo: 1,
    review: {
      reviewerEmail: 'doctor.demo.001@example.test',
      reviewStatus: ReviewStatus.REFERRED,
      reviewerNotes: 'Urgent tertiary transfer indicated for catheterization and intensive monitoring.',
    },
    referral: {
      fromFacilityId: 'FAC-DH-CUTTACK',
      toFacilityId: 'FAC-SCB-MCH',
      destinationDepartment: 'Cardiology ICU',
      reason: 'Requires urgent tertiary coronary intervention',
      clinicalSummary: 'Patient with acute STEMI stabilized on antiplatelet therapy requiring PCI.',
      status: ReferralStatus.ACCEPTED,
    },
  },
];
