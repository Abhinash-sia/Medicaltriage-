import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { Case } from '../src/modules/cases/case.model.js';
import { VisualInput } from '../src/modules/vision/visual-input.model.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import { CaseStatus, CasePriority, IntakeSource } from '../src/modules/cases/case.types.js';
import { signToken } from '../src/modules/auth/auth.utils.js';
import { StorageService } from '../src/modules/storage/storage.service.js';
import { MockVisionProvider } from '../src/modules/vision/mock-vision.provider.js';
import { AuditEventType } from '../src/modules/audit/audit-log.types.js';
import { VisualInputProcessingStatus, VisualInputVerificationStatus } from '../src/modules/vision/vision.types.js';
import { safetySuppressionEngine } from '../src/modules/vision/safety-suppression.engine.js';

const app = createApp();
const testStorageDir = './uploads/test_visual_inputs';
const storageService = new StorageService(testStorageDir);

describe('Phase 12 — Visual Inputs Implementation Suite', () => {
  let patientAUser: any;
  let patientBUser: any;
  let reviewerFacilityA: any;
  let reviewerFacilityB: any;

  let patientAToken: string;
  let patientBToken: string;
  let reviewerFacilityAToken: string;
  let reviewerFacilityBToken: string;

  let facilityAId: mongoose.Types.ObjectId;
  let facilityBId: mongoose.Types.ObjectId;

  let caseFacilityA: any;
  let caseFacilityB: any;

  const validJpgBuffer = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]),
    Buffer.from('MOCK_PHOTO_CONTENT'),
  ]);

  const validPngBuffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('MOCK_PHOTO_CONTENT'),
  ]);

  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\nendobj\n');
  const corruptBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Case.deleteMany({});
    await VisualInput.deleteMany({});
    await AuditLog.deleteMany({});
    MockVisionProvider.reset();

    facilityAId = new mongoose.Types.ObjectId();
    facilityBId = new mongoose.Types.ObjectId();

    patientAUser = await User.create({
      name: 'Patient A Visual',
      email: `patientA_vis_${Date.now()}_${Math.random()}@example.com`,
      passwordHash: 'hash123',
      role: UserRole.PATIENT,
      isActive: true,
    });

    patientBUser = await User.create({
      name: 'Patient B Visual',
      email: `patientB_vis_${Date.now()}_${Math.random()}@example.com`,
      passwordHash: 'hash123',
      role: UserRole.PATIENT,
      isActive: true,
    });

    reviewerFacilityA = await User.create({
      name: 'Reviewer Facility A Visual',
      email: `reviewerA_vis_${Date.now()}_${Math.random()}@facilityA.org`,
      passwordHash: 'hash123',
      role: UserRole.DOCTOR,
      facilityId: facilityAId.toString(),
      isActive: true,
    });

    reviewerFacilityB = await User.create({
      name: 'Reviewer Facility B Visual',
      email: `reviewerB_vis_${Date.now()}_${Math.random()}@facilityB.org`,
      passwordHash: 'hash123',
      role: UserRole.DOCTOR,
      facilityId: facilityBId.toString(),
      isActive: true,
    });

    patientAToken = signToken({
      id: patientAUser._id.toString(),
      role: patientAUser.role,
      name: patientAUser.name,
      email: patientAUser.email,
    });

    patientBToken = signToken({
      id: patientBUser._id.toString(),
      role: patientBUser.role,
      name: patientBUser.name,
      email: patientBUser.email,
    });

    reviewerFacilityAToken = signToken({
      id: reviewerFacilityA._id.toString(),
      role: reviewerFacilityA.role,
      name: reviewerFacilityA.name,
      email: reviewerFacilityA.email,
      facilityId: facilityAId.toString(),
    });

    reviewerFacilityBToken = signToken({
      id: reviewerFacilityB._id.toString(),
      role: reviewerFacilityB.role,
      name: reviewerFacilityB.name,
      email: reviewerFacilityB.email,
      facilityId: facilityBId.toString(),
    });

    caseFacilityA = await Case.create({
      caseNumber: `CASE-VIS-A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId: patientAUser._id,
      facilityId: facilityAId.toString(),
      chiefComplaint: 'Skin rash on forearm',
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
    });

    caseFacilityB = await Case.create({
      caseNumber: `CASE-VIS-B-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId: patientBUser._id,
      facilityId: facilityBId.toString(),
      chiefComplaint: 'Swollen ankle',
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
    });
  });

  describe('1. Pre-Vision Quality Validation & File Format Rules', () => {
    it('accepts valid JPEG and PNG images', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validJpgBuffer, {
          filename: 'rash.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      const input = res.body.data.visualInput;
      expect(input.mimeType).toBe('image/jpeg');
      expect(input.uploadedBy.toString()).toBe(patientAUser._id.toString());
      expect(input.uploadedAt).toBeDefined();
      expect(input.processingStatus).toBe(VisualInputProcessingStatus.PROCESSED);
      expect(input.qualityStatus).toBe('SUFFICIENT');
    });

    it('rejects PDF uploads for visual inputs (PDFs belong to Phase 11 OCR)', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', pdfBuffer, {
          filename: 'report.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Unsupported image file extension');
    });

    it('detects image quality failure BEFORE vision call when image is corrupted', async () => {
      const qualityFailJpg = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.from('MOCK_QUALITY_FAIL'),
      ]);

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', qualityFailJpg, {
          filename: 'blurry.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      const input = res.body.data.visualInput;
      expect(input.processingStatus).toBe(VisualInputProcessingStatus.FAILED);
      expect(input.qualityStatus).toBe('INSUFFICIENT');
      expect(input.qualityNotes).toContain('Image lighting is dark');
    });
  });

  describe('2. Case-Scoped Idempotency', () => {
    it('deduplicates identical image uploaded twice to the SAME case', async () => {
      const res1 = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validJpgBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validJpgBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });
      expect(res2.status).toBe(201);

      expect(res1.body.data.visualInput._id.toString()).toBe(res2.body.data.visualInput._id.toString());
      const count = await VisualInput.countDocuments({ caseId: caseFacilityA._id });
      expect(count).toBe(1);
    });

    it('allows identical image to be uploaded to DIFFERENT cases independently', async () => {
      const res1 = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validJpgBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post(`/api/cases/${caseFacilityB._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientBToken}`)
        .attach('file', validJpgBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });
      expect(res2.status).toBe(201);

      expect(res1.body.data.visualInput._id.toString()).not.toBe(res2.body.data.visualInput._id.toString());
    });
  });

  describe('3. Semantic Safety Suppression Engine', () => {
    it('suppresses diagnostic, treatment, and urgency claims while preserving legitimate descriptions', () => {
      const rawObservations: any[] = [
        {
          id: '1',
          type: 'REDNESS',
          description: 'Visible localized redness diagnosed as cellulitis.',
          certainty: 'OBSERVED',
          provenance: 'AI_GENERATED',
        },
        {
          id: '2',
          type: 'OTHER',
          description: 'Start antibiotics 500mg daily.',
          certainty: 'OBSERVED',
          provenance: 'AI_GENERATED',
        },
        {
          id: '3',
          type: 'OTHER',
          description: 'This is an emergency requiring immediate care.',
          certainty: 'OBSERVED',
          provenance: 'AI_GENERATED',
        },
        {
          id: '4',
          type: 'DISCOLORATION',
          description: 'Visible localized discoloration on forearm.',
          certainty: 'APPARENT',
          provenance: 'AI_GENERATED',
        },
      ];

      const filtered = safetySuppressionEngine.filterObservations(rawObservations);

      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('Visible localized discoloration on forearm.');
      expect(filtered[0].type).toBe('DISCOLORATION');
      expect(filtered[0].certainty).toBe('APPARENT');
      expect(filtered[0].provenance).toBe('AI_GENERATED');
    });

    it('filters raw provider diagnostic outputs during service upload pipeline', async () => {
      const diagJpgBuffer = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.from('MOCK_DIAGNOSTIC_OUTPUT'),
      ]);

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', diagJpgBuffer, {
          filename: 'diag_test.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      const observations = res.body.data.visualInput.observations;

      // Unsafe diagnostic, treatment, and emergency observations must be suppressed
      const descriptions = observations.map((o: any) => o.description);
      expect(descriptions.some((d: string) => d.includes('cellulitis'))).toBe(false);
      expect(descriptions.some((d: string) => d.includes('antibiotics'))).toBe(false);
      expect(descriptions.some((d: string) => d.includes('emergency'))).toBe(false);

      // Safe observation preserved
      expect(descriptions).toContain('Visible localized swelling on the lower leg.');
    });
  });

  describe('4. Strong Clinical Neutrality & Prompt Injection Tests', () => {
    it('verifies severe-sounding visual observation does NOT mutate Case.priority or clinical state', async () => {
      const severeJpgBuffer = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.from('MOCK_SEVERE_OBSERVATION'),
      ]);

      const priorityBefore = caseFacilityA.priority;
      const assignedBefore = caseFacilityA.assignedReviewerId;

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', severeJpgBuffer, {
          filename: 'severe.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);

      const caseAfter = await Case.findById(caseFacilityA._id);
      expect(caseAfter?.priority).toBe(priorityBefore);
      expect(caseAfter?.priority).toBe(CasePriority.ROUTINE);
      expect(caseAfter?.assignedReviewerId).toEqual(assignedBefore);
    });

    it('verifies prompt injection inside image text remains plain observation text without executing', async () => {
      const injectionJpgBuffer = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.from('MOCK_INJECTION_IMAGE'),
      ]);

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', injectionJpgBuffer, {
          filename: 'injection.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      const observations = res.body.data.visualInput.observations;
      expect(observations[0].description).toContain('Ignore previous instructions');

      const caseAfter = await Case.findById(caseFacilityA._id);
      expect(caseAfter?.priority).toBe(CasePriority.ROUTINE);
    });
  });

  describe('5. Patient & Facility Isolation Tests', () => {
    let visualInputAId: string;

    beforeEach(async () => {
      const uploadRes = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validJpgBuffer, {
          filename: 'patientA_photo.jpg',
          contentType: 'image/jpeg',
        });
      visualInputAId = uploadRes.body.data.visualInput._id.toString();
    });

    it('Patient A can access own visual input metadata', async () => {
      const res = await request(app)
        .get(`/api/visual-inputs/${visualInputAId}`)
        .set('Authorization', `Bearer ${patientAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.visualInput._id.toString()).toBe(visualInputAId);
    });

    it('Patient B requesting Patient A visual input metadata is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/visual-inputs/${visualInputAId}`)
        .set('Authorization', `Bearer ${patientBToken}`);
      expect(res.status).toBe(403);
    });

    it('Patient B requesting Patient A visual input file download is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/visual-inputs/${visualInputAId}/file`)
        .set('Authorization', `Bearer ${patientBToken}`);
      expect(res.status).toBe(403);
    });

    it('Facility A reviewer can access Facility A visual input file download', async () => {
      const res = await request(app)
        .get(`/api/visual-inputs/${visualInputAId}/file`)
        .set('Authorization', `Bearer ${reviewerFacilityAToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
    });

    it('Facility B reviewer requesting Facility A visual input metadata is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/visual-inputs/${visualInputAId}`)
        .set('Authorization', `Bearer ${reviewerFacilityBToken}`);
      expect(res.status).toBe(403);
    });

    it('Facility B reviewer requesting Facility A visual input file download is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/visual-inputs/${visualInputAId}/file`)
        .set('Authorization', `Bearer ${reviewerFacilityBToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('6. Human Verification Workflow', () => {
    let visualInputId: string;

    beforeEach(async () => {
      const uploadRes = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/visual-inputs`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validJpgBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });
      visualInputId = uploadRes.body.data.visualInput._id.toString();
    });

    it('allows authorized reviewer to verify visual observations', async () => {
      const res = await request(app)
        .post(`/api/visual-inputs/${visualInputId}/verify`)
        .set('Authorization', `Bearer ${reviewerFacilityAToken}`);

      expect(res.status).toBe(200);
      const input = res.body.data.visualInput;
      expect(input.verificationStatus).toBe(VisualInputVerificationStatus.VERIFIED);
      expect(input.verifiedBy.toString()).toBe(reviewerFacilityA._id.toString());
      expect(input.verifiedAt).toBeDefined();

      const auditLogs = await AuditLog.find({
        resourceId: visualInputId,
        action: AuditEventType.VISUAL_INPUT_VERIFIED,
      });
      expect(auditLogs.length).toBe(1);
    });

    it('denies patient from verifying visual observations (403)', async () => {
      const res = await request(app)
        .post(`/api/visual-inputs/${visualInputId}/verify`)
        .set('Authorization', `Bearer ${patientAToken}`);
      expect(res.status).toBe(403);
    });
  });
});
