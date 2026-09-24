import { z } from 'zod';
import { ReferralStatus } from './referral.types.js';

export const createReferralInputSchema = z.object({
  referralFacilityId: z
    .string({ required_error: 'Referral destination facility ID is required' })
    .trim()
    .min(1, 'Referral destination facility ID cannot be empty'),
  destinationDepartment: z.string().optional(),
  referralReason: z
    .string({ required_error: 'Referral reason is required' })
    .trim()
    .min(1, 'Referral reason cannot be empty')
    .max(2000, 'Referral reason cannot exceed 2000 characters'),
  referralSummary: z
    .string({ required_error: 'Referral summary is required' })
    .trim()
    .min(1, 'Referral summary cannot be empty')
    .max(5000, 'Referral summary cannot exceed 5000 characters'),
});

export const updateReferralStatusSchema = z
  .object({
    status: z.nativeEnum(ReferralStatus, {
      required_error: 'Target referral status is required',
    }),
    notes: z.string().optional(),
  })
  .strict();

export type CreateReferralInput = z.infer<typeof createReferralInputSchema>;
export type UpdateReferralStatusInput = z.infer<typeof updateReferralStatusSchema>;
