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
    relevantExtractedReportInfo: {
      type: String,
      default: '',
      trim: true,
    },
    missingInformation: {
      type: [String],
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
    safetySignals: {
      type: [String],
      default: [],
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
      default: 'Gemini-2.5-Flash',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    modelVersion: {
      type: String,
      default: 'v1.0',
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

export const TriageNote: Model<ITriageNoteDocument> =
  mongoose.models.TriageNote ||
  mongoose.model<ITriageNoteDocument>('TriageNote', TriageNoteSchema);
