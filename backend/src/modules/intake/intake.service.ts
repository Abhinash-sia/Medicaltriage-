import mongoose from 'mongoose';
import { Case } from '../cases/case.model.js';
import { CaseStatus, CasePriority, IntakeSource } from '../cases/case.types.js';
import { Symptom } from '../symptoms/symptom.model.js';
import { InformationSource } from '../symptoms/symptom.types.js';
import { Consent } from '../consent/consent.model.js';
import { ConsentStatus, ConsentType } from '../consent/consent.types.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { UserRole } from '../users/user.types.js';
import { IntakeSubmitInput, IntakeResponseData } from './intake.types.js';
import { AppError } from '../../middleware/error-handler.js';

export class IntakeService {
  static async submitIntake(
    patientUserId: string,
    input: IntakeSubmitInput,
    requestId?: string
  ): Promise<IntakeResponseData> {
    const patientObjectId = new mongoose.Types.ObjectId(patientUserId);

    // Idempotency / Retry Safety: Check for existing case with matching idempotency key metadata
    if (input.idempotencyKey) {
      const existingAudit = await AuditLog.findOne({
        actorId: patientUserId,
        action: AuditEventType.CASE_CREATED,
        'metadata.idempotencyKey': input.idempotencyKey,
      });

      if (existingAudit && existingAudit.caseId) {
        const existingCase = await Case.findById(existingAudit.caseId);
        if (existingCase) {
          return {
            caseId: existingCase._id.toString(),
            caseNumber: existingCase.caseNumber,
            patientId: existingCase.patientId.toString(),
            status: existingCase.status,
            priority: existingCase.priority,
            chiefComplaint: existingCase.chiefComplaint,
            primarySymptom: input.primarySymptom,
            language: existingCase.language,
            consentStatus: ConsentStatus.GRANTED,
            createdAt: existingCase.createdAt || new Date(),
          };
        }
      }
    }

    // Generate unique case identifier
    const timestamp = Date.now().toString().slice(-6);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const caseNumber = `CAS-${timestamp}-${randomDigits}`;

    const session =
      mongoose.connection.readyState === 1
        ? await mongoose.startSession().catch(() => null)
        : null;

    if (session) {
      session.startTransaction();
    }

    try {
      // 1. Create Case Document
      const newCase = new Case({
        caseNumber,
        patientId: patientObjectId,
        status: CaseStatus.OPEN,
        priority: CasePriority.ROUTINE, // Default initial workflow category awaiting safety evaluation
        intakeSource: IntakeSource.TEXT,
        language: input.language || 'en',
        chiefComplaint: `${input.primarySymptom}: ${input.symptomDescription}`,
        isDeleted: false,
      });
      await newCase.save({ session: session || undefined });

      // 2. Create Consent Document
      const newConsent = new Consent({
        caseId: newCase._id,
        patientId: patientObjectId,
        consentType: ConsentType.GENERAL_TRIAGE,
        status: ConsentStatus.GRANTED,
        version: input.consentVersion || 'v1.0-hackathon',
        capturedBy: 'PATIENT_PORTAL',
        capturedAt: new Date(),
      });
      await newConsent.save({ session: session || undefined });

      // Link consent reference back to case
      newCase.consentId = newConsent._id;
      await newCase.save({ session: session || undefined });

      // 3. Create Symptom Document (Preserving Patient Provenance)
      const newSymptom = new Symptom({
        caseId: newCase._id,
        symptomName: input.primarySymptom,
        onset: input.onset,
        duration: input.duration,
        severity: input.severity,
        bodyLocation: input.bodyLocation,
        associatedSymptoms: input.associatedSymptoms || [],
        source: InformationSource.PATIENT, // Patient provenance tag
        confidence: undefined, // No artificial AI confidence for patient direct inputs
      });
      await newSymptom.save({ session: session || undefined });

      // 4. Create Audit Log Entry
      const newAudit = new AuditLog({
        actorId: patientUserId,
        actorRole: UserRole.PATIENT,
        action: AuditEventType.CASE_CREATED,
        resourceType: 'Case',
        resourceId: newCase._id.toString(),
        caseId: newCase._id,
        requestId: requestId || null,
        timestamp: new Date(),
        outcome: 'SUCCESS',
        metadata: {
          intakeSource: IntakeSource.TEXT,
          idempotencyKey: input.idempotencyKey || null,
        },
      });
      await newAudit.save({ session: session || undefined });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        caseId: newCase._id.toString(),
        caseNumber: newCase.caseNumber,
        patientId: newCase.patientId.toString(),
        status: newCase.status,
        priority: newCase.priority,
        chiefComplaint: newCase.chiefComplaint,
        primarySymptom: input.primarySymptom,
        language: newCase.language,
        consentStatus: ConsentStatus.GRANTED,
        createdAt: newCase.createdAt || new Date(),
      };
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  static async getPatientCases(patientUserId: string) {
    const patientObjectId = new mongoose.Types.ObjectId(patientUserId);
    const cases = await Case.find({ patientId: patientObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .select('-__v');

    return cases.map((c) => ({
      id: c._id.toString(),
      caseNumber: c.caseNumber,
      status: c.status,
      priority: c.priority,
      chiefComplaint: c.chiefComplaint,
      language: c.language,
      createdAt: c.createdAt,
    }));
  }

  static async getPatientCaseById(caseId: string, patientUserId: string) {
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      const error: AppError = new Error('Invalid case ID format');
      error.statusCode = 400;
      error.code = 'INTAKE_INVALID_CASE_ID';
      throw error;
    }

    const patientObjectId = new mongoose.Types.ObjectId(patientUserId);
    const caseDoc = await Case.findOne({ _id: caseId, patientId: patientObjectId, isDeleted: false });
    if (!caseDoc) {
      const error: AppError = new Error('Case record not found');
      error.statusCode = 404;
      error.code = 'INTAKE_CASE_NOT_FOUND';
      throw error;
    }

    const symptoms = await Symptom.find({ caseId: caseDoc._id });
    const consent = await Consent.findById(caseDoc.consentId);

    return {
      id: caseDoc._id.toString(),
      caseNumber: caseDoc.caseNumber,
      patientId: caseDoc.patientId.toString(),
      status: caseDoc.status,
      priority: caseDoc.priority,
      chiefComplaint: caseDoc.chiefComplaint,
      language: caseDoc.language,
      consent: consent
        ? {
            status: consent.status,
            version: consent.version,
            capturedAt: consent.capturedAt,
          }
        : null,
      symptoms: symptoms.map((s) => ({
        id: s._id.toString(),
        name: s.symptomName,
        onset: s.onset,
        duration: s.duration,
        severity: s.severity,
        bodyLocation: s.bodyLocation,
        source: s.source,
      })),
      createdAt: caseDoc.createdAt,
    };
  }
}
