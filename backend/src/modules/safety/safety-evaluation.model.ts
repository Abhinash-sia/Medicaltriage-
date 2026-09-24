import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CasePriority } from '../cases/case.types.js';
import { ISafetySignal, SignalCategory, SourceType } from './safety.types.js';

export interface ISafetyEvaluation {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  evaluationVersion: number;
  status: 'ACTIVE' | 'SUPERSEDED';
  calculatedPriority: CasePriority;
  effectivePriority: CasePriority;
  matchedSignals: ISafetySignal[];
  hasHumanOverride: boolean;
  evaluatedAt: Date;
  evaluatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISafetyEvaluationDocument extends ISafetyEvaluation, Document {
  _id: Types.ObjectId;
}

const SafetySignalSchema = new Schema<ISafetySignal>(
  {
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(SignalCategory),
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(CasePriority),
      required: true,
    },
    sourceType: {
      type: String,
      enum: Object.values(SourceType),
      required: true,
    },
    sourceId: { type: String, required: true },
    evidenceSnippet: { type: String, required: true },
    explanation: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SafetyEvaluationSchema = new Schema<ISafetyEvaluationDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    evaluationVersion: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUPERSEDED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    calculatedPriority: {
      type: String,
      enum: Object.values(CasePriority),
      required: true,
    },
    effectivePriority: {
      type: String,
      enum: Object.values(CasePriority),
      required: true,
    },
    matchedSignals: {
      type: [SafetySignalSchema],
      default: [],
    },
    hasHumanOverride: {
      type: Boolean,
      default: false,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    evaluatedBy: {
      type: String,
      default: 'SYSTEM',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound Unique Partial Index ensuring at most 1 ACTIVE evaluation per case
SafetyEvaluationSchema.index(
  { caseId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

// Unique version index
SafetyEvaluationSchema.index({ caseId: 1, evaluationVersion: 1 }, { unique: true });

export const SafetyEvaluation: Model<ISafetyEvaluationDocument> =
  mongoose.models.SafetyEvaluation ||
  mongoose.model<ISafetyEvaluationDocument>('SafetyEvaluation', SafetyEvaluationSchema);
