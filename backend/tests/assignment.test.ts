import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole, IUser } from '../src/modules/users/user.types.js';
import { Case } from '../src/modules/cases/case.model.js';
import { ICase, CaseStatus, CasePriority, IntakeSource } from '../src/modules/cases/case.types.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { IAuditLog, AuditEventType } from '../src/modules/audit/audit-log.types.js';
import { signToken } from '../src/modules/auth/auth.utils.js';

describe('Phase 6 Assignment & Reviewer Ownership API Tests', () => {
  const app = createApp();

  let mockUsers: Map<string, IUser>;
  let mockCases: Map<string, ICase>;
  let mockAuditLogs: Map<string, IAuditLog>;

  let patientUser: IUser;
  let doctorUser: IUser;
  let nurseUser: IUser;
  let adminUser: IUser;
  let inactiveDoctorUser: IUser;

  let patientToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let adminToken: string;

  let sampleUnassignedCaseId: mongoose.Types.ObjectId;
  let sampleAssignedCaseId: mongoose.Types.ObjectId;

  let nurseFacAUser: IUser;
  let nurseFacBUser: IUser;
  let nurseFacAToken: string;
  let nurseFacBToken: string;

  let facilityACaseId: mongoose.Types.ObjectId;
  let facilityBCaseId: mongoose.Types.ObjectId;

  beforeEach(() => {
    mockUsers = new Map();
    mockCases = new Map();
    mockAuditLogs = new Map();

    // Patient
    const patientId = new mongoose.Types.ObjectId();
    patientUser = {
      _id: patientId,
      name: 'Anil Gupta',
      email: 'anil.gupta@example.com',
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

    // Nurse Facility A
    const nurseFacAId = new mongoose.Types.ObjectId();
    nurseFacAUser = {
      _id: nurseFacAId,
      name: 'Nurse Facility A',
      email: 'nurse.faca@phc.gov.in',
      role: UserRole.NURSE,
      facilityId: 'FACILITY_A',
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(nurseFacAId.toString(), nurseFacAUser);
    nurseFacAToken = signToken({ id: nurseFacAId.toString(), role: UserRole.NURSE });

    // Nurse Facility B
    const nurseFacBId = new mongoose.Types.ObjectId();
    nurseFacBUser = {
      _id: nurseFacBId,
      name: 'Nurse Facility B',
      email: 'nurse.facb@phc.gov.in',
      role: UserRole.NURSE,
      facilityId: 'FACILITY_B',
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(nurseFacBId.toString(), nurseFacBUser);
    nurseFacBToken = signToken({ id: nurseFacBId.toString(), role: UserRole.NURSE });

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

    // Inactive Doctor
    const inactiveId = new mongoose.Types.ObjectId();
    inactiveDoctorUser = {
      _id: inactiveId,
      name: 'Dr. Inactive',
      email: 'inactive@phc.gov.in',
      role: UserRole.DOCTOR,
      isActive: false,
      isDeleted: false,
    };
    mockUsers.set(inactiveId.toString(), inactiveDoctorUser);

    // Unassigned Case
    sampleUnassignedCaseId = new mongoose.Types.ObjectId();
    const unassignedCase: ICase = {
      _id: sampleUnassignedCaseId,
      caseNumber: 'CAS-20260923-0001',
      patientId: patientId,
      assignedReviewerId: undefined,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Chest tightness for 1 day',
      isDeleted: false,
      createdAt: new Date('2026-09-23T10:00:00.000Z'),
    };
    mockCases.set(sampleUnassignedCaseId.toString(), unassignedCase);

    // Assigned Case (assigned to Doctor)
    sampleAssignedCaseId = new mongoose.Types.ObjectId();
    const assignedCase: ICase = {
      _id: sampleAssignedCaseId,
      caseNumber: 'CAS-20260923-0002',
      patientId: patientId,
      assignedReviewerId: doctorId,
      status: CaseStatus.IN_REVIEW,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Severe knee pain',
      isDeleted: false,
      createdAt: new Date('2026-09-23T11:00:00.000Z'),
    };
    mockCases.set(sampleAssignedCaseId.toString(), assignedCase);

    // Facility A Case
    facilityACaseId = new mongoose.Types.ObjectId();
    const facilityACase: ICase = {
      _id: facilityACaseId,
      caseNumber: 'CAS-20260923-0003',
      patientId: patientId,
      facilityId: 'FACILITY_A',
      assignedReviewerId: undefined,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Fever and cough at Facility A',
      isDeleted: false,
      createdAt: new Date('2026-09-23T12:00:00.000Z'),
    };
    mockCases.set(facilityACaseId.toString(), facilityACase);

    // Facility B Case
    facilityBCaseId = new mongoose.Types.ObjectId();
    const facilityBCase: ICase = {
      _id: facilityBCaseId,
      caseNumber: 'CAS-20260923-0004',
      patientId: patientId,
      facilityId: 'FACILITY_B',
      assignedReviewerId: nurseFacBId,
      status: CaseStatus.IN_REVIEW,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
      chiefComplaint: 'Abdominal pain at Facility B',
      isDeleted: false,
      createdAt: new Date('2026-09-23T13:00:00.000Z'),
    };
    mockCases.set(facilityBCaseId.toString(), facilityBCase);

    // Mongoose Spies
    vi.spyOn(User, 'findOne').mockImplementation((query: unknown) => {
      const q = query as { _id?: string | mongoose.Types.ObjectId; isDeleted?: boolean; isActive?: boolean };
      for (const u of mockUsers.values()) {
        if (q._id && u._id?.toString() === q._id.toString()) {
          if (q.isDeleted !== undefined && u.isDeleted !== q.isDeleted) continue;
          if (q.isActive !== undefined && u.isActive !== q.isActive) continue;
          return Promise.resolve(u) as unknown as ReturnType<typeof User.findOne>;
        }
      }
      return Promise.resolve(null) as unknown as ReturnType<typeof User.findOne>;
    });

    vi.spyOn(User, 'findById').mockImplementation((id: unknown) => {
      const u = mockUsers.get(id?.toString() || '');
      if (!u) return Promise.resolve(null) as unknown as ReturnType<typeof User.findById>;
      const chain = {
        select: () => Promise.resolve(u),
        then: (resolve: (val: unknown) => void) => resolve(u),
      };
      return chain as unknown as ReturnType<typeof User.findById>;
    });

    vi.spyOn(Case, 'findOne').mockImplementation((query: unknown) => {
      const q = query as { _id?: string | mongoose.Types.ObjectId; isDeleted?: boolean };
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

    vi.spyOn(Case, 'findOneAndUpdate').mockImplementation((filter: unknown, update: unknown, options: unknown) => {
      const f = filter as { _id?: string | mongoose.Types.ObjectId; assignedReviewerId?: unknown; isDeleted?: boolean };
      const u = update as { $set: { assignedReviewerId: mongoose.Types.ObjectId | null } };
      const opts = options as { new?: boolean };
      const c = mockCases.get(f._id?.toString() || '');

      if (!c || c.isDeleted) return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOneAndUpdate>;

      // Check atomic assignedReviewerId condition
      if (f.assignedReviewerId === null && c.assignedReviewerId != null) {
        return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOneAndUpdate>;
      }

      const prevDoc = { ...c };
      c.assignedReviewerId = u.$set.assignedReviewerId || undefined;
      mockCases.set(c._id!.toString(), c);
      return Promise.resolve(opts?.new ? c : prevDoc) as unknown as ReturnType<typeof Case.findOneAndUpdate>;
    });

    vi.spyOn(Case, 'find').mockImplementation((query: unknown) => {
      const q = query as { assignedReviewerId?: mongoose.Types.ObjectId | null; facilityId?: string; isDeleted?: boolean };
      let list = Array.from(mockCases.values()).filter((c) => !c.isDeleted);

      if (q.facilityId) {
        list = list.filter((c) => c.facilityId === q.facilityId);
      }
      if (q.assignedReviewerId === null) {
        list = list.filter((c) => !c.assignedReviewerId);
      } else if (q.assignedReviewerId) {
        list = list.filter((c) => c.assignedReviewerId?.toString() === q.assignedReviewerId?.toString());
      }

      const chain = {
        sort: () => chain,
        skip: () => chain,
        limit: () => Promise.resolve(list),
        then: (resolve: (val: unknown) => void) => resolve(list),
      };
      return chain as unknown as ReturnType<typeof Case.find>;
    });

    vi.spyOn(Case, 'countDocuments').mockImplementation((query: unknown) => {
      const q = query as { assignedReviewerId?: mongoose.Types.ObjectId | null; facilityId?: string; isDeleted?: boolean };
      let list = Array.from(mockCases.values()).filter((c) => !c.isDeleted);

      if (q.facilityId) {
        list = list.filter((c) => c.facilityId === q.facilityId);
      }
      if (q.assignedReviewerId === null) {
        list = list.filter((c) => !c.assignedReviewerId);
      } else if (q.assignedReviewerId) {
        list = list.filter((c) => c.assignedReviewerId?.toString() === q.assignedReviewerId?.toString());
      }

      return Promise.resolve(list.length) as unknown as ReturnType<typeof Case.countDocuments>;
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

  describe('Authentication & RBAC Authorization for Assignment Endpoints', () => {
    it('1. should reject unauthenticated claim, release, and assign requests with 401', async () => {
      const claimRes = await request(app).post(`/api/reviewer/cases/${sampleUnassignedCaseId}/claim`);
      expect(claimRes.status).toBe(401);

      const releaseRes = await request(app).post(`/api/reviewer/cases/${sampleAssignedCaseId}/release`);
      expect(releaseRes.status).toBe(401);

      const assignRes = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/assign`)
        .send({ reviewerId: nurseUser._id?.toString() });
      expect(assignRes.status).toBe(401);
    });

    it('2. should reject PATIENT role access to assignment endpoints with 403', async () => {
      const claimRes = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/claim`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(claimRes.status).toBe(403);

      const releaseRes = await request(app)
        .post(`/api/reviewer/cases/${sampleAssignedCaseId}/release`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(releaseRes.status).toBe(403);

      const assignRes = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/assign`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ reviewerId: nurseUser._id?.toString() });
      expect(assignRes.status).toBe(403);
    });

    it('3. should reject non-admin users from calling administrative assign endpoint with 403', async () => {
      const assignRes = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/assign`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ reviewerId: nurseUser._id?.toString() });

      expect(assignRes.status).toBe(403);
    });
  });

  describe('POST /api/reviewer/cases/:caseId/claim — Case Claim Workflow & Concurrency', () => {
    it('4. should allow an authorized reviewer to claim an unassigned case atomically and create CASE_CLAIMED audit event', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/claim`)
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedReviewerId).toBe(nurseUser._id?.toString());

      // Verify Case assignedReviewerId updated
      const updatedCase = mockCases.get(sampleUnassignedCaseId.toString());
      expect(updatedCase?.assignedReviewerId?.toString()).toBe(nurseUser._id?.toString());

      // Verify AuditLog entry
      const audit = Array.from(mockAuditLogs.values()).find((a) => a.action === AuditEventType.CASE_CLAIMED);
      expect(audit).toBeDefined();
      expect(audit?.metadata).toEqual({
        previousReviewerId: null,
        newReviewerId: nurseUser._id?.toString(),
      });
    });

    it('5. should reject claiming an already assigned case with 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleAssignedCaseId}/claim`)
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ASSIGNMENT_CONFLICT');
    });

    it('6. Concurrency Protection: should allow only 1 of simultaneous claim requests to succeed while 1 receives 409 Conflict', async () => {
      // Simulate two concurrent claim requests
      const req1 = request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/claim`)
        .set('Authorization', `Bearer ${doctorToken}`);

      const req2 = request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/claim`)
        .set('Authorization', `Bearer ${nurseToken}`);

      const [res1, res2] = await Promise.all([req1, req2]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      // Exactly 1 reviewer owns the case
      const finalCase = mockCases.get(sampleUnassignedCaseId.toString());
      expect(finalCase?.assignedReviewerId).toBeDefined();
    });
  });

  describe('POST /api/reviewer/cases/:caseId/release — Case Release Workflow', () => {
    it('7. should allow a reviewer to release their own assigned case and create CASE_RELEASED audit event', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleAssignedCaseId}/release`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedReviewerId).toBeNull();

      const updatedCase = mockCases.get(sampleAssignedCaseId.toString());
      expect(updatedCase?.assignedReviewerId).toBeFalsy();

      const audit = Array.from(mockAuditLogs.values()).find((a) => a.action === AuditEventType.CASE_RELEASED);
      expect(audit).toBeDefined();
      expect(audit?.metadata).toEqual({
        previousReviewerId: doctorUser._id?.toString(),
        newReviewerId: null,
      });
    });

    it('8. should prevent a normal reviewer from releasing another reviewer\'s case (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleAssignedCaseId}/release`)
        .set('Authorization', `Bearer ${nurseToken}`); // Nurse trying to release Doctor's case

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('9. should allow an ADMIN user to release any assigned case', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleAssignedCaseId}/release`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/reviewer/cases/:caseId/assign — Administrative Assignment & Reassignment', () => {
    it('10. should allow ADMIN to assign an unassigned case to a valid reviewer and log CASE_ASSIGNED with previous & new reviewer IDs', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewerId: nurseUser._id?.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedReviewerId).toBe(nurseUser._id?.toString());

      const audit = Array.from(mockAuditLogs.values()).find((a) => a.action === AuditEventType.CASE_ASSIGNED);
      expect(audit).toBeDefined();
      expect(audit?.metadata).toEqual({
        previousReviewerId: null,
        newReviewerId: nurseUser._id?.toString(),
      });
    });

    it('11. should allow ADMIN to reassign a case currently assigned to Doctor over to Nurse', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${sampleAssignedCaseId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewerId: nurseUser._id?.toString() });

      expect(res.status).toBe(200);

      const audit = Array.from(mockAuditLogs.values()).find(
        (a) => a.action === AuditEventType.CASE_ASSIGNED && a.resourceId === sampleAssignedCaseId.toString()
      );
      expect(audit).toBeDefined();
      expect(audit?.metadata).toEqual({
        previousReviewerId: doctorUser._id?.toString(),
        newReviewerId: nurseUser._id?.toString(),
      });
    });

    it('12. should reject administrative assignment to a PATIENT role or inactive user', async () => {
      // Attempt assignment to patient
      const patientRes = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewerId: patientUser._id?.toString() });

      expect(patientRes.status).toBe(400);

      // Attempt assignment to inactive doctor
      const inactiveRes = await request(app)
        .post(`/api/reviewer/cases/${sampleUnassignedCaseId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewerId: inactiveDoctorUser._id?.toString() });

      expect(inactiveRes.status).toBe(400);
    });
  });

  describe('GET /api/reviewer/cases — Queue Filtering by Workload (assignedTo=me/unassigned)', () => {
    it('13. should filter queue cases by assignedTo=me (Doctor assigned cases only)', async () => {
      const res = await request(app)
        .get('/api/reviewer/cases?assignedTo=me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(sampleAssignedCaseId.toString());
    });

    it('14. should filter queue cases by assignedTo=unassigned (Unclaimed cases only)', async () => {
      const res = await request(app)
        .get('/api/reviewer/cases?assignedTo=unassigned')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((c: { isAssigned: boolean }) => !c.isAssigned)).toBe(true);
      expect(res.body.data.some((c: { id: string }) => c.id === sampleUnassignedCaseId.toString())).toBe(true);
    });
  });

  describe('Facility Authorization Isolation & Scope Enforcement', () => {
    it('15. should prevent a reviewer from Facility A from viewing details of a Facility B case (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/reviewer/cases/${facilityBCaseId}`)
        .set('Authorization', `Bearer ${nurseFacAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('16. should prevent a reviewer from Facility A from claiming a Facility B case (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${facilityBCaseId}/claim`)
        .set('Authorization', `Bearer ${nurseFacAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('17. should prevent a reviewer from Facility A from releasing a Facility B case (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/reviewer/cases/${facilityBCaseId}/release`)
        .set('Authorization', `Bearer ${nurseFacAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('18. should restrict assignedTo=all queue filtering to authenticated user\'s facility only', async () => {
      const res = await request(app)
        .get('/api/reviewer/cases?assignedTo=all')
        .set('Authorization', `Bearer ${nurseFacAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // nurseFacA should only see cases with facilityId = 'FACILITY_A'
      expect(res.body.data.every((c: { id: string }) => c.id === facilityACaseId.toString())).toBe(true);
    });
  });
});
