/**
 * SYNTHETIC DATASET SEED SERVICE
 * 
 * Performs deterministic, safe, idempotent database population of synthetic
 * demo/testing entities across facilities, users, cases, evaluations, triage notes,
 * referrals, and notifications.
 * 
 * STRICT INVARIANT: Refuses execution in production environment.
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { hashPassword } from '../modules/auth/auth.utils.js';
import { Facility } from '../modules/facilities/facility.model.js';
import { User } from '../modules/users/user.model.js';
import { Case } from '../modules/cases/case.model.js';
import { CasePriority, CaseStatus, IntakeSource } from '../modules/cases/case.types.js';
import { Review } from '../modules/reviews/review.model.js';
import { Referral } from '../modules/referrals/referral.model.js';
import { SafetyEvaluation } from '../modules/safety/safety-evaluation.model.js';
import { TriageNote } from '../modules/triage/triage-note.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { NotificationChannel, NotificationStatus, NotificationType } from '../modules/notifications/notification.types.js';
import { AuditLog } from '../modules/audit/audit-log.model.js';
import { AuditEventType } from '../modules/audit/audit-log.types.js';
import { VoiceInputModel } from '../modules/voice/voice-input.model.js';
import { Report } from '../modules/reports/report.model.js';
import { VisualInput } from '../modules/vision/visual-input.model.js';
import { TranslationModel } from '../modules/translation/translation.model.js';
import {
  SYNTHETIC_FACILITIES,
  SYNTHETIC_USERS,
  SYNTHETIC_CASES,
} from './synthetic-dataset.data.js';

export interface SeedSummary {
  facilities: number;
  users: number;
  cases: number;
  safetyEvaluations: number;
  triageNotes: number;
  reviews: number;
  referrals: number;
  notifications: number;
  auditLogs: number;
  voiceInputs: number;
  reports: number;
  visualInputs: number;
  translations: number;
}

export class SeedService {
  /**
   * Seeds deterministic synthetic dataset.
   * Throws if executed in production environment.
   */
  static async seed(): Promise<SeedSummary> {
    if (process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production') {
      throw new Error('SECURITY VIOLATION: Seeding synthetic test data is strictly forbidden in production.');
    }

    logger.info('[SeedService] Starting deterministic synthetic dataset initialization...');

    const summary: SeedSummary = {
      facilities: 0,
      users: 0,
      cases: 0,
      safetyEvaluations: 0,
      triageNotes: 0,
      reviews: 0,
      referrals: 0,
      notifications: 0,
      auditLogs: 0,
      voiceInputs: 0,
      reports: 0,
      visualInputs: 0,
      translations: 0,
    };

    // 1. Seed Facilities
    const facilityMap = new Map<string, string>(); // code -> code
    for (const f of SYNTHETIC_FACILITIES) {
      const existing = await Facility.findOne({ code: f.facilityId });
      if (existing) {
        existing.name = f.name;
        existing.type = f.type as any;
        existing.state = f.state;
        existing.district = f.district;
        existing.active = f.isActive;
        await existing.save();
      } else {
        await Facility.create({
          name: f.name,
          code: f.facilityId,
          type: f.type,
          state: f.state,
          district: f.district,
          active: f.isActive,
          supportedLanguages: ['en', 'hi', 'or', 'bn', 'ta', 'te', 'mr', 'gu'],
        });
      }
      facilityMap.set(f.facilityId, f.facilityId);
      summary.facilities++;
    }

    // 2. Seed Users
    const defaultPasswordHash = await hashPassword('Password123!');
    const userMap = new Map<string, mongoose.Types.ObjectId>(); // email -> ObjectId

    for (const u of SYNTHETIC_USERS) {
      let userDoc = await User.findOne({ email: u.email });
      if (userDoc) {
        userDoc.name = u.name;
        userDoc.phone = u.phone;
        userDoc.role = u.role;
        userDoc.facilityId = u.facilityId;
        userDoc.preferredLanguage = u.preferredLanguage;
        userDoc.isActive = u.isActive;
        userDoc.isDeleted = false;
        userDoc.passwordHash = defaultPasswordHash;
        await userDoc.save();
      } else {
        userDoc = await User.create({
          name: u.name,
          email: u.email,
          phone: u.phone,
          passwordHash: defaultPasswordHash,
          role: u.role,
          facilityId: u.facilityId,
          preferredLanguage: u.preferredLanguage,
          isActive: u.isActive,
          isDeleted: false,
        });
      }
      userMap.set(u.email, userDoc._id);
      summary.users++;
    }

    // 3. Seed Cases, SafetyEvaluations, TriageNotes, Reviews, Referrals
    const now = Date.now();

    for (const c of SYNTHETIC_CASES) {
      const patientId = userMap.get(c.patientEmail);
      if (!patientId) continue;

      const reviewerId = c.assignedReviewerEmail ? userMap.get(c.assignedReviewerEmail) : undefined;
      const createdAt = new Date(now - c.hoursAgo * 3600 * 1000);

      // Calculate authoritative SLA due date (URGENT=1h, PRIORITY=4h, ROUTINE=24h)
      let slaHours = 24;
      if (c.priority === CasePriority.URGENT) slaHours = 1;
      else if (c.priority === CasePriority.PRIORITY) slaHours = 4;
      const slaDueAt = new Date(createdAt.getTime() + slaHours * 3600 * 1000);

      let caseDoc = await Case.findOne({ caseNumber: c.caseNumber });
      if (caseDoc) {
        caseDoc.patientId = patientId;
        caseDoc.facilityId = c.facilityId;
        caseDoc.priority = c.priority;
        caseDoc.status = c.status;
        caseDoc.chiefComplaint = c.chiefComplaint;
        caseDoc.language = c.language;
        caseDoc.assignedReviewerId = reviewerId || undefined;
        caseDoc.slaDueAt = slaDueAt;
        caseDoc.createdAt = createdAt;
        caseDoc.isDeleted = false;
        await caseDoc.save();
      } else {
        caseDoc = await Case.create({
          caseNumber: c.caseNumber,
          patientId,
          facilityId: c.facilityId,
          priority: c.priority,
          status: c.status,
          intakeSource: IntakeSource.TEXT,
          chiefComplaint: c.chiefComplaint,
          language: c.language,
          assignedReviewerId: reviewerId || null,
          slaDueAt,
          currentSafetyVersion: 1,
          currentNoteVersion: 1,
          createdAt,
          isDeleted: false,
        });
      }
      summary.cases++;

      const caseObjectId = caseDoc._id;

      // 4. Seed SafetyEvaluation (Version 1)
      const matchedSignals = c.ruleTrigger
        ? [
            {
              ruleId: `RULE-${c.category}-SYN`,
              ruleName: c.ruleTrigger,
              category: 'RED_FLAG' as any,
              priority: c.priority,
              sourceType: 'INTAKE_NARRATIVE' as any,
              sourceId: caseObjectId.toString(),
              evidenceSnippet: c.chiefComplaint,
              explanation: `Synthetic evidence match for clinical red flag: ${c.ruleTrigger}`,
              detectedAt: createdAt,
            },
          ]
        : [];

      await SafetyEvaluation.findOneAndUpdate(
        { caseId: caseObjectId, evaluationVersion: 1 },
        {
          caseId: caseObjectId,
          evaluationVersion: 1,
          status: 'ACTIVE',
          calculatedPriority: c.priority,
          effectivePriority: c.priority,
          matchedSignals,
          hasHumanOverride: false,
          evaluatedAt: createdAt,
          evaluatedBy: 'SAFETY_ENGINE',
        },
        { upsert: true, new: true }
      );
      summary.safetyEvaluations++;

      // 5. Seed Structured TriageNote (Version 1)
      await TriageNote.findOneAndUpdate(
        { caseId: caseObjectId, noteVersion: 1 },
        {
          caseId: caseObjectId,
          noteVersion: 1,
          status: 'ACTIVE',
          symptomSummary: c.narrativeText || c.chiefComplaint,
          pertinentPositives: [c.chiefComplaint],
          pertinentNegatives: ['No unmanaged chronic comorbidities mentioned'],
          redFlags: c.ruleTrigger ? [c.ruleTrigger] : [],
          recommendedCareLevel: c.priority === CasePriority.URGENT ? 'EMERGENCY' : c.priority === CasePriority.PRIORITY ? 'URGENT_CARE' : 'PRIMARY_CARE',
          suggestedQuestions: ['Are symptoms worsening with exertion?', 'Have any over-the-counter remedies been taken?'],
          missingInformationAlerts: c.category === 'PRIORITY' ? ['Confirm exact onset time and temperature record'] : [],
          aiGeneratedAt: createdAt,
          sourceEvidenceHash: `hash-${c.caseNumber}-v1`,
          verified: c.status === CaseStatus.RESOLVED,
          verifiedBy: reviewerId || null,
          verifiedAt: c.status === CaseStatus.RESOLVED ? new Date(createdAt.getTime() + 1800000) : null,
        },
        { upsert: true, new: true }
      );
      summary.triageNotes++;

      // 6. Seed Review if present
      if (c.review && reviewerId) {
        const reviewDoc = await Review.findOneAndUpdate(
          { caseId: caseObjectId },
          {
            caseId: caseObjectId,
            reviewerId,
            reviewStatus: c.review.reviewStatus,
            reviewerNotes: c.review.reviewerNotes,
            priorityOverride: c.review.priorityOverride || null,
            overrideReason: c.review.overrideReason || null,
            createdAt: new Date(createdAt.getTime() + 1800000),
          },
          { upsert: true, new: true }
        );
        summary.reviews++;

        // 7. Seed Referral if present
        if (c.referral) {
          await Referral.findOneAndUpdate(
            { caseId: caseObjectId },
            {
              caseId: caseObjectId,
              reviewId: reviewDoc._id,
              originatingFacilityId: c.referral.fromFacilityId,
              destinationFacilityId: c.referral.toFacilityId,
              destinationDepartment: c.referral.destinationDepartment,
              referralReason: c.referral.reason,
              clinicalSummary: c.referral.clinicalSummary,
              status: c.referral.status,
              authorizedByReviewerId: reviewerId,
              authorizedAt: new Date(createdAt.getTime() + 2000000),
              acceptedAt: c.referral.status === 'ACCEPTED' ? new Date(createdAt.getTime() + 2400000) : null,
            },
            { upsert: true, new: true }
          );
          summary.referrals++;
        }
      }

      // 8. Seed Sample Operational Notifications
      if (reviewerId) {
        const notifKey = `${caseObjectId.toString()}:CASE_ASSIGNED:${reviewerId.toString()}`;
        const existingNotif = await Notification.findOne({ idempotencyKey: notifKey });
        if (!existingNotif) {
          await Notification.create({
            userId: reviewerId,
            facilityId: c.facilityId,
            caseId: caseObjectId,
            type: NotificationType.CASE_ASSIGNED,
            channel: NotificationChannel.IN_APP,
            title: `Case ${c.caseNumber} Assigned`,
            body: `Case ${c.caseNumber} has been assigned for clinical review.`,
            status: NotificationStatus.SENT,
            sentAt: createdAt,
            idempotencyKey: notifKey,
            metadata: { caseNumber: c.caseNumber },
          });
          summary.notifications++;
        }
      }

      // 9. Seed Audit Log Event
      const auditLogDoc = await AuditLog.findOne({ resourceId: caseObjectId.toString(), action: AuditEventType.CASE_CREATED });
      if (!auditLogDoc) {
        await AuditLog.create({
          actorId: patientId.toString(),
          actorRole: 'PATIENT',
          action: AuditEventType.CASE_CREATED,
          resourceType: 'Case',
          resourceId: caseObjectId.toString(),
          caseId: caseObjectId,
          timestamp: createdAt,
          source: 'PATIENT_PORTAL',
          outcome: 'SUCCESS',
          metadata: { caseNumber: c.caseNumber, priority: c.priority },
        });
        summary.auditLogs++;
      }
      // 10. Seed Multimodal Sub-Documents for Synthetic Scenarios
      // A. Voice STT Input (CASE-SYN-PRIORITY-007)
      if (c.caseNumber === 'CASE-SYN-PRIORITY-007') {
        await VoiceInputModel.findOneAndUpdate(
          { caseId: caseObjectId, contentHash: `hash-voice-${c.caseNumber}` },
          {
            caseId: caseObjectId,
            storageKey: `uploads/synthetic_voice_${c.caseNumber.toLowerCase()}.wav`,
            contentHash: `hash-voice-${c.caseNumber}`,
            originalFilename: `synthetic_voice_${c.caseNumber.toLowerCase()}.wav`,
            mimeType: 'audio/wav',
            fileSize: 102400,
            durationMs: 15000,
            uploadedBy: patientId,
            uploadedAt: createdAt,
            processingStatus: 'PROCESSED' as any,
            transcriptStatus: 'COMPLETED' as any,
            verificationStatus: 'REQUIRED' as any,
            requestedLanguage: 'or-IN',
            detectedLanguage: 'or',
            provider: 'mock',
            transcript: {
              text: c.chiefComplaint,
              source: 'VOICE_TRANSCRIPT' as any,
              provenance: 'AI_GENERATED' as any,
              language: 'or',
              confidence: 0.65,
            },
          },
          { upsert: true, new: true }
        );
        summary.voiceInputs++;
      }

      // B. Medical OCR Report (CASE-SYN-PRIORITY-006, CASE-SYN-URGENT-010)
      if (c.caseNumber === 'CASE-SYN-PRIORITY-006' || c.caseNumber === 'CASE-SYN-URGENT-010') {
        await Report.findOneAndUpdate(
          { caseId: caseObjectId, contentHash: `hash-ocr-${c.caseNumber}` },
          {
            caseId: caseObjectId,
            storageKey: `uploads/synthetic_report_${c.caseNumber.toLowerCase()}.pdf`,
            contentHash: `hash-ocr-${c.caseNumber}`,
            originalFilename: `synthetic_report_${c.caseNumber.toLowerCase()}.pdf`,
            mimeType: 'application/pdf',
            fileSize: 204800,
            uploadTimestamp: createdAt,
            processingStatus: 'PROCESSED' as any,
            verificationStatus: 'REQUIRED' as any,
            ocrStatus: 'PROCESSED',
            ocrUsable: true,
            extractionConfidence: c.caseNumber === 'CASE-SYN-PRIORITY-006' ? 0.55 : 0.95,
            extractedText: c.chiefComplaint,
            extractedData: c.caseNumber === 'CASE-SYN-URGENT-010' ? { Potassium: '7.1 mmol/L' } : {},
            hasUnstructuredLabData: c.caseNumber === 'CASE-SYN-PRIORITY-006',
            isLatest: true,
          },
          { upsert: true, new: true }
        );
        summary.reports++;
      }

      // C. Visual Observation (CASE-SYN-ROUTINE-002)
      if (c.caseNumber === 'CASE-SYN-ROUTINE-002') {
        await VisualInput.findOneAndUpdate(
          { caseId: caseObjectId, contentHash: `hash-vision-${c.caseNumber}` },
          {
            caseId: caseObjectId,
            storageKey: 'uploads/synthetic_skin_rash.jpg',
            contentHash: `hash-vision-${c.caseNumber}`,
            originalFilename: 'synthetic_skin_rash.jpg',
            mimeType: 'image/jpeg',
            fileSize: 153600,
            uploadedBy: patientId,
            uploadedAt: createdAt,
            processingStatus: 'PROCESSED' as any,
            verificationStatus: 'REQUIRED' as any,
            qualityStatus: 'SUFFICIENT',
            provider: 'mock',
            observations: [
              {
                id: `obs-syn-${c.caseNumber}`,
                type: 'REDNESS' as any,
                description: 'Erythematous pruritic rash on forearm',
                location: 'Forearm',
                certainty: 'OBSERVED' as any,
                provenance: 'AI_GENERATED' as any,
              },
            ],
          },
          { upsert: true, new: true }
        );
        summary.visualInputs++;
      }

      // D. Multilingual Translation (for non-English synthetic cases)
      if (c.language !== 'en') {
        await TranslationModel.findOneAndUpdate(
          {
            caseId: caseObjectId,
            sourceType: 'PATIENT_TEXT' as any,
            sourceId: caseObjectId,
            sourceContentHash: `hash-trans-${c.caseNumber}`,
            targetLanguage: 'en',
          },
          {
            caseId: caseObjectId,
            sourceType: 'PATIENT_TEXT' as any,
            sourceId: caseObjectId,
            sourceLanguage: c.language,
            targetLanguage: 'en',
            originalText: c.chiefComplaint,
            translatedText: `[Translated from ${c.language}]: ${c.chiefComplaint}`,
            sourceContentHash: `hash-trans-${c.caseNumber}`,
            status: 'COMPLETED' as any,
            provider: 'MockTranslationProvider',
            provenance: 'AI_GENERATED' as any,
            verificationStatus: 'REQUIRED' as any,
            requestedBy: patientId,
          },
          { upsert: true, new: true }
        );
        summary.translations++;
      }
    }

    logger.info({ summary }, '[SeedService] Deterministic synthetic dataset seeded successfully.');
    return summary;
  }
}
