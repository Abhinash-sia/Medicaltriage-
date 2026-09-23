import { CasePriority } from '../cases/case.types.js';

/**
 * Prototype operational SLA policy durations (in milliseconds).
 * IMPORTANT: These values are workflow prototype defaults only and are NOT clinically validated recommendations.
 */
export const SLA_POLICY: Record<CasePriority, number> = {
  [CasePriority.URGENT]: 60 * 60 * 1000, // 1 hour
  [CasePriority.PRIORITY]: 4 * 60 * 60 * 1000, // 4 hours
  [CasePriority.ROUTINE]: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Operational DUE_SOON threshold ratio (25% remaining duration).
 */
export const SLA_DUE_SOON_RATIO = 0.25;
