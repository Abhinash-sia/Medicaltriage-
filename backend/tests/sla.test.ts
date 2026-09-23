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
import { SlaService } from '../src/modules/sla/sla.service.js';
import { SlaStatus } from '../src/modules/sla/sla.types.js';
import { SLA_POLICY } from '../src/modules/sla/sla.config.js';

describe('Phase 7 SLA & Operational Escalation System Tests', () => {
  const app = createApp();

  let mockUsers: Map<string, IUser>;
  let mockCases: Map<string, ICase>;
  let mockAuditLogs: Map<string, IAuditLog>;

  let patientUser: IUser;
  let nurseUser: IUser;
  let medicalOfficerFacA: IUser;
  let adminUser: IUser;

  let patientToken: string;
  let nurseToken: string;
  let medicalOfficerFacAToken: string;
  let adminToken: string;

  beforeEach(() => {
    mockUsers = new Map();
    mockCases = new Map();
    mockAuditLogs = new Map();

    // Patient
    const patientId = new mongoose.Types.ObjectId();
    patientUser = {
      _id: patientId,
      name: 'Patient User',
      email: 'patient@example.com',
      role: UserRole.PATIENT,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(patientId.toString(), patientUser);
    patientToken = signToken({ id: patientId.toString(), role: UserRole.PATIENT });

    // Nurse
    const nurseId = new mongoose.Types.ObjectId();
    nurseUser = {
      _id: nurseId,
      name: 'Nurse Priya',
      email: 'nurse@phc.gov.in',
      role: UserRole.NURSE,
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(nurseId.toString(), nurseUser);
    nurseToken = signToken({ id: nurseId.toString(), role: UserRole.NURSE });

    // Medical Officer Facility A
    const moId = new mongoose.Types.ObjectId();
    medicalOfficerFacA = {
      _id: moId,
      name: 'Dr. Medical Officer FacA',
      email: 'mo.faca@phc.gov.in',
      role: UserRole.MEDICAL_OFFICER,
      facilityId: 'FACILITY_A',
      isActive: true,
      isDeleted: false,
    };
    mockUsers.set(moId.toString(), medicalOfficerFacA);
    medicalOfficerFacAToken = signToken({ id: moId.toString(), role: UserRole.MEDICAL_OFFICER });

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

    // Spies setup
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
          return Promise.resolve(c) as unknown as ReturnType<typeof Case.findOne>;
        }
      }
      return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOne>;
    });

    vi.spyOn(Case, 'findOneAndUpdate').mockImplementation((filter: unknown, update: unknown, options: unknown) => {
      const f = filter as {
        _id?: string | mongoose.Types.ObjectId;
        slaDueAt?: { $lte?: Date };
        escalatedAt?: null;
        isDeleted?: boolean;
      };
      const u = update as { $set: { escalatedAt: Date; escalationLevel: number } };
      const opts = options as { new?: boolean };
      const c = mockCases.get(f._id?.toString() || '');

      if (!c || c.isDeleted) return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOneAndUpdate>;

      if (f.escalatedAt === null && c.escalatedAt != null) {
        return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOneAndUpdate>;
      }

      if (f.slaDueAt?.$lte && c.slaDueAt && c.slaDueAt > f.slaDueAt.$lte) {
        return Promise.resolve(null) as unknown as ReturnType<typeof Case.findOneAndUpdate>;
      }

      const prev = { ...c };
      c.escalatedAt = u.$set.escalatedAt;
      c.escalationLevel = u.$set.escalationLevel;
      mockCases.set(c._id!.toString(), c);

      return Promise.resolve(opts?.new ? c : prev) as unknown as ReturnType<typeof Case.findOneAndUpdate>;
    });

    vi.spyOn(Case, 'updateOne').mockImplementation((filter: unknown, update: unknown) => {
      const f = filter as { _id?: string | mongoose.Types.ObjectId };
      const u = update as { $set: { escalatedAt: Date | null; escalationLevel?: number } };
      const c = mockCases.get(f._id?.toString() || '');
      if (c) {
        c.escalatedAt = u.$set.escalatedAt === null ? null : u.$set.escalatedAt;
        c.escalationLevel = u.$set.escalationLevel || 0;
        mockCases.set(c._id!.toString(), c);
      }
      return Promise.resolve({ matchedCount: 1, modifiedCount: 1 }) as unknown as ReturnType<typeof Case.updateOne>;
    });

    vi.spyOn(Case, 'find').mockImplementation((query: unknown) => {
      const q = query as {
        facilityId?: string;
        slaDueAt?: { $lte?: Date; $gt?: Date };
        escalatedAt?: null | { $ne?: null };
        isDeleted?: boolean;
        $expr?: unknown;
      };
      let list = Array.from(mockCases.values()).filter((c) => !c.isDeleted);

      if (q.facilityId) {
        list = list.filter((c) => c.facilityId === q.facilityId);
      }
      if (q.escalatedAt === null) {
        list = list.filter((c) => c.escalatedAt == null);
      } else if (q.escalatedAt && typeof q.escalatedAt === 'object' && '$ne' in q.escalatedAt) {
        list = list.filter((c) => c.escalatedAt != null);
      }
      if (q.slaDueAt && '$lte' in q.slaDueAt && q.slaDueAt.$lte) {
        const lte = q.slaDueAt.$lte;
        list = list.filter((c) => c.slaDueAt && c.slaDueAt <= lte);
      } else if (q.slaDueAt && '$gt' in q.slaDueAt && q.slaDueAt.$gt) {
        const gt = q.slaDueAt.$gt;
        list = list.filter((c) => c.slaDueAt && c.slaDueAt > gt);
      }

      const chain = {
        sort: () => chain,
        skip: () => chain,
        limit: () => Promise.resolve(list),
        select: () => Promise.resolve(list),
        then: (resolve: (val: unknown) => void) => resolve(list),
      };
      return chain as unknown as ReturnType<typeof Case.find>;
    });

    vi.spyOn(Case, 'countDocuments').mockImplementation((query: unknown) => {
      const q = query as { facilityId?: string; escalatedAt?: { $ne?: null }; isDeleted?: boolean };
      let list = Array.from(mockCases.values()).filter((c) => !c.isDeleted);

      if (q.facilityId) {
        list = list.filter((c) => c.facilityId === q.facilityId);
      }
      if (q.escalatedAt && '$ne' in q.escalatedAt) {
        list = list.filter((c) => c.escalatedAt != null);
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

  describe('SLA Policy Calculation & State Precedence', () => {
    it('1. should calculate deterministic SLA due timestamps for ROUTINE, PRIORITY, and URGENT', () => {
      const baseTime = new Date('2026-09-23T10:00:00.000Z');

      const routineDue = SlaService.calculateSlaDueAt({ createdAt: baseTime, priority: CasePriority.ROUTINE });
      expect(routineDue.getTime() - baseTime.getTime()).toBe(24 * 60 * 60 * 1000);

      const priorityDue = SlaService.calculateSlaDueAt({ createdAt: baseTime, priority: CasePriority.PRIORITY });
      expect(priorityDue.getTime() - baseTime.getTime()).toBe(4 * 60 * 60 * 1000);

      const urgentDue = SlaService.calculateSlaDueAt({ createdAt: baseTime, priority: CasePriority.URGENT });
      expect(urgentDue.getTime() - baseTime.getTime()).toBe(60 * 60 * 1000);
    });

    it('2. should enforce SLA display status precedence: ESCALATED > OVERDUE > DUE_SOON > PENDING', () => {
      const createdAt = new Date('2026-09-23T10:00:00.000Z');
      const slaDueAt = new Date('2026-09-24T10:00:00.000Z'); // 24h duration

      // Case 1: Pending (> 25% window remaining)
      const nowPending = new Date('2026-09-23T12:00:00.000Z'); // 22h remaining (91.6%)
      expect(SlaService.deriveSlaStatus({ createdAt, slaDueAt, priority: CasePriority.ROUTINE }, nowPending)).toBe(SlaStatus.PENDING);

      // Case 2: Due Soon (<= 25% window remaining)
      const nowDueSoon = new Date('2026-09-24T05:00:00.000Z'); // 5h remaining (20.8%)
      expect(SlaService.deriveSlaStatus({ createdAt, slaDueAt, priority: CasePriority.ROUTINE }, nowDueSoon)).toBe(SlaStatus.DUE_SOON);

      // Case 3: Overdue (slaDueAt passed)
      const nowOverdue = new Date('2026-09-24T11:00:00.000Z'); // 1h past dueAt
      expect(SlaService.deriveSlaStatus({ createdAt, slaDueAt, priority: CasePriority.ROUTINE }, nowOverdue)).toBe(SlaStatus.OVERDUE);

      // Case 4: Escalated (takes precedence even if overdue)
      const escalatedCase = { createdAt, slaDueAt, escalatedAt: new Date('2026-09-24T11:05:00.000Z'), priority: CasePriority.ROUTINE };
      expect(SlaService.deriveSlaStatus(escalatedCase, nowOverdue)).toBe(SlaStatus.ESCALATED);
    });
  });

  describe('POST /api/reviewer/sla/process — Batch Processing & Authorization', () => {
    it('3. should reject unauthenticated or non-authorized role requests (PATIENT, NURSE) with 401/403', async () => {
      // Unauthenticated
      const unauthRes = await request(app).post('/api/reviewer/sla/process');
      expect(unauthRes.status).toBe(401);

      // PATIENT role
      const patientRes = await request(app)
        .post('/api/reviewer/sla/process')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(patientRes.status).toBe(403);

      // NURSE role
      const nurseRes = await request(app)
        .post('/api/reviewer/sla/process')
        .set('Authorization', `Bearer ${nurseToken}`);
      expect(nurseRes.status).toBe(403);
    });

    it('4. should allow ADMIN to process overdue SLAs system-wide and create CASE_SLA_ESCALATED audit events', async () => {
      const overdueCaseId = new mongoose.Types.ObjectId();
      const overdueCase: ICase = {
        _id: overdueCaseId,
        caseNumber: 'CAS-20260923-9999',
        patientId: patientUser._id!,
        status: CaseStatus.OPEN,
        priority: CasePriority.ROUTINE,
        intakeSource: IntakeSource.TEXT,
        language: 'en',
        chiefComplaint: 'Overdue case for testing',
        slaDueAt: new Date('2026-09-22T10:00:00.000Z'), // Past deadline
        escalatedAt: null,
        escalationLevel: 0,
        isDeleted: false,
      };
      mockCases.set(overdueCaseId.toString(), overdueCase);

      const res = await request(app)
        .post('/api/reviewer/sla/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processed).toBeGreaterThanOrEqual(1);

      // Verify case state updated
      const updated = mockCases.get(overdueCaseId.toString());
      expect(updated?.escalatedAt).toBeDefined();
      expect(updated?.escalationLevel).toBe(1);

      // Verify Case.priority is UNCHANGED (Clinical Independence Boundary)
      expect(updated?.priority).toBe(CasePriority.ROUTINE);

      // Verify Audit Log entry created
      const audit = Array.from(mockAuditLogs.values()).find((a) => a.action === AuditEventType.CASE_SLA_ESCALATED);
      expect(audit).toBeDefined();
      expect(audit?.metadata).toHaveProperty('escalationLevel', 1);
    });

    it('5. should restrict MEDICAL_OFFICER processing to their authorized facility scope', async () => {
      // Case in Facility A
      const facACaseId = new mongoose.Types.ObjectId();
      mockCases.set(facACaseId.toString(), {
        _id: facACaseId,
        caseNumber: 'CAS-FAC-A',
        patientId: patientUser._id!,
        facilityId: 'FACILITY_A',
        status: CaseStatus.OPEN,
        priority: CasePriority.ROUTINE,
        intakeSource: IntakeSource.TEXT,
        language: 'en',
        chiefComplaint: 'Facility A Case',
        slaDueAt: new Date('2026-09-22T10:00:00.000Z'),
        escalatedAt: null,
        escalationLevel: 0,
        isDeleted: false,
      });

      // Case in Facility B
      const facBCaseId = new mongoose.Types.ObjectId();
      mockCases.set(facBCaseId.toString(), {
        _id: facBCaseId,
        caseNumber: 'CAS-FAC-B',
        patientId: patientUser._id!,
        facilityId: 'FACILITY_B',
        status: CaseStatus.OPEN,
        priority: CasePriority.ROUTINE,
        intakeSource: IntakeSource.TEXT,
        language: 'en',
        chiefComplaint: 'Facility B Case',
        slaDueAt: new Date('2026-09-22T10:00:00.000Z'),
        escalatedAt: null,
        escalationLevel: 0,
        isDeleted: false,
      });

      // Medical Officer Facility A runs processor
      const res = await request(app)
        .post('/api/reviewer/sla/process')
        .set('Authorization', `Bearer ${medicalOfficerFacAToken}`);

      expect(res.status).toBe(200);

      // Facility A case escalated
      const facAUpdated = mockCases.get(facACaseId.toString());
      expect(facAUpdated?.escalatedAt).toBeDefined();

      // Facility B case UNCHANGED (MO cannot escalate cases outside their facility)
      const facBUpdated = mockCases.get(facBCaseId.toString());
      expect(facBUpdated?.escalatedAt).toBeNull();
    });

    it('6. Idempotency & Concurrency: Re-running processor against already escalated case produces 0 new audit events', async () => {
      const overdueCaseId = new mongoose.Types.ObjectId();
      mockCases.set(overdueCaseId.toString(), {
        _id: overdueCaseId,
        caseNumber: 'CAS-IDEM-1',
        patientId: patientUser._id!,
        status: CaseStatus.OPEN,
        priority: CasePriority.ROUTINE,
        intakeSource: IntakeSource.TEXT,
        language: 'en',
        chiefComplaint: 'Idempotency test case',
        slaDueAt: new Date('2026-09-22T10:00:00.000Z'),
        escalatedAt: null,
        escalationLevel: 0,
        isDeleted: false,
      });

      // First run
      const res1 = await request(app)
        .post('/api/reviewer/sla/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.escalated).toBe(1);
      const auditCountFirst = Array.from(mockAuditLogs.values()).filter(
        (a) => a.action === AuditEventType.CASE_SLA_ESCALATED
      ).length;
      expect(auditCountFirst).toBe(1);

      // Second run (Idempotency check)
      const res2 = await request(app)
        .post('/api/reviewer/sla/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.escalated).toBe(0);

      // Verify no duplicate audit log entry was created
      const auditCountSecond = Array.from(mockAuditLogs.values()).filter(
        (a) => a.action === AuditEventType.CASE_SLA_ESCALATED
      ).length;
      expect(auditCountSecond).toBe(1);
    });

    it('7. Partial Failure Protection: Should revert escalation state and track failure count if AuditLog creation fails', async () => {
      const overdueCaseId = new mongoose.Types.ObjectId();
      mockCases.set(overdueCaseId.toString(), {
        _id: overdueCaseId,
        caseNumber: 'CAS-FAIL-1',
        patientId: patientUser._id!,
        status: CaseStatus.OPEN,
        priority: CasePriority.ROUTINE,
        intakeSource: IntakeSource.TEXT,
        language: 'en',
        chiefComplaint: 'Audit failure test case',
        slaDueAt: new Date('2026-09-22T10:00:00.000Z'),
        escalatedAt: null,
        escalationLevel: 0,
        isDeleted: false,
      });

      // Force AuditLog save to fail
      vi.spyOn(AuditLog.prototype, 'save').mockRejectedValueOnce(new Error('Audit DB write error'));

      const res = await request(app)
        .post('/api/reviewer/sla/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.escalated).toBe(0);

      // Case state should be reverted to unescalated
      const caseDoc = mockCases.get(overdueCaseId.toString());
      expect(caseDoc?.escalatedAt).toBeNull();
    });
  });
});
