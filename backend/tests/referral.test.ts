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
import { SafetyEvaluation } from '../src/modules/safety/safety-evaluation.model.js';
import { Referral } from '../src/modules/referrals/referral.model.js';
import { ReferralStatus } from '../src/modules/referrals/referral.types.js';
import { ReviewStatus } from '../src/modules/reviews/review.types.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { AuditEventType } from '../src/modules/audit/audit-log.types.js';

const app = createApp();

describe('Phase 18 — Referral Workflow Test Suite', () => {
  const FACILITY_A = 'FACILITY_ALPHA';
  const FACILITY_B = 'FACILITY_BETA';

  let patientId: string;
  let nurseId: string;
  let doctorFacBId: string;
  let patientToken: string;
  let nurseToken: string;
  let doctorFacBToken: string;
  let testCaseId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Clean collections
    await User.deleteMany({});
    await Case.deleteMany({});
    await SafetyEvaluation.deleteMany({});
    await Referral.deleteMany({});
    await AuditLog.deleteMany({});

    // Create Patient
    const patientUser = await User.create({
      name: 'Ramesh Patient',
      email: 'ramesh@example.com',
      passwordHash: 'hashed_pw',
      role: UserRole.PATIENT,
      facilityId: FACILITY_A,
    });
    patientId = patientUser._id.toString();

    // Create Nurse at Facility A
    const nurseUser = await User.create({
      name: 'Nurse Priya',
      email: 'priya.nurse@facilitya.gov.in',
      passwordHash: 'hashed_pw',
      role: UserRole.NURSE,
      facilityId: FACILITY_A,
    });
    nurseId = nurseUser._id.toString();

    // Create Doctor at Facility B (Destination Facility)
    const doctorFacBUser = await User.create({
      name: 'Dr. Suresh',
      email: 'suresh.doctor@facilityb.gov.in',
      passwordHash: 'hashed_pw',
      role: UserRole.DOCTOR,
      facilityId: FACILITY_B,
    });
    doctorFacBId = doctorFacBUser._id.toString();

    // Tokens
    patientToken = jwt.sign({ id: patientId, email: patientUser.email, role: patientUser.role, facilityId: FACILITY_A }, env.JWT_SECRET, { expiresIn: '1h' });
    nurseToken = jwt.sign({ id: nurseId, email: nurseUser.email, role: nurseUser.role, facilityId: FACILITY_A }, env.JWT_SECRET, { expiresIn: '1h' });
    doctorFacBToken = jwt.sign({ id: doctorFacBId, email: doctorFacBUser.email, role: doctorFacBUser.role, facilityId: FACILITY_B }, env.JWT_SECRET, { expiresIn: '1h' });

    // Create initial Case at Facility A
    const testCase = await Case.create({
      caseNumber: 'CASE-P18-0001',
      patientId: new mongoose.Types.ObjectId(patientId),
      facilityId: FACILITY_A,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Complex chest pain requiring cardiology consult',
      slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      currentSafetyVersion: 1,
    });
    testCaseId = testCase._id.toString();

    await SafetyEvaluation.create({
      caseId: testCase._id,
      evaluationVersion: 1,
      status: 'ACTIVE',
      calculatedPriority: CasePriority.ROUTINE,
      effectivePriority: CasePriority.ROUTINE,
      matchedSignals: [],
      hasHumanOverride: false,
      evaluatedBy: 'SYSTEM',
      evaluatedAt: new Date(),
    });
  });

  describe('1. Canonical Referral Creation Path', () => {
    it('submits a REFERRED review decision, creates Referral, updates Case.status to REFERRED, and resets assignedReviewerId', async () => {
      const caseBefore = await Case.findById(testCaseId);
      const originalSlaDueAt = caseBefore?.slaDueAt?.getTime();

      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          reviewStatus: ReviewStatus.REFERRED,
          reviewerNotes: 'Referring to tertiary care center for specialized cardiology evaluation.',
          referralFacilityId: FACILITY_B,
          destinationDepartment: 'Cardiology',
          referralReason: 'Specialized diagnostic procedures unavailable at PHC',
          referralSummary: 'Patient presents with atypical chest pain and elevated cardiovascular risk.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.caseStatus).toBe(CaseStatus.REFERRED);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.status).toBe(CaseStatus.REFERRED);
      expect(caseAfter?.assignedReviewerId).toBeNull();
      expect(caseAfter?.slaDueAt?.getTime()).toBe(originalSlaDueAt); // SLA preserved 100%

      const referral = await Referral.findOne({ caseId: testCaseId });
      expect(referral).not.toBeNull();
      expect(referral?.originatingFacilityId).toBe(FACILITY_A);
      expect(referral?.destinationFacilityId).toBe(FACILITY_B);
      expect(referral?.status).toBe(ReferralStatus.PENDING);

      const auditLog = await AuditLog.findOne({ action: AuditEventType.REFERRAL_INITIATED, caseId: testCaseId });
      expect(auditLog).not.toBeNull();
    });

    it('blocks patient access from creating referrals with 403', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reviewStatus: ReviewStatus.REFERRED,
          reviewerNotes: 'Attempting referral as patient',
          referralFacilityId: FACILITY_B,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Destination Facility Access & Incoming Queue', () => {
    it('allows destination facility doctor to view incoming referral queue', async () => {
      const res = await request(app)
        .get('/api/referrals/incoming')
        .set('Authorization', `Bearer ${doctorFacBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].destinationFacilityId).toBe(FACILITY_B);
    });

    it('grants destination facility doctor referral-bounded read access to referred case details', async () => {
      const res = await request(app)
        .get(`/api/reviewer/cases/${testCaseId}`)
        .set('Authorization', `Bearer ${doctorFacBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.caseNumber).toBe('CASE-P18-0001');
    });
  });

  describe('3. Referral Lifecycle Transitions & State Machine Enforcement', () => {
    it('allows destination doctor to ACCEPT referral, updating Case.status=REFERRED and assigning to doctor', async () => {
      const referral = await Referral.findOne({ caseId: testCaseId, status: ReferralStatus.PENDING });

      const res = await request(app)
        .patch(`/api/referrals/${referral!._id}/status`)
        .set('Authorization', `Bearer ${doctorFacBToken}`)
        .send({
          status: ReferralStatus.ACCEPTED,
          notes: 'Accepted for cardiology evaluation tomorrow morning.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ReferralStatus.ACCEPTED);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.status).toBe(CaseStatus.REFERRED);
      expect(caseAfter?.assignedReviewerId?.toString()).toBe(doctorFacBId);
    });

    it('blocks invalid transition ACCEPTED -> REJECTED with 400', async () => {
      const referral = await Referral.findOne({ caseId: testCaseId });

      const res = await request(app)
        .patch(`/api/referrals/${referral!._id}/status`)
        .set('Authorization', `Bearer ${doctorFacBToken}`)
        .send({
          status: ReferralStatus.REJECTED,
          notes: 'Invalid transition attempt',
        });

      expect(res.status).toBe(400);
    });

    it('allows destination doctor to COMPLETE referral, updating Case.status to CLOSED', async () => {
      const referral = await Referral.findOne({ caseId: testCaseId });

      const res = await request(app)
        .patch(`/api/referrals/${referral!._id}/status`)
        .set('Authorization', `Bearer ${doctorFacBToken}`)
        .send({
          status: ReferralStatus.COMPLETED,
          notes: 'Specialist consult completed. Patient admitted for observation.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ReferralStatus.COMPLETED);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.status).toBe(CaseStatus.CLOSED);
    });
  });
});
