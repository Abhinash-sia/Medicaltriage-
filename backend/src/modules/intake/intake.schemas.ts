import { z } from 'zod';
import { SymptomCourse } from './intake.types.js';

export const intakeSubmitSchema = z
  .object({
    consent: z
      .boolean({
        required_error: 'Explicit patient consent is required',
      })
      .refine((val) => val === true, {
        message: 'Explicit patient consent is required to create a healthcare intake case',
      }),
    consentVersion: z.string().trim().default('v1.0-hackathon'),
    language: z.string().trim().default('en'),
    primarySymptom: z
      .string({
        required_error: 'Primary symptom or reason for visit is required',
      })
      .trim()
      .min(2, 'Primary symptom must be at least 2 characters')
      .max(150, 'Primary symptom cannot exceed 150 characters'),
    symptomDescription: z
      .string({
        required_error: 'Detailed symptom description is required',
      })
      .trim()
      .min(5, 'Symptom description must be at least 5 characters')
      .max(2000, 'Symptom description cannot exceed 2000 characters'),
    onset: z
      .string({
        required_error: 'Symptom onset time or date is required',
      })
      .trim()
      .min(1, 'Symptom onset information is required')
      .max(100, 'Onset description cannot exceed 100 characters'),
    duration: z.string().trim().max(100).optional(),
    severity: z
      .number()
      .int()
      .min(1, 'Patient-reported severity must be between 1 and 10')
      .max(10, 'Patient-reported severity must be between 1 and 10')
      .optional(),
    bodyLocation: z.string().trim().max(100).optional(),
    course: z.nativeEnum(SymptomCourse).optional(),
    associatedSymptoms: z.array(z.string().trim().max(100)).optional(),
  })
  .strict(); // Strict mode rejects client injection of server-owned fields (e.g. patientId, priority, status, diagnosis)
