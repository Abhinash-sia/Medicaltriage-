import { CasePriority } from '../cases/case.types.js';

export enum SlaStatus {
  PENDING = 'PENDING',
  DUE_SOON = 'DUE_SOON',
  OVERDUE = 'OVERDUE',
  ESCALATED = 'ESCALATED',
}

export interface SlaStateDetails {
  dueAt: Date | null;
  status: SlaStatus;
  escalatedAt: Date | null;
  escalationLevel: number;
}

export interface SlaProcessorResult {
  processed: number;
  escalated: number;
  alreadyEscalated: number;
  failed: number;
}
