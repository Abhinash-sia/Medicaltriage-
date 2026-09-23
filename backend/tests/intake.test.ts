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
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { IAuditLog, AuditEventType } from '../src/modules/audit/audit-log.types.js';
import { signToken } from '../src/modules/auth/auth.utils.js';

describe('Phase 4 Patient Intake Workflow API Tests', () => {
  const app = createApp();

  let mockUsers: Map<string, IUser>;
  let mockCases: Map<string, ICase>;
  let mockSymptoms: Map<string, ISymptom>;
  let mockConsents: Map<string, IConsent>;
  let mockAuditLogs: Map<string, IAuditLog>;

  let patientUser: IUser;
  let doctorUser: IUser;
  let otherPatientUser: IUser;

  let patientToken: string;
  let doctorToken: string;

  beforeEach(() => {
    mockUsers = new Map();
    mockCases = new Map();
    mockSymptoms = new Map();
    mockConsents = new Map();
    mockAuditLogs = new Map();

    const patientId = new mongoose.Types.ObjectId();
    patientUser = {
      _id: patientId,
      name: 'Ramesh Patel',
      email: 'ramesh.patel@example.com',
      role: UserRole.PATIENT,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(patientId.toString(), patientUser);
    patientToken = signToken({ id: patientId.toString(), role: UserRole.PATIENT });

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

    const otherPatientId = new mongoose.Types.ObjectId();
    otherPatientUser = {
      _id: otherPatientId,
      name: 'Suresh Kumar',
      email: 'suresh@example.com',
      role: UserRole.PATIENT,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(otherPatientId.toString(), otherPatientUser);

    // Mongoose Spies
    vi.spyOn(User, 'findOne').mockImplementation((query: unknown) => {
      const q = query as { _id?: string | mongoose.Types.ObjectId; isActive?: boolean; isDeleted?: boolean };
      for (const u of mockUsers.values()) {
        if (q._id && u._id?.toString() === q._id.toString()) return Promise.resolve(u) as unknown as ReturnType<typeof User.findOne>;
      }
      return Promise.resolve(null) as unknown as ReturnType<typeof User.findOne>;
    });

    vi.spyOn(Case, 'findOne').mockImplementation((query: unknown) => {
      const q = query as { _id?: string; caseNumber?: string; patientId?: mongoose.Types.ObjectId };
      for (const c of mockCases.values()) {
        if (q._id && c._id?.toString() === q._id.toString()) {
          if (q.patientId && c.patientId.toString() !== q.patientId.toString()) continue;
          return Promise.resolve(c) as unknown as ReturnType<typeof Case.findOne>;
        }
        if (q.caseNumber && c.caseNumber === q.caseNumber) return Promise.resolve(c) as unknown as ReturnType<typeof Case.findOne>;
      }
      return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOne>;
    });

    vi.spyOn(Case, 'findById').mockImplementation((id: unknown) => {
      const caseDoc = mockCases.get(id?.toString() || '');
      return Promise.resolve(caseDoc || null) as unknown as ReturnType<typeof Case.findById>;
    });

    vi.spyOn(Case, 'find').mockImplementation((query: unknown) => {
      const q = query as { patientId?: mongoose.Types.ObjectId };
      const matched: ICase[] = [];
      for (const c of mockCases.values()) {
        if (q.patientId && c.patientId.toString() === q.patientId.toString()) {
          matched.push(c);
        }
      }
      const chain = {
        sort: () => chain,
        select: () => Promise.resolve(matched),
        then: (resolve: (val: unknown) => void) => resolve(matched),
      };
      return chain as unknown as ReturnType<typeof Case.find>;
    });

    vi.spyOn(Case.prototype, 'save').mockImplementation(function (this: ICase) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockCases.set(this._id.toString(), this);
      return Promise.resolve(this);
    });

    vi.spyOn(Consent.prototype, 'save').mockImplementation(function (this: IConsent) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockConsents.set(this._id.toString(), this);
      return Promise.resolve(this);
    });

    vi.spyOn(Consent, 'findById').mockImplementation((id: unknown) => {
      return Promise.resolve(mockConsents.get(id?.toString() || '') || null) as unknown as ReturnType<typeof Consent.findById>;
    });

    vi.spyOn(Symptom.prototype, 'save').mockImplementation(function (this: ISymptom) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSymptoms.set(this._id.toString(), this);
      return Promise.resolve(this);
    });

    vi.spyOn(Symptom, 'find').mockImplementation((query: unknown) => {
      const q = query as { caseId?: mongoose.Types.ObjectId };
      const list = Array.from(mockSymptoms.values()).filter(
        (s) => s.caseId.toString() === q.caseId?.toString()
      );
      return Promise.resolve(list) as unknown as ReturnType<typeof Symptom.find>;
    });

    vi.spyOn(AuditLog.prototype, 'save').mockImplementation(function (this: IAuditLog) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockAuditLogs.set(this._id.toString(), this);
      return Promise.resolve(this);
    });

    vi.spyOn(AuditLog, 'findOne').mockImplementation(() => {
      return Promise.resolve(null) as unknown as ReturnType<typeof AuditLog.findOne>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/intake - Authentication & Authorization', () => {
    it('1. should reject unauthenticated intake requests with 401', async () => {
      const response = await request(app).post('/api/intake').send({
        consent: true,
        primarySymptom: 'Persistent Cough',
        symptomDescription: 'Dry cough lasting 3 days with fever',
        onset: '3 days ago',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('2. should reject intake requests from non-patient roles (e.g. DOCTOR) with 403', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consent: true,
          primarySymptom: 'Fever',
          symptomDescription: 'High fever',
          onset: '1 day ago',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('3. should allow authenticated patient role to submit intake', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consent: true,
          primarySymptom: 'Chest tightness',
          symptomDescription: 'Mild tightness when breathing deeply',
          onset: 'Yesterday evening',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('caseNumber');
    });
  });

  describe('POST /api/intake - Consent Validation', () => {
    it('4. should reject request with missing consent field', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          primarySymptom: 'Severe headache',
          symptomDescription: 'Throbbing frontal headache',
          onset: 'Today morning',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTAKE_VALIDATION_ERROR');
    });

    it('5. should reject request when consent is explicitly denied (false)', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consent: false,
          primarySymptom: 'Abdominal pain',
          symptomDescription: 'Lower quadrant pain',
          onset: '2 days ago',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Explicit patient consent is required');
    });
  });

  describe('POST /api/intake - Field Validation & Security Overrides', () => {
    it('7 & 8. should reject missing primary symptom or missing symptom description', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consent: true,
          primarySymptom: 'A', // too short (<2 chars)
          symptomDescription: 'Fine', // too short (<5 chars)
          onset: 'Today',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('10. should reject patient-reported severity out of 1-10 range (>10)', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consent: true,
          primarySymptom: 'Joint pain',
          symptomDescription: 'Pain in right knee',
          onset: '1 week ago',
          severity: 15, // Out of bounds
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('11 & 12 & 13. should prevent client injection of patientId, priority, status, reviewerId, or diagnosis', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consent: true,
          primarySymptom: 'Fever',
          symptomDescription: 'High fever with chills',
          onset: '2 days ago',
          patientId: new mongoose.Types.ObjectId().toString(), // Attempted override
          priority: CasePriority.URGENT, // Attempted priority override
          status: CaseStatus.RESOLVED, // Attempted status override
          diagnosis: 'Appendicitis', // Attempted diagnostic claim
        });

      expect(response.status).toBe(400); // Rejected by strict Zod schema validation
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/intake - Successful Intake Persistence & Data Integrity', () => {
    it('14 & 15 & 16. should create Case, Consent, Symptom (source=PATIENT), and AuditLog entries', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consent: true,
          language: 'hi',
          primarySymptom: 'Shortness of breath',
          symptomDescription: 'Difficulty breathing after climbing stairs',
          onset: '3 days ago',
          severity: 6,
          bodyLocation: 'Chest',
          course: 'WORSENING',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      const data = response.body.data;
      expect(data).toHaveProperty('caseId');
      expect(data.patientId).toBe(patientUser._id?.toString());
      expect(data.status).toBe(CaseStatus.OPEN);
      expect(data.priority).toBe(CasePriority.ROUTINE); // Default initial workflow category

      // Verify Case record
      const createdCase = mockCases.get(data.caseId);
      expect(createdCase).toBeDefined();
      expect(createdCase?.patientId.toString()).toBe(patientUser._id?.toString());

      // Verify Consent record
      const createdConsent = Array.from(mockConsents.values()).find(
        (c) => c.caseId.toString() === data.caseId
      );
      expect(createdConsent).toBeDefined();
      expect(createdConsent?.status).toBe(ConsentStatus.GRANTED);

      // Verify Symptom record provenance (source must be PATIENT)
      const createdSymptom = Array.from(mockSymptoms.values()).find(
        (s) => s.caseId.toString() === data.caseId
      );
      expect(createdSymptom).toBeDefined();
      expect(createdSymptom?.source).toBe(InformationSource.PATIENT);
      expect(createdSymptom?.symptomName).toBe('Shortness of breath');
      expect(createdSymptom?.severity).toBe(6);
      expect(createdSymptom?.confidence).toBeUndefined(); // No artificial AI confidence for manual patient input

      // Verify AuditLog record
      const createdAudit = Array.from(mockAuditLogs.values()).find(
        (a) => a.caseId?.toString() === data.caseId
      );
      expect(createdAudit).toBeDefined();
      expect(createdAudit?.actorId).toBe(patientUser._id?.toString());
      expect(createdAudit?.actorRole).toBe(UserRole.PATIENT);
      expect(createdAudit?.action).toBe(AuditEventType.CASE_CREATED);
    });
  });

  describe('GET /api/intake/:caseId - Patient Case Ownership Enforcement', () => {
    let patientCaseId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consent: true,
          primarySymptom: 'Sore throat',
          symptomDescription: 'Painful swallowing',
          onset: 'Yesterday',
        });
      patientCaseId = res.body.data.caseId;
    });

    it('18. should allow patient to view their own case details', async () => {
      const response = await request(app)
        .get(`/api/intake/${patientCaseId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(patientCaseId);
    });

    it('18. should prevent another patient from viewing a case they do not own (404 Not Found)', async () => {
      const otherPatientToken = signToken({
        id: otherPatientUser._id?.toString() || '',
        role: UserRole.PATIENT,
      });

      const response = await request(app)
        .get(`/api/intake/${patientCaseId}`)
        .set('Authorization', `Bearer ${otherPatientToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTAKE_CASE_NOT_FOUND');
    });
  });
});
