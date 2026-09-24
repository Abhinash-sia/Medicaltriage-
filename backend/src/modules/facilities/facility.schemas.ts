import { z } from 'zod';
import { FacilityType } from './facility.types.js';

export const createFacilitySchema = z.object({
  name: z.string().trim().min(2, 'Facility name must be at least 2 characters').max(150),
  code: z
    .string()
    .trim()
    .min(2, 'Facility code must be at least 2 characters')
    .max(20)
    .toUpperCase(),
  type: z.nativeEnum(FacilityType),
  district: z.string().trim().optional(),
  state: z.string().trim().optional(),
  supportedLanguages: z.array(z.string().trim()).optional(),
  active: z.boolean().optional(),
});

export const updateFacilitySchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  type: z.nativeEnum(FacilityType).optional(),
  district: z.string().trim().optional(),
  state: z.string().trim().optional(),
  supportedLanguages: z.array(z.string().trim()).optional(),
  active: z.boolean().optional(),
});

export const updateFacilityLanguagesSchema = z.object({
  supportedLanguages: z
    .array(z.string().trim())
    .min(1, 'At least one supported language must be specified'),
});
