import { Document, Types } from 'mongoose';

export enum ReferralStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface IReferralStatusHistory {
  status: ReferralStatus;
  updatedBy: Types.ObjectId;
  updatedAt: Date;
  notes?: string;
}

export interface IReferral {
  _id?: Types.ObjectId;
  referralCode: string;
  caseId: Types.ObjectId;
  originatingFacilityId: string;
  destinationFacilityId: string;
  destinationDepartment?: string;
  referringReviewerId: Types.ObjectId;
  status: ReferralStatus;
  reason: string;
  summary: string;
  destinationNotes?: string;
  triageNoteVersionSnapshot?: number;
  safetyEvaluationVersionSnapshot?: number;
  statusHistory: IReferralStatusHistory[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReferralDocument extends IReferral, Document {
  _id: Types.ObjectId;
}
