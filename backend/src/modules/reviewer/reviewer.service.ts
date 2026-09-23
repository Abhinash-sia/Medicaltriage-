import mongoose from 'mongoose';
import { Case } from '../cases/case.model.js';
import { CaseStatus, CasePriority } from '../cases/case.types.js';
import { User } from '../users/user.model.js';
import { Symptom } from '../symptoms/symptom.model.js';
import { Consent } from '../consent/consent.model.js';
import { Review } from '../reviews/review.model.js';
import { ReviewStatus } from '../reviews/review.types.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import {
  ReviewerCasesQuery,
  PaginatedReviewerCasesResponse,
  ReviewerCaseDetails,
  SubmitReviewInput,
  SubmitReviewResponse,
} from './reviewer.types.js';
import { AppError } from '../../middleware/error-handler.js';

export class ReviewerService {
  static async getCases(query: ReviewerCasesQuery): Promise<PaginatedReviewerCasesResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }

    const total = await Case.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const caseDocs = await Case.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const cases = await Promise.all(
      caseDocs.map(async (c) => {
        const patient = await User.findById(c.patientId).select('name email phone');
        return {
          id: c._id.toString(),
          caseNumber: c.caseNumber,
          patientId: c.patientId.toString(),
          patientName: patient?.name || 'Unknown Patient',
          patientEmail: patient?.email || undefined,
          patientPhone: patient?.phone || undefined,
          status: c.status,
          priority: c.priority,
          chiefComplaint: c.chiefComplaint,
          intakeSource: c.intakeSource,
          language: c.language,
          createdAt: c.createdAt || new Date(),
          updatedAt: c.updatedAt || undefined,
        };
      })
    );

    return {
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getCaseById(caseId: string): Promise<ReviewerCaseDetails> {
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      const error: AppError = new Error('Invalid case ID format');
      error.statusCode = 400;
      error.code = 'REVIEWER_INVALID_CASE_ID';
      throw error;
    }

    const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
    if (!caseDoc) {
      const error: AppError = new Error('Case record not found');
      error.statusCode = 404;
      error.code = 'REVIEWER_CASE_NOT_FOUND';
      throw error;
    }

    const patient = await User.findById(caseDoc.patientId).select('name email phone');
    const symptoms = await Symptom.find({ caseId: caseDoc._id }).sort({ createdAt: 1 });
    const consent = await Consent.findById(caseDoc.consentId);
    const reviewDocs = await Review.find({ caseId: caseDoc._id }).sort({ createdAt: -1 });

    const reviews = await Promise.all(
      reviewDocs.map(async (r) => {
        const reviewer = await User.findById(r.reviewerId).select('name');
        return {
          id: r._id.toString(),
          reviewerId: r.reviewerId.toString(),
          reviewerName: reviewer?.name || 'Reviewer',
          reviewStatus: r.reviewStatus,
          reviewerNotes: r.reviewerNotes,
          reviewedAt: r.reviewedAt,
        };
      })
    );

    return {
      id: caseDoc._id.toString(),
      caseNumber: caseDoc.caseNumber,
      status: caseDoc.status,
      priority: caseDoc.priority,
      chiefComplaint: caseDoc.chiefComplaint,
      intakeSource: caseDoc.intakeSource,
      language: caseDoc.language,
      createdAt: caseDoc.createdAt || new Date(),
      updatedAt: caseDoc.updatedAt || undefined,
      patient: {
        id: caseDoc.patientId.toString(),
        name: patient?.name || 'Patient',
        email: patient?.email || undefined,
        phone: patient?.phone || undefined,
      },
      consent: consent
        ? {
            status: consent.status,
            version: consent.version,
            capturedAt: consent.capturedAt,
          }
        : null,
      symptoms: symptoms.map((s) => ({
        id: s._id.toString(),
        name: s.symptomName,
        description: s.symptomName,
        onset: s.onset,
        duration: s.duration,
        severity: s.severity,
        bodyLocation: s.bodyLocation,
        source: s.source,
        createdAt: s.createdAt,
      })),
      reviews,
    };
  }

  static async submitReview(
    caseId: string,
    reviewerUserId: string,
    input: SubmitReviewInput,
    requestId?: string
  ): Promise<SubmitReviewResponse> {
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      const error: AppError = new Error('Invalid case ID format');
      error.statusCode = 400;
      error.code = 'REVIEWER_INVALID_CASE_ID';
      throw error;
    }

    const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
    if (!caseDoc) {
      const error: AppError = new Error('Case record not found');
      error.statusCode = 404;
      error.code = 'REVIEWER_CASE_NOT_FOUND';
      throw error;
    }

    const reviewerUser = await User.findById(reviewerUserId);
    if (!reviewerUser) {
      const error: AppError = new Error('Reviewer user account not found');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_INVALID';
      throw error;
    }

    const reviewerObjectId = new mongoose.Types.ObjectId(reviewerUserId);
    const reviewStatus = input.reviewStatus || ReviewStatus.COMPLETED;

    // Create Review document
    const newReview = new Review({
      caseId: caseDoc._id,
      reviewerId: reviewerObjectId,
      reviewStatus,
      reviewerNotes: input.reviewerNotes,
      reviewedAt: new Date(),
    });
    await newReview.save();

    // Minimal Case status transition: OPEN -> IN_REVIEW
    if (caseDoc.status === CaseStatus.OPEN) {
      caseDoc.status = CaseStatus.IN_REVIEW;
      await caseDoc.save();
    }

    // Create Audit Log entry
    const newAudit = new AuditLog({
      actorId: reviewerUserId,
      actorRole: reviewerUser.role,
      action: AuditEventType.REVIEW_STARTED,
      resourceType: 'Case',
      resourceId: caseDoc._id.toString(),
      caseId: caseDoc._id,
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'REVIEWER_PORTAL',
      outcome: 'SUCCESS',
      metadata: {
        reviewId: newReview._id.toString(),
        reviewStatus: newReview.reviewStatus,
      },
    });
    await newAudit.save();

    return {
      reviewId: newReview._id.toString(),
      caseId: caseDoc._id.toString(),
      reviewerId: reviewerUserId,
      reviewStatus: newReview.reviewStatus,
      caseStatus: caseDoc.status,
      reviewedAt: newReview.reviewedAt,
    };
  }
}
