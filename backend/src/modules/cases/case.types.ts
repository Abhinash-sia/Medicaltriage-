import { Document, Types } from 'mongoose';

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  ESCALATED = 'ESCALATED',
  REFERRED = 'REFERRED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum CasePriority {
  URGENT = 'URGENT',
  PRIORITY = 'PRIORITY',
  ROUTINE = 'ROUTINE',
}

export enum IntakeSource {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  REPORT = 'REPORT',
  VISUAL = 'VISUAL',
  HEALTH_WORKER = 'HEALTH_WORKER',
}

export interface ICase {
  _id?: Types.ObjectId;
  caseNumber: string;
  patientId: Types.ObjectId;
  assignedReviewerId?: Types.ObjectId;
  facilityId?: string;
  status: CaseStatus;
  priority: CasePriority;
  intakeSource: IntakeSource;
  language: string;
  consentId?: Types.ObjectId;
  chiefComplaint: string;
  slaDueAt?: Date | null;
  escalatedAt?: Date | null;
  escalationLevel?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICaseDocument extends ICase, Document {
  _id: Types.ObjectId;
}
