import { z } from 'zod';

export const visualObservationSchema = z.object({
  id: z.string().default(() => `obs_${Math.random().toString(36).substring(2, 9)}`),
  type: z.enum([
    'REDNESS',
    'SWELLING',
    'DISCOLORATION',
    'VISIBLE_WOUND',
    'ASYMMETRY',
    'VISIBLE_DISCHARGE',
    'SKIN_CHANGE',
    'OTHER',
  ]).default('OTHER'),
  description: z.string().min(1, 'Observation description cannot be empty'),
  location: z.string().nullable().optional(),
  certainty: z.enum(['OBSERVED', 'APPARENT', 'UNCERTAIN']).default('OBSERVED'),
  provenance: z.enum(['AI_GENERATED', 'HUMAN_VERIFIED']).default('AI_GENERATED'),
});

export const visionAnalysisResultSchema = z.object({
  qualityStatus: z.enum(['SUFFICIENT', 'INSUFFICIENT', 'UNKNOWN']).default('SUFFICIENT'),
  qualityNotes: z.string().optional(),
  observations: z.array(visualObservationSchema).default([]),
  error: z.string().optional(),
});
