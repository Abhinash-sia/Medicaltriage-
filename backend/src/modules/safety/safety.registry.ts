import { CasePriority } from '../cases/case.types.js';
import { SafetyRule, SignalCategory, SourceType, ISafetySignal, SafetyEvaluationContext } from './safety.types.js';

const isPresent = (status?: string): boolean => {
  if (!status) return true;
  const s = String(status).toUpperCase();
  return s === 'PRESENT' || s === 'TRUE';
};

const isCurrentOrRecent = (temporalStatus?: string): boolean => {
  if (!temporalStatus) return true;
  const t = String(temporalStatus).toUpperCase();
  return t === 'CURRENT' || t === 'RECENT';
};

const isCurrentPresentSymptom = (s: any, nameKeywords: string[]): boolean => {
  if (!isPresent(s.status) || !isCurrentOrRecent(s.temporalStatus)) {
    return false;
  }
  const name = String(s.symptomName || s.normalizedLabel || '').toLowerCase();
  return nameKeywords.some((kw) => name.includes(kw.toLowerCase()));
};

export class SafetyRegistry {
  private static rules: SafetyRule[] = [];

  public static initialize(): void {
    if (this.rules.length > 0) return;

    // --- URGENT RULES (10) ---

    // 1. URGENT_HUMAN_ESCALATION
    this.rules.push({
      id: 'URGENT_HUMAN_ESCALATION',
      name: 'Reviewer Escalation',
      category: SignalCategory.HUMAN_ESCALATION,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        if (ctx.hasHumanEscalation || ctx.reviews.some((r) => r.escalated || r.isEscalated)) {
          return {
            ruleId: 'URGENT_HUMAN_ESCALATION',
            ruleName: 'Reviewer Escalation',
            category: SignalCategory.HUMAN_ESCALATION,
            priority: CasePriority.URGENT,
            sourceType: SourceType.REVIEWER_ACTION,
            sourceId: ctx.reviews[0]?._id?.toString() || ctx.caseId.toString(),
            evidenceSnippet: 'Reviewer explicitly escalated case',
            explanation: 'Case escalated by clinical reviewer',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 2. URGENT_SEVERE_BREATHING
    this.rules.push({
      id: 'URGENT_SEVERE_BREATHING',
      name: 'Severe Breathing Difficulty',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find(
          (s) =>
            isCurrentPresentSymptom(s, ['breathing', 'shortness of breath', 'dyspnea', 'gasping']) &&
            (Number(s.severity) >= 7 || String(s.context || '').toLowerCase().includes('severe'))
        );
        if (sym) {
          return {
            ruleId: 'URGENT_SEVERE_BREATHING',
            ruleName: 'Severe Breathing Difficulty',
            category: SignalCategory.CLINICAL_URGENT,
            priority: CasePriority.URGENT,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName} (Severity: ${sym.severity || 'Severe'})`,
            explanation: 'Severe breathing difficulty detected in current symptom structured assessment',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 3. URGENT_CHEST_PAIN_BREATHING
    this.rules.push({
      id: 'URGENT_CHEST_PAIN_BREATHING',
      name: 'Chest Pain + Breathing Difficulty',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const hasChestPain = ctx.symptoms.some((s) =>
          isCurrentPresentSymptom(s, ['chest pain', 'angina', 'chest pressure'])
        );
        const hasBreathing = ctx.symptoms.some((s) =>
          isCurrentPresentSymptom(s, ['breathing', 'shortness of breath', 'dyspnea'])
        );
        if (hasChestPain && hasBreathing) {
          return {
            ruleId: 'URGENT_CHEST_PAIN_BREATHING',
            ruleName: 'Chest Pain + Breathing Difficulty',
            category: SignalCategory.CLINICAL_URGENT,
            priority: CasePriority.URGENT,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: ctx.caseId.toString(),
            evidenceSnippet: 'Combination of current Chest Pain and Breathing Difficulty',
            explanation: 'Co-occurrence of chest pain and breathing difficulty requires urgent clinical review',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 4. URGENT_ALTERED_CONSCIOUSNESS
    this.rules.push({
      id: 'URGENT_ALTERED_CONSCIOUSNESS',
      name: 'Altered Consciousness',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find((s) =>
          isCurrentPresentSymptom(s, ['unconscious', 'altered consciousness', 'fainted', 'syncope', 'unresponsive', 'confusion'])
        );
        if (sym) {
          return {
            ruleId: 'URGENT_ALTERED_CONSCIOUSNESS',
            ruleName: 'Altered Consciousness',
            category: SignalCategory.CLINICAL_URGENT,
            priority: CasePriority.URGENT,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName}`,
            explanation: 'Altered state of consciousness or loss of responsiveness detected',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 5. URGENT_SEVERE_BLEEDING
    this.rules.push({
      id: 'URGENT_SEVERE_BLEEDING',
      name: 'Severe Bleeding',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find(
          (s) =>
            isCurrentPresentSymptom(s, ['bleeding', 'hemorrhage', 'blood loss']) &&
            (Number(s.severity) >= 7 || String(s.context || '').toLowerCase().includes('severe') || String(s.context || '').toLowerCase().includes('uncontrolled'))
        );
        if (sym) {
          return {
            ruleId: 'URGENT_SEVERE_BLEEDING',
            ruleName: 'Severe Bleeding',
            category: SignalCategory.CLINICAL_URGENT,
            priority: CasePriority.URGENT,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName}`,
            explanation: 'Severe or uncontrolled hemorrhage detected',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 6. URGENT_SEIZURE
    this.rules.push({
      id: 'URGENT_SEIZURE',
      name: 'Active/Recent Seizure',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find((s) =>
          isCurrentPresentSymptom(s, ['seizure', 'convulsion', 'fits'])
        );
        if (sym) {
          return {
            ruleId: 'URGENT_SEIZURE',
            ruleName: 'Active/Recent Seizure',
            category: SignalCategory.CLINICAL_URGENT,
            priority: CasePriority.URGENT,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName}`,
            explanation: 'Current or recent seizure activity reported',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 7. URGENT_SELF_HARM
    this.rules.push({
      id: 'URGENT_SELF_HARM',
      name: 'Immediate Self-Harm Language',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find((s) =>
          isCurrentPresentSymptom(s, ['suicide', 'self-harm', 'harm myself', 'end my life'])
        );
        const aiFlag = ctx.aiExtractions?.some((a) => a.selfHarmRisk === true || a.flags?.includes('SELF_HARM'));
        if (sym || aiFlag) {
          return {
            ruleId: 'URGENT_SELF_HARM',
            ruleName: 'Immediate Self-Harm Language',
            category: SignalCategory.CLINICAL_URGENT,
            priority: CasePriority.URGENT,
            sourceType: sym ? SourceType.SYMPTOM_MODEL : SourceType.AI_EXTRACTION,
            sourceId: sym?._id?.toString() || 'ai_extraction',
            evidenceSnippet: sym ? `Symptom: ${sym.symptomName}` : 'AI extraction self-harm flag',
            explanation: 'Explicit self-harm intent detected',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 8. URGENT_SEVERE_ALLERGY
    this.rules.push({
      id: 'URGENT_SEVERE_ALLERGY',
      name: 'Severe Allergic Reaction',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find(
          (s) =>
            isCurrentPresentSymptom(s, ['anaphylaxis', 'allergic reaction', 'throat swelling', 'face swelling']) &&
            (Number(s.severity) >= 7 || String(s.context || '').toLowerCase().includes('swelling') || String(s.context || '').toLowerCase().includes('breathing'))
        );
        if (sym) {
          return {
            ruleId: 'URGENT_SEVERE_ALLERGY',
            ruleName: 'Severe Allergic Reaction',
            category: SignalCategory.CLINICAL_URGENT,
            priority: CasePriority.URGENT,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName}`,
            explanation: 'Severe allergic reaction with airway compromise or significant swelling',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 9. URGENT_PEDIATRIC_CONFIGURED
    this.rules.push({
      id: 'URGENT_PEDIATRIC_CONFIGURED',
      name: 'Configured Pediatric Critical Case',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        if (ctx.patientAgeMonths !== undefined && ctx.pediatricRules && ctx.pediatricRules.length > 0) {
          const matchedPedRule = ctx.pediatricRules.find((rule) => {
            if (!rule.isActive) return false;
            if (ctx.patientAgeMonths! > rule.maxAgeMonths) return false;
            if (rule.requiredSymptomName) {
              return ctx.symptoms.some((s) =>
                isCurrentPresentSymptom(s, [rule.requiredSymptomName])
              );
            }
            return true;
          });

          if (matchedPedRule) {
            return {
              ruleId: 'URGENT_PEDIATRIC_CONFIGURED',
              ruleName: 'Configured Pediatric Critical Case',
              category: SignalCategory.CLINICAL_URGENT,
              priority: matchedPedRule.resultingPriority || CasePriority.URGENT,
              sourceType: SourceType.PEDIATRIC_RULE,
              sourceId: matchedPedRule._id?.toString() || 'pediatric_rule',
              evidenceSnippet: `Patient age: ${ctx.patientAgeMonths} months matched facility rule: ${matchedPedRule.ruleName}`,
              explanation: `Facility-configured pediatric critical threshold matched (${matchedPedRule.ruleName})`,
              detectedAt: new Date(),
            };
          }
        }
        return null;
      },
    });

    // 10. URGENT_CLINICIAN_LAB
    this.rules.push({
      id: 'URGENT_CLINICIAN_LAB',
      name: 'Clinician-Configured Critical Lab',
      category: SignalCategory.CLINICAL_URGENT,
      priority: CasePriority.URGENT,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        if (!ctx.labRules || ctx.labRules.length === 0) return null;

        const latestCompletedReports = ctx.reports.filter(
          (r) =>
            (r.ocrStatus === 'PROCESSED' || r.ocrStatus === 'COMPLETED' || r.processingStatus === 'PROCESSED' || r.status === 'COMPLETED') &&
            (r.isLatest === undefined || r.isLatest === true)
        );

        for (const report of latestCompletedReports) {
          const extracted = report.extractedData || {};
          for (const labRule of ctx.labRules) {
            if (!labRule.isActive) continue;

            const rawVal = extracted[labRule.labTestName];
            if (rawVal !== undefined && rawVal !== null) {
              const valStr = String(rawVal).trim();
              const match = valStr.match(/^([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z\/%]+)?$/);
              if (match) {
                const numVal = parseFloat(match[1]);
                const unitStr = match[2] ? match[2].trim().toLowerCase() : '';
                const expectedUnit = (labRule.unit || '').trim().toLowerCase();

                // Unit match requirement: if rule specifies unit, extracted unit must match
                if (!isNaN(numVal) && (!expectedUnit || unitStr === expectedUnit)) {
                  let matches = false;
                  if (labRule.operator === 'LT' && numVal < labRule.thresholdValue) matches = true;
                  if (labRule.operator === 'LTE' && numVal <= labRule.thresholdValue) matches = true;
                  if (labRule.operator === 'GT' && numVal > labRule.thresholdValue) matches = true;
                  if (labRule.operator === 'GTE' && numVal >= labRule.thresholdValue) matches = true;
                  if (labRule.operator === 'EQ' && numVal === labRule.thresholdValue) matches = true;

                  if (matches) {
                    return {
                      ruleId: 'URGENT_CLINICIAN_LAB',
                      ruleName: 'Clinician-Configured Critical Lab',
                      category: SignalCategory.CLINICAL_URGENT,
                      priority: labRule.resultingPriority || CasePriority.URGENT,
                      sourceType: SourceType.LAB_RULE,
                      sourceId: labRule._id?.toString() || 'lab_rule',
                      evidenceSnippet: `Lab Test: ${labRule.labTestName} = ${numVal} ${labRule.unit} (Threshold: ${labRule.operator} ${labRule.thresholdValue})`,
                      explanation: `Lab result matched facility clinician rule: ${labRule.labTestName}`,
                      detectedAt: new Date(),
                    };
                  }
                }
              }
            }
          }
        }
        return null;
      },
    });

    // --- PRIORITY RULES (5) ---

    // 11. PRIORITY_FEVER_PERSISTENT
    this.rules.push({
      id: 'PRIORITY_FEVER_PERSISTENT',
      name: 'Persistent Fever > 3 Days',
      category: SignalCategory.CLINICAL_PRIORITY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find((s) => {
          if (!isCurrentPresentSymptom(s, ['fever', 'pyrexia', 'high temperature'])) return false;
          const dur = String(s.duration || s.onset || '').toLowerCase();
          return dur.includes('3') || dur.includes('4') || dur.includes('5') || dur.includes('week') || dur.includes('persistent');
        });
        if (sym) {
          return {
            ruleId: 'PRIORITY_FEVER_PERSISTENT',
            ruleName: 'Persistent Fever > 3 Days',
            category: SignalCategory.CLINICAL_PRIORITY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName} (Duration: ${sym.duration || 'Persistent'})`,
            explanation: 'Persistent fever reported for 3 or more days',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 12. PRIORITY_REPEATED_VOMITING
    this.rules.push({
      id: 'PRIORITY_REPEATED_VOMITING',
      name: 'Repeated Vomiting',
      category: SignalCategory.CLINICAL_PRIORITY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find((s) =>
          isCurrentPresentSymptom(s, ['vomiting', 'emesis', 'throwing up'])
        );
        if (sym) {
          return {
            ruleId: 'PRIORITY_REPEATED_VOMITING',
            ruleName: 'Repeated Vomiting',
            category: SignalCategory.CLINICAL_PRIORITY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName}`,
            explanation: 'Repeated vomiting reported without emergency respiratory/hemodynamic signals',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 13. PRIORITY_DEHYDRATION_CONCERN
    this.rules.push({
      id: 'PRIORITY_DEHYDRATION_CONCERN',
      name: 'Dehydration Concern',
      category: SignalCategory.CLINICAL_PRIORITY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find((s) =>
          isCurrentPresentSymptom(s, ['dehydration', 'excessive thirst', 'dry mouth', 'sunken eyes'])
        );
        if (sym) {
          return {
            ruleId: 'PRIORITY_DEHYDRATION_CONCERN',
            ruleName: 'Dehydration Concern',
            category: SignalCategory.CLINICAL_PRIORITY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName}`,
            explanation: 'Dehydration signs or symptoms reported',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 14. PRIORITY_PERSISTENT_WEAKNESS
    this.rules.push({
      id: 'PRIORITY_PERSISTENT_WEAKNESS',
      name: 'Persistent/Worsening Weakness',
      category: SignalCategory.CLINICAL_PRIORITY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const sym = ctx.symptoms.find((s) =>
          isCurrentPresentSymptom(s, ['weakness', 'fatigue', 'lethargy', 'extreme tiredness'])
        );
        if (sym) {
          return {
            ruleId: 'PRIORITY_PERSISTENT_WEAKNESS',
            ruleName: 'Persistent/Worsening Weakness',
            category: SignalCategory.CLINICAL_PRIORITY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.SYMPTOM_MODEL,
            sourceId: sym._id?.toString() || 'symptom',
            evidenceSnippet: `Symptom: ${sym.symptomName}`,
            explanation: 'Persistent weakness or severe fatigue noted',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 15. PRIORITY_REVIEWER_REQUESTED
    this.rules.push({
      id: 'PRIORITY_REVIEWER_REQUESTED',
      name: 'Reviewer Priority Request',
      category: SignalCategory.CLINICAL_PRIORITY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const reqReview = ctx.reviews.find((r) => r.requestedPriority === CasePriority.PRIORITY);
        if (reqReview) {
          return {
            ruleId: 'PRIORITY_REVIEWER_REQUESTED',
            ruleName: 'Reviewer Priority Request',
            category: SignalCategory.CLINICAL_PRIORITY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.REVIEWER_ACTION,
            sourceId: reqReview._id?.toString() || ctx.caseId.toString(),
            evidenceSnippet: 'Reviewer requested Priority workflow review',
            explanation: 'Reviewer requested priority workflow handling',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // --- SYSTEM_UNCERTAINTY RULES (7) ---

    // 16. UNCERTAINTY_AI_EXTRACTION
    this.rules.push({
      id: 'UNCERTAINTY_AI_EXTRACTION',
      name: 'AI Extraction Failure',
      category: SignalCategory.SYSTEM_UNCERTAINTY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const failedExt = ctx.aiExtractions?.find(
          (a) => a.status === 'FAILED' && (a.isLatest === undefined || a.isLatest === true)
        );
        if (failedExt) {
          return {
            ruleId: 'UNCERTAINTY_AI_EXTRACTION',
            ruleName: 'AI Extraction Failure',
            category: SignalCategory.SYSTEM_UNCERTAINTY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.AI_EXTRACTION,
            sourceId: failedExt._id?.toString() || 'ai_extraction',
            evidenceSnippet: 'Active AI extraction status is FAILED',
            explanation: 'AI extraction pipeline failure requires human review verification',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 17. UNCERTAINTY_LOW_CONFIDENCE
    this.rules.push({
      id: 'UNCERTAINTY_LOW_CONFIDENCE',
      name: 'Low Extraction Confidence',
      category: SignalCategory.SYSTEM_UNCERTAINTY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const lowConfExt = ctx.aiExtractions?.find(
          (a) => a.confidence !== undefined && a.confidence < 0.70 && (a.isLatest === undefined || a.isLatest === true)
        );
        if (lowConfExt) {
          return {
            ruleId: 'UNCERTAINTY_LOW_CONFIDENCE',
            ruleName: 'Low Extraction Confidence',
            category: SignalCategory.SYSTEM_UNCERTAINTY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.AI_EXTRACTION,
            sourceId: lowConfExt._id?.toString() || 'ai_extraction',
            evidenceSnippet: `AI extraction confidence score: ${lowConfExt.confidence}`,
            explanation: 'Extraction confidence below 0.70 threshold requires human review',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 18. UNCERTAINTY_OCR_FAILURE
    this.rules.push({
      id: 'UNCERTAINTY_OCR_FAILURE',
      name: 'OCR Processing Uncertainty',
      category: SignalCategory.SYSTEM_UNCERTAINTY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const activeReport = ctx.reports.find(
          (r) => (r.isLatest === undefined || r.isLatest === true) && (r.ocrStatus === 'FAILED' || (r.ocrConfidence !== undefined && r.ocrConfidence < 0.60))
        );
        if (activeReport) {
          return {
            ruleId: 'UNCERTAINTY_OCR_FAILURE',
            ruleName: 'OCR Processing Uncertainty',
            category: SignalCategory.SYSTEM_UNCERTAINTY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.PROCESSING_STATE,
            sourceId: activeReport._id?.toString() || 'report',
            evidenceSnippet: `Report OCR status: ${activeReport.ocrStatus} (Confidence: ${activeReport.ocrConfidence || 'N/A'})`,
            explanation: 'Report OCR failure or low confidence requires manual inspection',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 19. UNCERTAINTY_VOICE_STT_FAILURE
    this.rules.push({
      id: 'UNCERTAINTY_VOICE_STT_FAILURE',
      name: 'Voice STT Processing Failure',
      category: SignalCategory.SYSTEM_UNCERTAINTY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const activeVoice = ctx.voiceInputs.find(
          (v) => (v.isLatest === undefined || v.isLatest === true) && (v.status === 'FAILED' || (v.sttConfidence !== undefined && v.sttConfidence < 0.60))
        );
        if (activeVoice) {
          return {
            ruleId: 'UNCERTAINTY_VOICE_STT_FAILURE',
            ruleName: 'Voice STT Processing Failure',
            category: SignalCategory.SYSTEM_UNCERTAINTY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.PROCESSING_STATE,
            sourceId: activeVoice._id?.toString() || 'voice_input',
            evidenceSnippet: `Voice STT status: ${activeVoice.status} (Confidence: ${activeVoice.sttConfidence || 'N/A'})`,
            explanation: 'Voice transcription failure or low confidence requires manual verification',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 20. UNCERTAINTY_VISUAL_FAILURE
    this.rules.push({
      id: 'UNCERTAINTY_VISUAL_FAILURE',
      name: 'Visual Input Processing Error',
      category: SignalCategory.SYSTEM_UNCERTAINTY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const activeVisual = ctx.visualInputs.find(
          (v) => (v.isLatest === undefined || v.isLatest === true) && v.status === 'FAILED'
        );
        if (activeVisual) {
          return {
            ruleId: 'UNCERTAINTY_VISUAL_FAILURE',
            ruleName: 'Visual Input Processing Error',
            category: SignalCategory.SYSTEM_UNCERTAINTY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.PROCESSING_STATE,
            sourceId: activeVisual._id?.toString() || 'visual_input',
            evidenceSnippet: `Visual input processing status: ${activeVisual.status}`,
            explanation: 'Visual processing error requires reviewer assessment',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 21. UNCERTAINTY_MISSING_INFO
    this.rules.push({
      id: 'UNCERTAINTY_MISSING_INFO',
      name: 'Required Info Missing',
      category: SignalCategory.SYSTEM_UNCERTAINTY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const activeMissing = ctx.missingInfoResults.find(
          (m) => (m.isLatest === undefined || m.isLatest === true) && m.hasRequiredMissingInfo === true && m.isResolved !== true
        );
        if (activeMissing) {
          return {
            ruleId: 'UNCERTAINTY_MISSING_INFO',
            ruleName: 'Required Info Missing',
            category: SignalCategory.SYSTEM_UNCERTAINTY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.PROCESSING_STATE,
            sourceId: activeMissing._id?.toString() || 'missing_info',
            evidenceSnippet: 'Active missing required information assessment flagged unresolved info',
            explanation: 'Required clinical intake information is missing and requires follow-up',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });

    // 22. UNCERTAINTY_UNSTRUCTURED_LAB
    this.rules.push({
      id: 'UNCERTAINTY_UNSTRUCTURED_LAB',
      name: 'Malformed Lab Evidence',
      category: SignalCategory.SYSTEM_UNCERTAINTY,
      priority: CasePriority.PRIORITY,
      evaluate: (ctx: SafetyEvaluationContext): ISafetySignal | null => {
        const latestCompletedReport = ctx.reports.find(
          (r) =>
            (r.ocrStatus === 'PROCESSED' || r.ocrStatus === 'COMPLETED' || r.processingStatus === 'PROCESSED' || r.status === 'COMPLETED') &&
            (r.isLatest === undefined || r.isLatest === true) &&
            r.hasUnstructuredLabData === true
        );
        if (latestCompletedReport) {
          return {
            ruleId: 'UNCERTAINTY_UNSTRUCTURED_LAB',
            ruleName: 'Malformed Lab Evidence',
            category: SignalCategory.SYSTEM_UNCERTAINTY,
            priority: CasePriority.PRIORITY,
            sourceType: SourceType.PROCESSING_STATE,
            sourceId: latestCompletedReport._id?.toString() || 'report',
            evidenceSnippet: 'Report contains unparseable or malformed lab observation data',
            explanation: 'Unstructured lab report text requires human review verification',
            detectedAt: new Date(),
          };
        }
        return null;
      },
    });
  }

  public static getAllRules(): SafetyRule[] {
    this.initialize();
    return this.rules;
  }
}
