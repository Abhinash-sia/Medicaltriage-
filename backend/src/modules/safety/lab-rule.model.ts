import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CasePriority } from '../cases/case.types.js';

export interface ILabSafetyRule {
  _id?: Types.ObjectId;
  facilityId: string;
  labTestName: string;
  operator: 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ';
  thresholdValue: number;
  unit: string;
  resultingPriority: CasePriority;
  createdBy?: Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILabSafetyRuleDocument extends ILabSafetyRule, Document {
  _id: Types.ObjectId;
}

const LabSafetyRuleSchema = new Schema<ILabSafetyRuleDocument>(
  {
    facilityId: {
      type: String,
      required: [true, 'Facility ID is required'],
      trim: true,
      index: true,
    },
    labTestName: {
      type: String,
      required: [true, 'Lab test name is required'],
      trim: true,
    },
    operator: {
      type: String,
      enum: ['LT', 'LTE', 'GT', 'GTE', 'EQ'],
      required: true,
    },
    thresholdValue: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
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

LabSafetyRuleSchema.index({ facilityId: 1, labTestName: 1, isActive: 1 });

export const LabSafetyRule: Model<ILabSafetyRuleDocument> =
  mongoose.models.LabSafetyRule ||
  mongoose.model<ILabSafetyRuleDocument>('LabSafetyRule', LabSafetyRuleSchema);
