/**
 * REUSABLE TEST FIXTURES & FACTORIES (PHASE 20)
 * 
 * Provides centralized factory functions for creating synthetic test models
 * and tokens with predictable defaults and clean overrides.
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';
import { User } from '../../src/modules/users/user.model.js';
import { UserRole, IUser } from '../../src/modules/users/user.types.js';
import { Facility } from '../../src/modules/facilities/facility.model.js';
import { FacilityType, IFacility } from '../../src/modules/facilities/facility.types.js';
import { Case } from '../../src/modules/cases/case.model.js';
import { CasePriority, CaseStatus, IntakeSource, ICase } from '../../src/modules/cases/case.types.js';
import { SafetyEvaluation, ISafetyEvaluation } from '../../src/modules/safety/safety-evaluation.model.js';
import { TriageNote, ITriageNote } from '../../src/modules/triage/triage-note.model.js';
import { Review } from '../../src/modules/reviews/review.model.js';
import { IReview, ReviewStatus } from '../../src/modules/reviews/review.types.js';
import { Referral } from '../../src/modules/referrals/referral.model.js';
import { IReferral, ReferralStatus } from '../../src/modules/referrals/referral.types.js';
import { Notification } from '../../src/modules/notifications/notification.model.js';
import { INotification, NotificationChannel, NotificationStatus, NotificationType } from '../../src/modules/notifications/notification.types.js';
import { hashPassword } from '../../src/modules/auth/auth.utils.js';

let counter = 1000;
const nextId = () => counter++;

/**
 * Creates a valid JWT with the strict Phase 3 & 19 claims invariant { id, role }
 */
export const createTestAuthToken = (userId: string, role: UserRole = UserRole.PATIENT): string => {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Creates a synthetic User document for testing
 */
export const createTestUser = async (overrides: Partial<IUser> = {}): Promise<any> => {
  const id = nextId();
  const passwordHash = await hashPassword('TestPassword123!');
  return User.create({
    name: `Test User ${id}`,
    email: `test.user.${id}@example.test`,
    phone: `+9199999${id.toString().padStart(5, '0')}`,
    passwordHash,
    role: UserRole.PATIENT,
    preferredLanguage: 'en',
    isActive: true,
    isDeleted: false,
    ...overrides,
  });
};

/**
 * Creates a synthetic Facility document for testing
 */
export const createTestFacility = async (overrides: Partial<IFacility> = {}): Promise<any> => {
  const id = nextId();
  return Facility.create({
    name: `Test Facility ${id}`,
    code: `FAC-TEST-${id}`,
    type: FacilityType.PHC,
    district: 'Test District',
    state: 'Test State',
    supportedLanguages: ['en', 'hi'],
    active: true,
    ...overrides,
  });
};

/**
 * Creates a synthetic Case document for testing
 */
export const createTestCase = async (overrides: Partial<ICase> = {}): Promise<any> => {
  const id = nextId();
  const now = Date.now();
  return Case.create({
    caseNumber: `CASE-TEST-${id}`,
    patientId: overrides.patientId || new mongoose.Types.ObjectId(),
    facilityId: overrides.facilityId || 'FAC-DH-CUTTACK',
    priority: CasePriority.ROUTINE,
    status: CaseStatus.OPEN,
    intakeSource: IntakeSource.TEXT,
    chiefComplaint: `Synthetic symptom complaint ${id}`,
    language: 'en',
    slaDueAt: new Date(now + 24 * 3600 * 1000),
    isDeleted: false,
    ...overrides,
  });
};

/**
 * Creates a synthetic SafetyEvaluation document for testing
 */
export const createTestSafetyEvaluation = async (overrides: Partial<ISafetyEvaluation> = {}): Promise<any> => {
  return SafetyEvaluation.create({
    caseId: overrides.caseId || new mongoose.Types.ObjectId(),
    evaluationVersion: 1,
    status: 'ACTIVE',
    calculatedPriority: CasePriority.ROUTINE,
    effectivePriority: CasePriority.ROUTINE,
    matchedSignals: [],
    hasHumanOverride: false,
    evaluatedAt: new Date(),
    evaluatedBy: 'SAFETY_ENGINE',
    ...overrides,
  });
};

/**
 * Creates a synthetic TriageNote document for testing
 */
export const createTestTriageNote = async (overrides: Partial<ITriageNote> = {}): Promise<any> => {
  return TriageNote.create({
    caseId: overrides.caseId || new mongoose.Types.ObjectId(),
    noteVersion: 1,
    status: 'ACTIVE',
    symptomSummary: 'Synthetic symptom narrative summary',
    pertinentPositives: ['Symptom positive'],
    pertinentNegatives: ['No red flags'],
    redFlags: [],
    recommendedCareLevel: 'PRIMARY_CARE',
    suggestedQuestions: ['Any worsening?'],
    missingInformationAlerts: [],
    aiGeneratedAt: new Date(),
    sourceEvidenceHash: `hash-${Date.now()}`,
    verified: false,
    ...overrides,
  });
};

/**
 * Creates a synthetic Review document for testing
 */
export const createTestReview = async (overrides: Partial<IReview> = {}): Promise<any> => {
  return Review.create({
    caseId: overrides.caseId || new mongoose.Types.ObjectId(),
    reviewerId: overrides.reviewerId || new mongoose.Types.ObjectId(),
    reviewStatus: ReviewStatus.COMPLETED,
    reviewerNotes: 'Verified case notes.',
    ...overrides,
  });
};

/**
 * Creates a synthetic Referral document for testing
 */
export const createTestReferral = async (overrides: Partial<IReferral> = {}): Promise<any> => {
  const id = nextId();
  return Referral.create({
    referralCode: `REF-TEST-${id}`,
    caseId: overrides.caseId || new mongoose.Types.ObjectId(),
    originatingFacilityId: overrides.originatingFacilityId || 'FAC-DH-CUTTACK',
    destinationFacilityId: overrides.destinationFacilityId || 'FAC-SCB-MCH',
    destinationDepartment: overrides.destinationDepartment || 'General Medicine',
    referringReviewerId: overrides.referringReviewerId || new mongoose.Types.ObjectId(),
    reason: overrides.reason || 'Specialist consultation required',
    summary: overrides.summary || 'Patient requires tertiary level evaluation',
    status: ReferralStatus.PENDING,
    statusHistory: [],
    ...overrides,
  });
};

/**
 * Creates a clean default SafetyEvaluationContext for unit testing the safety engine
 */
export const createTestSafetyContext = (overrides: Record<string, unknown> = {}): any => {
  return {
    caseId: new mongoose.Types.ObjectId(),
    facilityId: 'FAC-DH-CUTTACK',
    symptoms: [],
    reports: [],
    voiceInputs: [],
    visualInputs: [],
    reviews: [],
    missingInfoResults: [],
    labRules: [],
    pediatricRules: [],
    aiExtractions: [],
    ...overrides,
  };
};

/**
 * Creates a synthetic Notification document for testing
 */
export const createTestNotification = async (overrides: Partial<INotification> = {}): Promise<any> => {
  const id = nextId();
  return Notification.create({
    userId: overrides.userId || new mongoose.Types.ObjectId(),
    type: NotificationType.CASE_ASSIGNED,
    channel: NotificationChannel.IN_APP,
    title: `Test Notification ${id}`,
    body: `Test notification body ${id}`,
    status: NotificationStatus.SENT,
    idempotencyKey: `notif:test:${id}`,
    metadata: {},
    ...overrides,
  });
};
