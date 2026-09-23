import { CaseStatus, CasePriority } from '../cases/case.types.js';

export enum PatientLanguagePreference {
  ENGLISH = 'en',
  HINDI = 'hi',
  OTHER = 'other',
}

export enum SymptomCourse {
  IMPROVING = 'IMPROVING',
  UNCHANGED = 'UNCHANGED',
  WORSENING = 'WORSENING',
}

export interface IntakeSubmitInput {
  consent: boolean;
  consentVersion?: string;
  language?: PatientLanguagePreference | string;
  primarySymptom: string;
  symptomDescription: string;
  onset: string;
  duration?: string;
  severity?: number;
  bodyLocation?: string;
  course?: SymptomCourse;
  associatedSymptoms?: string[];
  idempotencyKey?: string;
}

export interface IntakeResponseData {
  caseId: string;
  caseNumber: string;
  patientId: string;
  status: CaseStatus;
  priority: CasePriority;
  chiefComplaint: string;
  primarySymptom: string;
  language: string;
  consentStatus: string;
  createdAt: Date;
}
