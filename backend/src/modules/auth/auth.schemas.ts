import { z } from 'zod';
import { UserRole } from '../users/user.types.js';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(120),
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
      .max(128, 'Password cannot exceed 128 characters'),
    role: z
      .enum([UserRole.PATIENT])
      .default(UserRole.PATIENT)
      .refine((val) => val === UserRole.PATIENT, {
        message: 'Self-registration is allowed for PATIENT role only. Privileged roles require administrative provisioning.',
      }),
  })
  .refine((data) => (data.email && data.email !== '') || (data.phone && data.phone !== ''), {
    message: 'Either email or phone number must be provided for registration',
    path: ['email'],
  });

export const loginSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().trim().optional().or(z.literal('')),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => (data.email && data.email !== '') || (data.phone && data.phone !== ''), {
    message: 'Either email or phone number is required for login',
    path: ['email'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
