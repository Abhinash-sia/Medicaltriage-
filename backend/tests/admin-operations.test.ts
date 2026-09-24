import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import { Facility } from '../src/modules/facilities/facility.model.js';
import { FacilityType } from '../src/modules/facilities/facility.types.js';
import { Case } from '../src/modules/cases/case.model.js';
import { CaseStatus, CasePriority, IntakeSource } from '../src/modules/cases/case.types.js';

const app = createApp();

describe('Phase 19 — Admin Operations & Facility Management Test Suite', () => {
  let adminId: string;
  let adminToken: string;
  let nurseId: string;
  let nurseToken: string;
  let patientToken: string;
  let targetReviewerId: string;
  let testFacilityId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    await Facility.deleteMany({});
    await User.deleteMany({ email: { $in: ['admin.ops@example.com', 'nurse.ops@example.com', 'patient.ops@example.com', 'target.reviewer@example.com'] } });

    // 1. Admin User
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.ops@example.com',
      passwordHash: 'secret_hash',
      role: UserRole.ADMIN,
      facilityId: 'HQ-FACILITY',
      isActive: true,
      isDeleted: false,
    });
    adminId = adminUser._id.toString();
    adminToken = jwt.sign({ id: adminId, role: UserRole.ADMIN }, env.JWT_SECRET);

    // 2. Nurse User (Reviewer)
    const nurseUser = await User.create({
      name: 'Staff Nurse',
      email: 'nurse.ops@example.com',
      passwordHash: 'secret_hash',
      role: UserRole.NURSE,
      facilityId: 'PHC-BALASORE',
      isActive: true,
      isDeleted: false,
    });
    nurseId = nurseUser._id.toString();
    nurseToken = jwt.sign({ id: nurseId, role: UserRole.NURSE }, env.JWT_SECRET);

    // 3. Patient User
    const patientUser = await User.create({
      name: 'Regular Patient',
      email: 'patient.ops@example.com',
      passwordHash: 'secret_hash',
      role: UserRole.PATIENT,
      isActive: true,
      isDeleted: false,
    });
    patientToken = jwt.sign({ id: patientUser._id.toString(), role: UserRole.PATIENT }, env.JWT_SECRET);

    // 4. Target Reviewer for Deactivation/Reactivation
    const targetReviewer = await User.create({
      name: 'Dr. Target Deactivate',
      email: 'target.reviewer@example.com',
      passwordHash: 'secret_hash',
      role: UserRole.DOCTOR,
      facilityId: 'PHC-BALASORE',
      isActive: true,
      isDeleted: false,
    });
    targetReviewerId = targetReviewer._id.toString();

    // 5. Seed Facility
    const fac = await Facility.create({
      name: 'Balasore Primary Health Centre',
      code: 'PHC-BLS',
      type: FacilityType.PHC,
      district: 'Balasore',
      state: 'Odisha',
      supportedLanguages: ['en', 'or', 'hi'],
      active: true,
    });
    testFacilityId = fac._id.toString();
  });

  describe('User Management Operations', () => {
    it('GET /api/admin/users should return paginated users for ADMIN and exclude password hashes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify NO password hash is exposed
      for (const u of res.body.data) {
        expect(u).not.toHaveProperty('passwordHash');
        expect(u).toHaveProperty('role');
        expect(u).toHaveProperty('isActive');
      }
    });

    it('GET /api/admin/users should deny access to non-admin roles', async () => {
      const nurseRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${nurseToken}`);
      expect(nurseRes.status).toBe(403);

      const patientRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(patientRes.status).toBe(403);
    });

    it('POST /api/admin/users/:id/deactivate should deactivate target user account', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetReviewerId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);

      const updated = await User.findById(targetReviewerId);
      expect(updated?.isActive).toBe(false);
    });

    it('should prohibit admin from deactivating their own account', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${adminId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ADMIN_SELF_DEACTIVATION_PROHIBITED');
    });

    it('POST /api/admin/users/:id/reactivate should reactivate target user account', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetReviewerId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(true);

      const updated = await User.findById(targetReviewerId);
      expect(updated?.isActive).toBe(true);
    });
  });

  describe('Facility Operations & Language Configuration', () => {
    it('GET /api/facilities should list facilities', async () => {
      const res = await request(app)
        .get('/api/facilities')
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((f: any) => f.code === 'PHC-BLS')).toBe(true);
    });

    it('POST /api/facilities should register a new facility by ADMIN', async () => {
      const res = await request(app)
        .post('/api/facilities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rourkela Government Hospital',
          code: 'RGH-01',
          type: FacilityType.GOVERNMENT_HOSPITAL,
          district: 'Sundargarh',
          state: 'Odisha',
          supportedLanguages: ['en', 'hi', 'or'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('RGH-01');
      expect(res.body.data.supportedLanguages).toEqual(['en', 'hi', 'or']);
    });

    it('PATCH /api/facilities/:id/languages should update supported languages', async () => {
      const res = await request(app)
        .patch(`/api/facilities/${testFacilityId}/languages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supportedLanguages: ['en', 'or', 'bn', 'hi'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supportedLanguages).toContain('bn');
      expect(res.body.data.supportedLanguages).toContain('or');
    });

    it('PATCH /api/facilities/:id/languages should reject unsupported language codes', async () => {
      const res = await request(app)
        .patch(`/api/facilities/${testFacilityId}/languages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supportedLanguages: ['en', 'klingon', 'valyrian'],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_LANGUAGE_CODE');
    });
  });

  describe('Operational Dashboard Metrics', () => {
    it('GET /api/admin/dashboard should return operational counts for ADMIN', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('openCases');
      expect(res.body.data).toHaveProperty('inReviewCases');
      expect(res.body.data).toHaveProperty('escalatedCases');
      expect(res.body.data).toHaveProperty('referredCases');
      expect(res.body.data).toHaveProperty('overdueCases');
      expect(res.body.data).toHaveProperty('unreadNotifications');
      expect(res.body.data).toHaveProperty('activeReviewers');
      expect(res.body.data).toHaveProperty('activeFacilities');
      expect(typeof res.body.data.activeReviewers).toBe('number');
      expect(typeof res.body.data.activeFacilities).toBe('number');
    });
  });
});
