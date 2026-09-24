import mongoose, { Types } from 'mongoose';
import { Case } from '../cases/case.model.js';
import { CaseStatus, CasePriority } from '../cases/case.types.js';
import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { Review } from './review.model.js';
import { ReviewStatus, IReviewDocument } from './review.types.js';
import { TriageNote } from '../triage/triage-note.model.js';
import { SafetyEvaluation } from '../safety/safety-evaluation.model.js';
import { SafetyEvaluationService } from '../safety/safety-evaluation.service.js';
import { SlaService } from '../sla/sla.service.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { AppError } from '../../middleware/error-handler.js';

function createError(statusCode: number, message: string, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

async function checkFacilityAccess(caseDoc: any, userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    throw createError(401, 'User account not found', 'AUTH_TOKEN_INVALID');
  }
  if (user.role !== UserRole.ADMIN && caseDoc.facilityId && user.facilityId && caseDoc.facilityId !== user.facilityId) {
    throw createError(403, 'Unauthorized access to case from another facility', 'FACILITY_ACCESS_DENIED');
  }
}

export interface SubmitReviewDecisionInput {
  reviewStatus: ReviewStatus;
  reviewerNotes: string;
  targetUserId?: string;
  escalationReason?: string;
}

export class ReviewService {
  /**
   * Submits a formal human review decision (RESOLVE, REQUEST_INFO, ESCALATE).
   */
  public static async submitReviewDecision(
    caseIdInput: string | Types.ObjectId,
    reviewerUserId: string,
    input: SubmitReviewDecisionInput,
    requestId?: string
  ): Promise<{ reviewId: string; caseId: string; reviewerId?: string; reviewStatus: ReviewStatus; caseStatus: CaseStatus; reviewedAt: Date }> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      throw createError(400, 'Invalid case ID format', 'REVIEWER_INVALID_CASE_ID');
    }

    const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
    if (!caseDoc) {
      throw createError(404, 'Case record not found', 'REVIEWER_CASE_NOT_FOUND');
    }

    await checkFacilityAccess(caseDoc, reviewerUserId);

    const reviewerUser = await User.findById(reviewerUserId);
    if (!reviewerUser) {
      throw createError(401, 'Reviewer user account not found', 'AUTH_TOKEN_INVALID');
    }

    // Verify ownership: Unassigned non-admin reviewers cannot submit review for another reviewer's claimed case
    if (
      caseDoc.assignedReviewerId &&
      caseDoc.assignedReviewerId.toString() !== reviewerUserId &&
      reviewerUser.role !== UserRole.ADMIN
    ) {
      throw createError(403, 'Cannot submit review for a case assigned to another reviewer', 'ASSIGNMENT_DENIED');
    }

    // Fetch active snapshots for evidence linkage
    let activeNote: any = null;
    let activeSafety: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        activeNote = await TriageNote.findOne({ caseId, status: 'ACTIVE' }).lean();
      } catch (_) {}
      try {
        activeSafety = await SafetyEvaluation.findOne({ caseId, status: 'ACTIVE' }).lean();
      } catch (_) {}
    }

    const reviewStatus = input.reviewStatus || ReviewStatus.COMPLETED;
    let targetUserObjectId: Types.ObjectId | null = null;
    let escalationDecisionObj: any = null;

    // Handle ESCALATED decision specifics
    if (reviewStatus === ReviewStatus.ESCALATED) {
      if (input.targetUserId) {
        if (!mongoose.Types.ObjectId.isValid(input.targetUserId)) {
          throw createError(400, 'Invalid target reviewer user ID format');
        }

        const targetUser = await User.findOne({ _id: input.targetUserId, isDeleted: false });
        if (!targetUser) {
          throw createError(404, 'Target reviewer user not found');
        }

        // Validate target reviewer facility compatibility
        if (reviewerUser.role !== UserRole.ADMIN && caseDoc.facilityId && targetUser.facilityId && caseDoc.facilityId !== targetUser.facilityId) {
          throw createError(403, 'Target reviewer belongs to a different facility');
        }

        const ALLOWED_ROLES = [UserRole.NURSE, UserRole.HEALTH_WORKER, UserRole.DOCTOR, UserRole.MEDICAL_OFFICER, UserRole.ADMIN];
        if (!ALLOWED_ROLES.includes(targetUser.role as UserRole)) {
          throw createError(400, 'Target user does not have an authorized reviewer role');
        }

        targetUserObjectId = targetUser._id;
      }

      escalationDecisionObj = {
        escalatedToFacility: caseDoc.facilityId || 'GOVERNMENT_HOSPITAL',
        targetUserId: targetUserObjectId || undefined,
        reason: input.escalationReason || input.reviewerNotes,
      };
    }

    // Determine new Case Status
    let targetCaseStatus: CaseStatus = caseDoc.status;
    if (reviewStatus === ReviewStatus.COMPLETED) {
      targetCaseStatus = CaseStatus.RESOLVED;
    } else if (reviewStatus === ReviewStatus.ESCALATED) {
      targetCaseStatus = CaseStatus.ESCALATED;
    } else if (reviewStatus === ReviewStatus.ADDITIONAL_INFO_REQUESTED) {
      targetCaseStatus = CaseStatus.IN_REVIEW;
    } else if (caseDoc.status === CaseStatus.OPEN) {
      targetCaseStatus = CaseStatus.IN_REVIEW;
    }

    // Multi-document transaction vs standalone fallback execution
    let session: mongoose.ClientSession | null = null;
    const isReplicaSet =
      mongoose.connection.readyState === 1 &&
      ((mongoose.connection as any).client?.topology?.description?.type?.includes('ReplicaSet') ||
        (mongoose.connection as any).client?.topology?.description?.type?.includes('Sharded'));

    if (isReplicaSet) {
      try {
        const s = await mongoose.startSession();
        s.startTransaction();
        session = s;
      } catch (_) {
        session = null;
      }
    }

    try {
      // 1. Save Review Document
      const newReview = new Review({
        caseId: caseDoc._id,
        reviewerId: new mongoose.Types.ObjectId(reviewerUserId),
        reviewStatus,
        reviewerNotes: input.reviewerNotes,
        triageNoteVersion: activeNote ? activeNote.noteVersion : undefined,
        safetyEvaluationVersion: activeSafety ? activeSafety.evaluationVersion : undefined,
        targetUserId: targetUserObjectId || undefined,
        escalationDecision: escalationDecisionObj || undefined,
        reviewedAt: new Date(),
      });
      await newReview.save({ session: session || undefined });

      // 2. Update Case State
      caseDoc.status = targetCaseStatus;
      if (reviewStatus === ReviewStatus.ESCALATED) {
        if (!caseDoc.escalatedAt) {
          caseDoc.escalatedAt = new Date();
        }
        caseDoc.escalationLevel = (caseDoc.escalationLevel || 0) + 1;
        caseDoc.assignedReviewerId = (targetUserObjectId || undefined) as any;
      } else if (caseDoc.status === CaseStatus.OPEN) {
        caseDoc.assignedReviewerId = new mongoose.Types.ObjectId(reviewerUserId);
      }

      await caseDoc.save({ session: session || undefined });

      // 3. Log Audit Events
      const primaryAction =
        reviewStatus === ReviewStatus.ESCALATED
          ? AuditEventType.CASE_ESCALATED_BY_REVIEWER
          : reviewStatus === ReviewStatus.COMPLETED
          ? AuditEventType.CASE_RESOLVED_BY_REVIEWER
          : reviewStatus === ReviewStatus.ADDITIONAL_INFO_REQUESTED
          ? AuditEventType.CASE_MORE_INFO_REQUESTED
          : AuditEventType.CASE_REVIEW_DECISION;

      const audit = new AuditLog({
        actorId: reviewerUserId,
        actorRole: reviewerUser.role,
        action: primaryAction,
        resourceType: 'Case',
        resourceId: caseDoc._id.toString(),
        caseId: caseDoc._id,
        requestId: requestId || null,
        timestamp: new Date(),
        source: 'REVIEWER_SERVICE',
        outcome: 'SUCCESS',
        metadata: {
          reviewId: newReview._id.toString(),
          reviewStatus,
          caseStatus: targetCaseStatus,
          targetUserId: targetUserObjectId ? targetUserObjectId.toString() : null,
          triageNoteVersion: activeNote ? activeNote.noteVersion : null,
          safetyEvaluationVersion: activeSafety ? activeSafety.evaluationVersion : null,
          isReplicaSet: !!session,
        },
      });
      await audit.save({ session: session || undefined });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        reviewId: newReview._id.toString(),
        caseId: caseDoc._id.toString(),
        reviewerId: reviewerUserId,
        reviewStatus: newReview.reviewStatus,
        caseStatus: targetCaseStatus,
        reviewedAt: newReview.reviewedAt,
      };
    } catch (err) {
      if (session) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
      }
      throw err;
    }
  }

  /**
   * Human Priority Override execution using Phase 15 SafetyEvaluation semantics.
   * Recalculates SLA due timestamp using exact Phase 7 policy (1h URGENT, 4h PRIORITY, 24h ROUTINE).
   */
  public static async overridePriority(
    caseIdInput: string | Types.ObjectId,
    reviewerUserId: string,
    overridePriority: CasePriority,
    reason: string,
    requestId?: string
  ): Promise<{ caseId: string; priority: CasePriority; priorityOverrideBy: string; slaDueAt: Date | null }> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      throw createError(400, 'Invalid case ID format', 'REVIEWER_INVALID_CASE_ID');
    }

    const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
    if (!caseDoc) {
      throw createError(404, 'Case record not found', 'REVIEWER_CASE_NOT_FOUND');
    }

    await checkFacilityAccess(caseDoc, reviewerUserId);

    const reviewerUser = await User.findById(reviewerUserId);
    if (!reviewerUser) {
      throw createError(401, 'Reviewer user account not found', 'AUTH_TOKEN_INVALID');
    }

    if (!reason || reason.trim().length === 0) {
      throw createError(400, 'Priority override justification reason is required');
    }

    // Role Validation for Demotion:
    // Demotions (URGENT -> PRIORITY/ROUTINE, PRIORITY -> ROUTINE) require DOCTOR, MEDICAL_OFFICER, or ADMIN
    const currentPriority = caseDoc.priority;
    const isDemotion =
      (currentPriority === CasePriority.URGENT && (overridePriority === CasePriority.PRIORITY || overridePriority === CasePriority.ROUTINE)) ||
      (currentPriority === CasePriority.PRIORITY && overridePriority === CasePriority.ROUTINE);

    const DEMOTION_ALLOWED_ROLES = [UserRole.DOCTOR, UserRole.MEDICAL_OFFICER, UserRole.ADMIN];
    if (isDemotion && !DEMOTION_ALLOWED_ROLES.includes(reviewerUser.role as UserRole)) {
      throw createError(403, 'Priority demotion requires Doctor, Medical Officer, or Admin authorization', 'ROLE_UNAUTHORIZED');
    }

    const previousPriority = caseDoc.priority;

    // Recalculate SLA due timestamp using exact Phase 7 SLA policy
    const newSlaDueAt = SlaService.calculateSlaDueAt({
      createdAt: caseDoc.createdAt || new Date(),
      priority: overridePriority,
    });

    // Update Case priority override fields
    caseDoc.priorityOverride = overridePriority;
    caseDoc.priorityOverrideReason = reason.trim();
    caseDoc.priorityOverrideBy = new mongoose.Types.ObjectId(reviewerUserId);
    caseDoc.priorityOverrideAt = new Date();
    caseDoc.priority = overridePriority;
    caseDoc.slaDueAt = newSlaDueAt;
    await caseDoc.save();

    // Re-evaluate Safety Engine case to update active SafetyEvaluation preserving version history
    await SafetyEvaluationService.evaluateCase(caseId, reviewerUserId);

    // Save Review document recording priority change
    const newReview = new Review({
      caseId: caseDoc._id,
      reviewerId: new mongoose.Types.ObjectId(reviewerUserId),
      reviewStatus: ReviewStatus.IN_PROGRESS,
      reviewerNotes: `Priority override applied: ${previousPriority} -> ${overridePriority}. Reason: ${reason.trim()}`,
      priorityChange: {
        previousPriority,
        newPriority: overridePriority,
        reason: reason.trim(),
      },
      reviewedAt: new Date(),
    });
    await newReview.save();

    // Log Audit Event
    await AuditLog.create({
      actorId: reviewerUserId,
      actorRole: reviewerUser.role,
      action: AuditEventType.CASE_PRIORITY_OVERRIDDEN,
      resourceType: 'Case',
      resourceId: caseDoc._id.toString(),
      caseId: caseDoc._id,
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'REVIEWER_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        previousPriority,
        newPriority: overridePriority,
        reason: reason.trim(),
        slaDueAt: newSlaDueAt,
      },
    });

    return {
      caseId: caseDoc._id.toString(),
      priority: overridePriority,
      priorityOverrideBy: reviewerUserId,
      slaDueAt: newSlaDueAt,
    };
  }

  /**
   * Retrieves chronological review history for a case.
   */
  public static async getCaseReviews(
    caseIdInput: string | Types.ObjectId,
    requestingUserId: string
  ): Promise<any[]> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      throw createError(400, 'Invalid case ID format');
    }

    const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
    if (!caseDoc) {
      throw createError(404, 'Case record not found');
    }

    await checkFacilityAccess(caseDoc, requestingUserId);

    const reviews = await Review.find({ caseId }).sort({ reviewedAt: -1 });

    return Promise.all(
      reviews.map(async (r) => {
        const reviewer = await User.findById(r.reviewerId).select('name role');
        const targetUser = r.targetUserId ? await User.findById(r.targetUserId).select('name role') : null;

        return {
          id: r._id.toString(),
          reviewerId: r.reviewerId.toString(),
          reviewerName: reviewer?.name || 'Clinical Reviewer',
          reviewerRole: reviewer?.role || 'REVIEWER',
          reviewStatus: r.reviewStatus,
          reviewerNotes: r.reviewerNotes,
          triageNoteVersion: r.triageNoteVersion || null,
          safetyEvaluationVersion: r.safetyEvaluationVersion || null,
          targetUserId: r.targetUserId ? r.targetUserId.toString() : null,
          targetUserName: targetUser?.name || null,
          priorityChange: r.priorityChange || null,
          escalationDecision: r.escalationDecision || null,
          reviewedAt: r.reviewedAt,
        };
      })
    );
  }
}
