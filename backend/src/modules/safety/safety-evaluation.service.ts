import mongoose, { Types } from 'mongoose';
import { Case } from '../cases/case.model.js';
import { CasePriority } from '../cases/case.types.js';
import { Symptom } from '../symptoms/symptom.model.js';
import { Report } from '../reports/report.model.js';
import { LabSafetyRule } from './lab-rule.model.js';
import { PediatricSafetyRule } from './pediatric-rule.model.js';
import { SafetyEvaluation, ISafetyEvaluationDocument } from './safety-evaluation.model.js';
import { SafetyEngine } from './safety.engine.js';
import { SafetyEvaluationContext } from './safety.types.js';
import { SlaService } from '../sla/sla.service.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';

export class SafetyEvaluationService {
  public static async evaluateCase(
    caseIdInput: string | Types.ObjectId,
    evaluatedBy: string = 'SYSTEM'
  ): Promise<ISafetyEvaluationDocument> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new Error(`Case with ID ${caseId} not found`);
    }

    try {
      // Gather context inputs safely
      const symptoms = await Symptom.find({ caseId }).lean();
      const reports = await Report.find({ caseId }).lean();

      let voiceInputs: any[] = [];
      try {
        const VoiceInputModel = mongoose.models.VoiceInput;
        if (VoiceInputModel) {
          voiceInputs = await VoiceInputModel.find({ caseId }).lean();
        }
      } catch (_) {}

      let visualInputs: any[] = [];
      try {
        const VisualInputModel = mongoose.models.VisualInput;
        if (VisualInputModel) {
          visualInputs = await VisualInputModel.find({ caseId }).lean();
        }
      } catch (_) {}

      let reviews: any[] = [];
      try {
        const ReviewModel = mongoose.models.Review;
        if (ReviewModel) {
          reviews = await ReviewModel.find({ caseId }).lean();
        }
      } catch (_) {}

      let missingInfoResults: any[] = [];
      try {
        const MissingInfoModel = mongoose.models.MissingInfoResult;
        if (MissingInfoModel) {
          missingInfoResults = await MissingInfoModel.find({ caseId }).lean();
        }
      } catch (_) {}

      const labRules = await LabSafetyRule.find({
        facilityId: caseDoc.facilityId || 'GOVERNMENT_HOSPITAL',
        isActive: true,
      }).lean();

      const pediatricRules = await PediatricSafetyRule.find({
        facilityId: caseDoc.facilityId || 'GOVERNMENT_HOSPITAL',
        isActive: true,
      }).lean();

      // Check patient age if user model exists
      let patientAgeMonths: number | undefined;
      try {
        const UserModel = mongoose.models.User;
        if (UserModel && caseDoc.patientId) {
          const patientUser = await UserModel.findById(caseDoc.patientId).lean();
          if (patientUser && (patientUser as any).ageMonths !== undefined) {
            patientAgeMonths = (patientUser as any).ageMonths;
          } else if (patientUser && (patientUser as any).dateOfBirth) {
            const dob = new Date((patientUser as any).dateOfBirth);
            const now = new Date();
            patientAgeMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
          }
        }
      } catch (_) {}

      const context: SafetyEvaluationContext = {
        caseId,
        facilityId: caseDoc.facilityId || 'GOVERNMENT_HOSPITAL',
        patientAgeMonths,
        symptoms,
        reports,
        voiceInputs,
        visualInputs,
        reviews,
        missingInfoResults,
        labRules,
        pediatricRules,
        hasHumanEscalation: reviews.some((r) => r.isEscalated || r.escalated),
      };

      // Run Engine
      const engineResult = SafetyEngine.evaluate(context);

      // Handle Human Priority Override
      const hasHumanOverride = !!caseDoc.priorityOverride;
      const effectivePriority = hasHumanOverride ? caseDoc.priorityOverride! : engineResult.calculatedPriority;

      // Multi-document ACID transactions require ReplicaSet or Sharded MongoDB topologies.
      // In standalone MongoDB instances (e.g., local dev or standalone unit test Mongo), transactions
      // are not supported; operations execute sequentially with single-document atomicity and partial unique index locks.
      let session: mongoose.ClientSession | null = null;
      const isReplicaSet =
        mongoose.connection.readyState === 1 &&
        ((mongoose.connection as any).client?.topology?.description?.type?.includes('ReplicaSet') ||
          (mongoose.connection as any).client?.topology?.description?.type?.includes('Sharded'));

      if (isReplicaSet) {
        try {
          const s = await mongoose.startSession();
          s.startTransaction();
          session = s;
        } catch (_) {
          session = null;
        }
      }

      try {
        // Atomic Version Management
        const updatedCase = await Case.findOneAndUpdate(
          { _id: caseId },
          { $inc: { currentSafetyVersion: 1 } },
          { new: true, session: session || undefined }
        );
        const nextVersion = updatedCase?.currentSafetyVersion || 1;

        // Transition prior ACTIVE to SUPERSEDED
        await SafetyEvaluation.updateMany(
          { caseId, status: 'ACTIVE' },
          { status: 'SUPERSEDED' },
          { session: session || undefined }
        );

        // Create new ACTIVE evaluation
        const [evaluation] = await SafetyEvaluation.create(
          [
            {
              caseId,
              evaluationVersion: nextVersion,
              status: 'ACTIVE',
              calculatedPriority: engineResult.calculatedPriority,
              effectivePriority,
              matchedSignals: engineResult.matchedSignals,
              hasHumanOverride,
              evaluatedBy,
              evaluatedAt: engineResult.evaluatedAt,
            },
          ],
          { session: session || undefined }
        );

        // Update Case priority & Recalculate SLA
        const slaDueAt = SlaService.calculateSlaDueAt({
          createdAt: caseDoc.createdAt || new Date(),
          priority: effectivePriority,
        });

        await Case.updateOne(
          { _id: caseId },
          { priority: effectivePriority, slaDueAt },
          { session: session || undefined }
        );

        // Log Audit Event
        const audit = new AuditLog({
          actorId: evaluatedBy,
          actorRole: 'SYSTEM',
          action: AuditEventType.SAFETY_EVALUATION_COMPLETED,
          resourceType: 'Case',
          resourceId: caseId.toString(),
          caseId,
          timestamp: new Date(),
          source: 'SAFETY_ENGINE',
          outcome: 'SUCCESS',
          metadata: {
            version: nextVersion,
            calculatedPriority: engineResult.calculatedPriority,
            effectivePriority,
            hasHumanOverride,
            signalCount: engineResult.matchedSignals.length,
          },
        });
        await audit.save({ session: session || undefined });

        if (session) {
          await session.commitTransaction();
          session.endSession();
        }

        return evaluation;
      } catch (txnError) {
        if (session) {
          await session.abortTransaction().catch(() => {});
          session.endSession();
        }
        throw txnError;
      }
    } catch (err: any) {
      // Fallback path
      try {
        const fallbackPriority = caseDoc.priorityOverride ? caseDoc.priorityOverride : CasePriority.PRIORITY;
        const slaDueAt = SlaService.calculateSlaDueAt({
          createdAt: caseDoc.createdAt || new Date(),
          priority: fallbackPriority,
        });

        await Case.updateOne({ _id: caseId }, { priority: fallbackPriority, slaDueAt });

        await AuditLog.create({
          actorId: evaluatedBy,
          actorRole: 'SYSTEM',
          action: AuditEventType.SAFETY_EVALUATION_FAILED,
          resourceType: 'Case',
          resourceId: caseId.toString(),
          caseId,
          timestamp: new Date(),
          source: 'SAFETY_ENGINE',
          outcome: 'FAILURE',
          metadata: { error: String(err.message || err), fallbackPriority, overridePreserved: !!caseDoc.priorityOverride },
        });
      } catch (fallbackErr: any) {
        await AuditLog.create({
          actorId: evaluatedBy,
          actorRole: 'SYSTEM',
          action: AuditEventType.SAFETY_FALLBACK_PERSISTENCE_FAILED,
          resourceType: 'Case',
          resourceId: caseId.toString(),
          caseId,
          timestamp: new Date(),
          source: 'SAFETY_ENGINE',
          outcome: 'FAILURE',
          metadata: { engineError: String(err.message || err), fallbackError: String(fallbackErr.message || fallbackErr) },
        }).catch(() => {});

        throw new Error(`CRITICAL_SAFETY_FAILURE: Unable to persist safe fallback state for case ${caseId}`);
      }

      throw err;
    }
  }

  public static async getActiveEvaluation(
    caseIdInput: string | Types.ObjectId
  ): Promise<ISafetyEvaluationDocument | null> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;
    return SafetyEvaluation.findOne({ caseId, status: 'ACTIVE' });
  }

  public static async getEvaluationHistory(
    caseIdInput: string | Types.ObjectId
  ): Promise<ISafetyEvaluationDocument[]> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;
    return SafetyEvaluation.find({ caseId }).sort({ evaluationVersion: -1 });
  }
}
