import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import { Notification } from '../src/modules/notifications/notification.model.js';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../src/modules/notifications/notification.types.js';
import { NotificationService } from '../src/modules/notifications/notification.service.js';
import {
  NotificationProviderFactory,
  InAppNotificationProvider,
  MockEmailNotificationProvider,
  MockSmsNotificationProvider,
} from '../src/modules/notifications/notification.providers.js';
import { Case } from '../src/modules/cases/case.model.js';
import { CasePriority, CaseStatus } from '../src/modules/cases/case.types.js';
import { SlaService } from '../src/modules/sla/sla.service.js';
import { SlaStatus } from '../src/modules/sla/sla.types.js';

const app = createApp();

describe('Phase 19 — Notification Subsystem Test Suite', () => {
  let userAId: string;
  let userBId: string;
  let userAToken: string;
  let userBToken: string;
  const facilityId = 'DH-CUTTACK';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    await Notification.deleteMany({});
    await User.deleteMany({ email: { $in: ['notif.userA@example.com', 'notif.userB@example.com'] } });

    const userA = await User.create({
      name: 'Dr. Alok Mohanty',
      email: 'notif.userA@example.com',
      role: UserRole.DOCTOR,
      facilityId,
      isActive: true,
      isDeleted: false,
    });
    userAId = userA._id.toString();
    userAToken = jwt.sign({ id: userAId, role: UserRole.DOCTOR }, env.JWT_SECRET);

    const userB = await User.create({
      name: 'Nurse Sunita Das',
      email: 'notif.userB@example.com',
      role: UserRole.NURSE,
      facilityId,
      isActive: true,
      isDeleted: false,
    });
    userBId = userB._id.toString();
    userBToken = jwt.sign({ id: userBId, role: UserRole.NURSE }, env.JWT_SECRET);
  });

  describe('Provider Abstraction & Mock Providers', () => {
    it('should retrieve registered providers for IN_APP, EMAIL, SMS', () => {
      const inApp = NotificationProviderFactory.getProvider(NotificationChannel.IN_APP);
      const email = NotificationProviderFactory.getProvider(NotificationChannel.EMAIL);
      const sms = NotificationProviderFactory.getProvider(NotificationChannel.SMS);

      expect(inApp).toBeInstanceOf(InAppNotificationProvider);
      expect(email).toBeInstanceOf(MockEmailNotificationProvider);
      expect(sms).toBeInstanceOf(MockSmsNotificationProvider);
    });

    it('should send simulated email without error', async () => {
      const emailProvider = new MockEmailNotificationProvider();
      const dummyNotification = {
        userId: new mongoose.Types.ObjectId(userAId),
        type: NotificationType.CASE_ASSIGNED,
        channel: NotificationChannel.EMAIL,
        title: 'New Case Assigned',
        body: 'Case #101 assigned to you',
        status: NotificationStatus.PENDING,
      };

      const result = await emailProvider.send(dummyNotification as any);
      expect(result.success).toBe(true);
      expect(result.provider).toBe('MOCK_EMAIL_SERVICE');
      expect(result.providerMessageId).toBeDefined();
    });

    it('should send simulated SMS without error', async () => {
      const smsProvider = new MockSmsNotificationProvider();
      const dummyNotification = {
        userId: new mongoose.Types.ObjectId(userAId),
        type: NotificationType.CASE_SLA_OVERDUE,
        channel: NotificationChannel.SMS,
        title: 'SLA Overdue Alert',
        body: 'Case #101 has exceeded SLA target',
        status: NotificationStatus.PENDING,
      };

      const result = await smsProvider.send(dummyNotification as any);
      expect(result.success).toBe(true);
      expect(result.provider).toBe('MOCK_SMS_GATEWAY');
      expect(result.providerMessageId).toBeDefined();
    });
  });

  describe('Notification Creation & Idempotency', () => {
    it('should create and store an operational notification', async () => {
      const notif = await NotificationService.createNotification({
        userId: userAId,
        facilityId,
        type: NotificationType.CASE_ASSIGNED,
        title: 'Case #9001 Assigned',
        body: 'Case #9001 has been assigned to you for review.',
        idempotencyKey: `case-9001:CASE_ASSIGNED:${userAId}`,
      });

      expect(notif).toBeDefined();
      expect(notif?.userId.toString()).toBe(userAId);
      expect(notif?.status).toBe(NotificationStatus.SENT);
      expect(notif?.type).toBe(NotificationType.CASE_ASSIGNED);
    });

    it('should prevent duplicate notifications with same idempotency key', async () => {
      const key = `case-9002:CASE_ASSIGNED:${userAId}`;

      const notif1 = await NotificationService.createNotification({
        userId: userAId,
        facilityId,
        type: NotificationType.CASE_ASSIGNED,
        title: 'Case #9002 Assigned',
        body: 'First submission',
        idempotencyKey: key,
      });

      const notif2 = await NotificationService.createNotification({
        userId: userAId,
        facilityId,
        type: NotificationType.CASE_ASSIGNED,
        title: 'Case #9002 Assigned - Duplicate',
        body: 'Duplicate attempt',
        idempotencyKey: key,
      });

      expect(notif1?._id.toString()).toBe(notif2?._id.toString());
      const count = await Notification.countDocuments({ idempotencyKey: key });
      expect(count).toBe(1);
    });

    it('should remain fail-safe and not throw even if invalid user or provider throws', async () => {
      const result = await NotificationService.createNotification({
        userId: 'invalid-user-id',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Notice',
        body: 'Notice body',
      });

      // Does not throw an uncaught exception
      expect(result).toBeNull();
    });
  });

  describe('Notification Retrieval & Inbox APIs', () => {
    beforeAll(async () => {
      // Seed notifications for User A and User B
      await NotificationService.createNotification({
        userId: userAId,
        facilityId,
        type: NotificationType.CASE_ESCALATED,
        title: 'Case #9003 Escalated',
        body: 'Case #9003 has been escalated to senior review.',
        idempotencyKey: `test:case-9003:${userAId}`,
      });

      await NotificationService.createNotification({
        userId: userBId,
        facilityId,
        type: NotificationType.CASE_ASSIGNED,
        title: 'Case #9004 Assigned',
        body: 'Case #9004 has been assigned to you.',
        idempotencyKey: `test:case-9004:${userBId}`,
      });
    });

    it('GET /api/notifications/unread-count should return unread count for current user', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThan(0);
    });

    it('GET /api/notifications should isolate notifications to current user', async () => {
      const resA = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);
      expect(Array.isArray(resA.body.data)).toBe(true);
      expect(resA.body.data.every((n: any) => n.userId.toString() === userAId)).toBe(true);

      const resB = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.every((n: any) => n.userId.toString() === userBId)).toBe(true);
    });

    it('POST /api/notifications/:id/read should mark notification as READ', async () => {
      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userAToken}`);

      const notifId = listRes.body.data[0].id;

      const readRes = await request(app)
        .post(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.success).toBe(true);
      expect(readRes.body.data.status).toBe(NotificationStatus.READ);
      expect(readRes.body.data.readAt).toBeDefined();
    });

    it('should deny marking another user notification as read', async () => {
      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userBToken}`);

      const userBNotifId = listRes.body.data[0].id;

      // User A tries to mark User B's notification as read
      const readRes = await request(app)
        .post(`/api/notifications/${userBNotifId}/read`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(readRes.status).toBe(404);
      expect(readRes.body.success).toBe(false);
    });

    it('POST /api/notifications/read-all should mark all unread notifications as read', async () => {
      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });

  describe('SLA DUE_SOON Notification & Resilience Integration', () => {
    let dueSoonCaseId: string;
    let normalCaseId: string;
    const testReviewerId = new mongoose.Types.ObjectId();

    beforeAll(async () => {
      await Case.deleteMany({ caseNumber: { $in: ['CASE-SLA-DUE-1', 'CASE-SLA-NORM-1'] } });

      const now = Date.now();
      // Total duration for URGENT = 1 hour (3600000ms). DUE_SOON triggers when remaining <= 25% (i.e. <= 15m remaining).
      // Created 50m ago, due in 10m: remaining is 10m / 60m = 16.7% <= 25% -> DUE_SOON.
      const dueSoonCase = await Case.create({
        caseNumber: 'CASE-SLA-DUE-1',
        patientId: new mongoose.Types.ObjectId(),
        facilityId,
        priority: CasePriority.URGENT,
        status: CaseStatus.IN_REVIEW,
        chiefComplaint: 'Patient with severe headache and fever',
        assignedReviewerId: testReviewerId,
        createdAt: new Date(now - 50 * 60 * 1000),
        slaDueAt: new Date(now + 10 * 60 * 1000),
        isDeleted: false,
      });
      dueSoonCaseId = dueSoonCase._id.toString();

      // Normal case: Created 5m ago, due in 55m -> remaining 55m / 60m = 91.7% -> WITHIN_SLA.
      const normalCase = await Case.create({
        caseNumber: 'CASE-SLA-NORM-1',
        patientId: new mongoose.Types.ObjectId(),
        facilityId,
        priority: CasePriority.URGENT,
        status: CaseStatus.IN_REVIEW,
        chiefComplaint: 'Patient routine follow-up',
        assignedReviewerId: testReviewerId,
        createdAt: new Date(now - 5 * 60 * 1000),
        slaDueAt: new Date(now + 55 * 60 * 1000),
        isDeleted: false,
      });
      normalCaseId = normalCase._id.toString();
    });

    afterAll(async () => {
      await Case.deleteMany({ caseNumber: { $in: ['CASE-SLA-DUE-1', 'CASE-SLA-NORM-1'] } });
      await Notification.deleteMany({ userId: testReviewerId });
    });

    it('1. DUE_SOON status produces CASE_SLA_DUE_SOON notification for assigned reviewer', async () => {
      const notifiedCount = await SlaService.processDueSoonNotifications(undefined, facilityId);
      expect(notifiedCount).toBeGreaterThanOrEqual(1);

      const dueNotification = await Notification.findOne({
        userId: testReviewerId,
        caseId: new mongoose.Types.ObjectId(dueSoonCaseId),
        type: NotificationType.CASE_SLA_DUE_SOON,
      });

      expect(dueNotification).toBeDefined();
      expect(dueNotification?.type).toBe(NotificationType.CASE_SLA_DUE_SOON);
      expect(dueNotification?.title).toContain('CASE-SLA-DUE-1');
      expect(dueNotification?.status).toBe(NotificationStatus.SENT);

      // Verify normal case did NOT produce a DUE_SOON notification
      const normalNotification = await Notification.findOne({
        caseId: new mongoose.Types.ObjectId(normalCaseId),
        type: NotificationType.CASE_SLA_DUE_SOON,
      });
      expect(normalNotification).toBeNull();
    });

    it('2. Repeated processing does not create duplicate notifications (preserves idempotency)', async () => {
      const beforeCount = await Notification.countDocuments({
        userId: testReviewerId,
        caseId: new mongoose.Types.ObjectId(dueSoonCaseId),
        type: NotificationType.CASE_SLA_DUE_SOON,
      });
      expect(beforeCount).toBe(1);

      // Re-run processing
      const notifiedCount2 = await SlaService.processDueSoonNotifications(undefined, facilityId);
      expect(notifiedCount2).toBe(1); // Detected 1 due-soon case, but idempotency prevents duplicate DB insert

      const afterCount = await Notification.countDocuments({
        userId: testReviewerId,
        caseId: new mongoose.Types.ObjectId(dueSoonCaseId),
        type: NotificationType.CASE_SLA_DUE_SOON,
      });
      expect(afterCount).toBe(1);
    });

    it('3. Notification failure does not break SLA processing (fail-safe resilience)', async () => {
      // Spy on NotificationService.triggerSlaDueSoonNotification to throw an error
      const spy = vi
        .spyOn(NotificationService, 'triggerSlaDueSoonNotification')
        .mockRejectedValueOnce(new Error('Notification infrastructure network failure'));

      // Process overdue/due-soon SLAs should complete smoothly without throwing
      const result = await SlaService.processOverdueSlas('SYSTEM');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('escalated');

      spy.mockRestore();
    });
  });
});
