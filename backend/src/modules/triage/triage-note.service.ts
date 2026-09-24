import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { Case } from '../cases/case.model.js';
import { Symptom } from '../symptoms/symptom.model.js';
import { Report } from '../reports/report.model.js';
import { SafetyEvaluation } from '../safety/safety-evaluation.model.js';
import { TriageNote } from './triage-note.model.js';
import {
  ITriageNoteDocument,
  NoteProvenance,
  GenerationStatus,
  ISymptomSectionItem,
  IReportSectionItem,
  IVoiceSectionItem,
  IVisualSectionItem,
  ITranslationSectionItem,
  ISafetyReviewSection,
  IReviewerAttentionSection,
  ITimelineEvent,
  IMissingInformationItem,
  IFollowUpQuestionItem,
} from './triage-note.types.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { AppError } from '../../middleware/error-handler.js';
import { CasePriority } from '../cases/case.types.js';

function createError(statusCode: number, message: string, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

export class TriageNoteService {
  /**
   * Computes a deterministic SHA-256 fingerprint hash of all case evidence.
   */
  public static computeSourceEvidenceHash(evidence: {
    caseId: string;
    chiefComplaint: string;
    language: string;
    intakeSource: string;
    symptoms: any[];
    reports: any[];
    voiceInputs: any[];
    visualInputs: any[];
    translations: any[];
    activeSafetyEval: any;
  }): string {
    const rawFingerprintData = {
      caseId: evidence.caseId,
      chiefComplaint: evidence.chiefComplaint || '',
      language: evidence.language || '',
      intakeSource: evidence.intakeSource || '',
      symptoms: evidence.symptoms
        .map((s) => ({
          id: s._id ? s._id.toString() : String(s.id || s.symptomName || ''),
          name: s.symptomName || s.name || '',
          severity: s.severity ?? null,
          bodyLocation: s.bodyLocation || s.bodySite || '',
          status: s.status || '',
          provenance: s.provenance || '',
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      reports: evidence.reports
        .map((r) => ({
          id: r._id ? r._id.toString() : String(r.id || r.originalFilename || ''),
          status: r.processingStatus || r.status || '',
          contentHash: r.contentHash || '',
          ocrStatus: r.ocrStatus || '',
          verified: r.verificationStatus === 'VERIFIED' || !!r.verifiedBy,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      voiceInputs: evidence.voiceInputs
        .map((v) => ({
          id: v._id ? v._id.toString() : String(v.id || v.originalFilename || ''),
          status: v.processingStatus || '',
          transcript: v.transcript?.text || '',
          verified: v.verificationStatus === 'VERIFIED' || !!v.verifiedBy,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      visualInputs: evidence.visualInputs
        .map((v) => ({
          id: v._id ? v._id.toString() : String(v.id || v.originalFilename || ''),
          status: v.processingStatus || '',
          description: (v.observations || []).map((o: any) => o.description || '').join(';'),
          verified: v.verificationStatus === 'VERIFIED' || !!v.verifiedBy,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      translations: evidence.translations
        .map((t) => ({
          id: t._id ? t._id.toString() : String(t.id || ''),
          targetLanguage: t.targetLanguage || '',
          translatedText: t.translatedText || '',
          verified: t.verificationStatus === 'VERIFIED' || !!t.verifiedBy,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      activeSafetyEval: evidence.activeSafetyEval
        ? {
            id: evidence.activeSafetyEval._id ? evidence.activeSafetyEval._id.toString() : '',
            version: evidence.activeSafetyEval.evaluationVersion ?? 1,
            effectivePriority: evidence.activeSafetyEval.effectivePriority || CasePriority.ROUTINE,
            signals: (evidence.activeSafetyEval.matchedSignals || [])
              .map((sig: any) => ({ ruleId: sig.ruleId, priority: sig.priority }))
              .sort((a: any, b: any) => a.ruleId.localeCompare(b.ruleId)),
          }
        : null,
    };

    return crypto.createHash('sha256').update(JSON.stringify(rawFingerprintData)).digest('hex');
  }

  /**
   * Generates or retrieves the active Structured Triage Note for a case deterministically.
   */
  public static async generateTriageNote(
    caseIdInput: string | Types.ObjectId,
    reviewerId: string,
    facilityId?: string
  ): Promise<{ note: ITriageNoteDocument; isNew: boolean }> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc || caseDoc.isDeleted) {
      throw createError(404, `Case with ID ${caseId} not found`);
    }

    // Facility Isolation Enforcement
    if (facilityId && caseDoc.facilityId && caseDoc.facilityId !== facilityId) {
      throw createError(403, 'Unauthorized access to case from another facility');
    }

    // Gather Evidence Safely from Mongoose Models
    const symptoms = await Symptom.find({ caseId }).lean();
    const reports = await Report.find({ caseId, isLatest: true }).lean();

    let voiceInputs: any[] = [];
    try {
      const VoiceInputModel = mongoose.models.VoiceInput;
      if (VoiceInputModel) {
        voiceInputs = await VoiceInputModel.find({ caseId }).lean();
      }
    } catch (_) {}

    let visualInputs: any[] = [];
    try {
      const VisualInput = mongoose.models.VisualInput;
      if (VisualInput) {
        visualInputs = await VisualInput.find({ caseId }).lean();
      }
    } catch (_) {}

    let translations: any[] = [];
    try {
      const Translation = mongoose.models.Translation;
      if (Translation) {
        translations = await Translation.find({ caseId }).lean();
      }
    } catch (_) {}

    // ACTIVE Safety Evaluation Selection (Phase 15 integration)
    const activeSafetyEval = await SafetyEvaluation.findOne({ caseId, status: 'ACTIVE' }).lean();

    // Compute deterministic SHA-256 evidence fingerprint
    const sourceEvidenceHash = this.computeSourceEvidenceHash({
      caseId: caseId.toString(),
      chiefComplaint: caseDoc.chiefComplaint || '',
      language: caseDoc.language || '',
      intakeSource: caseDoc.intakeSource || '',
      symptoms,
      reports,
      voiceInputs,
      visualInputs,
      translations,
      activeSafetyEval,
    });

    // Check for existing ACTIVE note
    const existingActiveNote = await TriageNote.findOne({ caseId, status: 'ACTIVE' });
    if (existingActiveNote && existingActiveNote.sourceEvidenceHash === sourceEvidenceHash) {
      return { note: existingActiveNote, isNew: false };
    }

    // Assemble Structured Sections Deterministically
    const presentingConcern = caseDoc.chiefComplaint || 'No chief complaint provided';

    const symptomsSection: ISymptomSectionItem[] = symptoms.map((s) => ({
      id: s._id ? s._id.toString() : String(s.symptomName),
      name: s.symptomName,
      severity: s.severity ? `${s.severity}/10` : undefined,
      duration: s.duration || s.onset || undefined,
      bodySite: s.bodyLocation || undefined,
      status: s.status || 'PRESENT',
      provenance: s.provenance || 'PATIENT',
      source: s.source || 'PATIENT',
    }));

    const symptomSummary = symptoms.length > 0
      ? symptoms.map((s) => `${s.symptomName}${s.severity ? ` (${s.severity}/10)` : ''}${s.duration ? ` for ${s.duration}` : ''}`).join('; ')
      : presentingConcern;

    const reportsSection: IReportSectionItem[] = reports.map((r) => ({
      reportId: r._id ? r._id.toString() : String(r.originalFilename),
      fileType: r.mimeType || 'application/pdf',
      status: r.processingStatus,
      summary: r.extractedText ? (r.extractedText.slice(0, 200) + (r.extractedText.length > 200 ? '...' : '')) : undefined,
      keyFindings: r.extractedData?.keyFindings || [],
      verifiedByHuman: r.verificationStatus === 'VERIFIED' || !!r.verifiedBy,
      uploadedAt: r.uploadTimestamp || (r as any).createdAt || new Date(),
    }));

    const voiceSection: IVoiceSectionItem[] = voiceInputs.map((v) => ({
      voiceId: v._id ? v._id.toString() : String(v.originalFilename),
      transcript: v.transcript?.text || 'No transcript available',
      durationSeconds: v.durationMs ? Math.round(v.durationMs / 1000) : undefined,
      verifiedByHuman: v.verificationStatus === 'VERIFIED' || !!v.verifiedBy,
      uploadedAt: v.uploadedAt || new Date(),
    }));

    const visualSection: IVisualSectionItem[] = visualInputs.map((v) => ({
      visualId: v._id ? v._id.toString() : String(v.originalFilename),
      imageType: v.mimeType || 'image/jpeg',
      description: (v.observations || []).map((o: any) => o.description).join('; ') || undefined,
      keyFindings: (v.observations || []).map((o: any) => `${o.type || 'FINDING'}: ${o.description}`),
      verifiedByHuman: v.verificationStatus === 'VERIFIED' || !!v.verifiedBy,
      uploadedAt: v.uploadedAt || new Date(),
    }));

    const translationsSection: ITranslationSectionItem[] = translations.map((t) => ({
      targetLanguage: t.targetLanguage,
      originalText: t.originalText,
      translatedText: t.translatedText || '',
      provider: t.provider || 'system',
      verifiedByHuman: t.verificationStatus === 'VERIFIED' || !!t.verifiedBy,
    }));

    const safetyReviewSection: ISafetyReviewSection = {
      activeEvaluationId: activeSafetyEval ? activeSafetyEval._id.toString() : undefined,
      priority: activeSafetyEval ? activeSafetyEval.effectivePriority : caseDoc.priority,
      triggeredRules: activeSafetyEval ? (activeSafetyEval.matchedSignals || []).map((sig: any) => ({
        ruleId: sig.ruleId,
        ruleName: sig.ruleName,
        category: sig.category,
        matchedTrigger: sig.evidenceSnippet || sig.explanation,
        recommendedPriority: sig.priority,
      })) : [],
      evaluatedAt: activeSafetyEval ? activeSafetyEval.evaluatedAt : new Date(),
    };

    const unverifiedReportsCount = reports.filter((r) => r.verificationStatus !== 'VERIFIED' && !r.verifiedBy).length;
    const unverifiedVoiceCount = voiceInputs.filter((v) => v.verificationStatus !== 'VERIFIED' && !v.verifiedBy).length;
    const unverifiedVisualCount = visualInputs.filter((v) => v.verificationStatus !== 'VERIFIED' && !v.verifiedBy).length;
    const unverifiedTranslationsCount = translations.filter((t) => t.verificationStatus !== 'VERIFIED' && !t.verifiedBy).length;
    const totalUnverifiedCount = unverifiedReportsCount + unverifiedVoiceCount + unverifiedVisualCount + unverifiedTranslationsCount;

    const reviewerAttentionSection: IReviewerAttentionSection = {
      criticalCount: (activeSafetyEval?.matchedSignals || []).filter((sig: any) => sig.priority === CasePriority.URGENT).length,
      unverifiedCount: totalUnverifiedCount,
      uncertaintiesCount: symptoms.filter((s) => s.temporalStatus === 'UNCERTAIN' || s.status === 'UNCERTAIN').length,
      safetyUrgent: activeSafetyEval ? activeSafetyEval.effectivePriority === CasePriority.URGENT : caseDoc.priority === CasePriority.URGENT,
      actionRequired: totalUnverifiedCount > 0
        ? `Review ${totalUnverifiedCount} unverified input(s)`
        : activeSafetyEval?.effectivePriority === CasePriority.URGENT
        ? 'Immediate clinical reviewer attention required due to URGENT safety signals'
        : 'Review structured note for clinical decision making',
    };

    // Construct Timeline Events
    const timelineEvents: ITimelineEvent[] = [];
    symptoms.forEach((s) => {
      timelineEvents.push({
        eventType: 'SYMPTOM_ONSET',
        date: null,
        relativeTime: s.onset || s.duration || null,
        description: `Symptom reported: ${s.symptomName}${s.bodyLocation ? ` at ${s.bodyLocation}` : ''}`,
        source: 'PATIENT',
        provenance: NoteProvenance.AI_GENERATED,
        certainty: 'CERTAIN',
        sourceQuote: s.context || null,
      });
    });

    // Construct Missing Information Items
    const missingInformationItems: IMissingInformationItem[] = [];
    if (!caseDoc.chiefComplaint) {
      missingInformationItems.push({
        id: 'mi-1',
        description: 'Chief complaint detail is incomplete',
        importance: 'CRITICAL',
        source: 'PATIENT_NARRATIVE',
        provenance: NoteProvenance.AI_GENERATED,
      });
    }

    const followUpQuestionItems: IFollowUpQuestionItem[] = [];
    if (symptoms.some((s) => !s.onset && !s.duration)) {
      followUpQuestionItems.push({
        id: 'fq-1',
        question: 'When did your symptoms start and how long have they lasted?',
        priority: 'HIGH',
        answerType: 'DURATION',
        provenance: NoteProvenance.AI_GENERATED,
      });
    }

    // Version Allocation & Transition Strategy (Transaction / Fallback)
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
      const updatedCase = await Case.findOneAndUpdate(
        { _id: caseId },
        { $inc: { currentNoteVersion: 1 } },
        { new: true, session: session || undefined }
      );
      const nextVersion = updatedCase?.currentNoteVersion || 1;

      // Transition prior ACTIVE note to SUPERSEDED
      await TriageNote.updateMany(
        { caseId, status: 'ACTIVE' },
        { status: 'SUPERSEDED' },
        { session: session || undefined }
      );

      // Create new ACTIVE Triage Note
      const [newNote] = await TriageNote.create(
        [
          {
            caseId,
            noteVersion: nextVersion,
            status: 'ACTIVE',
            sourceEvidenceHash,
            presentingConcern,
            symptomSummary,
            timelineSummary: timelineEvents.map((e) => e.description).join('; '),
            timelineEvents,
            relevantExtractedReportInfo: reportsSection.map((r) => r.summary).filter(Boolean).join('; '),
            missingInformation: missingInformationItems.map((m) => m.description),
            missingInformationItems,
            negativeFindings: [],
            uncertainties: [],
            confidence: 1.0,
            sourceTextHash: sourceEvidenceHash,
            suggestedFollowUpQuestions: followUpQuestionItems.map((f) => f.question),
            followUpQuestionItems,
            safetySignals: (activeSafetyEval?.matchedSignals || []).map((s: any) => s.ruleName),
            symptomsSection,
            reportsSection,
            voiceSection,
            visualSection,
            translationsSection,
            safetyReviewSection,
            reviewerAttentionSection,
            priority: activeSafetyEval ? activeSafetyEval.effectivePriority : caseDoc.priority,
            provenance: NoteProvenance.AI_GENERATED,
            generationStatus: GenerationStatus.COMPLETED,
            generatedBy: 'System-Deterministic-Assembly',
            modelVersion: 'Phase16-Deterministic',
            generatedAt: new Date(),
          },
        ],
        { session: session || undefined }
      );

      // Log Audit Event
      const auditAction = existingActiveNote ? AuditEventType.TRIAGE_NOTE_REGENERATED : AuditEventType.TRIAGE_NOTE_GENERATED;
      const audit = new AuditLog({
        actorId: reviewerId,
        actorRole: 'CLINICAL_REVIEWER',
        action: auditAction,
        resourceType: 'TriageNote',
        resourceId: newNote._id.toString(),
        caseId,
        timestamp: new Date(),
        source: 'TRIAGE_NOTE_SERVICE',
        outcome: 'SUCCESS',
        metadata: {
          noteVersion: nextVersion,
          sourceEvidenceHash,
          isReplicaSet: !!session,
        },
      });
      await audit.save({ session: session || undefined });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return { note: newNote, isNew: true };
    } catch (err: any) {
      if (session) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
      }

      // Log Failure Audit Event
      await AuditLog.create({
        actorId: reviewerId,
        actorRole: 'CLINICAL_REVIEWER',
        action: AuditEventType.TRIAGE_NOTE_GENERATION_FAILED,
        resourceType: 'Case',
        resourceId: caseId.toString(),
        caseId,
        timestamp: new Date(),
        source: 'TRIAGE_NOTE_SERVICE',
        outcome: 'FAILURE',
        metadata: { error: String(err.message || err) },
      }).catch(() => {});

      throw err;
    }
  }

  /**
   * Human Reviewer verification of the active Triage Note.
   * STRICT SEMANTICS: Operational/information review only, never implies diagnosis, treatment, referral, or medical clearance.
   * MUST NEVER alter Case.priority, Case.slaDueAt, SafetyEvaluation, or escalation state.
   */
  public static async verifyTriageNote(
    caseIdInput: string | Types.ObjectId,
    reviewerId: string,
    reviewerNotes?: string,
    facilityId?: string
  ): Promise<ITriageNoteDocument> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc || caseDoc.isDeleted) {
      throw createError(404, `Case with ID ${caseId} not found`);
    }

    if (facilityId && caseDoc.facilityId && caseDoc.facilityId !== facilityId) {
      throw createError(403, 'Unauthorized access to case from another facility');
    }

    const activeNote = await TriageNote.findOne({ caseId, status: 'ACTIVE' });
    if (!activeNote) {
      throw createError(404, 'No active triage note found for case');
    }

    activeNote.provenance = NoteProvenance.HUMAN_VERIFIED;
    activeNote.reviewedBy = new Types.ObjectId(reviewerId);
    activeNote.reviewedAt = new Date();
    if (reviewerNotes !== undefined) {
      activeNote.reviewerNotes = reviewerNotes;
    }

    await activeNote.save();

    await AuditLog.create({
      actorId: reviewerId,
      actorRole: 'CLINICAL_REVIEWER',
      action: AuditEventType.TRIAGE_NOTE_VERIFIED,
      resourceType: 'TriageNote',
      resourceId: activeNote._id.toString(),
      caseId,
      timestamp: new Date(),
      source: 'TRIAGE_NOTE_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        noteVersion: activeNote.noteVersion,
        provenance: NoteProvenance.HUMAN_VERIFIED,
        reviewedBy: reviewerId,
      },
    });

    return activeNote;
  }

  /**
   * Retrieves the current ACTIVE note for a case.
   */
  public static async getActiveNote(
    caseIdInput: string | Types.ObjectId,
    facilityId?: string
  ): Promise<ITriageNoteDocument | null> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc || caseDoc.isDeleted) {
      throw createError(404, `Case with ID ${caseId} not found`);
    }

    if (facilityId && caseDoc.facilityId && caseDoc.facilityId !== facilityId) {
      throw createError(403, 'Unauthorized access to case from another facility');
    }

    return TriageNote.findOne({ caseId, status: 'ACTIVE' });
  }

  /**
   * Retrieves all historical versions of notes for a case sorted by noteVersion DESC.
   */
  public static async getNoteHistory(
    caseIdInput: string | Types.ObjectId,
    facilityId?: string
  ): Promise<ITriageNoteDocument[]> {
    const caseId = typeof caseIdInput === 'string' ? new Types.ObjectId(caseIdInput) : caseIdInput;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc || caseDoc.isDeleted) {
      throw createError(404, `Case with ID ${caseId} not found`);
    }

    if (facilityId && caseDoc.facilityId && caseDoc.facilityId !== facilityId) {
      throw createError(403, 'Unauthorized access to case from another facility');
    }

    return TriageNote.find({ caseId }).sort({ noteVersion: -1 });
  }
}
