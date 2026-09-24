import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import { Case } from '../src/modules/cases/case.model.js';
import { CaseStatus, CasePriority, IntakeSource } from '../src/modules/cases/case.types.js';
import { Symptom } from '../src/modules/symptoms/symptom.model.js';
import { SymptomStatus, TemporalStatus, InformationSource } from '../src/modules/symptoms/symptom.types.js';
import { Report } from '../src/modules/reports/report.model.js';
import { LabSafetyRule } from '../src/modules/safety/lab-rule.model.js';
import { PediatricSafetyRule } from '../src/modules/safety/pediatric-rule.model.js';
import { SafetyEvaluation } from '../src/modules/safety/safety-evaluation.model.js';
import { SafetyRegistry } from '../src/modules/safety/safety.registry.ts';
import { SafetyEngine } from '../src/modules/safety/safety.engine.js';
import { SafetyEvaluationService } from '../src/modules/safety/safety-evaluation.service.js';

describe('Phase 15 — Safety & Urgency Engine Hardened Suite', () => {
  const app = createApp();

  let patientToken: string;
  let reviewerToken: string;
  let reviewerFacBToken: string;

  let patientId: string;
  let reviewerId: string;
  let reviewerFacBId: string;

  let testCaseId: string;

  const FACILITY_A = 'FACILITY_ALPHA';
  const FACILITY_B = 'FACILITY_BETA';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Case.deleteMany({});
    await Symptom.deleteMany({});
    await Report.deleteMany({});
    await LabSafetyRule.deleteMany({});
    await PediatricSafetyRule.deleteMany({});
    await SafetyEvaluation.deleteMany({});

    // Create Patient
    const patientDoc = await User.create({
      name: 'Patient One',
      email: 'patient1@example.com',
      password: 'Password123!',
      role: UserRole.PATIENT,
      facilityId: FACILITY_A,
    });
    patientId = patientDoc._id.toString();

    // Create Reviewer Facility A
    const reviewerDoc = await User.create({
      name: 'Doctor Alpha',
      email: 'doc.alpha@example.com',
      password: 'Password123!',
      role: UserRole.DOCTOR,
      facilityId: FACILITY_A,
    });
    reviewerId = reviewerDoc._id.toString();

    // Create Reviewer Facility B
    const reviewerFacBDoc = await User.create({
      name: 'Doctor Beta',
      email: 'doc.beta@example.com',
      password: 'Password123!',
      role: UserRole.DOCTOR,
      facilityId: FACILITY_B,
    });
    reviewerFacBId = reviewerFacBDoc._id.toString();

    // Tokens
    patientToken = jwt.sign({ id: patientId, role: UserRole.PATIENT }, env.JWT_SECRET, { expiresIn: '1h' });
    reviewerToken = jwt.sign({ id: reviewerId, role: UserRole.DOCTOR }, env.JWT_SECRET, { expiresIn: '1h' });
    reviewerFacBToken = jwt.sign({ id: reviewerFacBId, role: UserRole.DOCTOR }, env.JWT_SECRET, { expiresIn: '1h' });

    // Base Case
    const caseDoc = await Case.create({
      caseNumber: 'CASE-SAFETY-1001',
      patientId: new mongoose.Types.ObjectId(patientId),
      facilityId: FACILITY_A,
      status: CaseStatus.OPEN,
      priority: CasePriority.ROUTINE,
      intakeSource: IntakeSource.TEXT,
      chiefComplaint: 'Feeling unwell with mild fever',
      language: 'en',
    });
    testCaseId = caseDoc._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- SECTION A: REGISTRY INVENTORY & PRECEDENCE ---
  it('1. should verify exact 22 rule inventory registered in SafetyRegistry', () => {
    const rules = SafetyRegistry.getAllRules();
    expect(rules.length).toBe(22);

    const urgentRules = rules.filter((r) => r.priority === CasePriority.URGENT);
    const priorityRules = rules.filter((r) => r.priority === CasePriority.PRIORITY);

    expect(urgentRules.length).toBe(10);
    expect(priorityRules.length).toBe(12);
  });

  // --- SECTION B: DIRECT BEHAVIOR TESTS FOR ALL 10 URGENT RULES ---

  it('2. Rule URGENT_HUMAN_ESCALATION: should emit URGENT when hasHumanEscalation is true', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [{ isEscalated: true }],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
      hasHumanEscalation: true,
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_HUMAN_ESCALATION')).toBe(true);
  });

  it('3. Rule URGENT_SEVERE_BREATHING: should emit URGENT for current severe breathing difficulty', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Shortness of breath', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT, severity: 8 },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_SEVERE_BREATHING')).toBe(true);
  });

  it('4. Rule URGENT_CHEST_PAIN_BREATHING: should emit URGENT when both Chest Pain and Breathing difficulty are current', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Chest pain', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
        { symptomName: 'Breathing difficulty', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_CHEST_PAIN_BREATHING')).toBe(true);
  });

  it('5. Rule URGENT_ALTERED_CONSCIOUSNESS: should emit URGENT for current loss of consciousness or confusion', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Unconscious fainted', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_ALTERED_CONSCIOUSNESS')).toBe(true);
  });

  it('6. Rule URGENT_SEVERE_BLEEDING: should emit URGENT for current severe hemorrhage', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Uncontrolled Bleeding', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT, severity: 9 },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_SEVERE_BLEEDING')).toBe(true);
  });

  it('7. Rule URGENT_SEIZURE: should emit URGENT for current or recent seizure', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Active Seizure', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_SEIZURE')).toBe(true);
  });

  it('8. Rule URGENT_SELF_HARM: should emit URGENT for self-harm intent language or AI flag', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Intending self-harm', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_SELF_HARM')).toBe(true);
  });

  it('9. Rule URGENT_SEVERE_ALLERGY: should emit URGENT for severe allergy with airway swelling', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Anaphylaxis throat swelling', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT, severity: 8 },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_SEVERE_ALLERGY')).toBe(true);
  });

  it('10. Rule URGENT_PEDIATRIC_CONFIGURED: should emit URGENT when facility pediatric rule matches', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      patientAgeMonths: 2,
      symptoms: [
        { symptomName: 'Fever', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [
        { _id: 'ped1', facilityId: FACILITY_A, ruleName: 'Infant Fever Protocol', maxAgeMonths: 3, requiredSymptomName: 'Fever', resultingPriority: CasePriority.URGENT, isActive: true },
      ],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_PEDIATRIC_CONFIGURED')).toBe(true);
  });

  it('11. Rule URGENT_CLINICIAN_LAB: should emit URGENT when validated lab numeric value and unit match rule', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [
        { ocrStatus: 'PROCESSED', extractedData: { Hemoglobin: '5.2 g/dL' }, isLatest: true },
      ],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [
        { _id: 'lab1', facilityId: FACILITY_A, labTestName: 'Hemoglobin', operator: 'LT', thresholdValue: 7.0, unit: 'g/dL', resultingPriority: CasePriority.URGENT, isActive: true },
      ],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.URGENT);
    expect(res.matchedSignals.some((s) => s.ruleId === 'URGENT_CLINICIAN_LAB')).toBe(true);
  });

  // --- SECTION C: DIRECT BEHAVIOR TESTS FOR ALL 5 PRIORITY RULES ---

  it('12. Rule PRIORITY_FEVER_PERSISTENT: should emit PRIORITY for fever lasting > 3 days', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'High Fever', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT, duration: '4 days' },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'PRIORITY_FEVER_PERSISTENT')).toBe(true);
  });

  it('13. Rule PRIORITY_REPEATED_VOMITING: should emit PRIORITY for repeated vomiting', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Vomiting emesis', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'PRIORITY_REPEATED_VOMITING')).toBe(true);
  });

  it('14. Rule PRIORITY_DEHYDRATION_CONCERN: should emit PRIORITY for dehydration symptoms', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Dehydration excessive thirst', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'PRIORITY_DEHYDRATION_CONCERN')).toBe(true);
  });

  it('15. Rule PRIORITY_PERSISTENT_WEAKNESS: should emit PRIORITY for persistent weakness', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [
        { symptomName: 'Weakness lethargy', status: SymptomStatus.PRESENT, temporalStatus: TemporalStatus.CURRENT },
      ],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'PRIORITY_PERSISTENT_WEAKNESS')).toBe(true);
  });

  it('16. Rule PRIORITY_REVIEWER_REQUESTED: should emit PRIORITY when reviewer requests priority review', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [{ requestedPriority: CasePriority.PRIORITY }],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'PRIORITY_REVIEWER_REQUESTED')).toBe(true);
  });

  // --- SECTION D: DIRECT BEHAVIOR TESTS FOR ALL 7 UNCERTAINTY RULES ---

  it('17. Rule UNCERTAINTY_AI_EXTRACTION: should emit PRIORITY for failed AI extraction', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
      aiExtractions: [{ status: 'FAILED', isLatest: true }],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_AI_EXTRACTION')).toBe(true);
  });

  it('18. Rule UNCERTAINTY_LOW_CONFIDENCE: should emit PRIORITY for AI extraction confidence < 0.70', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
      aiExtractions: [{ confidence: 0.62, isLatest: true }],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_LOW_CONFIDENCE')).toBe(true);
  });

  it('19. Rule UNCERTAINTY_OCR_FAILURE: should emit PRIORITY for active OCR failure', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [{ ocrStatus: 'FAILED', isLatest: true }],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_OCR_FAILURE')).toBe(true);
  });

  it('20. Rule UNCERTAINTY_VOICE_STT_FAILURE: should emit PRIORITY for active voice STT failure', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [],
      voiceInputs: [{ status: 'FAILED', isLatest: true }],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_VOICE_STT_FAILURE')).toBe(true);
  });

  it('21. Rule UNCERTAINTY_VISUAL_FAILURE: should emit PRIORITY for active visual input error', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [],
      voiceInputs: [],
      visualInputs: [{ status: 'FAILED', isLatest: true }],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_VISUAL_FAILURE')).toBe(true);
  });

  it('22. Rule UNCERTAINTY_MISSING_INFO: should emit PRIORITY for unresolved required missing info', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [{ hasRequiredMissingInfo: true, isResolved: false, isLatest: true }],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_MISSING_INFO')).toBe(true);
  });

  it('23. Rule UNCERTAINTY_UNSTRUCTURED_LAB: should emit PRIORITY for report with malformed lab data', async () => {
    const res = SafetyEngine.evaluate({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      facilityId: FACILITY_A,
      symptoms: [],
      reports: [{ ocrStatus: 'PROCESSED', hasUnstructuredLabData: true, isLatest: true }],
      voiceInputs: [],
      visualInputs: [],
      reviews: [],
      missingInfoResults: [],
      labRules: [],
      pediatricRules: [],
    });
    expect(res.calculatedPriority).toBe(CasePriority.PRIORITY);
    expect(res.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_UNSTRUCTURED_LAB')).toBe(true);
  });

  // --- SECTION E: HARDENED LAB UNIT MISMATCH & MALFORMED LAB TESTS ---

  it('24. should NOT trigger clinical lab rule when lab unit mismatches configured rule unit', async () => {
    await LabSafetyRule.create({
      facilityId: FACILITY_A,
      labTestName: 'Hemoglobin',
      operator: 'LT',
      thresholdValue: 7.0,
      unit: 'g/dL',
      resultingPriority: CasePriority.URGENT,
      isActive: true,
    });

    await Report.create({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      storageKey: 'reports/lab_mismatch.pdf',
      contentHash: 'hash_mismatch',
      originalFilename: 'lab_mismatch.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      processingStatus: 'PROCESSED',
      ocrStatus: 'PROCESSED',
      ocrUsable: true,
      extractedText: 'Hemoglobin 5.2 mg/dL',
      extractedData: { Hemoglobin: '5.2 mg/dL' }, // Mismatched unit mg/dL vs g/dL
      isLatest: true,
    });

    const evalResult = await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);
    expect(evalResult.calculatedPriority).toBe(CasePriority.ROUTINE);
    expect(evalResult.matchedSignals.some((s) => s.ruleId === 'URGENT_CLINICIAN_LAB')).toBe(false);
  });

  // --- SECTION F: INTEGRATION & ARCHITECTURAL TESTS ---

  it('25. should NOT trigger urgent rule for negated symptoms (status = ABSENT)', async () => {
    await Symptom.create({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      symptomName: 'Chest Pain',
      status: SymptomStatus.ABSENT,
      temporalStatus: TemporalStatus.CURRENT,
      source: InformationSource.PATIENT,
    });
    await Symptom.create({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      symptomName: 'Breathing Difficulty',
      status: SymptomStatus.PRESENT,
      temporalStatus: TemporalStatus.CURRENT,
      source: InformationSource.PATIENT,
    });

    const evalResult = await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);
    expect(evalResult.calculatedPriority).not.toBe(CasePriority.URGENT);
    expect(evalResult.matchedSignals.some((s) => s.ruleId === 'URGENT_CHEST_PAIN_BREATHING')).toBe(false);
  });

  it('26. should NOT trigger urgent seizure rule for historical seizure (temporalStatus = HISTORICAL)', async () => {
    await Symptom.create({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      symptomName: 'Seizure',
      status: SymptomStatus.PRESENT,
      temporalStatus: TemporalStatus.HISTORICAL,
      source: InformationSource.PATIENT,
    });

    const evalResult = await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);
    expect(evalResult.calculatedPriority).toBe(CasePriority.ROUTINE);
    expect(evalResult.matchedSignals.some((s) => s.ruleId === 'URGENT_SEIZURE')).toBe(false);
  });

  it('27. should preserve human priorityOverride when automatic evaluation detects no signals', async () => {
    await Case.findByIdAndUpdate(testCaseId, {
      priorityOverride: CasePriority.URGENT,
      priorityOverrideReason: 'Clinical intuition of attending physician',
    });

    const evalResult = await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);
    expect(evalResult.calculatedPriority).toBe(CasePriority.ROUTINE);
    expect(evalResult.effectivePriority).toBe(CasePriority.URGENT);
    expect(evalResult.hasHumanOverride).toBe(true);

    const updatedCase = await Case.findById(testCaseId);
    expect(updatedCase?.priority).toBe(CasePriority.URGENT);
  });

  it('28. should resolve processing uncertainty when retried attempt succeeds', async () => {
    await Report.create({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      storageKey: 'reports/lab_old.pdf',
      contentHash: 'hash_old',
      originalFilename: 'lab_old.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      processingStatus: 'FAILED',
      ocrStatus: 'FAILED',
      ocrUsable: false,
      extractedText: '',
      isLatest: false,
    });

    await Report.create({
      caseId: new mongoose.Types.ObjectId(testCaseId),
      storageKey: 'reports/lab_new.pdf',
      contentHash: 'hash_new',
      originalFilename: 'lab_new.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      processingStatus: 'PROCESSED',
      ocrStatus: 'PROCESSED',
      ocrUsable: true,
      extractedText: 'Normal Report',
      extractedData: {},
      isLatest: true,
    });

    const evalResult = await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);
    expect(evalResult.calculatedPriority).toBe(CasePriority.ROUTINE);
    expect(evalResult.matchedSignals.some((s) => s.ruleId === 'UNCERTAINTY_OCR_FAILURE')).toBe(false);
  });

  it('29. should increment evaluation version and maintain single ACTIVE evaluation', async () => {
    const eval1 = await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);
    expect(eval1.evaluationVersion).toBe(1);
    expect(eval1.status).toBe('ACTIVE');

    const eval2 = await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);
    expect(eval2.evaluationVersion).toBe(2);
    expect(eval2.status).toBe('ACTIVE');

    const activeCount = await SafetyEvaluation.countDocuments({ caseId: testCaseId, status: 'ACTIVE' });
    expect(activeCount).toBe(1);

    const oldEval = await SafetyEvaluation.findById(eval1._id);
    expect(oldEval?.status).toBe('SUPERSEDED');
  });

  it('30. should restrict patient access and enforce facility isolation on API endpoints', async () => {
    const patRes = await request(app)
      .post(`/api/reviewer/cases/${testCaseId}/safety/evaluate`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patRes.status).toBe(403);

    const facBRes = await request(app)
      .post(`/api/reviewer/cases/${testCaseId}/safety/evaluate`)
      .set('Authorization', `Bearer ${reviewerFacBToken}`);
    expect(facBRes.status).toBe(403);

    const facARes = await request(app)
      .post(`/api/reviewer/cases/${testCaseId}/safety/evaluate`)
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(facARes.status).toBe(200);
    expect(facARes.body.success).toBe(true);
  });

  it('31. should return active safety evaluation and history via GET endpoint', async () => {
    await SafetyEvaluationService.evaluateCase(testCaseId, reviewerId);

    const res = await request(app)
      .get(`/api/reviewer/cases/${testCaseId}/safety`)
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeEvaluation).toBeDefined();
    expect(res.body.data.history.length).toBeGreaterThan(0);
  });
});
