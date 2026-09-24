import { Document, Types } from 'mongoose';

export enum FacilityType {
  GOVERNMENT_HOSPITAL = 'GOVERNMENT_HOSPITAL',
  PHC = 'PHC',
  PUBLIC_HEALTH_CAMP = 'PUBLIC_HEALTH_CAMP',
  COMPANY_CLINIC = 'COMPANY_CLINIC',
  INDUSTRIAL_HEALTH_UNIT = 'INDUSTRIAL_HEALTH_UNIT',
  CAMPUS_HEALTH_CENTER = 'CAMPUS_HEALTH_CENTER',
  OTHER = 'OTHER',
}

export interface IFacility {
  _id?: Types.ObjectId;
  name: string;
  code: string;
  type: FacilityType;
  district?: string;
  state?: string;
  supportedLanguages: string[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFacilityDocument extends IFacility, Document {
  _id: Types.ObjectId;
}

export interface CreateFacilityInput {
  name: string;
  code: string;
  type: FacilityType;
  district?: string;
  state?: string;
  supportedLanguages?: string[];
  active?: boolean;
}

export interface UpdateFacilityInput {
  name?: string;
  type?: FacilityType;
  district?: string;
  state?: string;
  supportedLanguages?: string[];
  active?: boolean;
}

export interface UpdateFacilityLanguagesInput {
  supportedLanguages: string[];
}
