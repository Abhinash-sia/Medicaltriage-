import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import { Case } from '../src/modules/cases/case.model.js';
import { CasePriority, IntakeSource, CaseStatus } from '../src/modules/cases/case.types.js';
import { Symptom } from '../src/modules/symptoms/symptom.model.js';
import { Review } from '../src/modules/reviews/review.model.js';
import { ReviewStatus } from '../src/modules/reviews/review.types.js';
import { SafetyEvaluation } from '../src/modules/safety/safety-evaluation.model.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { AuditEventType } from '../src/modules/audit/audit-log.types.js';
import { SignalCategory, SourceType } from '../src/modules/safety/safety.types.js';

describe('Phase 17 — Human Review & Escalation Test Suite', () => {
  const app = createApp();

  let patientToken: string;
  let nurseToken: string;
  let doctorToken: string;
  let reviewerFacBToken: string;

  let patientId: string;
  let nurseId: string;
  let doctorId: string;
  let reviewerFacBId: string;

  let testCaseId: string;

  const FACILITY_A = 'FACILITY_ALPHA';
  const FACILITY_B = 'FACILITY_BETA';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Case.deleteMany({});
    await Symptom.deleteMany({});
    await Review.deleteMany({});
    await SafetyEvaluation.deleteMany({});
    await AuditLog.deleteMany({});

    // Create test Users
    const patientUser = await User.create({
      name: 'John Patient',
      email: 'john.patient@example.com',
      passwordHash: 'hashed_pw',
      role: UserRole.PATIENT,
      facilityId: FACILITY_A,
    });
    patientId = patientUser._id.toString();

    const nurseUser = await User.create({
      name: 'Nurse Sarah',
      email: 'sarah.nurse@example.com',
      passwordHash: 'hashed_pw',
      role: UserRole.NURSE,
      facilityId: FACILITY_A,
    });
    nurseId = nurseUser._id.toString();

    const doctorUser = await User.create({
      name: 'Doctor Alice',
      email: 'alice.doctor@example.com',
      passwordHash: 'hashed_pw',
      role: UserRole.DOCTOR,
      facilityId: FACILITY_A,
    });
    doctorId = doctorUser._id.toString();

    const reviewerFacBUser = await User.create({
      name: 'Doctor Bob',
      email: 'bob.doctor@example.com',
      passwordHash: 'hashed_pw',
      role: UserRole.DOCTOR,
      facilityId: FACILITY_B,
    });
    reviewerFacBId = reviewerFacBUser._id.toString();

    // Create JWT tokens
    patientToken = jwt.sign(
      { id: patientId, email: patientUser.email, role: patientUser.role, facilityId: FACILITY_A },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    nurseToken = jwt.sign(
      { id: nurseId, email: nurseUser.email, role: nurseUser.role, facilityId: FACILITY_A },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    doctorToken = jwt.sign(
      { id: doctorId, email: doctorUser.email, role: doctorUser.role, facilityId: FACILITY_A },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    reviewerFacBToken = jwt.sign(
      { id: reviewerFacBId, email: reviewerFacBUser.email, role: reviewerFacBUser.role, facilityId: FACILITY_B },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create initial test Case
    const testCase = await Case.create({
      caseNumber: 'CASE-P17-0001',
      patientId: new mongoose.Types.ObjectId(patientId),
      facilityId: FACILITY_A,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Mild headache and persistent fever',
      slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h ROUTINE SLA
      currentSafetyVersion: 1,
    });
    testCaseId = testCase._id.toString();

    // Create active Safety Evaluation
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

  describe('1. Review Decisions & State Transitions', () => {
    it('submits a COMPLETED review decision and marks case RESOLVED', async () => {
      // First claim case
      await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/claim`)
        .set('Authorization', `Bearer ${nurseToken}`);

      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          reviewStatus: ReviewStatus.COMPLETED,
          reviewerNotes: 'Clinical review completed. Patient advised on symptom management.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.caseStatus).toBe(CaseStatus.RESOLVED);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.status).toBe(CaseStatus.RESOLVED);

      const auditLogs = await AuditLog.find({ action: AuditEventType.CASE_RESOLVED_BY_REVIEWER });
      expect(auditLogs.length).toBe(1);
    });

    it('submits ADDITIONAL_INFO_REQUESTED decision and keeps case IN_REVIEW', async () => {
      await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/claim`)
        .set('Authorization', `Bearer ${nurseToken}`);

      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          reviewStatus: ReviewStatus.ADDITIONAL_INFO_REQUESTED,
          reviewerNotes: 'Requested additional details regarding fever duration and onset.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.caseStatus).toBe(CaseStatus.IN_REVIEW);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.status).toBe(CaseStatus.IN_REVIEW);
    });
  });

  describe('2. Escalation & Handoff Semantics', () => {
    it('escalates case to target doctor and preserves existing slaDueAt unchanged', async () => {
      const caseBefore = await Case.findById(testCaseId);
      const originalSlaDueAt = caseBefore?.slaDueAt?.getTime();

      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          reviewStatus: ReviewStatus.ESCALATED,
          reviewerNotes: 'Escalating case to attending physician due to recurring symptoms.',
          targetUserId: doctorId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.caseStatus).toBe(CaseStatus.ESCALATED);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.status).toBe(CaseStatus.ESCALATED);
      expect(caseAfter?.assignedReviewerId?.toString()).toBe(doctorId);
      expect(caseAfter?.escalatedAt).not.toBeNull();
      expect(caseAfter?.slaDueAt?.getTime()).toBe(originalSlaDueAt); // SLA preserved 100%

      const auditLogs = await AuditLog.find({ action: AuditEventType.CASE_ESCALATED_BY_REVIEWER });
      expect(auditLogs.length).toBe(1);
    });

    it('escalates case to unassigned escalation queue when targetUserId is omitted', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          reviewStatus: ReviewStatus.ESCALATED,
          reviewerNotes: 'Escalating case to general escalation queue.',
        });

      expect(res.status).toBe(201);
      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.status).toBe(CaseStatus.ESCALATED);
      expect(caseAfter?.assignedReviewerId).toBeNull();
    });
  });

  describe('3. Human Priority Override', () => {
    it('allows elevation to URGENT, recalculates SLA, and preserves calculated priority', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/priority-override`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          overridePriority: CasePriority.URGENT,
          reason: 'Patient reported sudden severe onset of neurological symptoms.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.priority).toBe(CasePriority.URGENT);

      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.priority).toBe(CasePriority.URGENT);
      expect(caseAfter?.priorityOverride).toBe(CasePriority.URGENT);
      expect(caseAfter?.priorityOverrideReason).toBe('Patient reported sudden severe onset of neurological symptoms.');

      // Check SLA due time recalculated for URGENT (1 hour = 3600000ms)
      const expectedSlaTime = caseAfter!.createdAt!.getTime() + 3600000;
      expect(caseAfter?.slaDueAt?.getTime()).toBe(expectedSlaTime);

      // Verify SafetyEvaluation preserved calculatedPriority = ROUTINE while effectivePriority = URGENT
      const activeSafety = await SafetyEvaluation.findOne({ caseId: testCaseId, status: 'ACTIVE' });
      expect(activeSafety?.calculatedPriority).toBe(CasePriority.ROUTINE);
      expect(activeSafety?.effectivePriority).toBe(CasePriority.URGENT);
    });

    it('blocks priority demotion for NURSE role with 403 and allows it for DOCTOR role', async () => {
      // First elevate to URGENT
      await Case.updateOne({ _id: testCaseId }, { priority: CasePriority.URGENT, priorityOverride: CasePriority.URGENT });

      // Attempt demotion as Nurse
      const nurseRes = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/priority-override`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          overridePriority: CasePriority.ROUTINE,
          reason: 'Symptoms subsided.',
        });

      expect(nurseRes.status).toBe(403);

      // Attempt demotion as Doctor
      const docRes = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/priority-override`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          overridePriority: CasePriority.ROUTINE,
          reason: 'Doctor evaluation confirmed mild non-urgent headache.',
        });

      expect(docRes.status).toBe(200);
      expect(docRes.body.data.priority).toBe(CasePriority.ROUTINE);
    });
  });

  describe('4. Review History Retrieval', () => {
    it('returns full chronological review history for a case', async () => {
      await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          reviewStatus: ReviewStatus.ADDITIONAL_INFO_REQUESTED,
          reviewerNotes: 'Note 1: Requested info',
        });

      await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          reviewStatus: ReviewStatus.COMPLETED,
          reviewerNotes: 'Note 2: Final resolution',
        });

      const res = await request(app)
        .get(`/api/reviewer/cases/${testCaseId}/reviews`)
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].reviewerNotes).toBe('Note 2: Final resolution');
    });
  });

  describe('5. Security & Isolation Controls', () => {
    it('blocks patient access with 403', async () => {
      const res = await request(app)
        .get(`/api/reviewer/cases/${testCaseId}/reviews`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });

    it('enforces facility isolation with 403 for reviewer from another facility', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/review`)
        .set('Authorization', `Bearer ${reviewerFacBToken}`)
        .send({
          reviewStatus: ReviewStatus.COMPLETED,
          reviewerNotes: 'Cross-facility review attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Unauthorized access to case from another facility');
    });
  });
});
