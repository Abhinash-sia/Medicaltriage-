import { Document, Types } from 'mongoose';

export enum UserRole {
  PATIENT = 'PATIENT',
  NURSE = 'NURSE',
  HEALTH_WORKER = 'HEALTH_WORKER',
  DOCTOR = 'DOCTOR',
  MEDICAL_OFFICER = 'MEDICAL_OFFICER',
  ADMIN = 'ADMIN',
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  facilityId?: string;
  ageMonths?: number;
  dateOfBirth?: Date;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}
