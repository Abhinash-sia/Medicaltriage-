import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { Case } from '../src/modules/cases/case.model.js';
import { CaseStatus, CasePriority, IntakeSource } from '../src/modules/cases/case.types.js';
import { Report } from '../src/modules/reports/report.model.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import { signToken } from '../src/modules/auth/auth.utils.js';
import { StorageService } from '../src/modules/storage/storage.service.js';
import { MockOcrProvider } from '../src/modules/ocr/mock-ocr.provider.js';
import { AuditEventType } from '../src/modules/audit/audit-log.types.js';
import { ReportProcessingStatus, ReportVerificationStatus } from '../src/modules/reports/report.types.js';

const app = createApp();
const testStorageDir = './uploads/test_reports';
const storageService = new StorageService(testStorageDir);

describe('Phase 11 — Reports & OCR Implementation Suite', () => {
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

  // Helper buffers for testing magic-bytes
  const validPdfBuffer = Buffer.concat([
    Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Title (Test Report)\n>>\nendobj\n'),
    Buffer.from('MOCK_LAB_RESULTS'),
  ]);

  const validPngBuffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('MOCK_IMAGE_CONTENT'),
  ]);

  const validJpgBuffer = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]),
    Buffer.from('MOCK_IMAGE_CONTENT'),
  ]);

  const invalidExtensionBuffer = Buffer.from('console.log("malicious shell");');

  const spoofedPdfBuffer = Buffer.from('THIS_IS_NOT_A_PDF_HEADER_JUST_PLAIN_TEXT');

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
    await Report.deleteMany({});
    await AuditLog.deleteMany({});
    MockOcrProvider.reset();

    facilityAId = new mongoose.Types.ObjectId();
    facilityBId = new mongoose.Types.ObjectId();

    patientAUser = await User.create({
      name: 'Patient A OCR',
      email: `patientA_ocr_${Date.now()}_${Math.random()}@example.com`,
      passwordHash: 'hash123',
      role: UserRole.PATIENT,
      isActive: true,
    });

    patientBUser = await User.create({
      name: 'Patient B OCR',
      email: `patientB_ocr_${Date.now()}_${Math.random()}@example.com`,
      passwordHash: 'hash123',
      role: UserRole.PATIENT,
      isActive: true,
    });

    reviewerFacilityA = await User.create({
      name: 'Reviewer Facility A OCR',
      email: `reviewerA_ocr_${Date.now()}_${Math.random()}@facilityA.org`,
      passwordHash: 'hash123',
      role: UserRole.DOCTOR,
      facilityId: facilityAId.toString(),
      isActive: true,
    });

    reviewerFacilityB = await User.create({
      name: 'Reviewer Facility B OCR',
      email: `reviewerB_ocr_${Date.now()}_${Math.random()}@facilityB.org`,
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
      caseNumber: `CASE-OCR-A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId: patientAUser._id,
      facilityId: facilityAId.toString(),
      chiefComplaint: 'Chest pain and cough',
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
    });

    caseFacilityB = await Case.create({
      caseNumber: `CASE-OCR-B-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId: patientBUser._id,
      facilityId: facilityBId.toString(),
      chiefComplaint: 'Abdominal cramping',
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      language: 'en',
    });
  });

  describe('1. File Storage & Magic Byte Security Validation', () => {
    it('validates magic bytes for PDF, PNG, and JPEG files', () => {
      const pdfValid = storageService.validateFile(validPdfBuffer, 'application/pdf', 'lab_report.pdf');
      expect(pdfValid.isValid).toBe(true);

      const pngValid = storageService.validateFile(validPngBuffer, 'image/png', 'scan.png');
      expect(pngValid.isValid).toBe(true);

      const jpgValid = storageService.validateFile(validJpgBuffer, 'image/jpeg', 'photo.jpg');
      expect(jpgValid.isValid).toBe(true);
    });

    it('rejects spoofed file where magic bytes do not match PDF signature', () => {
      const validation = storageService.validateFile(spoofedPdfBuffer, 'application/pdf', 'fake.pdf');
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('does not match any allowed file signature');
    });

    it('rejects forbidden file extension', () => {
      const validation = storageService.validateFile(invalidExtensionBuffer, 'application/javascript', 'script.js');
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Unsupported file extension');
    });

    it('rejects path traversal in storageKey retrieval', () => {
      expect(() => {
        storageService.getReadStream('../../etc/passwd');
      }).toThrow('Path traversal attempt detected');
    });
  });

  describe('2. Report Upload & OCR Processing Workflow', () => {
    it('successfully uploads report file, executes mock OCR, and sets statuses', async () => {
      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validPdfBuffer, {
          filename: 'lab_results.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.report).toBeDefined();

      const report = res.body.data.report;
      expect(report.caseId.toString()).toBe(caseFacilityA._id.toString());
      expect(report.originalFilename).toBe('lab_results.pdf');
      expect(report.processingStatus).toBe(ReportProcessingStatus.PROCESSED);
      expect(report.verificationStatus).toBe(ReportVerificationStatus.REQUIRED);
      expect(report.ocrUsable).toBe(true);
      expect(report.extractedText).toContain('Hemoglobin: 8.2 g/dL');
      expect(report.storageKey).toMatch(/^reports\/[a-f0-9-]+.pdf$/);

      // Verify Audit Logs generated
      const auditLogs = await AuditLog.find({ caseId: caseFacilityA._id });
      const actions = auditLogs.map((log) => log.action);
      expect(actions).toContain(AuditEventType.REPORT_UPLOADED);
      expect(actions).toContain(AuditEventType.REPORT_OCR_STARTED);
      expect(actions).toContain(AuditEventType.REPORT_OCR_PROCESSED);
    });

    it('handles empty OCR text output explicitly without failing', async () => {
      const emptyOcrPdf = Buffer.concat([
        Buffer.from('%PDF-1.4\n1 0 obj\nendobj\n'),
        Buffer.from('MOCK_EMPTY_OCR'),
      ]);

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', emptyOcrPdf, {
          filename: 'blank_scan.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      const report = res.body.data.report;
      expect(report.processingStatus).toBe(ReportProcessingStatus.PROCESSED);
      expect(report.extractedText).toBe('');
      expect(report.ocrUsable).toBe(false);
      expect(report.verificationStatus).toBe(ReportVerificationStatus.REQUIRED);
    });

    it('handles OCR engine failure gracefully', async () => {
      const failOcrPdf = Buffer.concat([
        Buffer.from('%PDF-1.4\n1 0 obj\nendobj\n'),
        Buffer.from('MOCK_FAIL_OCR'),
      ]);

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', failOcrPdf, {
          filename: 'corrupted.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      const report = res.body.data.report;
      expect(report.processingStatus).toBe(ReportProcessingStatus.FAILED);
      expect(report.ocrUsable).toBe(false);
      expect(report.processingError).toBeDefined();

      const auditLogs = await AuditLog.find({
        caseId: caseFacilityA._id,
        action: AuditEventType.REPORT_OCR_FAILED,
      });
      expect(auditLogs.length).toBe(1);
    });
  });

  describe('3. Case-Scoped Idempotency', () => {
    it('deduplicates exact same file uploaded twice to the SAME case', async () => {
      const res1 = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validPdfBuffer, {
          filename: 'lab_report.pdf',
          contentType: 'application/pdf',
        });

      expect(res1.status).toBe(201);
      const report1 = res1.body.data.report;

      // Upload identical file again to same case
      const res2 = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validPdfBuffer, {
          filename: 'lab_report.pdf',
          contentType: 'application/pdf',
        });

      expect(res2.status).toBe(201);
      const report2 = res2.body.data.report;

      expect(report1._id.toString()).toBe(report2._id.toString());

      const count = await Report.countDocuments({ caseId: caseFacilityA._id });
      expect(count).toBe(1);
    });

    it('allows same file content to be uploaded to DIFFERENT cases independently', async () => {
      const res1 = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validPdfBuffer, {
          filename: 'lab_report.pdf',
          contentType: 'application/pdf',
        });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post(`/api/cases/${caseFacilityB._id}/reports`)
        .set('Authorization', `Bearer ${patientBToken}`)
        .attach('file', validPdfBuffer, {
          filename: 'lab_report.pdf',
          contentType: 'application/pdf',
        });
      expect(res2.status).toBe(201);

      expect(res1.body.data.report._id.toString()).not.toBe(res2.body.data.report._id.toString());
    });
  });

  describe('4. Explicit Cross-User & Facility Isolation Tests', () => {
    let reportAId: string;

    beforeEach(async () => {
      const uploadRes = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validPdfBuffer, {
          filename: 'patientA_report.pdf',
          contentType: 'application/pdf',
        });
      reportAId = uploadRes.body.data.report._id.toString();
    });

    it('Patient A can fetch metadata for Report A', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportAId}`)
        .set('Authorization', `Bearer ${patientAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.report._id.toString()).toBe(reportAId);
    });

    it('Patient B requesting Patient A report metadata is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportAId}`)
        .set('Authorization', `Bearer ${patientBToken}`);
      expect(res.status).toBe(403);
    });

    it('Patient B requesting Patient A report file download is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportAId}/file`)
        .set('Authorization', `Bearer ${patientBToken}`);
      expect(res.status).toBe(403);
    });

    it('Facility A reviewer can access Facility A report file download', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportAId}/file`)
        .set('Authorization', `Bearer ${reviewerFacilityAToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('Facility B reviewer requesting Facility A report metadata is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportAId}`)
        .set('Authorization', `Bearer ${reviewerFacilityBToken}`);
      expect(res.status).toBe(403);
    });

    it('Facility B reviewer requesting Facility A report file download is DENIED (403)', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportAId}/file`)
        .set('Authorization', `Bearer ${reviewerFacilityBToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('5. Human Verification Workflow', () => {
    let reportId: string;

    beforeEach(async () => {
      const uploadRes = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', validPdfBuffer, {
          filename: 'lab_report.pdf',
          contentType: 'application/pdf',
        });
      reportId = uploadRes.body.data.report._id.toString();
    });

    it('allows authorized reviewer to verify report OCR output', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/verify`)
        .set('Authorization', `Bearer ${reviewerFacilityAToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data.report;
      expect(report.verificationStatus).toBe(ReportVerificationStatus.VERIFIED);
      expect(report.verifiedBy.toString()).toBe(reviewerFacilityA._id.toString());
      expect(report.verifiedAt).toBeDefined();

      const auditLogs = await AuditLog.find({
        resourceId: reportId,
        action: AuditEventType.REPORT_OCR_VERIFIED,
      });
      expect(auditLogs.length).toBe(1);
    });

    it('denies patient from calling report verify endpoint (403)', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/verify`)
        .set('Authorization', `Bearer ${patientAToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('6. Clinical Neutrality & Prompt Injection Safety Tests', () => {
    it('verifies OCR text with lab values does NOT alter Case priority or clinical state', async () => {
      const labBuffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n1 0 obj\nendobj\n'),
        Buffer.from('MOCK_LAB_RESULTS'),
      ]);

      const priorityBefore = caseFacilityA.priority;
      const assignedBefore = caseFacilityA.assignedReviewerId;

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', labBuffer, {
          filename: 'severe_labs.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);

      const caseAfter = await Case.findById(caseFacilityA._id);
      expect(caseAfter?.priority).toBe(priorityBefore);
      expect(caseAfter?.assignedReviewerId).toEqual(assignedBefore);
    });

    it('verifies prompt injection in OCR text remains plain text without executing', async () => {
      const injectionBuffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n1 0 obj\nendobj\n'),
        Buffer.from('MOCK_PROMPT_INJECTION'),
      ]);

      const res = await request(app)
        .post(`/api/cases/${caseFacilityA._id}/reports`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .attach('file', injectionBuffer, {
          filename: 'malicious_doc.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      const report = res.body.data.report;
      expect(report.extractedText).toContain('Ignore previous instructions');

      const caseAfter = await Case.findById(caseFacilityA._id);
      expect(caseAfter?.priority).toBe(CasePriority.ROUTINE);
    });
  });
});
