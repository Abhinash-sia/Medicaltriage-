import mongoose from 'mongoose';
import { Case } from '../cases/case.model.js';
import { ICase, CaseStatus } from '../cases/case.types.js';
import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { Symptom } from '../symptoms/symptom.model.js';
import { Consent } from '../consent/consent.model.js';
import { Review } from '../reviews/review.model.js';
import { ReviewStatus } from '../reviews/review.types.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { SlaService } from '../sla/sla.service.js';
import { ReferralService } from '../referrals/referral.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import {
  ReviewerCasesQuery,
  PaginatedReviewerCasesResponse,
  ReviewerCaseDetails,
  SubmitReviewInput,
  SubmitReviewResponse,
  AssignmentResponse,
} from './reviewer.types.js';
import { AppError } from '../../middleware/error-handler.js';

const REVIEWER_ROLES = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
  UserRole.ADMIN,
];

async function checkFacilityAccess(caseDoc: ICase, userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (user && user.role !== UserRole.ADMIN && user.facilityId && caseDoc.facilityId) {
    if (caseDoc.facilityId !== user.facilityId) {
      if (caseDoc.status === CaseStatus.REFERRED || caseDoc.status === CaseStatus.IN_REVIEW) {
        await ReferralService.checkReferralFacilityAccess(caseDoc, userId);
      } else {
        const error: AppError = new Error('Access forbidden: Case belongs to a different facility');
        error.statusCode = 403;
        error.code = 'AUTH_FORBIDDEN';
        throw error;
      }
    }
  }
}

export class ReviewerService {
  static async getCases(
    query: ReviewerCasesQuery,
    requestingUserId: string
  ): Promise<PaginatedReviewerCasesResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isDeleted: false };
    const now = new Date();

    // Enforce facility authorization scope on queue queries
    const requestingUser = await User.findById(requestingUserId);
    if (requestingUser && requestingUser.role !== UserRole.ADMIN && requestingUser.facilityId) {
      filter.facilityId = requestingUser.facilityId;
    } else if (query.facilityId) {
      filter.facilityId = query.facilityId;
    }

    if (query.language) {
      filter.language = query.language.toLowerCase().trim();
    }

    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.assignedTo === 'me') {
      filter.assignedReviewerId = new mongoose.Types.ObjectId(requestingUserId);
    } else if (query.assignedTo === 'unassigned') {
      filter.assignedReviewerId = null;
    }

    // Database-level timestamp conditions for slaStatus filtering
    if (query.slaStatus === 'escalated') {
      filter.escalatedAt = { $ne: null };
    } else if (query.slaStatus === 'overdue') {
      filter.escalatedAt = null;
      filter.slaDueAt = { $lte: now };
    } else if (query.slaStatus === 'due_soon') {
      filter.escalatedAt = null;
      filter.slaDueAt = { $gt: now };
      filter.$expr = {
        $lte: [
          { $subtract: ['$slaDueAt', now] },
          { $multiply: [{ $subtract: ['$slaDueAt', '$createdAt'] }, 0.25] },
        ],
      };
    } else if (query.slaStatus === 'pending') {
      filter.escalatedAt = null;
      filter.slaDueAt = { $gt: now };
      filter.$expr = {
        $gt: [
          { $subtract: ['$slaDueAt', now] },
          { $multiply: [{ $subtract: ['$slaDueAt', '$createdAt'] }, 0.25] },
        ],
      };
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
        let assignedReviewerName: string | undefined = undefined;
        if (c.assignedReviewerId) {
          const reviewer = await User.findById(c.assignedReviewerId).select('name');
          assignedReviewerName = reviewer?.name;
        }

        const sla = SlaService.getSlaDetails(c, now);

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
          assignedReviewerId: c.assignedReviewerId ? c.assignedReviewerId.toString() : null,
          assignedReviewerName,
          isAssigned: !!c.assignedReviewerId,
          sla,
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

  static async getCaseById(caseId: string, requestingUserId?: string): Promise<ReviewerCaseDetails> {
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

    if (requestingUserId) {
      await checkFacilityAccess(caseDoc, requestingUserId);
    }

    const patient = await User.findById(caseDoc.patientId).select('name email phone');
    let assignedReviewerName: string | undefined = undefined;
    if (caseDoc.assignedReviewerId) {
      const reviewer = await User.findById(caseDoc.assignedReviewerId).select('name');
      assignedReviewerName = reviewer?.name;
    }

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

    const sla = SlaService.getSlaDetails(caseDoc);

    return {
      id: caseDoc._id.toString(),
      caseNumber: caseDoc.caseNumber,
      status: caseDoc.status,
      priority: caseDoc.priority,
      chiefComplaint: caseDoc.chiefComplaint,
      intakeSource: caseDoc.intakeSource,
      language: caseDoc.language,
      assignedReviewerId: caseDoc.assignedReviewerId ? caseDoc.assignedReviewerId.toString() : null,
      assignedReviewerName,
      isAssigned: !!caseDoc.assignedReviewerId,
      sla,
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

    await checkFacilityAccess(caseDoc, reviewerUserId);

    const reviewerUser = await User.findById(reviewerUserId);
    if (!reviewerUser) {
      const error: AppError = new Error('Reviewer user account not found');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_INVALID';
      throw error;
    }

    const reviewerObjectId = new mongoose.Types.ObjectId(reviewerUserId);
    const reviewStatus = input.reviewStatus || ReviewStatus.COMPLETED;

    const newReview = new Review({
      caseId: caseDoc._id,
      reviewerId: reviewerObjectId,
      reviewStatus,
      reviewerNotes: input.reviewerNotes,
      reviewedAt: new Date(),
    });
    await newReview.save();

    if (caseDoc.status === 'OPEN') {
      caseDoc.status = 'IN_REVIEW' as any;
      await caseDoc.save();
    }

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

  static async claimCase(
    caseId: string,
    reviewerUserId: string,
    requestId?: string
  ): Promise<AssignmentResponse> {
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

    await checkFacilityAccess(caseDoc, reviewerUserId);

    if (caseDoc.assignedReviewerId) {
      const error: AppError = new Error('This case is already claimed by another reviewer');
      error.statusCode = 409;
      error.code = 'ASSIGNMENT_CONFLICT';
      throw error;
    }

    const reviewerObjectId = new mongoose.Types.ObjectId(reviewerUserId);

    // Atomic claim mutation using findOneAndUpdate to prevent race conditions
    const updatedCase = await Case.findOneAndUpdate(
      { _id: caseId, assignedReviewerId: null, isDeleted: false },
      { $set: { assignedReviewerId: reviewerObjectId } },
      { new: true }
    );

    if (!updatedCase) {
      const error: AppError = new Error('This case was already claimed by another reviewer');
      error.statusCode = 409;
      error.code = 'ASSIGNMENT_CONFLICT';
      throw error;
    }

    const reviewerUser = await User.findById(reviewerUserId);

    const newAudit = new AuditLog({
      actorId: reviewerUserId,
      actorRole: reviewerUser?.role || UserRole.NURSE,
      action: AuditEventType.CASE_CLAIMED,
      resourceType: 'Case',
      resourceId: updatedCase._id.toString(),
      caseId: updatedCase._id,
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'REVIEWER_PORTAL',
      outcome: 'SUCCESS',
      metadata: {
        previousReviewerId: null,
        newReviewerId: reviewerUserId,
      },
    });
    await newAudit.save();

    // Trigger operational notification (fail-safe)
    NotificationService.triggerAssignmentNotification(
      updatedCase._id.toString(),
      updatedCase.caseNumber,
      reviewerUserId,
      updatedCase.facilityId
    ).catch(() => {});

    return {
      caseId: updatedCase._id.toString(),
      caseNumber: updatedCase.caseNumber,
      assignedReviewerId: reviewerUserId,
      assignedReviewerName: reviewerUser?.name || 'Reviewer',
      action: 'CASE_CLAIMED',
    };
  }

  static async releaseCase(
    caseId: string,
    reviewerUserId: string,
    isAdmin: boolean,
    requestId?: string
  ): Promise<AssignmentResponse> {
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

    await checkFacilityAccess(caseDoc, reviewerUserId);

    if (!caseDoc.assignedReviewerId) {
      const error: AppError = new Error('Case is not currently assigned to any reviewer');
      error.statusCode = 409;
      error.code = 'ASSIGNMENT_NOT_ASSIGNED';
      throw error;
    }

    const previousReviewerId = caseDoc.assignedReviewerId.toString();

    // Ownership check: Normal reviewers can only release cases assigned to themselves
    if (!isAdmin && previousReviewerId !== reviewerUserId) {
      const error: AppError = new Error('Access forbidden: You can only release cases assigned to yourself');
      error.statusCode = 403;
      error.code = 'AUTH_FORBIDDEN';
      throw error;
    }

    caseDoc.assignedReviewerId = null as any;
    await caseDoc.save();

    const actorUser = await User.findById(reviewerUserId);

    const newAudit = new AuditLog({
      actorId: reviewerUserId,
      actorRole: actorUser?.role || UserRole.NURSE,
      action: AuditEventType.CASE_RELEASED,
      resourceType: 'Case',
      resourceId: caseDoc._id.toString(),
      caseId: caseDoc._id,
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'REVIEWER_PORTAL',
      outcome: 'SUCCESS',
      metadata: {
        previousReviewerId,
        newReviewerId: null,
      },
    });
    await newAudit.save();

    return {
      caseId: caseDoc._id.toString(),
      caseNumber: caseDoc.caseNumber,
      assignedReviewerId: null,
      action: 'CASE_RELEASED',
    };
  }

  static async assignCase(
    caseId: string,
    adminUserId: string,
    targetReviewerId: string,
    requestId?: string
  ): Promise<AssignmentResponse> {
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      const error: AppError = new Error('Invalid case ID format');
      error.statusCode = 400;
      error.code = 'REVIEWER_INVALID_CASE_ID';
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(targetReviewerId)) {
      const error: AppError = new Error('Invalid target reviewer ID format');
      error.statusCode = 400;
      error.code = 'ASSIGNMENT_INVALID_TARGET';
      throw error;
    }

    const targetUser = await User.findOne({ _id: targetReviewerId, isDeleted: false, isActive: true });
    if (!targetUser || !REVIEWER_ROLES.includes(targetUser.role)) {
      const error: AppError = new Error('Target user is not an active authorized reviewer');
      error.statusCode = 400;
      error.code = 'ASSIGNMENT_INVALID_TARGET';
      throw error;
    }

    const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
    if (!caseDoc) {
      const error: AppError = new Error('Case record not found');
      error.statusCode = 404;
      error.code = 'REVIEWER_CASE_NOT_FOUND';
      throw error;
    }

    await checkFacilityAccess(caseDoc, adminUserId);

    // Facility compatibility check for target reviewer
    if (caseDoc.facilityId && targetUser.facilityId && caseDoc.facilityId !== targetUser.facilityId) {
      const error: AppError = new Error('Target reviewer belongs to a different facility than the case');
      error.statusCode = 400;
      error.code = 'ASSIGNMENT_INVALID_TARGET';
      throw error;
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetReviewerId);

    // Atomic administrative assignment mutation capturing pre-update state for race-safe audit logging
    const previousCaseDoc = await Case.findOneAndUpdate(
      { _id: caseId, isDeleted: false },
      { $set: { assignedReviewerId: targetObjectId } },
      { new: false } // Returns pre-update document
    );

    if (!previousCaseDoc) {
      const error: AppError = new Error('Case record not found');
      error.statusCode = 404;
      error.code = 'REVIEWER_CASE_NOT_FOUND';
      throw error;
    }

    const previousReviewerId = previousCaseDoc.assignedReviewerId
      ? previousCaseDoc.assignedReviewerId.toString()
      : null;

    const adminUser = await User.findById(adminUserId);

    // Audit Event Logging: Preserving exact previousReviewerId and newReviewerId
    const newAudit = new AuditLog({
      actorId: adminUserId,
      actorRole: adminUser?.role || UserRole.ADMIN,
      action: AuditEventType.CASE_ASSIGNED,
      resourceType: 'Case',
      resourceId: previousCaseDoc._id.toString(),
      caseId: previousCaseDoc._id,
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'REVIEWER_PORTAL',
      outcome: 'SUCCESS',
      metadata: {
        previousReviewerId,
        newReviewerId: targetReviewerId,
      },
    });
    await newAudit.save();

    // Trigger operational notification (fail-safe)
    NotificationService.triggerAssignmentNotification(
      previousCaseDoc._id.toString(),
      previousCaseDoc.caseNumber,
      targetReviewerId,
      previousCaseDoc.facilityId
    ).catch(() => {});

    return {
      caseId: previousCaseDoc._id.toString(),
      caseNumber: previousCaseDoc.caseNumber,
      assignedReviewerId: targetReviewerId,
      assignedReviewerName: targetUser.name,
      action: 'CASE_ASSIGNED',
    };
  }

  static async unassignCase(
    caseId: string,
    adminUserId: string,
    requestId?: string
  ): Promise<AssignmentResponse> {
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

    await checkFacilityAccess(caseDoc, adminUserId);

    // Atomic administrative unassignment mutation capturing pre-update state
    const previousCaseDoc = await Case.findOneAndUpdate(
      { _id: caseId, isDeleted: false },
      { $set: { assignedReviewerId: null } },
      { new: false }
    );

    if (!previousCaseDoc) {
      const error: AppError = new Error('Case record not found');
      error.statusCode = 404;
      error.code = 'REVIEWER_CASE_NOT_FOUND';
      throw error;
    }

    const previousReviewerId = previousCaseDoc.assignedReviewerId
      ? previousCaseDoc.assignedReviewerId.toString()
      : null;

    const adminUser = await User.findById(adminUserId);

    const newAudit = new AuditLog({
      actorId: adminUserId,
      actorRole: adminUser?.role || UserRole.ADMIN,
      action: AuditEventType.CASE_UNASSIGNED,
      resourceType: 'Case',
      resourceId: previousCaseDoc._id.toString(),
      caseId: previousCaseDoc._id,
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'REVIEWER_PORTAL',
      outcome: 'SUCCESS',
      metadata: {
        previousReviewerId,
        newReviewerId: null,
      },
    });
    await newAudit.save();

    return {
      caseId: previousCaseDoc._id.toString(),
      caseNumber: previousCaseDoc.caseNumber,
      assignedReviewerId: null,
      action: 'CASE_UNASSIGNED',
    };
  }
}
