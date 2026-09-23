import { CaseStatus, CasePriority, IntakeSource } from '../cases/case.types.js';
import { ReviewStatus } from '../reviews/review.types.js';
import { InformationSource } from '../symptoms/symptom.types.js';

export interface ReviewerCasesQuery {
  page?: number;
  limit?: number;
  status?: CaseStatus;
  priority?: CasePriority;
}

export interface ReviewerQueueItem {
  id: string;
  caseNumber: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  status: CaseStatus;
  priority: CasePriority;
  chiefComplaint: string;
  intakeSource: IntakeSource;
  language: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaginatedReviewerCasesResponse {
  cases: ReviewerQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewerCaseSymptom {
  id: string;
  name: string;
  description?: string;
  onset?: string;
  duration?: string;
  severity?: number;
  bodyLocation?: string;
  course?: string;
  source: InformationSource;
  createdAt?: Date;
}

export interface ReviewerCaseConsent {
  status: string;
  version?: string;
  capturedAt?: Date;
}

export interface ReviewerCaseReviewItem {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  reviewStatus: ReviewStatus;
  reviewerNotes: string;
  reviewedAt: Date;
}

export interface ReviewerCaseDetails {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  priority: CasePriority;
  chiefComplaint: string;
  intakeSource: IntakeSource;
  language: string;
  createdAt: Date;
  updatedAt?: Date;
  patient: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  consent: ReviewerCaseConsent | null;
  symptoms: ReviewerCaseSymptom[];
  reviews: ReviewerCaseReviewItem[];
}

export interface SubmitReviewInput {
  reviewerNotes: string;
  reviewStatus?: ReviewStatus;
}

export interface SubmitReviewResponse {
  reviewId: string;
  caseId: string;
  reviewerId: string;
  reviewStatus: ReviewStatus;
  caseStatus: CaseStatus;
  reviewedAt: Date;
}
