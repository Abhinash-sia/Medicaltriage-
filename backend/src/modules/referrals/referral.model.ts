import mongoose, { Schema, Model } from 'mongoose';
import { IReferralDocument, ReferralStatus } from './referral.types.js';

const ReferralStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

const ReferralSchema = new Schema<IReferralDocument>(
  {
    referralCode: {
      type: String,
      required: [true, 'Referral code is required'],
      unique: true,
      trim: true,
      index: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    originatingFacilityId: {
      type: String,
      required: [true, 'Originating facility ID is required'],
      trim: true,
      index: true,
    },
    destinationFacilityId: {
      type: String,
      required: [true, 'Destination facility ID is required'],
      trim: true,
      index: true,
    },
    destinationDepartment: {
      type: String,
      default: null,
      trim: true,
    },
    referringReviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Referring reviewer reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      default: ReferralStatus.PENDING,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Referral reason is required'],
      trim: true,
    },
    summary: {
      type: String,
      required: [true, 'Referral summary is required'],
      trim: true,
    },
    destinationNotes: {
      type: String,
      default: null,
      trim: true,
    },
    triageNoteVersionSnapshot: {
      type: Number,
      default: null,
    },
    safetyEvaluationVersionSnapshot: {
      type: Number,
      default: null,
    },
    statusHistory: {
      type: [ReferralStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ReferralSchema.index({ caseId: 1, createdAt: -1 });
ReferralSchema.index({ destinationFacilityId: 1, status: 1 });
ReferralSchema.index({ originatingFacilityId: 1, status: 1 });

export const Referral: Model<IReferralDocument> =
  mongoose.models.Referral || mongoose.model<IReferralDocument>('Referral', ReferralSchema);
