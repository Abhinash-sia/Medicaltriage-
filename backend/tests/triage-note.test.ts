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
import { Report } from '../src/modules/reports/report.model.js';
import { SafetyEvaluation } from '../src/modules/safety/safety-evaluation.model.js';
import { TriageNote } from '../src/modules/triage/triage-note.model.js';
import { TriageNoteService } from '../src/modules/triage/triage-note.service.js';
import { NoteProvenance, NoteStatus } from '../src/modules/triage/triage-note.types.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { AuditEventType } from '../src/modules/audit/audit-log.types.js';

import { SignalCategory, SourceType } from '../src/modules/safety/safety.types.js';

describe('Phase 16 — Structured Triage Note Test Suite', () => {
  const app = createApp();

  let patientToken: string;
  let reviewerToken: string;
  let reviewerFacBToken: string;

  let patientId: string;
  let reviewerId: string;
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
    await Report.deleteMany({});
    await SafetyEvaluation.deleteMany({});
    await TriageNote.deleteMany({});
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

    const reviewerUser = await User.create({
      name: 'Nurse Sarah',
      email: 'sarah.nurse@example.com',
      passwordHash: 'hashed_pw',
      role: UserRole.NURSE,
      facilityId: FACILITY_A,
    });
    reviewerId = reviewerUser._id.toString();

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

    reviewerToken = jwt.sign(
      { id: reviewerId, email: reviewerUser.email, role: reviewerUser.role, facilityId: FACILITY_A },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    reviewerFacBToken = jwt.sign(
      { id: reviewerFacBId, email: reviewerFacBUser.email, role: reviewerFacBUser.role, facilityId: FACILITY_B },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test Case
    const testCase = await Case.create({
      caseNumber: 'CASE-P16-0001',
      patientId: new mongoose.Types.ObjectId(patientId),
      facilityId: FACILITY_A,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Severe chest pain radiating to left arm',
    });
    testCaseId = testCase._id.toString();

    // Add initial symptom
    await Symptom.create({
      caseId: testCase._id,
      symptomName: 'Chest Pain',
      severity: 9,
      onset: '2 hours ago',
      bodyLocation: 'Chest',
      source: 'PATIENT',
    });

    // Create initial active Safety Evaluation
    await SafetyEvaluation.create({
      caseId: testCase._id,
      evaluationVersion: 1,
      status: 'ACTIVE',
      calculatedPriority: CasePriority.URGENT,
      effectivePriority: CasePriority.URGENT,
      matchedSignals: [
        {
          ruleId: 'SEC-URG-001',
          ruleName: 'Severe Chest Pain Rule',
          category: SignalCategory.CLINICAL_URGENT,
          priority: CasePriority.URGENT,
          sourceType: SourceType.SYMPTOM_MODEL,
          sourceId: 'symptom-1',
          evidenceSnippet: 'Chest Pain (9/10)',
          explanation: 'Chest pain requires immediate clinical evaluation',
          detectedAt: new Date(),
        },
      ],
      hasHumanOverride: false,
      evaluatedBy: 'SYSTEM',
      evaluatedAt: new Date(),
    });
  });

  describe('1. Deterministic Evidence Assembly & Fingerprinting', () => {
    it('computes a consistent sourceEvidenceHash for the same evidence', async () => {
      const hash1 = TriageNoteService.computeSourceEvidenceHash({
        caseId: testCaseId,
        chiefComplaint: 'Severe chest pain radiating to left arm',
        language: 'en',
        intakeSource: IntakeSource.TEXT,
        symptoms: [{ _id: 's1', symptomName: 'Chest Pain', severity: 9, bodyLocation: 'Chest' }],
        reports: [],
        voiceInputs: [],
        visualInputs: [],
        translations: [],
        activeSafetyEval: null,
      });

      const hash2 = TriageNoteService.computeSourceEvidenceHash({
        caseId: testCaseId,
        chiefComplaint: 'Severe chest pain radiating to left arm',
        language: 'en',
        intakeSource: IntakeSource.TEXT,
        symptoms: [{ _id: 's1', symptomName: 'Chest Pain', severity: 9, bodyLocation: 'Chest' }],
        reports: [],
        voiceInputs: [],
        visualInputs: [],
        translations: [],
        activeSafetyEval: null,
      });

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64); // SHA-256 length
    });
  });

  describe('2. Note Generation & Idempotency', () => {
    it('generates an ACTIVE note on initial call and returns it on subsequent call with same evidence', async () => {
      const res1 = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/generate`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.noteVersion).toBe(1);
      expect(res1.body.data.status).toBe('ACTIVE');
      expect(res1.body.isNew).toBe(true);

      const noteId1 = res1.body.data._id;

      // Second generation call with same evidence
      const res2 = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/generate`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.data._id).toBe(noteId1);
      expect(res2.body.data.noteVersion).toBe(1);
      expect(res2.body.isNew).toBe(false);
    });

    it('creates a new version when evidence changes and supersedes prior note', async () => {
      // First note
      await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/generate`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      // Add new symptom (evidence change)
      await Symptom.create({
        caseId: testCaseId,
        symptomName: 'Shortness of Breath',
        severity: 8,
        source: 'PATIENT',
      });

      // Second note generation
      const res2 = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/generate`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.noteVersion).toBe(2);
      expect(res2.body.data.status).toBe('ACTIVE');
      expect(res2.body.isNew).toBe(true);

      // Check database note history
      const allNotes = await TriageNote.find({ caseId: testCaseId }).sort({ noteVersion: 1 });
      expect(allNotes.length).toBe(2);
      expect(allNotes[0].noteVersion).toBe(1);
      expect(allNotes[0].status).toBe('SUPERSEDED');
      expect(allNotes[1].noteVersion).toBe(2);
      expect(allNotes[1].status).toBe('ACTIVE');
    });

    it('auto-generates an ACTIVE note on GET if none exists', async () => {
      const res = await request(app)
        .get(`/api/reviewer/cases/${testCaseId}/triage-note`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.noteVersion).toBe(1);
      expect(res.body.data.status).toBe('ACTIVE');
    });
  });

  describe('3. Human Verification Semantics & Invariants', () => {
    it('verifies note provenance without modifying case priority or safety evaluation', async () => {
      const genRes = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/generate`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      const noteId = genRes.body.data._id;

      // Get case priority before verification
      const caseBefore = await Case.findById(testCaseId);

      const verifyRes = await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/verify`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ reviewerNotes: 'Verified patient narrative and safety signals.' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.provenance).toBe(NoteProvenance.HUMAN_VERIFIED);
      expect(verifyRes.body.data.reviewerNotes).toBe('Verified patient narrative and safety signals.');
      expect(verifyRes.body.data.reviewedBy).toBe(reviewerId);

      // Verify invariants
      const caseAfter = await Case.findById(testCaseId);
      expect(caseAfter?.priority).toBe(caseBefore?.priority);
      expect(caseAfter?.slaDueAt).toEqual(caseBefore?.slaDueAt);

      // Verify audit event
      const auditLogs = await AuditLog.find({ action: AuditEventType.TRIAGE_NOTE_VERIFIED });
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].resourceId).toBe(noteId);
    });
  });

  describe('4. Security & Isolation Controls', () => {
    it('blocks patient access with 403', async () => {
      const res = await request(app)
        .get(`/api/reviewer/cases/${testCaseId}/triage-note`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });

    it('enforces facility isolation with 403 for reviewer from another facility', async () => {
      const res = await request(app)
        .get(`/api/reviewer/cases/${testCaseId}/triage-note`)
        .set('Authorization', `Bearer ${reviewerFacBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Unauthorized access to case from another facility');
    });
  });

  describe('5. Safety Evaluation & Audit Event Integration', () => {
    it('logs TRIAGE_NOTE_GENERATED and TRIAGE_NOTE_REGENERATED audit events correctly', async () => {
      // First generation
      await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/generate`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      let logs = await AuditLog.find({ caseId: testCaseId });
      expect(logs.some((l) => l.action === AuditEventType.TRIAGE_NOTE_GENERATED)).toBe(true);

      // Add symptom to trigger regeneration
      await Symptom.create({ caseId: testCaseId, symptomName: 'Dizziness', source: 'PATIENT' });

      // Second generation
      await request(app)
        .post(`/api/reviewer/cases/${testCaseId}/triage-note/generate`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      logs = await AuditLog.find({ caseId: testCaseId });
      expect(logs.some((l) => l.action === AuditEventType.TRIAGE_NOTE_REGENERATED)).toBe(true);
    });
  });
});
