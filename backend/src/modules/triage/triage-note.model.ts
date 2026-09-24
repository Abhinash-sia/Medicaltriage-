import mongoose, { Schema, Model } from 'mongoose';
import { ITriageNoteDocument, NoteProvenance, GenerationStatus } from './triage-note.types.js';
import { CasePriority } from '../cases/case.types.js';

const TriageNoteSchema = new Schema<ITriageNoteDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    presentingConcern: {
      type: String,
      required: true,
      trim: true,
    },
    symptomSummary: {
      type: String,
      required: true,
      trim: true,
    },
    timelineSummary: {
      type: String,
      default: '',
      trim: true,
    },
    timelineEvents: {
      type: [
        {
          eventType: {
            type: String,
            enum: ['SYMPTOM_ONSET', 'SYMPTOM_CHANGE', 'MEDICAL_ENCOUNTER', 'REPORT', 'MEDICATION', 'OTHER'],
            default: 'OTHER',
          },
          date: { type: String, default: null },
          relativeTime: { type: String, default: null },
          description: { type: String, required: true, trim: true },
          source: {
            type: String,
            enum: ['PATIENT', 'AI_EXTRACTION', 'REPORT', 'VOICE_TRANSCRIPT'],
            default: 'AI_EXTRACTION',
          },
          provenance: {
            type: String,
            enum: Object.values(NoteProvenance),
            default: NoteProvenance.AI_GENERATED,
          },
          certainty: {
            type: String,
            enum: ['CERTAIN', 'APPROXIMATE', 'UNCERTAIN'],
            default: 'CERTAIN',
          },
          sourceQuote: { type: String, default: null },
        },
      ],
      default: [],
    },
    relevantExtractedReportInfo: {
      type: String,
      default: '',
      trim: true,
    },
    missingInformation: {
      type: [String],
      default: [],
    },
    missingInformationItems: {
      type: [
        {
          id: { type: String, required: true },
          field: { type: String, default: null },
          topic: { type: String, default: null },
          description: { type: String, required: true, trim: true },
          importance: {
            type: String,
            enum: ['CRITICAL', 'IMPORTANT', 'OPTIONAL'],
            default: 'IMPORTANT',
          },
          reason: { type: String, default: null },
          source: {
            type: String,
            enum: ['PATIENT_NARRATIVE', 'STRUCTURED_SYMPTOMS', 'TIMELINE', 'REPORT'],
            default: 'PATIENT_NARRATIVE',
          },
          provenance: {
            type: String,
            enum: Object.values(NoteProvenance),
            default: NoteProvenance.AI_GENERATED,
          },
        },
      ],
      default: [],
    },
    negativeFindings: {
      type: [String],
      default: [],
    },
    uncertainties: {
      type: [String],
      default: [],
    },
    confidence: {
      type: Number,
      default: null,
    },
    sourceTextHash: {
      type: String,
      default: '',
    },
    suggestedFollowUpQuestions: {
      type: [String],
      default: [],
    },
    followUpQuestionItems: {
      type: [
        {
          id: { type: String, required: true },
          question: { type: String, required: true, trim: true },
          linkedMissingInformationId: { type: String, default: null },
          priority: {
            type: String,
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            default: 'MEDIUM',
          },
          reason: { type: String, default: null },
          answerType: {
            type: String,
            enum: ['TEXT', 'YES_NO', 'DATE', 'DURATION', 'NUMBER', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'UNKNOWN'],
            default: 'TEXT',
          },
          provenance: {
            type: String,
            enum: Object.values(NoteProvenance),
            default: NoteProvenance.AI_GENERATED,
          },
        },
      ],
      default: [],
    },
    safetySignals: {
      type: [String],
      default: [],
    },
    noteVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUPERSEDED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    sourceEvidenceHash: {
      type: String,
      default: '',
    },
    symptomsSection: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    reportsSection: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    voiceSection: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    visualSection: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    translationsSection: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    safetyReviewSection: {
      type: Schema.Types.Mixed,
      default: null,
    },
    reviewerAttentionSection: {
      type: Schema.Types.Mixed,
      default: null,
    },
    priority: {
      type: String,
      enum: Object.values(CasePriority),
      required: true,
      default: CasePriority.ROUTINE,
      index: true,
    },
    provenance: {
      type: String,
      enum: Object.values(NoteProvenance),
      default: NoteProvenance.AI_GENERATED,
      required: true,
      index: true,
    },
    generationStatus: {
      type: String,
      enum: Object.values(GenerationStatus),
      default: GenerationStatus.COMPLETED,
      required: true,
      index: true,
    },
    generatedBy: {
      type: String,
      required: true,
      default: 'System-Deterministic-Assembly',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    modelVersion: {
      type: String,
      default: 'Phase16-Deterministic',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewerNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Partial unique index ensuring at most 1 ACTIVE note per case
TriageNoteSchema.index(
  { caseId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

// Unique note version index
TriageNoteSchema.index({ caseId: 1, noteVersion: 1 }, { unique: true });

export const TriageNote: Model<ITriageNoteDocument> =
  mongoose.models.TriageNote ||
  mongoose.model<ITriageNoteDocument>('TriageNote', TriageNoteSchema);
