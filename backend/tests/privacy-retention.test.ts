import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import { Case } from '../src/modules/cases/case.model.js';
import { CaseStatus, CasePriority, IntakeSource } from '../src/modules/cases/case.types.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { AuditEventType } from '../src/modules/audit/audit-log.types.js';

const app = createApp();

describe('Phase 18 — Privacy & Retention Test Suite', () => {
  let adminId: string;
  let nurseId: string;
  let adminToken: string;
  let nurseToken: string;
  let testCaseId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    await User.deleteMany({});
    await Case.deleteMany({});
    await AuditLog.deleteMany({});

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@triage.gov.in',
      passwordHash: 'hashed_pw',
      role: UserRole.ADMIN,
      facilityId: 'GOVERNMENT_HOSPITAL',
    });
    adminId = adminUser._id.toString();

    const nurseUser = await User.create({
      name: 'Nurse Anita',
      email: 'anita@phc.gov.in',
      passwordHash: 'hashed_pw',
      role: UserRole.NURSE,
      facilityId: 'GOVERNMENT_HOSPITAL',
    });
    nurseId = nurseUser._id.toString();

    adminToken = jwt.sign({ id: adminId, email: adminUser.email, role: adminUser.role, facilityId: 'GOVERNMENT_HOSPITAL' }, env.JWT_SECRET, { expiresIn: '1h' });
    nurseToken = jwt.sign({ id: nurseId, email: nurseUser.email, role: nurseUser.role, facilityId: 'GOVERNMENT_HOSPITAL' }, env.JWT_SECRET, { expiresIn: '1h' });

    const testCase = await Case.create({
      caseNumber: 'CASE-PURGE-001',
      patientId: new mongoose.Types.ObjectId(),
      facilityId: 'GOVERNMENT_HOSPITAL',
      status: CaseStatus.RESOLVED,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Resolved mild fever',
      updatedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days old
    });
    testCaseId = testCase._id.toString();
  });

  describe('1. Retention Status & Non-Authoritative Disclaimer', () => {
    it('returns system retention status with explicit non-authoritative engineering disclaimer', async () => {
      const res = await request(app)
        .get('/api/admin/retention/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.disclaimer).toContain('These retention durations are engineering defaults');
      expect(res.body.data.eligiblePurgeCount).toBeGreaterThan(0);
    });

    it('blocks non-admin nurse from viewing retention status with 403', async () => {
      const res = await request(app)
        .get('/api/admin/retention/status')
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Administrative Purge Execution', () => {
    it('executes dry-run purge without deleting database documents', async () => {
      const res = await request(app)
        .post('/api/admin/retention/purge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dryRun: true });

      expect(res.status).toBe(200);
      expect(res.body.data.dryRun).toBe(true);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.isDeleted).toBe(false);
    });

    it('executes administrative data purge on resolved case, soft-deleting case and emitting DATA_PURGE_EXECUTED audit event', async () => {
      const res = await request(app)
        .post('/api/admin/retention/purge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ caseId: testCaseId, dryRun: false });

      expect(res.status).toBe(200);
      expect(res.body.data.purgedCases).toBe(1);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.isDeleted).toBe(true);

      const auditLog = await AuditLog.findOne({ action: AuditEventType.DATA_PURGE_EXECUTED });
      expect(auditLog).not.toBeNull();
      expect(auditLog?.metadata?.disclaimer).toContain('engineering defaults');
    });

    it('allows admin to retry failed purges safely', async () => {
      const res = await request(app)
        .post('/api/admin/retention/retry-failed-purges')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
