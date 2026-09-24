import { Document, Types } from 'mongoose';

export enum NotificationType {
  CASE_ASSIGNED = 'CASE_ASSIGNED',
  CASE_ESCALATED = 'CASE_ESCALATED',
  CASE_SLA_DUE_SOON = 'CASE_SLA_DUE_SOON',
  CASE_SLA_OVERDUE = 'CASE_SLA_OVERDUE',
  CASE_REFERRED = 'CASE_REFERRED',
  REFERRAL_ACCEPTED = 'REFERRAL_ACCEPTED',
  REFERRAL_REJECTED = 'REFERRAL_REJECTED',
  REFERRAL_COMPLETED = 'REFERRAL_COMPLETED',
  REVIEW_MORE_INFO_REQUESTED = 'REVIEW_MORE_INFO_REQUESTED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

export interface INotification {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  facilityId?: string;
  caseId?: Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  status: NotificationStatus;
  readAt?: Date | null;
  sentAt?: Date | null;
  provider?: string;
  providerMessageId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationDocument extends INotification, Document {
  _id: Types.ObjectId;
}

export interface NotificationProviderResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
}

export interface INotificationProvider {
  channel: NotificationChannel;
  send(notification: INotification): Promise<NotificationProviderResult>;
}

export interface CreateNotificationInput {
  userId: string | Types.ObjectId;
  facilityId?: string;
  caseId?: string | Types.ObjectId;
  type: NotificationType;
  channel?: NotificationChannel;
  title: string;
  body: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
}

export interface PaginatedNotificationsResponse {
  notifications: Array<INotification & { id: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}
