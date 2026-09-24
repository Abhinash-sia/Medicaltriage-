import { Types } from 'mongoose';

export type RetentionClass = 'CLINICAL_CASE' | 'MEDIA_BLOB' | 'AI_DERIVED' | 'AUDIT_LOG';

export type PurgeStatus = 'ACTIVE' | 'PURGE_PENDING' | 'FILES_DELETED' | 'FILE_CLEANUP_FAILED' | 'PURGED';

export interface IRetentionMetadata {
  retentionClass: RetentionClass;
  configurableDurationDays: number;
  expiresAt?: Date | null;
  purgeStatus: PurgeStatus;
  purgedAt?: Date | null;
  purgedBy?: Types.ObjectId | null;
  purgeAttempts?: number;
  lastPurgeError?: string | null;
}

export interface RetentionStatusSummary {
  clinicalCaseCount: number;
  mediaBlobCount: number;
  aiDerivedCount: number;
  auditLogCount: number;
  eligiblePurgeCount: number;
  failedFileCleanupCount: number;
  disclaimer: string;
}

export interface PurgeExecutionInput {
  dryRun?: boolean;
  caseId?: string;
  olderThanDays?: number;
  retentionClass?: RetentionClass;
}

export interface PurgeExecutionResult {
  dryRun: boolean;
  eligibleCases: number;
  purgedCases: number;
  deletedFiles: number;
  failedFiles: number;
  fileCleanupErrors: Array<{ path: string; error: string }>;
  timestamp: Date;
  disclaimer: string;
}
