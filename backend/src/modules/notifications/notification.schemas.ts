import { z } from 'zod';
import { NotificationType, NotificationChannel, NotificationStatus } from './notification.types.js';

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  facilityId: z.string().optional(),
  caseId: z.string().optional(),
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel).optional().default(NotificationChannel.IN_APP),
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required').max(1000),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.nativeEnum(NotificationStatus).optional(),
  type: z.nativeEnum(NotificationType).optional(),
});
