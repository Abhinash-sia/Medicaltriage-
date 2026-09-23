import mongoose, { Schema, Model } from 'mongoose';
import { IConsentDocument, ConsentStatus, ConsentType } from './consent.types.js';

const ConsentSchema = new Schema<IConsentDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    consentType: {
      type: String,
      enum: Object.values(ConsentType),
      default: ConsentType.GENERAL_TRIAGE,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ConsentStatus),
      default: ConsentStatus.GRANTED,
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      default: 'v1.0-hackathon',
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
    capturedBy: {
      type: String,
      required: true,
      default: 'PATIENT_PORTAL',
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Consent: Model<IConsentDocument> =
  mongoose.models.Consent || mongoose.model<IConsentDocument>('Consent', ConsentSchema);
