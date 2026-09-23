import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  User,
  UserRole,
  Case,
  CaseStatus,
  CasePriority,
  IntakeSource,
  Symptom,
  InformationSource,
  Report,
  ReportProcessingStatus,
  TriageNote,
  NoteProvenance,
  GenerationStatus,
  Review,
  ReviewStatus,
  Consent,
  ConsentStatus,
  ConsentType,
  AuditLog,
  AuditEventType,
} from '../src/modules/index.js';

describe('Phase 2 Database Models Schema Validation Unit Tests', () => {
  describe('User Model', () => {
    it('should validate a valid User document', () => {
      const validUser = new User({
        name: 'Dr. Asha Sharma',
        email: 'asha.sharma@phc-health.gov.in',
        phone: '+919876543210',
        role: UserRole.DOCTOR,
        facilityId: 'PHC_RURAL_01',
      });

      const err = validUser.validateSync();
      expect(err).toBeUndefined();
      expect(validUser.role).toBe(UserRole.DOCTOR);
      expect(validUser.isActive).toBe(true);
    });

    it('should reject invalid User role enum values', () => {
      const invalidUser = new User({
        name: 'John Doe',
        role: 'SUPER_HERO' as UserRole,
      });

      const err = invalidUser.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['role']).toBeDefined();
    });

    it('should fail validation when required User name is missing', () => {
      const missingNameUser = new User({
        role: UserRole.PATIENT,
      });

      const err = missingNameUser.validateSync();
      expect(err?.errors['name']).toBeDefined();
    });
  });

  describe('Case Model', () => {
    it('should validate a valid Case document', () => {
      const validCase = new Case({
        caseNumber: 'CAS-2026-0001',
        patientId: new mongoose.Types.ObjectId(),
        status: CaseStatus.OPEN,
        priority: CasePriority.URGENT,
        intakeSource: IntakeSource.VOICE,
        chiefComplaint: 'Acute chest discomfort and shortness of breath',
      });

      const err = validCase.validateSync();
      expect(err).toBeUndefined();
      expect(validCase.priority).toBe(CasePriority.URGENT);
    });

    it('should reject invalid Case priority enum', () => {
      const invalidCase = new Case({
        caseNumber: 'CAS-2026-0002',
        patientId: new mongoose.Types.ObjectId(),
        priority: 'CRITICAL_DIAGNOSIS' as CasePriority,
        chiefComplaint: 'Fever',
      });

      const err = invalidCase.validateSync();
      expect(err?.errors['priority']).toBeDefined();
    });
  });

  describe('Symptom Model', () => {
    it('should validate a valid Symptom document', () => {
      const validSymptom = new Symptom({
        caseId: new mongoose.Types.ObjectId(),
        symptomName: 'Localized swelling and redness',
        onset: '2 days ago',
        severity: 7,
        source: InformationSource.AI_EXTRACTION,
        confidence: 0.88,
        provenance: 'Gemini 2.5 Flash extraction',
      });

      const err = validSymptom.validateSync();
      expect(err).toBeUndefined();
    });

    it('should enforce severity bounds between 1 and 10', () => {
      const invalidSymptom = new Symptom({
        caseId: new mongoose.Types.ObjectId(),
        symptomName: 'Severe headache',
        severity: 15,
        source: InformationSource.PATIENT,
      });

      const err = invalidSymptom.validateSync();
      expect(err?.errors['severity']).toBeDefined();
    });
  });

  describe('Report Model', () => {
    it('should validate a valid Report document', () => {
      const validReport = new Report({
        caseId: new mongoose.Types.ObjectId(),
        storageKey: 'reports/lab_report_1001.pdf',
        contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        originalFilename: 'Blood_Panel_Jan.pdf',
        mimeType: 'application/pdf',
        fileSize: 1048576,
        processingStatus: ReportProcessingStatus.PROCESSED,
      });

      const err = validReport.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('TriageNote Model & Safety Invariants', () => {
    it('should validate a valid TriageNote document with AI provenance', () => {
      const validNote = new TriageNote({
        caseId: new mongoose.Types.ObjectId(),
        presentingConcern: 'Persistent fever with cough',
        symptomSummary: 'Fever (3 days), dry cough',
        priority: CasePriority.PRIORITY,
        provenance: NoteProvenance.AI_GENERATED,
        generationStatus: GenerationStatus.COMPLETED,
        generatedBy: 'Gemini-2.5-Flash',
      });

      const err = validNote.validateSync();
      expect(err).toBeUndefined();
      expect(validNote.provenance).toBe(NoteProvenance.AI_GENERATED);
    });

    it('should ensure model does not accept non-existent fields for authoritative medical diagnosis', () => {
      const noteData = {
        caseId: new mongoose.Types.ObjectId(),
        presentingConcern: 'Fever',
        symptomSummary: 'High temperature',
        priority: CasePriority.ROUTINE,
        provenance: NoteProvenance.AI_GENERATED,
        generatedBy: 'Gemini',
      };

      const note = new TriageNote(noteData);
      expect((note as unknown as Record<string, unknown>).diagnosis).toBeUndefined();
      expect((note as unknown as Record<string, unknown>).prescription).toBeUndefined();
    });
  });

  describe('Review Model', () => {
    it('should validate a valid Review document', () => {
      const validReview = new Review({
        caseId: new mongoose.Types.ObjectId(),
        reviewerId: new mongoose.Types.ObjectId(),
        reviewStatus: ReviewStatus.COMPLETED,
        reviewerNotes: 'Reviewed patient inputs and lab reports. Prioritized for clinical visit.',
      });

      const err = validReview.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('Consent Model', () => {
    it('should validate a valid Consent document', () => {
      const validConsent = new Consent({
        caseId: new mongoose.Types.ObjectId(),
        consentType: ConsentType.GENERAL_TRIAGE,
        status: ConsentStatus.GRANTED,
        version: 'v1.0-hackathon',
        capturedBy: 'PATIENT_PORTAL',
      });

      const err = validConsent.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('AuditLog Model', () => {
    it('should validate a valid AuditLog entry', () => {
      const validAudit = new AuditLog({
        actorId: 'USR-9901',
        actorRole: UserRole.DOCTOR,
        action: AuditEventType.CASE_UPDATED,
        resourceType: 'Case',
        resourceId: 'CAS-2026-0001',
        outcome: 'SUCCESS',
      });

      const err = validAudit.validateSync();
      expect(err).toBeUndefined();
    });
  });
});
