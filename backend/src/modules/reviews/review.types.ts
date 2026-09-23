import { Document, Types } from 'mongoose';

export enum ReviewStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED',
  REFERRED = 'REFERRED',
  ADDITIONAL_INFO_REQUESTED = 'ADDITIONAL_INFO_REQUESTED',
}

export interface IPriorityChange {
  previousPriority: string;
  newPriority: string;
  reason: string;
}

export interface IEscalationDecision {
  escalatedToFacility: string;
  reason: string;
}

export interface IReferralDecision {
  referralFacility: string;
  summary: string;
}

export interface IReview {
  _id?: Types.ObjectId;
  caseId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  reviewStatus: ReviewStatus;
  reviewerNotes: string;
  priorityChange?: IPriorityChange;
  escalationDecision?: IEscalationDecision;
  referralDecision?: IReferralDecision;
  reviewedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReviewDocument extends IReview, Document {
  _id: Types.ObjectId;
}
