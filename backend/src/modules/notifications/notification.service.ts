import mongoose from 'mongoose';
import { Notification } from './notification.model.js';
import {
  CreateNotificationInput,
  NotificationQuery,
  PaginatedNotificationsResponse,
  INotification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from './notification.types.js';
import { NotificationProviderFactory } from './notification.providers.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { UserRole } from '../users/user.types.js';
import { User } from '../users/user.model.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../middleware/error-handler.js';

export class NotificationService {
  /**
   * Creates and dispatches an operational notification.
   * Guaranteed to be non-blocking and fail-safe: will not throw errors to caller if provider fails.
   */
  static async createNotification(
    input: CreateNotificationInput,
    requestId?: string
  ): Promise<INotification | null> {
    try {
      const channel = input.channel || NotificationChannel.IN_APP;
      const userObjectId =
        typeof input.userId === 'string'
          ? new mongoose.Types.ObjectId(input.userId)
          : input.userId;
      const caseObjectId = input.caseId
        ? typeof input.caseId === 'string'
          ? new mongoose.Types.ObjectId(input.caseId)
          : input.caseId
        : undefined;

      const idempotencyKey =
        input.idempotencyKey ||
        `${caseObjectId ? caseObjectId.toString() : 'sys'}:${input.type}:${userObjectId.toString()}:${Date.now()}`;

      // Idempotency check: if key already exists, return existing record
      const existing = await Notification.findOne({ idempotencyKey });
      if (existing) {
        logger.info(
          { idempotencyKey, notificationId: existing._id.toString() },
          '[NotificationService] Duplicate notification suppressed by idempotency key'
        );
        return existing.toObject();
      }

      // Create notification record in PENDING status
      const notification = new Notification({
        userId: userObjectId,
        facilityId: input.facilityId || null,
        caseId: caseObjectId || null,
        type: input.type,
        channel,
        title: input.title,
        body: input.body,
        status: NotificationStatus.PENDING,
        idempotencyKey,
        metadata: input.metadata || {},
      });

      await notification.save();

      // Dispatch to channel provider
      const provider = NotificationProviderFactory.getProvider(channel);
      let providerResult;
      try {
        providerResult = await provider.send(notification);
      } catch (providerErr) {
        logger.error(
          { err: providerErr, notificationId: notification._id.toString() },
          '[NotificationService] Provider dispatch error'
        );
        providerResult = {
          success: false,
          provider: 'UNKNOWN',
          error: (providerErr as Error).message,
        };
      }

      if (providerResult.success) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
        notification.provider = providerResult.provider;
        notification.providerMessageId = providerResult.providerMessageId || undefined;
      } else {
        notification.status = NotificationStatus.FAILED;
        notification.provider = providerResult.provider;
      }

      await notification.save();

      // Operational Audit Log (best-effort)
      try {
        const audit = new AuditLog({
          actorId: 'SYSTEM',
          actorRole: 'SYSTEM',
          action: AuditEventType.NOTIFICATION_CREATED,
          resourceType: 'Notification',
          resourceId: notification._id.toString(),
          caseId: caseObjectId || null,
          requestId: requestId || null,
          timestamp: new Date(),
          source: 'NOTIFICATION_SERVICE',
          outcome: providerResult.success ? 'SUCCESS' : 'FAILURE',
          metadata: {
            recipientUserId: userObjectId.toString(),
            type: notification.type,
            channel: notification.channel,
            status: notification.status,
          },
        });
        await audit.save();
      } catch (auditErr) {
        logger.warn({ err: auditErr }, '[NotificationService] Audit logging failed');
      }

      return notification.toObject();
    } catch (err) {
      logger.error({ err, input }, '[NotificationService] Failed to create notification safely');
      return null;
    }
  }

  /**
   * Retrieves paginated notifications for a given user.
   */
  static async getNotifications(
    userId: string,
    query: NotificationQuery
  ): Promise<PaginatedNotificationsResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: Record<string, unknown> = { userId: userObjectId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const [total, unreadCount, docs] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({
        userId: userObjectId,
        status: { $in: [NotificationStatus.SENT, NotificationStatus.PENDING] },
      }),
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const notifications = docs.map((doc) => ({
      ...doc.toObject(),
      id: doc._id.toString(),
    }));

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      unreadCount,
    };
  }

  /**
   * Returns count of unread notifications for a user.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Notification.countDocuments({
      userId: userObjectId,
      status: { $in: [NotificationStatus.SENT, NotificationStatus.PENDING] },
    });
  }

  /**
   * Marks a single notification as read by its recipient.
   */
  static async markAsRead(
    userId: string,
    notificationId: string,
    requestId?: string
  ): Promise<INotification> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      const error: AppError = new Error('Invalid notification ID format');
      error.statusCode = 400;
      error.code = 'INVALID_NOTIFICATION_ID';
      throw error;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: userObjectId,
    });

    if (!notification) {
      const error: AppError = new Error('Notification not found or access forbidden');
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    await notification.save();

    // Audit logging
    try {
      const user = await User.findById(userId);
      const audit = new AuditLog({
        actorId: userId,
        actorRole: user?.role || UserRole.NURSE,
        action: AuditEventType.NOTIFICATION_READ,
        resourceType: 'Notification',
        resourceId: notification._id.toString(),
        caseId: notification.caseId || null,
        requestId: requestId || null,
        timestamp: new Date(),
        source: 'NOTIFICATION_SERVICE',
        outcome: 'SUCCESS',
      });
      await audit.save();
    } catch (auditErr) {
      logger.warn({ err: auditErr }, '[NotificationService] Audit log for markAsRead failed');
    }

    return notification.toObject();
  }

  /**
   * Marks all unread notifications as read for a user.
   */
  static async markAllAsRead(
    userId: string,
    requestId?: string
  ): Promise<{ modifiedCount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();

    const result = await Notification.updateMany(
      {
        userId: userObjectId,
        status: { $in: [NotificationStatus.SENT, NotificationStatus.PENDING] },
      },
      {
        $set: {
          status: NotificationStatus.READ,
          readAt: now,
        },
      }
    );

    // Audit logging
    try {
      const user = await User.findById(userId);
      const audit = new AuditLog({
        actorId: userId,
        actorRole: user?.role || UserRole.NURSE,
        action: AuditEventType.NOTIFICATION_READ_ALL,
        resourceType: 'Notification',
        resourceId: userId,
        requestId: requestId || null,
        timestamp: new Date(),
        source: 'NOTIFICATION_SERVICE',
        outcome: 'SUCCESS',
        metadata: {
          modifiedCount: result.modifiedCount,
        },
      });
      await audit.save();
    } catch (auditErr) {
      logger.warn({ err: auditErr }, '[NotificationService] Audit log for markAllAsRead failed');
    }

    return { modifiedCount: result.modifiedCount };
  }

  // --- Workflow Trigger Notification Helpers ---

  static async triggerAssignmentNotification(
    caseId: string,
    caseNumber: string,
    assignedReviewerId: string,
    facilityId?: string
  ): Promise<void> {
    await this.createNotification({
      userId: assignedReviewerId,
      facilityId,
      caseId,
      type: NotificationType.CASE_ASSIGNED,
      title: `Case ${caseNumber} Assigned`,
      body: `Case ${caseNumber} has been assigned to you for review.`,
      idempotencyKey: `${caseId}:CASE_ASSIGNED:${assignedReviewerId}`,
      metadata: { caseNumber },
    });
  }

  static async triggerEscalationNotification(
    caseId: string,
    caseNumber: string,
    targetUserId: string,
    escalationLevel: number,
    facilityId?: string
  ): Promise<void> {
    await this.createNotification({
      userId: targetUserId,
      facilityId,
      caseId,
      type: NotificationType.CASE_ESCALATED,
      title: `Case ${caseNumber} Escalated (Level ${escalationLevel})`,
      body: `Case ${caseNumber} has been escalated and requires immediate attention.`,
      idempotencyKey: `${caseId}:CASE_ESCALATED:${targetUserId}:${escalationLevel}`,
      metadata: { caseNumber, escalationLevel },
    });
  }

  static async triggerSlaDueSoonNotification(
    caseId: string,
    caseNumber: string,
    reviewerId: string,
    facilityId?: string
  ): Promise<void> {
    await this.createNotification({
      userId: reviewerId,
      facilityId,
      caseId,
      type: NotificationType.CASE_SLA_DUE_SOON,
      title: `SLA Due Soon: Case ${caseNumber}`,
      body: `Case ${caseNumber} SLA target deadline is approaching soon.`,
      idempotencyKey: `${caseId}:CASE_SLA_DUE_SOON:${reviewerId}`,
      metadata: { caseNumber },
    });
  }

  static async triggerSlaOverdueNotification(
    caseId: string,
    caseNumber: string,
    reviewerId: string,
    facilityId?: string
  ): Promise<void> {
    await this.createNotification({
      userId: reviewerId,
      facilityId,
      caseId,
      type: NotificationType.CASE_SLA_OVERDUE,
      title: `SLA Overdue: Case ${caseNumber}`,
      body: `Case ${caseNumber} has exceeded its SLA target deadline.`,
      idempotencyKey: `${caseId}:CASE_SLA_OVERDUE:${reviewerId}`,
      metadata: { caseNumber },
    });
  }

  static async triggerReferralNotification(
    caseId: string,
    caseNumber: string,
    targetUserId: string,
    type:
      | NotificationType.CASE_REFERRED
      | NotificationType.REFERRAL_ACCEPTED
      | NotificationType.REFERRAL_REJECTED
      | NotificationType.REFERRAL_COMPLETED,
    referralId: string,
    facilityId?: string,
    details?: string
  ): Promise<void> {
    let title = `Referral Update: Case ${caseNumber}`;
    let body = `Case ${caseNumber} referral status updated.`;

    if (type === NotificationType.CASE_REFERRED) {
      title = `New Incoming Referral: Case ${caseNumber}`;
      body = `Case ${caseNumber} has been referred to your facility/department.`;
    } else if (type === NotificationType.REFERRAL_ACCEPTED) {
      title = `Referral Accepted: Case ${caseNumber}`;
      body = `Referral for case ${caseNumber} has been accepted by destination facility.`;
    } else if (type === NotificationType.REFERRAL_REJECTED) {
      title = `Referral Rejected: Case ${caseNumber}`;
      body = `Referral for case ${caseNumber} has been declined: ${details || 'No reason provided'}.`;
    } else if (type === NotificationType.REFERRAL_COMPLETED) {
      title = `Referral Completed: Case ${caseNumber}`;
      body = `Referral for case ${caseNumber} has been completed.`;
    }

    await this.createNotification({
      userId: targetUserId,
      facilityId,
      caseId,
      type,
      title,
      body,
      idempotencyKey: `${caseId}:${type}:${targetUserId}:${referralId}`,
      metadata: { caseNumber, referralId },
    });
  }

  static async triggerMoreInfoRequestedNotification(
    caseId: string,
    caseNumber: string,
    targetUserId: string,
    facilityId?: string
  ): Promise<void> {
    await this.createNotification({
      userId: targetUserId,
      facilityId,
      caseId,
      type: NotificationType.REVIEW_MORE_INFO_REQUESTED,
      title: `Additional Information Requested: Case ${caseNumber}`,
      body: `Additional clinical or intake information has been requested for case ${caseNumber}.`,
      idempotencyKey: `${caseId}:REVIEW_MORE_INFO_REQUESTED:${targetUserId}:${Date.now()}`,
      metadata: { caseNumber },
    });
  }
}
