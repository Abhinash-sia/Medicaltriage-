import { z } from 'zod';
import { CaseStatus, CasePriority } from '../cases/case.types.js';
import { ReviewStatus } from '../reviews/review.types.js';

export const reviewerCasesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Maximum limit is 100')),
  status: z.nativeEnum(CaseStatus).optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  assignedTo: z.enum(['me', 'unassigned', 'all']).optional(),
  slaStatus: z.enum(['pending', 'due_soon', 'overdue', 'escalated']).optional(),
});

export const submitReviewSchema = z
  .object({
    reviewerNotes: z
      .string({ required_error: 'Reviewer notes are required' })
      .trim()
      .min(1, 'Reviewer notes cannot be empty')
      .max(5000, 'Reviewer notes cannot exceed 5000 characters'),
    reviewStatus: z.nativeEnum(ReviewStatus).optional().default(ReviewStatus.COMPLETED),
  })
  .strict({
    message:
      'Invalid field in review submission. Client cannot override server-controlled fields such as reviewerId or assignedReviewerId.',
  });

export const adminAssignSchema = z
  .object({
    reviewerId: z.string({ required_error: 'Target reviewer ID is required' }).trim().min(1, 'Target reviewer ID is required'),
  })
  .strict({
    message: 'Invalid field in admin assignment payload.',
  });

export type ReviewerCasesQueryInput = z.infer<typeof reviewerCasesQuerySchema>;
export type SubmitReviewSchemaInput = z.infer<typeof submitReviewSchema>;
export type AdminAssignSchemaInput = z.infer<typeof adminAssignSchema>;
