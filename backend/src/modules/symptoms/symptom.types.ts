import { Document, Types } from 'mongoose';

export enum InformationSource {
  PATIENT = 'PATIENT',
  HEALTH_WORKER = 'HEALTH_WORKER',
  AI_EXTRACTION = 'AI_EXTRACTION',
  REPORT = 'REPORT',
  VOICE_TRANSCRIPT = 'VOICE_TRANSCRIPT',
}

export enum SymptomStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  UNCERTAIN = 'UNCERTAIN',
}

export enum TemporalStatus {
  CURRENT = 'CURRENT',
  RECENT = 'RECENT',
  HISTORICAL = 'HISTORICAL',
  UNKNOWN = 'UNKNOWN',
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
  status?: SymptomStatus | string;
  temporalStatus?: TemporalStatus | string;
  context?: string;
  confidence?: number;
  provenance?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISymptomDocument extends ISymptom, Document {
  _id: Types.ObjectId;
}
