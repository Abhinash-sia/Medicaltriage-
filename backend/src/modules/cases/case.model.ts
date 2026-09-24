import mongoose, { Schema, Model } from 'mongoose';
import { ICaseDocument, CaseStatus, CasePriority, IntakeSource } from './case.types.js';

const CaseSchema = new Schema<ICaseDocument>(
  {
    caseNumber: {
      type: String,
      required: [true, 'Case number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    assignedReviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    facilityId: {
      type: String,
      trim: true,
      default: 'GOVERNMENT_HOSPITAL',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CaseStatus),
      default: CaseStatus.OPEN,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(CasePriority),
      default: CasePriority.ROUTINE,
      required: true,
      index: true,
    },
    intakeSource: {
      type: String,
      enum: Object.values(IntakeSource),
      default: IntakeSource.TEXT,
      required: true,
    },
    language: {
      type: String,
      default: 'en',
      trim: true,
    },
    consentId: {
      type: Schema.Types.ObjectId,
      ref: 'Consent',
      default: null,
    },
    chiefComplaint: {
      type: String,
      required: [true, 'Chief complaint description is required'],
      trim: true,
    },
    slaDueAt: {
      type: Date,
      default: null,
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
      index: true,
    },
    escalationLevel: {
      type: Number,
      default: 0,
    },
    priorityOverride: {
      type: String,
      enum: Object.values(CasePriority),
      default: null,
    },
    priorityOverrideReason: {
      type: String,
      default: null,
    },
    priorityOverrideBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priorityOverrideAt: {
      type: Date,
      default: null,
    },
    currentSafetyVersion: {
      type: Number,
      default: 0,
    },
    currentNoteVersion: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for reviewer triage queue filtering and sorting
CaseSchema.index({ status: 1, priority: 1, createdAt: -1 });
CaseSchema.index({ facilityId: 1, status: 1 });
CaseSchema.index({ facilityId: 1, slaDueAt: 1, escalatedAt: 1 });

export const Case: Model<ICaseDocument> =
  mongoose.models.Case || mongoose.model<ICaseDocument>('Case', CaseSchema);
