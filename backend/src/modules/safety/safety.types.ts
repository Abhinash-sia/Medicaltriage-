import { Types } from 'mongoose';
import { CasePriority } from '../cases/case.types.js';

export enum SignalCategory {
  CLINICAL_URGENT = 'CLINICAL_URGENT',
  CLINICAL_PRIORITY = 'CLINICAL_PRIORITY',
  SYSTEM_UNCERTAINTY = 'SYSTEM_UNCERTAINTY',
  HUMAN_ESCALATION = 'HUMAN_ESCALATION',
}

export enum SourceType {
  REVIEWER_ACTION = 'REVIEWER_ACTION',
  SYMPTOM_MODEL = 'SYMPTOM_MODEL',
  LAB_RULE = 'LAB_RULE',
  PEDIATRIC_RULE = 'PEDIATRIC_RULE',
  AI_EXTRACTION = 'AI_EXTRACTION',
  PROCESSING_STATE = 'PROCESSING_STATE',
}

export interface ISafetySignal {
  ruleId: string;
  ruleName: string;
  category: SignalCategory;
  priority: CasePriority;
  sourceType: SourceType;
  sourceId: string;
  evidenceSnippet: string;
  explanation: string;
  detectedAt: Date;
}

export interface SafetyEvaluationContext {
  caseId: Types.ObjectId;
  facilityId: string;
  patientAgeMonths?: number;
  symptoms: any[];
  reports: any[];
  voiceInputs: any[];
  visualInputs: any[];
  reviews: any[];
  missingInfoResults: any[];
  labRules: any[];
  pediatricRules: any[];
  aiExtractions?: any[];
  hasHumanEscalation?: boolean;
}

export interface SafetyRule {
  id: string;
  name: string;
  category: SignalCategory;
  priority: CasePriority;
  evaluate: (context: SafetyEvaluationContext) => ISafetySignal | null;
}

export interface EngineResult {
  calculatedPriority: CasePriority;
  matchedSignals: ISafetySignal[];
  evaluatedAt: Date;
}
