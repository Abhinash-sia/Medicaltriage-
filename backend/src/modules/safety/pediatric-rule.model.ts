import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CasePriority } from '../cases/case.types.js';

export interface IPediatricSafetyRule {
  _id?: Types.ObjectId;
  facilityId: string;
  ruleName: string;
  maxAgeMonths: number;
  requiredSymptomName?: string;
  resultingPriority: CasePriority;
  createdBy?: Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPediatricSafetyRuleDocument extends IPediatricSafetyRule, Document {
  _id: Types.ObjectId;
}

const PediatricSafetyRuleSchema = new Schema<IPediatricSafetyRuleDocument>(
  {
    facilityId: {
      type: String,
      required: [true, 'Facility ID is required'],
      trim: true,
      index: true,
    },
    ruleName: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    maxAgeMonths: {
      type: Number,
      required: true,
    },
    requiredSymptomName: {
      type: String,
      trim: true,
      default: null,
    },
    resultingPriority: {
      type: String,
      enum: Object.values(CasePriority),
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PediatricSafetyRuleSchema.index({ facilityId: 1, isActive: 1 });

export const PediatricSafetyRule: Model<IPediatricSafetyRuleDocument> =
  mongoose.models.PediatricSafetyRule ||
  mongoose.model<IPediatricSafetyRuleDocument>('PediatricSafetyRule', PediatricSafetyRuleSchema);
