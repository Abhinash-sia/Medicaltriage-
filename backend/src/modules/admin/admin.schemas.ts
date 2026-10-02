import { z } from 'zod';
import { UserRole } from '../users/user.types.js';

export const createStaffUserSchema = z
  .object({
    name: z.string().trim().min(2, 'Staff name must be at least 2 characters long').max(120),
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
    phone: z
      .string()
      .trim()
      .min(8, 'Phone number must be at least 8 digits')
      .max(20)
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128),
    role: z.nativeEnum(UserRole).refine((val) => val !== UserRole.PATIENT, {
      message: 'Staff creation endpoint is reserved for clinical & administrative roles only.',
    }),
    facilityId: z.string().trim().optional(),
    preferredLanguage: z.string().trim().default('en'),
  })
  .refine((data) => (data.email && data.email !== '') || (data.phone && data.phone !== ''), {
    message: 'Either email or phone number is required to provision staff member.',
    path: ['email'],
  });

export type CreateStaffUserSchemaInput = z.infer<typeof createStaffUserSchema>;
