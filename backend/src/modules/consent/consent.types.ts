import { Document, Types } from 'mongoose';

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ConsentType {
  GENERAL_TRIAGE = 'GENERAL_TRIAGE',
  DATA_RETENTION = 'DATA_RETENTION',
  VOICE_RECORDING = 'VOICE_RECORDING',
  VISUAL_MEDIA = 'VISUAL_MEDIA',
}

export interface IConsent {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  patientId?: Types.ObjectId;
  consentType: ConsentType;
  status: ConsentStatus;
  version: string;
  capturedAt: Date;
  capturedBy: string;
  withdrawnAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConsentDocument extends IConsent, Document {
  _id: Types.ObjectId;
}
