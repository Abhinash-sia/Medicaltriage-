import mongoose from 'mongoose';
import { Case } from '../cases/case.model.js';
import { ICase, CasePriority } from '../cases/case.types.js';
import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { NotificationService } from '../notifications/notification.service.js';
import { SlaStatus, SlaStateDetails, SlaProcessorResult } from './sla.types.js';
import { SLA_POLICY, SLA_DUE_SOON_RATIO } from './sla.config.js';

export class SlaService {
  /**
   * Deterministically calculates the SLA due timestamp based on creation time and priority.
   */
  static calculateSlaDueAt({
    createdAt,
    priority,
  }: {
    createdAt: Date;
    priority: CasePriority;
  }): Date {
    const durationMs = SLA_POLICY[priority] || SLA_POLICY[CasePriority.ROUTINE];
    return new Date(createdAt.getTime() + durationMs);
  }

  /**
   * Derives operational SLA display status following strict precedence:
   * ESCALATED > OVERDUE > DUE_SOON > PENDING.
   */
  static deriveSlaStatus(
    caseDoc: {
      slaDueAt?: Date | null;
      escalatedAt?: Date | null;
      createdAt?: Date;
      priority: CasePriority;
    },
    nowInput?: Date
  ): SlaStatus {
    const now = nowInput || new Date();

    // 1. ESCALATED (Highest precedence)
    if (caseDoc.escalatedAt != null) {
      return SlaStatus.ESCALATED;
    }

    if (!caseDoc.slaDueAt) {
      return SlaStatus.PENDING;
    }

    const dueAtTime = new Date(caseDoc.slaDueAt).getTime();
    const nowTime = now.getTime();

    // 2. OVERDUE
    if (dueAtTime <= nowTime) {
      return SlaStatus.OVERDUE;
    }

    // 3. DUE_SOON (Remaining time <= 25% of total SLA duration)
    const createdAtTime = caseDoc.createdAt ? new Date(caseDoc.createdAt).getTime() : dueAtTime - SLA_POLICY[caseDoc.priority];
    const totalDuration = dueAtTime - createdAtTime;
    const remainingTime = dueAtTime - nowTime;

    if (totalDuration > 0 && remainingTime / totalDuration <= SLA_DUE_SOON_RATIO) {
      return SlaStatus.DUE_SOON;
    }

    // 4. PENDING
    return SlaStatus.PENDING;
  }

  /**
   * Helper to format SLA state details for API DTOs.
   */
  static getSlaDetails(
    caseDoc: {
      slaDueAt?: Date | null;
      escalatedAt?: Date | null;
      escalationLevel?: number;
      createdAt?: Date;
      priority: CasePriority;
    },
    nowInput?: Date
  ): SlaStateDetails {
    const status = this.deriveSlaStatus(caseDoc, nowInput);
    return {
      dueAt: caseDoc.slaDueAt || null,
      status,
      escalatedAt: caseDoc.escalatedAt || null,
      escalationLevel: caseDoc.escalationLevel || 0,
    };
  }

  /**
   * Atomically processes overdue SLAs.
   * Scopes processing to authorized facility for non-ADMIN users (e.g., MEDICAL_OFFICER).
   * Transaction-protected & idempotent: rollback occurs if AuditLog write fails.
   */
  static async processOverdueSlas(
    actorUserId: string,
    actorRole: string = UserRole.ADMIN,
    requestId?: string
  ): Promise<SlaProcessorResult> {
    const now = new Date();
    const actorUser = mongoose.Types.ObjectId.isValid(actorUserId)
      ? await User.findById(actorUserId)
      : null;

    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    // Medical Officers are restricted to their authorized facility/scope
    if (actorUser && actorUser.role !== UserRole.ADMIN && actorUser.facilityId) {
      filter.facilityId = actorUser.facilityId;
    }

    // Count already escalated cases in scope
    const alreadyEscalatedCount = await Case.countDocuments({
      ...filter,
      escalatedAt: { $ne: null },
    });

    // Find candidate overdue cases awaiting escalation
    const candidateFilter = {
      ...filter,
      slaDueAt: { $lte: now },
      escalatedAt: null,
    };

    const candidateCases = await Case.find(candidateFilter).select('_id slaDueAt facilityId');
    let newlyEscalatedCount = 0;
    let failedCount = 0;

    for (const c of candidateCases) {
      const session =
        mongoose.connection.readyState === 1
          ? await mongoose.startSession().catch(() => null)
          : null;

      if (session) {
        session.startTransaction();
      }

      try {
        // Atomic mutation to prevent race conditions across concurrent processors
        const updatedCase = await Case.findOneAndUpdate(
          {
            _id: c._id,
            slaDueAt: { $lte: now },
            escalatedAt: null,
            isDeleted: false,
          },
          {
            $set: {
              escalatedAt: now,
              escalationLevel: 1,
            },
          },
          { new: true, session: session || undefined }
        );

        // Only create audit event if THIS request performed the state transition
        if (updatedCase) {
          const audit = new AuditLog({
            actorId: actorUserId,
            actorRole: actorUser?.role || actorRole,
            action: AuditEventType.CASE_SLA_ESCALATED,
            resourceType: 'Case',
            resourceId: updatedCase._id.toString(),
            caseId: updatedCase._id,
            requestId: requestId || null,
            timestamp: now,
            source: 'REVIEWER_PORTAL',
            outcome: 'SUCCESS',
            metadata: {
              slaDueAt: updatedCase.slaDueAt,
              escalationLevel: 1,
              escalatedAt: now,
            },
          });
          await audit.save({ session: session || undefined });

          if (session) {
            await session.commitTransaction();
            session.endSession();
          }

          // Operational SLA Overdue Notification (fail-safe)
          if (updatedCase.assignedReviewerId) {
            NotificationService.triggerSlaOverdueNotification(
              updatedCase._id.toString(),
              updatedCase.caseNumber,
              updatedCase.assignedReviewerId.toString(),
              updatedCase.facilityId
            ).catch(() => {});
          }

          newlyEscalatedCount++;
        } else {
          if (session) {
            await session.abortTransaction().catch(() => {});
            session.endSession();
          }
        }
      } catch (error) {
        if (session) {
          await session.abortTransaction().catch(() => {});
          session.endSession();
        } else {
          // In non-transactional environments (e.g. standalone Mongo/tests), compensate by reverting state if audit save fails
          await Case.updateOne(
            { _id: c._id, escalatedAt: now },
            { $set: { escalatedAt: null, escalationLevel: 0 } }
          ).catch(() => {});
        }
        failedCount++;
      }
    }

    // Fail-safe secondary operational side-effect: process DUE_SOON notifications in scope
    try {
      await this.processDueSoonNotifications(
        actorUserId,
        actorUser && actorUser.role !== UserRole.ADMIN ? actorUser.facilityId : undefined
      );
    } catch {
      // Fail-safe: Notification errors never affect SLA processing result
    }

    return {
      processed: candidateCases.length,
      escalated: newlyEscalatedCount,
      alreadyEscalated: alreadyEscalatedCount,
      failed: failedCount,
    };
  }

  /**
   * Identifies cases in DUE_SOON status and generates operational notifications (fail-safe).
   */
  static async processDueSoonNotifications(
    actorUserId?: string,
    facilityIdScope?: string
  ): Promise<number> {
    const now = new Date();
    const filter: Record<string, unknown> = {
      isDeleted: false,
      escalatedAt: null,
      slaDueAt: { $gt: now },
      assignedReviewerId: { $ne: null },
    };

    if (facilityIdScope) {
      filter.facilityId = facilityIdScope;
    }

    const candidateCases = await Case.find(filter).select(
      '_id caseNumber slaDueAt createdAt priority assignedReviewerId facilityId'
    );
    let dueSoonNotifiedCount = 0;

    for (const c of candidateCases) {
      try {
        const status = this.deriveSlaStatus(c, now);
        if (status === SlaStatus.DUE_SOON && c.assignedReviewerId) {
          await NotificationService.triggerSlaDueSoonNotification(
            c._id.toString(),
            c.caseNumber,
            c.assignedReviewerId.toString(),
            c.facilityId
          );
          dueSoonNotifiedCount++;
        }
      } catch {
        // Fail-safe: ignore notification error so caller workflow is never affected
      }
    }

    return dueSoonNotifiedCount;
  }
}
