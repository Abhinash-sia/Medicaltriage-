import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole, IUser } from '../src/modules/users/user.types.js';
import { Case } from '../src/modules/cases/case.model.js';
import { ICase, CaseStatus, CasePriority, IntakeSource } from '../src/modules/cases/case.types.js';
import { Symptom } from '../src/modules/symptoms/symptom.model.js';
import { ISymptom, InformationSource } from '../src/modules/symptoms/symptom.types.js';
import { Consent } from '../src/modules/consent/consent.model.js';
import { IConsent, ConsentStatus, ConsentType } from '../src/modules/consent/consent.types.js';
import { Review } from '../src/modules/reviews/review.model.js';
import { IReview, ReviewStatus } from '../src/modules/reviews/review.types.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { IAuditLog, AuditEventType } from '../src/modules/audit/audit-log.types.js';
import { signToken } from '../src/modules/auth/auth.utils.js';

describe('Phase 5 Reviewer Dashboard API Tests', () => {
  const app = createApp();

  let mockUsers: Map<string, IUser>;
  let mockCases: Map<string, ICase>;
  let mockSymptoms: Map<string, ISymptom>;
  let mockConsents: Map<string, IConsent>;
  let mockReviews: Map<string, IReview>;
  let mockAuditLogs: Map<string, IAuditLog>;

  let patientUser: IUser;
  let doctorUser: IUser;
  let nurseUser: IUser;
  let healthWorkerUser: IUser;
  let medicalOfficerUser: IUser;
  let adminUser: IUser;

  let patientToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let healthWorkerToken: string;
  let medicalOfficerToken: string;
  let adminToken: string;

  let sampleCaseId: mongoose.Types.ObjectId;
  let sampleCase: ICase;

  beforeEach(() => {
    mockUsers = new Map();
    mockCases = new Map();
    mockSymptoms = new Map();
    mockConsents = new Map();
    mockReviews = new Map();
    mockAuditLogs = new Map();

    // Patient
    const patientId = new mongoose.Types.ObjectId();
    patientUser = {
      _id: patientId,
      name: 'Anil Gupta',
      email: 'anil.gupta@example.com',
      phone: '+919876543210',
      role: UserRole.PATIENT,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(patientId.toString(), patientUser);
    patientToken = signToken({ id: patientId.toString(), role: UserRole.PATIENT });

    // Doctor
    const doctorId = new mongoose.Types.ObjectId();
    doctorUser = {
      _id: doctorId,
      name: 'Dr. Sunita Rao',
      email: 'sunita.rao@phc.gov.in',
      role: UserRole.DOCTOR,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(doctorId.toString(), doctorUser);
    doctorToken = signToken({ id: doctorId.toString(), role: UserRole.DOCTOR });

    // Nurse
    const nurseId = new mongoose.Types.ObjectId();
    nurseUser = {
      _id: nurseId,
      name: 'Nurse Priya Sharma',
      email: 'priya.sharma@phc.gov.in',
      role: UserRole.NURSE,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(nurseId.toString(), nurseUser);
    nurseToken = signToken({ id: nurseId.toString(), role: UserRole.NURSE });

    // Health Worker
    const hwId = new mongoose.Types.ObjectId();
    healthWorkerUser = {
      _id: hwId,
      name: 'Asha Worker Meena',
      email: 'meena@phc.gov.in',
      role: UserRole.HEALTH_WORKER,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(hwId.toString(), healthWorkerUser);
    healthWorkerToken = signToken({ id: hwId.toString(), role: UserRole.HEALTH_WORKER });

    // Medical Officer
    const moId = new mongoose.Types.ObjectId();
    medicalOfficerUser = {
      _id: moId,
      name: 'Dr. Rajesh Verma (MO)',
      email: 'rajesh.verma@phc.gov.in',
      role: UserRole.MEDICAL_OFFICER,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(moId.toString(), medicalOfficerUser);
    medicalOfficerToken = signToken({ id: moId.toString(), role: UserRole.MEDICAL_OFFICER });

    // Admin
    const adminId = new mongoose.Types.ObjectId();
    adminUser = {
      _id: adminId,
      name: 'System Admin',
      email: 'admin@phc.gov.in',
      role: UserRole.ADMIN,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(adminId.toString(), adminUser);
    adminToken = signToken({ id: adminId.toString(), role: UserRole.ADMIN });

    // Sample Case Creation
    sampleCaseId = new mongoose.Types.ObjectId();
    const consentId = new mongoose.Types.ObjectId();

    sampleCase = {
      _id: sampleCaseId,
      caseNumber: 'CAS-20260923-0001',
      patientId: patientId,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Severe headache and dizziness: Throbbing frontal pain for 2 days',
      consentId: consentId,
      isDeleted: false,
      createdAt: new Date('2026-09-23T10:00:00.000Z'),
    };
    mockCases.set(sampleCaseId.toString(), sampleCase);

    const sampleConsent: IConsent = {
      _id: consentId,
      caseId: sampleCaseId,
      patientId: patientId,
      consentType: ConsentType.GENERAL_TRIAGE,
      status: ConsentStatus.GRANTED,
      version: 'v1.0-hackathon',
      capturedBy: 'PATIENT_PORTAL',
      capturedAt: new Date('2026-09-23T10:00:00.000Z'),
    };
    mockConsents.set(consentId.toString(), sampleConsent);

    const sampleSymptom: ISymptom = {
      _id: new mongoose.Types.ObjectId(),
      caseId: sampleCaseId,
      symptomName: 'Severe headache',
      onset: '2 days ago',
      severity: 7,
      bodyLocation: 'Head',
      source: InformationSource.PATIENT,
      createdAt: new Date('2026-09-23T10:00:00.000Z'),
    };
    mockSymptoms.set(sampleSymptom._id.toString(), sampleSymptom);

    // Mongoose Spies
    vi.spyOn(User, 'findOne').mockImplementation((query: unknown) => {
      const q = query as { _id?: string | mongoose.Types.ObjectId; isActive?: boolean };
      for (const u of mockUsers.values()) {
        if (q._id && u._id?.toString() === q._id.toString()) {
          return Promise.resolve(u) as unknown as ReturnType<typeof User.findOne>;
        }
      }
      return Promise.resolve(null) as unknown as ReturnType<typeof User.findOne>;
    });

    vi.spyOn(User, 'findById').mockImplementation((id: unknown) => {
      const user = mockUsers.get(id?.toString() || '');
      if (!user) return Promise.resolve(null) as unknown as ReturnType<typeof User.findById>;
      const chain = {
        select: () => Promise.resolve(user),
        then: (resolve: (val: unknown) => void) => resolve(user),
      };
      return chain as unknown as ReturnType<typeof User.findById>;
    });

    vi.spyOn(Case, 'findOne').mockImplementation((query: unknown) => {
      const q = query as { _id?: string; caseNumber?: string; isDeleted?: boolean };
      for (const c of mockCases.values()) {
        if (q._id && c._id?.toString() === q._id.toString() && !c.isDeleted) {
          if (!c.save) {
            c.save = function (this: ICase) {
              mockCases.set(this._id!.toString(), this);
              return Promise.resolve(this);
            };
          }
          return Promise.resolve(c) as unknown as ReturnType<typeof Case.findOne>;
        }
      }
      return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOne>;
    });

    vi.spyOn(Case, 'findById').mockImplementation((id: unknown) => {
      const caseDoc = mockCases.get(id?.toString() || '');
      return Promise.resolve(caseDoc || null) as unknown as ReturnType<typeof Case.findById>;
    });

    vi.spyOn(Case, 'find').mockImplementation((query: unknown) => {
      const q = query as { status?: string; priority?: string; isDeleted?: boolean };
      let list = Array.from(mockCases.values()).filter((c) => !c.isDeleted);
      if (q.status) list = list.filter((c) => c.status === q.status);
      if (q.priority) list = list.filter((c) => c.priority === q.priority);

      const chain = {
        sort: () => chain,
        skip: () => chain,
        limit: () => Promise.resolve(list),
        then: (resolve: (val: unknown) => void) => resolve(list),
      };
      return chain as unknown as ReturnType<typeof Case.find>;
    });

    vi.spyOn(Case, 'countDocuments').mockImplementation((query: unknown) => {
      const q = query as { status?: string; priority?: string; isDeleted?: boolean };
      let list = Array.from(mockCases.values()).filter((c) => !c.isDeleted);
      if (q.status) list = list.filter((c) => c.status === q.status);
      if (q.priority) list = list.filter((c) => c.priority === q.priority);
      return Promise.resolve(list.length) as unknown as ReturnType<typeof Case.countDocuments>;
    });

    vi.spyOn(Case.prototype, 'save').mockImplementation(function (this: ICase) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockCases.set(this._id.toString(), this);
      return Promise.resolve(this);
    });

    vi.spyOn(Consent, 'findById').mockImplementation((id: unknown) => {
      return Promise.resolve(mockConsents.get(id?.toString() || '') || null) as unknown as ReturnType<typeof Consent.findById>;
    });

    vi.spyOn(Symptom, 'find').mockImplementation((query: unknown) => {
      const q = query as { caseId?: mongoose.Types.ObjectId };
      const list = Array.from(mockSymptoms.values()).filter(
        (s) => s.caseId.toString() === q.caseId?.toString()
      );
      const chain = {
        sort: () => Promise.resolve(list),
        then: (resolve: (val: unknown) => void) => resolve(list),
      };
      return chain as unknown as ReturnType<typeof Symptom.find>;
    });

    vi.spyOn(Review, 'find').mockImplementation((query: unknown) => {
      const q = query as { caseId?: mongoose.Types.ObjectId };
      const list = Array.from(mockReviews.values()).filter(
        (r) => r.caseId.toString() === q.caseId?.toString()
      );
      const chain = {
        sort: () => Promise.resolve(list),
        then: (resolve: (val: unknown) => void) => resolve(list),
      };
      return chain as unknown as ReturnType<typeof Review.find>;
    });

    vi.spyOn(Review.prototype, 'save').mockImplementation(function (this: IReview) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockReviews.set(this._id.toString(), this);
      return Promise.resolve(this);
    });

    vi.spyOn(AuditLog.prototype, 'save').mockImplementation(function (this: IAuditLog) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockAuditLogs.set(this._id.toString(), this);
      return Promise.resolve(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Reviewer API — Authentication & RBAC Authorization', () => {
    it('1, 2, 3. should reject unauthenticated requests to reviewer endpoints with 401', async () => {
      const queueRes = await request(app).get('/api/reviewer/cases');
      expect(queueRes.status).toBe(401);
      expect(queueRes.body.error.code).toBe('AUTH_TOKEN_MISSING');

      const detailRes = await request(app).get(`/api/reviewer/cases/${sampleCaseId.toString()}`);
      expect(detailRes.status).toBe(401);

      const reviewRes = await request(app)
        .post(`/api/reviewer/cases/${sampleCaseId.toString()}/review`)
        .send({ reviewerNotes: 'Test note' });
      expect(reviewRes.status).toBe(401);
    });

    it('4, 5, 6. should reject PATIENT role access to reviewer endpoints with 403', async () => {
      const queueRes = await request(app)
        .get('/api/reviewer/cases')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(queueRes.status).toBe(403);
      expect(queueRes.body.error.code).toBe('AUTH_FORBIDDEN');

      const detailRes = await request(app)
        .get(`/api/reviewer/cases/${sampleCaseId.toString()}`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(detailRes.status).toBe(403);

      const reviewRes = await request(app)
        .post(`/api/reviewer/cases/${sampleCaseId.toString()}/review`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ reviewerNotes: 'Test note' });
      expect(reviewRes.status).toBe(403);
    });

    it('7-11. should allow all authorized healthcare roles (NURSE, HEALTH_WORKER, DOCTOR, MEDICAL_OFFICER, ADMIN) to access queue', async () => {
      const roles = [
        { role: 'NURSE', token: nurseToken },
        { role: 'HEALTH_WORKER', token: healthWorkerToken },
        { role: 'DOCTOR', token: doctorToken },
        { role: 'MEDICAL_OFFICER', token: medicalOfficerToken },
        { role: 'ADMIN', token: adminToken },
      ];

      for (const item of roles) {
        const res = await request(app)
          .get('/api/reviewer/cases')
          .set('Authorization', `Bearer ${item.token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/reviewer/cases — Reviewer Queue Pagination & Filtering', () => {
    it('12, 13, 14. should return paginated cases queue with total count and bound limit', async () => {
      const res = await request(app)
        .get('/api/reviewer/cases?page=1&limit=10')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('15, 16. should filter queue cases by status and priority', async () => {
      const statusRes = await request(app)
        .get('/api/reviewer/cases?status=OPEN&priority=ROUTINE')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.success).toBe(true);
      expect(statusRes.body.data.length).toBe(1);

      const emptyRes = await request(app)
        .get('/api/reviewer/cases?status=RESOLVED')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.data.length).toBe(0);
    });
  });

  describe('GET /api/reviewer/cases/:caseId — Reviewer Case Detail View', () => {
    it('18, 20, 21, 22. should return case details including patient info (excluding passwordHash), symptoms (source=PATIENT), and consent', async () => {
      const res = await request(app)
        .get(`/api/reviewer/cases/${sampleCaseId.toString()}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.id).toBe(sampleCaseId.toString());
      expect(data.patient.name).toBe('Anil Gupta');
      expect(data.patient).not.toHaveProperty('passwordHash');
      expect(data.symptoms[0].source).toBe(InformationSource.PATIENT);
      expect(data.consent.status).toBe(ConsentStatus.GRANTED);
    });

    it('19. should return 404 for non-existent case ID', async () => {
      const missingId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/reviewer/cases/${missingId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REVIEWER_CASE_NOT_FOUND');
    });
  });

  describe('POST /api/reviewer/cases/:caseId/review — Human Review Submission', () => {
    it('23, 24, 25, 28, 29, 30. should submit human review, record Review document with reviewerId, update case status to IN_REVIEW, and create AuditLog', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleCaseId.toString()}/review`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          reviewerNotes: 'Patient notes severe frontal headache. Advised resting in quiet room and hydration while awaiting clinical consult.',
          reviewStatus: ReviewStatus.COMPLETED,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('reviewId');
      expect(data.reviewerId).toBe(doctorUser._id?.toString());
      expect(data.caseStatus).toBe(CaseStatus.IN_REVIEW);

      // Verify Review document
      const createdReview = mockReviews.get(data.reviewId);
      expect(createdReview).toBeDefined();
      expect(createdReview?.reviewerId.toString()).toBe(doctorUser._id?.toString());
      expect(createdReview?.reviewerNotes).toContain('severe frontal headache');

      // Verify Case status updated to IN_REVIEW but assignedReviewerId is NOT modified (Phase 5 rule)
      const updatedCase = mockCases.get(sampleCaseId.toString());
      expect(updatedCase?.status).toBe(CaseStatus.IN_REVIEW);
      expect(updatedCase?.assignedReviewerId).toBeUndefined();

      // Verify AuditLog record
      const createdAudit = Array.from(mockAuditLogs.values()).find(
        (a) => a.resourceId === sampleCaseId.toString()
      );
      expect(createdAudit).toBeDefined();
      expect(createdAudit?.action).toBe(AuditEventType.REVIEW_STARTED);
    });

    it('26, 27, 31, 32, 33. should reject invalid reviewer notes, empty payload, or attempted field overrides', async () => {
      // Empty reviewer notes
      const emptyRes = await request(app)
        .post(`/api/reviewer/cases/${sampleCaseId.toString()}/review`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ reviewerNotes: '   ' });

      expect(emptyRes.status).toBe(400);
      expect(emptyRes.body.success).toBe(false);

      // Attempted override of client fields
      const overrideRes = await request(app)
        .post(`/api/reviewer/cases/${sampleCaseId.toString()}/review`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          reviewerNotes: 'Valid review note',
          reviewerId: new mongoose.Types.ObjectId().toString(), // rejected by strict schema
          diagnosis: 'Migraine', // rejected
        });

      expect(overrideRes.status).toBe(400);
      expect(overrideRes.body.success).toBe(false);
    });
  });
});
