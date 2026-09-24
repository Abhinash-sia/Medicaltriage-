import mongoose, { Schema, Model } from 'mongoose';
import { ISymptomDocument, InformationSource } from './symptom.types.js';

const SymptomSchema = new Schema<ISymptomDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    symptomName: {
      type: String,
      required: [true, 'Symptom description is required'],
      trim: true,
    },
    normalizedLabel: {
      type: String,
      trim: true,
      index: true,
    },
    onset: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
    },
    frequency: {
      type: String,
      trim: true,
    },
    bodyLocation: {
      type: String,
      trim: true,
    },
    associatedSymptoms: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: Object.values(InformationSource),
      required: [true, 'Information source is required'],
      default: InformationSource.PATIENT,
      index: true,
    },
    status: {
      type: String,
      trim: true,
      default: 'PRESENT',
    },
    temporalStatus: {
      type: String,
      trim: true,
      default: 'CURRENT',
      index: true,
    },
    context: {
      type: String,
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0.0,
      max: 1.0,
    },
    provenance: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Symptom: Model<ISymptomDocument> =
  mongoose.models.Symptom || mongoose.model<ISymptomDocument>('Symptom', SymptomSchema);
