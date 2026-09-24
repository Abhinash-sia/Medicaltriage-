import mongoose, { Schema, Model } from 'mongoose';
import { IFacilityDocument, FacilityType } from './facility.types.js';

const FacilitySchema = new Schema<IFacilityDocument>(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
      maxlength: [150, 'Facility name cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Facility code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(FacilityType),
      required: [true, 'Facility type is required'],
      default: FacilityType.PHC,
    },
    district: {
      type: String,
      trim: true,
      default: null,
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
    supportedLanguages: {
      type: [String],
      default: ['en', 'hi'],
    },
    active: {
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

export const Facility: Model<IFacilityDocument> =
  mongoose.models.Facility || mongoose.model<IFacilityDocument>('Facility', FacilitySchema);
