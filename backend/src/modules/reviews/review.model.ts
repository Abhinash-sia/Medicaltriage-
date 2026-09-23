import mongoose, { Schema, Model } from 'mongoose';
import { IReviewDocument, ReviewStatus } from './review.types.js';

const PriorityChangeSchema = new Schema(
  {
    previousPriority: { type: String, required: true },
    newPriority: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const EscalationDecisionSchema = new Schema(
  {
    escalatedToFacility: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const ReferralDecisionSchema = new Schema(
  {
    referralFacility: { type: String, required: true },
    summary: { type: String, required: true },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReviewDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer reference is required'],
      index: true,
    },
    reviewStatus: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.COMPLETED,
      required: true,
      index: true,
    },
    reviewerNotes: {
      type: String,
      required: [true, 'Reviewer notes are required'],
      trim: true,
    },
    priorityChange: {
      type: PriorityChangeSchema,
      default: null,
    },
    escalationDecision: {
      type: EscalationDecisionSchema,
      default: null,
    },
    referralDecision: {
      type: ReferralDecisionSchema,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Review: Model<IReviewDocument> =
  mongoose.models.Review || mongoose.model<IReviewDocument>('Review', ReviewSchema);
