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

describe('Phase 18 — Auditability Test Suite', () => {
  const FACILITY_A = 'FACILITY_ALPHA';
  const FACILITY_B = 'FACILITY_BETA';

  let patientId: string;
  let nurseId: string;
  let reviewerFacBId: string;
  let patientToken: string;
  let nurseToken: string;
  let reviewerFacBToken: string;
  let testCaseId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    await User.deleteMany({});
    await Case.deleteMany({});
    await AuditLog.deleteMany({});

    const patientUser = await User.create({
      name: 'Sunil Patient',
      email: 'sunil@example.com',
      passwordHash: 'hashed_pw',
      role: UserRole.PATIENT,
      facilityId: FACILITY_A,
    });
    patientId = patientUser._id.toString();

    const nurseUser = await User.create({
      name: 'Nurse Priya',
      email: 'priya.nurse@facilitya.gov.in',
      passwordHash: 'hashed_pw',
      role: UserRole.NURSE,
      facilityId: FACILITY_A,
    });
    nurseId = nurseUser._id.toString();

    const reviewerFacBUser = await User.create({
      name: 'Doctor Bob',
      email: 'bob.doctor@facilityb.gov.in',
      passwordHash: 'hashed_pw',
      role: UserRole.DOCTOR,
      facilityId: FACILITY_B,
    });
    reviewerFacBId = reviewerFacBUser._id.toString();

    patientToken = jwt.sign({ id: patientId, email: patientUser.email, role: patientUser.role, facilityId: FACILITY_A }, env.JWT_SECRET, { expiresIn: '1h' });
    nurseToken = jwt.sign({ id: nurseId, email: nurseUser.email, role: nurseUser.role, facilityId: FACILITY_A }, env.JWT_SECRET, { expiresIn: '1h' });
    reviewerFacBToken = jwt.sign({ id: reviewerFacBId, email: reviewerFacBUser.email, role: reviewerFacBUser.role, facilityId: FACILITY_B }, env.JWT_SECRET, { expiresIn: '1h' });

    const testCase = await Case.create({
      caseNumber: 'CASE-AUDIT-001',
      patientId: new mongoose.Types.ObjectId(patientId),
      facilityId: FACILITY_A,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Audit trail verification complaint',
    });
    testCaseId = testCase._id.toString();

    // Create seed audit entry
    await AuditLog.create({
      actorId: nurseId,
      actorRole: UserRole.NURSE,
      action: AuditEventType.CASE_CREATED,
      resourceType: 'Case',
      resourceId: testCaseId,
      caseId: testCase._id,
      timestamp: new Date(),
      source: 'TEST_SUITE',
      outcome: 'SUCCESS',
      metadata: { note: 'Initial intake created' },
    });
  });

  describe('1. Audit Trail Endpoint Access Controls', () => {
    it('allows authorized nurse to retrieve sanitized audit trail for a case', async () => {
      const res = await request(app)
        .get(`/api/cases/${testCaseId}/audit-trail`)
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].action).toBe(AuditEventType.CASE_CREATED);
      expect(res.body.data[0].actorName).toBe('Nurse Priya');

      // Verify AUDIT_LOG_VIEWED event emitted
      const viewLog = await AuditLog.findOne({ action: AuditEventType.AUDIT_LOG_VIEWED });
      expect(viewLog).not.toBeNull();
    });

    it('blocks patient role access with 403', async () => {
      const res = await request(app)
        .get(`/api/cases/${testCaseId}/audit-trail`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });

    it('enforces facility isolation with 403 for reviewer from another facility', async () => {
      const res = await request(app)
        .get(`/api/cases/${testCaseId}/audit-trail`)
        .set('Authorization', `Bearer ${reviewerFacBToken}`);

      expect(res.status).toBe(403);
    });
  });
});
