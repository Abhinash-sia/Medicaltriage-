import mongoose, { Types } from 'mongoose';
import { Case } from '../cases/case.model.js';
import { CaseStatus } from '../cases/case.types.js';
import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { Referral } from './referral.model.js';
import { ReferralStatus, IReferralDocument } from './referral.types.js';
import { TriageNote } from '../triage/triage-note.model.js';
import { SafetyEvaluation } from '../safety/safety-evaluation.model.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { AppError } from '../../middleware/error-handler.js';

function createError(statusCode: number, message: string, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

export class ReferralService {
  /**
   * Helper verifying if a reviewer is authorized to access a case via originating or active destination facility.
   */
  public static async checkReferralFacilityAccess(
    caseDoc: any,
    userId: string
  ): Promise<{ originating: boolean; destination: boolean; isAdmin: boolean }> {
    const user = await User.findById(userId);
    if (!user) {
      throw createError(401, 'User account not found', 'AUTH_TOKEN_INVALID');
    }

    if (user.role === UserRole.ADMIN) {
      return { originating: true, destination: true, isAdmin: true };
    }

    const originatingMatch = !!(caseDoc.facilityId && user.facilityId && caseDoc.facilityId === user.facilityId);

    // Check if user belongs to a destination facility of an active referral (PENDING or ACCEPTED) for this case
    let destinationMatch = false;
    if (user.facilityId && (caseDoc.status === CaseStatus.REFERRED || caseDoc.status === CaseStatus.IN_REVIEW)) {
      if (mongoose.connection.readyState === 1) {
        const activeReferral = await Referral.findOne({
          caseId: caseDoc._id,
          status: { $in: [ReferralStatus.PENDING, ReferralStatus.ACCEPTED] },
          destinationFacilityId: user.facilityId,
        });
        if (activeReferral) {
          destinationMatch = true;
        }
      }
    }

    if (!originatingMatch && !destinationMatch) {
      throw createError(403, 'Access forbidden: Case belongs to a different facility', 'AUTH_FORBIDDEN');
    }

    return { originating: originatingMatch, destination: destinationMatch, isAdmin: false };
  }

  /**
   * Internal referral creation logic invoked by ReviewService.submitReviewDecision.
   */
  public static async createReferral(
    caseDoc: any,
    reviewerUser: any,
    input: {
      referralFacilityId: string;
      destinationDepartment?: string;
      referralReason: string;
      referralSummary: string;
    },
    requestId?: string
  ): Promise<{ referralId: string; referralCode: string; status: ReferralStatus }> {
    if (reviewerUser.role === UserRole.PATIENT) {
      throw createError(403, 'Patients cannot create case referrals', 'AUTH_FORBIDDEN');
    }

    if (!input.referralFacilityId || input.referralFacilityId.trim().length === 0) {
      throw createError(400, 'Destination referral facility ID is required');
    }

    if (input.referralFacilityId.trim() === caseDoc.facilityId) {
      throw createError(400, 'Referral destination facility cannot be the same as the originating facility');
    }

    // Snapshots of active notes/evaluations
    let activeNote: any = null;
    let activeSafety: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        activeNote = await TriageNote.findOne({ caseId: caseDoc._id, status: 'ACTIVE' }).lean();
      } catch (_) {}
      try {
        activeSafety = await SafetyEvaluation.findOne({ caseId: caseDoc._id, status: 'ACTIVE' }).lean();
      } catch (_) {}
    }

    // Generate referral code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referralCode = `REF-${dateStr}-${randomSuffix}`;

    const originatingFacilityId = caseDoc.facilityId || 'GOVERNMENT_HOSPITAL';

    // Start session if ReplicaSet/Sharded
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
      const newReferral = new Referral({
        referralCode,
        caseId: caseDoc._id,
        originatingFacilityId,
        destinationFacilityId: input.referralFacilityId.trim(),
        destinationDepartment: input.destinationDepartment?.trim() || null,
        referringReviewerId: reviewerUser._id,
        status: ReferralStatus.PENDING,
        reason: input.referralReason.trim(),
        summary: input.referralSummary.trim(),
        triageNoteVersionSnapshot: activeNote ? activeNote.noteVersion : null,
        safetyEvaluationVersionSnapshot: activeSafety ? activeSafety.evaluationVersion : null,
        statusHistory: [
          {
            status: ReferralStatus.PENDING,
            updatedBy: reviewerUser._id,
            updatedAt: new Date(),
            notes: 'Referral initiated by healthcare reviewer',
          },
        ],
      });
      await newReferral.save({ session: session || undefined });

      // Update Case state: Case.status = REFERRED, assignedReviewerId = null
      caseDoc.status = CaseStatus.REFERRED;
      caseDoc.assignedReviewerId = undefined;
      await caseDoc.save({ session: session || undefined });

      // Audit Log
      const audit = new AuditLog({
        actorId: reviewerUser._id.toString(),
        actorRole: reviewerUser.role,
        action: AuditEventType.REFERRAL_INITIATED,
        resourceType: 'Referral',
        resourceId: newReferral._id.toString(),
        caseId: caseDoc._id,
        requestId: requestId || null,
        timestamp: new Date(),
        source: 'REFERRAL_SERVICE',
        outcome: 'SUCCESS',
        metadata: {
          referralCode,
          originatingFacilityId,
          destinationFacilityId: input.referralFacilityId.trim(),
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
        referralId: newReferral._id.toString(),
        referralCode,
        status: ReferralStatus.PENDING,
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
   * Retrieves chronological referral history for a case.
   */
  public static async getCaseReferrals(caseIdInput: string | Types.ObjectId, userId: string): Promise<any[]> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;
    const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
    if (!caseDoc) {
      throw createError(404, 'Case record not found');
    }

    await ReferralService.checkReferralFacilityAccess(caseDoc, userId);

    const referrals = await Referral.find({ caseId }).sort({ createdAt: -1 });

    return Promise.all(
      referrals.map(async (ref) => {
        const referrer = await User.findById(ref.referringReviewerId).select('name role');
        return {
          id: ref._id.toString(),
          referralCode: ref.referralCode,
          caseId: ref.caseId.toString(),
          originatingFacilityId: ref.originatingFacilityId,
          destinationFacilityId: ref.destinationFacilityId,
          destinationDepartment: ref.destinationDepartment || null,
          referringReviewerId: ref.referringReviewerId.toString(),
          referringReviewerName: referrer?.name || 'Clinical Reviewer',
          referringReviewerRole: referrer?.role || 'REVIEWER',
          status: ref.status,
          reason: ref.reason,
          summary: ref.summary,
          destinationNotes: ref.destinationNotes || null,
          triageNoteVersionSnapshot: ref.triageNoteVersionSnapshot || null,
          safetyEvaluationVersionSnapshot: ref.safetyEvaluationVersionSnapshot || null,
          statusHistory: ref.statusHistory,
          createdAt: ref.createdAt,
          updatedAt: ref.updatedAt,
        };
      })
    );
  }

  /**
   * Lists incoming pending/accepted referrals for reviewer's facility.
   */
  public static async getIncomingReferrals(userId: string): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw createError(401, 'User account not found');
    }

    if (user.role === UserRole.PATIENT) {
      throw createError(403, 'Patients cannot view facility referral queue');
    }

    const facilityId = user.facilityId || 'GOVERNMENT_HOSPITAL';
    const query = user.role === UserRole.ADMIN ? {} : { destinationFacilityId: facilityId };

    const referrals = await Referral.find(query).sort({ createdAt: -1 });

    return Promise.all(
      referrals.map(async (ref) => {
        const caseDoc = await Case.findById(ref.caseId).select('caseNumber priority chiefComplaint status');
        const referrer = await User.findById(ref.referringReviewerId).select('name role');

        return {
          id: ref._id.toString(),
          referralCode: ref.referralCode,
          caseId: ref.caseId.toString(),
          caseNumber: caseDoc?.caseNumber || null,
          casePriority: caseDoc?.priority || null,
          caseStatus: caseDoc?.status || null,
          chiefComplaint: caseDoc?.chiefComplaint || null,
          originatingFacilityId: ref.originatingFacilityId,
          destinationFacilityId: ref.destinationFacilityId,
          destinationDepartment: ref.destinationDepartment || null,
          referringReviewerName: referrer?.name || 'Clinical Reviewer',
          status: ref.status,
          reason: ref.reason,
          summary: ref.summary,
          createdAt: ref.createdAt,
        };
      })
    );
  }

  /**
   * Transitions referral status (ACCEPT, REJECT, CANCEL, COMPLETE).
   */
  public static async updateReferralStatus(
    referralIdInput: string,
    userId: string,
    targetStatus: ReferralStatus,
    notes?: string,
    requestId?: string
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(referralIdInput)) {
      throw createError(400, 'Invalid referral ID format');
    }

    const referral = await Referral.findById(referralIdInput);
    if (!referral) {
      throw createError(404, 'Referral record not found');
    }

    const caseDoc = await Case.findById(referral.caseId);
    if (!caseDoc) {
      throw createError(404, 'Associated case record not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError(401, 'User account not found');
    }

    if (user.role === UserRole.PATIENT) {
      throw createError(403, 'Patients cannot update referral status');
    }

    const currentStatus = referral.status;

    // Validate state machine transitions & actor permissions
    let expectedCurrentStatus: ReferralStatus = ReferralStatus.PENDING;
    let auditAction: AuditEventType;

    if (targetStatus === ReferralStatus.ACCEPTED) {
      if (currentStatus !== ReferralStatus.PENDING) {
        throw createError(400, `Cannot ACCEPT a referral in ${currentStatus} state`);
      }
      // Authorization: Destination facility reviewer or ADMIN
      if (user.role !== UserRole.ADMIN && user.facilityId !== referral.destinationFacilityId) {
        throw createError(403, 'Only reviewers at the destination facility can ACCEPT this referral');
      }
      expectedCurrentStatus = ReferralStatus.PENDING;
      auditAction = AuditEventType.REFERRAL_ACCEPTED;
    } else if (targetStatus === ReferralStatus.REJECTED) {
      if (currentStatus !== ReferralStatus.PENDING) {
        throw createError(400, `Cannot REJECT a referral in ${currentStatus} state`);
      }
      // Authorization: Destination facility reviewer or ADMIN
      if (user.role !== UserRole.ADMIN && user.facilityId !== referral.destinationFacilityId) {
        throw createError(403, 'Only reviewers at the destination facility can REJECT this referral');
      }
      expectedCurrentStatus = ReferralStatus.PENDING;
      auditAction = AuditEventType.REFERRAL_REJECTED;
    } else if (targetStatus === ReferralStatus.CANCELLED) {
      if (currentStatus !== ReferralStatus.PENDING) {
        throw createError(400, `Cannot CANCEL a referral in ${currentStatus} state`);
      }
      // Authorization: Originating facility reviewer or ADMIN
      if (user.role !== UserRole.ADMIN && user.facilityId !== referral.originatingFacilityId) {
        throw createError(403, 'Only reviewers at the originating facility can CANCEL this referral');
      }
      expectedCurrentStatus = ReferralStatus.PENDING;
      auditAction = AuditEventType.REFERRAL_CANCELLED;
    } else if (targetStatus === ReferralStatus.COMPLETED) {
      if (currentStatus !== ReferralStatus.ACCEPTED) {
        throw createError(400, `Cannot COMPLETE a referral in ${currentStatus} state. Referral must be ACCEPTED first.`);
      }
      // Authorization: Destination facility reviewer or ADMIN
      if (user.role !== UserRole.ADMIN && user.facilityId !== referral.destinationFacilityId) {
        throw createError(403, 'Only reviewers at the destination facility can COMPLETE this referral');
      }
      expectedCurrentStatus = ReferralStatus.ACCEPTED;
      auditAction = AuditEventType.REFERRAL_COMPLETED;
    } else {
      throw createError(400, `Invalid target referral status transition: ${targetStatus}`);
    }

    // Atomic precondition update to prevent double-accept / race conditions
    const updatedReferral = await Referral.findOneAndUpdate(
      { _id: referral._id, status: expectedCurrentStatus },
      {
        $set: {
          status: targetStatus,
          destinationNotes: notes || referral.destinationNotes,
        },
        $push: {
          statusHistory: {
            status: targetStatus,
            updatedBy: user._id,
            updatedAt: new Date(),
            notes: notes || undefined,
          },
        },
      },
      { new: true }
    );

    if (!updatedReferral) {
      throw createError(409, `Referral state conflict: Referral is no longer in ${expectedCurrentStatus} state`, 'CONCURRENCY_CONFLICT');
    }

    // Update Case status and assignedReviewerId per exact Phase 18 matrix
    if (targetStatus === ReferralStatus.ACCEPTED) {
      caseDoc.status = CaseStatus.REFERRED;
      caseDoc.assignedReviewerId = user._id;
    } else if (targetStatus === ReferralStatus.REJECTED) {
      caseDoc.status = CaseStatus.IN_REVIEW;
      caseDoc.assignedReviewerId = undefined;
    } else if (targetStatus === ReferralStatus.CANCELLED) {
      caseDoc.status = CaseStatus.IN_REVIEW;
      caseDoc.assignedReviewerId = referral.referringReviewerId;
    } else if (targetStatus === ReferralStatus.COMPLETED) {
      caseDoc.status = CaseStatus.CLOSED;
      caseDoc.assignedReviewerId = user._id;
    }
    await caseDoc.save();

    // Log Audit Event
    await AuditLog.create({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: auditAction,
      resourceType: 'Referral',
      resourceId: referral._id.toString(),
      caseId: caseDoc._id,
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'REFERRAL_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        referralCode: referral.referralCode,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        caseStatus: caseDoc.status,
        notes: notes || null,
      },
    });

    return {
      referralId: updatedReferral._id.toString(),
      referralCode: updatedReferral.referralCode,
      status: updatedReferral.status,
      caseStatus: caseDoc.status,
      assignedReviewerId: caseDoc.assignedReviewerId ? caseDoc.assignedReviewerId.toString() : null,
      updatedAt: updatedReferral.updatedAt,
    };
  }
}
