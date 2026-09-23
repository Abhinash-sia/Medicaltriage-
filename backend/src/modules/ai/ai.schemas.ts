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

export const missingInformationItemSchema = z.object({
  id: z.string().optional().nullable(),
  field: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  description: z.string().min(1),
  importance: z.enum(['CRITICAL', 'IMPORTANT', 'OPTIONAL']).optional().nullable(),
  reason: z.string().optional().nullable(),
  source: z.enum(['PATIENT_NARRATIVE', 'STRUCTURED_SYMPTOMS', 'TIMELINE', 'REPORT']).optional().nullable(),
  provenance: z.enum(['AI_GENERATED', 'HUMAN_VERIFIED']).optional().nullable(),
});

export const followUpQuestionSchema = z.object({
  id: z.string().optional().nullable(),
  question: z.string().min(1),
  linkedMissingInformationId: z.string().optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().nullable(),
  reason: z.string().optional().nullable(),
  answerType: z.enum(['TEXT', 'YES_NO', 'DATE', 'DURATION', 'NUMBER', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'UNKNOWN']).optional().nullable(),
  provenance: z.enum(['AI_GENERATED', 'HUMAN_VERIFIED']).optional().nullable(),
});

export const aiExtractionOutputSchema = z.object({
  symptoms: z.array(extractedSymptomSchema),
  negativeFindings: z.array(z.string()),
  timeline: z.array(timelineEventSchema),
  uncertainties: z.array(z.string()),
  missingInformation: z.array(missingInformationItemSchema).optional().nullable(),
  followUpQuestions: z.array(followUpQuestionSchema).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

export type AiExtractionOutputSchema = z.infer<typeof aiExtractionOutputSchema>;
