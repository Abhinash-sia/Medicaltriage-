import crypto from 'crypto';
import { Types } from 'mongoose';
import { Case } from '../cases/case.model.js';
import { Symptom } from '../symptoms/symptom.model.js';
import { InformationSource } from '../symptoms/symptom.types.js';
import { TriageNote } from '../triage/triage-note.model.js';
import { GenerationStatus, NoteProvenance } from '../triage/triage-note.types.js';
import { IUserDocument, UserRole } from '../users/user.types.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { aiExtractionOutputSchema } from './ai.schemas.js';
import { getAiProvider } from './ai.provider.js';
import { ExtractionResult } from './ai.types.js';

import { normalizeAndSortTimelineEvents } from './timeline.normalizer.js';
import { ITimelineEvent } from '../triage/triage-note.types.js';

const MAX_NARRATIVE_LENGTH = 10000;

export interface ExtractionResponse {
  caseId: string;
  source: InformationSource.AI_EXTRACTION;
  provenance: NoteProvenance.AI_GENERATED;
  generationStatus: GenerationStatus;
  model: string;
  generatedAt: Date;
  symptoms: Array<{
    name: string;
    normalizedLabel?: string | null;
    status: string;
    onset?: string | null;
    duration?: string | null;
    frequency?: string | null;
    severity?: string | null;
    context?: string | null;
  }>;
  negativeFindings: string[];
  timeline: Array<{ description: string; relativeTime?: string | null }>;
  timelineEvents?: ITimelineEvent[];
  uncertainties: string[];
  confidence?: number | null;
  noteId?: string;
}

export class AiService {
  /**
   * Generates SHA-256 hash of source narrative text for idempotency check.
   */
  private computeHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
  }

  /**
   * Extracts structured information from a patient narrative for human reviewer verification.
   */
  async extractAndPersistCaseInformation(
    caseId: string,
    reviewerUser: IUserDocument,
    options?: { forceReextract?: boolean }
  ): Promise<ExtractionResponse> {
    if (!Types.ObjectId.isValid(caseId)) {
      throw new Error('Invalid case ID format');
    }

    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      throw new Error('Case not found');
    }

    // Facility isolation check
    if (
      reviewerUser.role !== UserRole.ADMIN &&
      existingCase.facilityId?.toString() !== reviewerUser.facilityId?.toString()
    ) {
      throw new Error('Unauthorized access to case from another facility');
    }

    const narrative = existingCase.chiefComplaint || '';
    if (!narrative.trim()) {
      throw new Error('Patient narrative is empty. Cannot perform extraction.');
    }

    if (narrative.length > MAX_NARRATIVE_LENGTH) {
      throw new Error(`Patient narrative exceeds maximum limit of ${MAX_NARRATIVE_LENGTH} characters.`);
    }

    const sourceTextHash = this.computeHash(narrative);

    // Idempotency check: if successful extraction exists for exact same source hash
    if (!options?.forceReextract) {
      const existingNote = await TriageNote.findOne({
        caseId: existingCase._id,
        generationStatus: GenerationStatus.COMPLETED,
        sourceTextHash,
      });

      if (existingNote) {
        const existingSymptoms = await Symptom.find({
          caseId: existingCase._id,
          source: InformationSource.AI_EXTRACTION,
        });

        return {
          caseId: existingCase._id.toString(),
          source: InformationSource.AI_EXTRACTION,
          provenance: NoteProvenance.AI_GENERATED,
          generationStatus: GenerationStatus.COMPLETED,
          model: existingNote.generatedBy || 'gemini-2.5-flash',
          generatedAt: existingNote.generatedAt || existingNote.createdAt || new Date(),
          symptoms: existingSymptoms.map((s) => ({
            name: s.symptomName,
            normalizedLabel: s.normalizedLabel,
            status: s.status || 'PRESENT',
            onset: s.onset || null,
            duration: s.duration || null,
            frequency: s.frequency || null,
            severity: s.severity ? String(s.severity) : null,
            context: s.context || null,
          })),
          negativeFindings: existingNote.negativeFindings || [],
          timeline: existingNote.timelineSummary
            ? existingNote.timelineSummary.split('\n').filter(Boolean).map((t) => ({ description: t }))
            : [],
          uncertainties: existingNote.uncertainties || [],
          confidence: existingNote.confidence ?? null,
          noteId: existingNote._id.toString(),
        };
      }
    }

    // Capture initial priority/assignment/SLA state to ensure safety invariant
    const originalPriority = existingCase.priority;
    const originalAssignedReviewerId = existingCase.assignedReviewerId;
    const originalSlaDueAt = existingCase.slaDueAt;

    const provider = getAiProvider();
    let extractionResult: ExtractionResult;

    try {
      const rawResult = await provider.extractSymptoms({ narrative });
      extractionResult = aiExtractionOutputSchema.parse(rawResult);
    } catch (err: any) {
      const safeErrorMsg = err.message || 'AI Provider extraction failed';

      // Persist failed note status
      await TriageNote.findOneAndUpdate(
        { caseId: existingCase._id },
        {
          caseId: existingCase._id,
          presentingConcern: narrative.substring(0, 200),
          symptomSummary: 'Extraction failed',
          priority: originalPriority, // NEVER modify priority
          provenance: NoteProvenance.AI_GENERATED,
          generationStatus: GenerationStatus.FAILED,
          generatedBy: 'gemini-2.5-flash',
          generatedAt: new Date(),
          sourceTextHash,
        },
        { upsert: true, new: true }
      );

      // Log failure in AuditLog (no sensitive API keys or raw narratives in metadata)
      await AuditLog.create({
        actorId: (reviewerUser.id || reviewerUser._id)?.toString() || 'SYSTEM',
        actorRole: reviewerUser.role,
        action: AuditEventType.AI_EXTRACTION_FAILED,
        resourceType: 'Case',
        resourceId: existingCase._id.toString(),
        caseId: existingCase._id,
        timestamp: new Date(),
        source: 'REVIEWER_API',
        outcome: 'FAILURE',
        metadata: {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          error: safeErrorMsg,
        },
      });

      await AuditLog.create({
        actorId: (reviewerUser.id || reviewerUser._id)?.toString() || 'SYSTEM',
        actorRole: reviewerUser.role,
        action: AuditEventType.TIMELINE_GENERATION_FAILED,
        resourceType: 'Case',
        resourceId: existingCase._id.toString(),
        caseId: existingCase._id,
        timestamp: new Date(),
        source: 'REVIEWER_API',
        outcome: 'FAILURE',
        metadata: {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          error: safeErrorMsg,
        },
      });

      // Verify Safety Invariants
      const updatedCase = await Case.findById(caseId);
      if (updatedCase) {
        if (updatedCase.priority !== originalPriority) updatedCase.priority = originalPriority;
        if (String(updatedCase.assignedReviewerId) !== String(originalAssignedReviewerId)) {
          updatedCase.assignedReviewerId = originalAssignedReviewerId;
        }
        if (updatedCase.slaDueAt?.getTime() !== originalSlaDueAt?.getTime()) {
          updatedCase.slaDueAt = originalSlaDueAt;
        }
        await updatedCase.save();
      }

      throw new Error(`AI extraction failed: ${safeErrorMsg}`);
    }

    // Clean up previous AI_EXTRACTION symptoms for this case to prevent duplicates
    await Symptom.deleteMany({
      caseId: existingCase._id,
      source: InformationSource.AI_EXTRACTION,
    });

    // Save extracted symptoms
    const symptomDocsToInsert = extractionResult.symptoms.map((s) => ({
      caseId: existingCase._id,
      symptomName: s.name,
      normalizedLabel: s.normalizedLabel || undefined,
      onset: s.onset || undefined,
      duration: s.duration || undefined,
      frequency: s.frequency || undefined,
      status: s.status,
      context: s.context || undefined,
      source: InformationSource.AI_EXTRACTION,
      provenance: NoteProvenance.AI_GENERATED,
      confidence: extractionResult.confidence ?? undefined,
    }));

    if (symptomDocsToInsert.length > 0) {
      await Symptom.insertMany(symptomDocsToInsert);
    }

    // Normalize and sort timeline events chronologically
    const normalizedTimelineEvents = normalizeAndSortTimelineEvents(
      extractionResult.timeline,
      extractionResult.symptoms,
      existingCase.createdAt || new Date()
    );

    // Save TriageNote
    const timelineSummaryText = normalizedTimelineEvents
      .map((t) => (t.relativeTime ? `[${t.relativeTime}] ${t.description}` : t.description))
      .join('\n');

    const triageNoteDoc = await TriageNote.findOneAndUpdate(
      { caseId: existingCase._id },
      {
        caseId: existingCase._id,
        presentingConcern: narrative.substring(0, 300),
        symptomSummary: extractionResult.symptoms.map((s) => s.name).join(', ') || 'No symptoms identified',
        timelineSummary: timelineSummaryText,
        timelineEvents: normalizedTimelineEvents,
        negativeFindings: extractionResult.negativeFindings,
        uncertainties: extractionResult.uncertainties,
        confidence: extractionResult.confidence ?? null,
        sourceTextHash,
        priority: originalPriority, // Must preserve original Case priority
        provenance: NoteProvenance.AI_GENERATED, // ALWAYS AI_GENERATED, NEVER HUMAN_VERIFIED AUTOMATICALLY
        generationStatus: GenerationStatus.COMPLETED,
        generatedBy: 'gemini-2.5-flash',
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Audit Log for Success
    await AuditLog.create({
      actorId: (reviewerUser.id || reviewerUser._id)?.toString() || 'SYSTEM',
      actorRole: reviewerUser.role,
      action: AuditEventType.AI_OUTPUT_GENERATED,
      resourceType: 'Case',
      resourceId: existingCase._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'REVIEWER_API',
      outcome: 'SUCCESS',
      metadata: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        status: 'COMPLETED',
        symptomCount: extractionResult.symptoms.length,
        negativeFindingCount: extractionResult.negativeFindings.length,
        timelineEventCount: normalizedTimelineEvents.length,
      },
    });

    await AuditLog.create({
      actorId: (reviewerUser.id || reviewerUser._id)?.toString() || 'SYSTEM',
      actorRole: reviewerUser.role,
      action: AuditEventType.TIMELINE_GENERATED,
      resourceType: 'Case',
      resourceId: existingCase._id.toString(),
      caseId: existingCase._id,
      timestamp: new Date(),
      source: 'REVIEWER_API',
      outcome: 'SUCCESS',
      metadata: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        timelineEventCount: normalizedTimelineEvents.length,
      },
    });

    // Safety Invariant Check: Ensure Case fields were NOT mutated by extraction
    const finalCase = await Case.findById(caseId);
    if (finalCase) {
      if (finalCase.priority !== originalPriority) {
        finalCase.priority = originalPriority;
        await finalCase.save();
      }
    }

    return {
      caseId: existingCase._id.toString(),
      source: InformationSource.AI_EXTRACTION,
      provenance: NoteProvenance.AI_GENERATED,
      generationStatus: GenerationStatus.COMPLETED,
      model: 'gemini-2.5-flash',
      generatedAt: triageNoteDoc.generatedAt,
      symptoms: extractionResult.symptoms,
      negativeFindings: extractionResult.negativeFindings,
      timeline: extractionResult.timeline,
      timelineEvents: normalizedTimelineEvents,
      uncertainties: extractionResult.uncertainties,
      confidence: extractionResult.confidence ?? null,
      noteId: triageNoteDoc._id.toString(),
    };
  }

  /**
   * Retrieves chronological timeline events for a case, enforcing facility authorization.
   */
  async getCaseTimeline(
    caseId: string,
    reviewerUser: IUserDocument
  ): Promise<{
    caseId: string;
    timelineEvents: ITimelineEvent[];
    sourceTextHash?: string;
    generationStatus: GenerationStatus;
    generatedAt?: Date;
  }> {
    if (!Types.ObjectId.isValid(caseId)) {
      throw new Error('Invalid case ID format');
    }

    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      throw new Error('Case not found');
    }

    // Facility isolation check
    if (
      reviewerUser.role !== UserRole.ADMIN &&
      existingCase.facilityId?.toString() !== reviewerUser.facilityId?.toString()
    ) {
      throw new Error('Unauthorized access to case from another facility');
    }

    const note = await TriageNote.findOne({ caseId: existingCase._id });

    return {
      caseId: existingCase._id.toString(),
      timelineEvents: note?.timelineEvents || [],
      sourceTextHash: note?.sourceTextHash,
      generationStatus: note?.generationStatus || GenerationStatus.PENDING,
      generatedAt: note?.generatedAt,
    };
  }
}
