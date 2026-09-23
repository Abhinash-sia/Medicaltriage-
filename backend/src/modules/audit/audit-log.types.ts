import { Document, Types } from 'mongoose';
import { UserRole } from '../users/user.types.js';

export enum AuditEventType {
  CASE_CREATED = 'CASE_CREATED',
  CASE_UPDATED = 'CASE_UPDATED',
  REPORT_UPLOADED = 'REPORT_UPLOADED',
  REPORT_PROCESSED = 'REPORT_PROCESSED',
  AI_OUTPUT_GENERATED = 'AI_OUTPUT_GENERATED',
  AI_EXTRACTION_REQUESTED = 'AI_EXTRACTION_REQUESTED',
  AI_EXTRACTION_FAILED = 'AI_EXTRACTION_FAILED',
  SAFETY_FLAG_CREATED = 'SAFETY_FLAG_CREATED',
  REVIEW_STARTED = 'REVIEW_STARTED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  CASE_ESCALATED = 'CASE_ESCALATED',
  CASE_REFERRED = 'CASE_REFERRED',
  CASE_RESOLVED = 'CASE_RESOLVED',
  CONSENT_RECORDED = 'CONSENT_RECORDED',
  DATA_PURGED = 'DATA_PURGED',
  CASE_CLAIMED = 'CASE_CLAIMED',
  CASE_RELEASED = 'CASE_RELEASED',
  CASE_ASSIGNED = 'CASE_ASSIGNED',
  CASE_UNASSIGNED = 'CASE_UNASSIGNED',
  CASE_SLA_ESCALATED = 'CASE_SLA_ESCALATED',
}

export type AuditActorRole = UserRole | 'SYSTEM';

export interface IAuditLog {
  _id?: Types.ObjectId;
  actorId: string;
  actorRole: AuditActorRole;
  action: AuditEventType;
  resourceType: string;
  resourceId: string;
  caseId?: Types.ObjectId;
  requestId?: string;
  timestamp: Date;
  source: string;
  outcome: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {
  _id: Types.ObjectId;
}
