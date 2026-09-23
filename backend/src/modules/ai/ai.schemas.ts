import { z } from 'zod';

export const extractedSymptomSchema = z.object({
  name: z.string().min(1),
  normalizedLabel: z.string().optional().nullable(),
  status: z.enum(['PRESENT', 'ABSENT', 'UNCERTAIN']),
  onset: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  severity: z.string().optional().nullable(),
  context: z.string().optional().nullable(),
});

export const timelineEventSchema = z.object({
  eventType: z.enum(['SYMPTOM_ONSET', 'SYMPTOM_CHANGE', 'MEDICAL_ENCOUNTER', 'REPORT', 'MEDICATION', 'OTHER']).optional().nullable(),
  date: z.string().optional().nullable(),
  relativeTime: z.string().optional().nullable(),
  description: z.string().min(1),
  certainty: z.enum(['CERTAIN', 'APPROXIMATE', 'UNCERTAIN']).optional().nullable(),
  sourceQuote: z.string().optional().nullable(),
});

export const aiExtractionOutputSchema = z.object({
  symptoms: z.array(extractedSymptomSchema),
  negativeFindings: z.array(z.string()),
  timeline: z.array(timelineEventSchema),
  uncertainties: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

export type AiExtractionOutputSchema = z.infer<typeof aiExtractionOutputSchema>;
