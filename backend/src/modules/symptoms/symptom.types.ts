import { Document, Types } from 'mongoose';

export enum InformationSource {
  PATIENT = 'PATIENT',
  HEALTH_WORKER = 'HEALTH_WORKER',
  AI_EXTRACTION = 'AI_EXTRACTION',
  REPORT = 'REPORT',
  VOICE_TRANSCRIPT = 'VOICE_TRANSCRIPT',
}

export interface ISymptom {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  symptomName: string;
  normalizedLabel?: string;
  onset?: string;
  duration?: string;
  severity?: number;
  frequency?: string;
  bodyLocation?: string;
  associatedSymptoms?: string[];
  source: InformationSource;
  confidence?: number;
  provenance?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISymptomDocument extends ISymptom, Document {
  _id: Types.ObjectId;
}
