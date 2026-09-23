import { VisualObservation } from './vision.types.js';
import { logger } from '../../lib/logger.js';

/**
 * Regex patterns identifying non-descriptive clinical claims (diagnoses, treatments, urgency assertions).
 */
const DIAGNOSTIC_PATTERNS = [
  /\b(diagnos(is|ed|e|ing)|cellulitis|pneumonia|fracture|infection|cancer|abscess|melanoma|eczema|psoriasis|dermatitis|ringworm|shingles|gout|gangrene|staph)\b/i,
  /\b(consistent\s+with|suggestive\s+of|indicative\s+of|likely\s+case\s+of)\s+[a-z]/i,
  /\bthis\s+is\s+(a\s+)?(case\s+of\s+)?[a-z]+\s+(disease|condition|infection|syndrome)\b/i,
];

const TREATMENT_PATTERNS = [
  /\b(take|start|prescribe|administer|apply)\s+(medication|antibiotics?|cream|ointment|steroids?|surgery)\b/i,
  /\b(use|require)s?\s+(treatment|therapy|intervention)\b/i,
  /\bshould\s+be\s+(treated|given|prescribed)\b/i,
];

const URGENCY_PATTERNS = [
  /\b(this\s+is\s+an?\s+)?(emergency|critical|life-threatening|dangerous)\b/i,
  /\b(needs|requires)\s+(immediate|urgent)\s+(attention|care|intervention)\b/i,
  /\b(assign|triage)\s+to\s+(urgent|critical|priority)\b/i,
];

export class SafetySuppressionEngine {
  /**
   * Post-processes visual observations to strip non-descriptive clinical diagnoses, treatment recommendations, or urgency determinations.
   */
  public filterObservations(rawObservations: VisualObservation[]): VisualObservation[] {
    if (!Array.isArray(rawObservations)) return [];

    const safeObservations: VisualObservation[] = [];

    for (const obs of rawObservations) {
      const desc = obs.description || '';

      // Check if observation contains prohibited diagnostic, treatment, or urgency patterns
      const isDiagnostic = DIAGNOSTIC_PATTERNS.some((pattern) => pattern.test(desc));
      const isTreatment = TREATMENT_PATTERNS.some((pattern) => pattern.test(desc));
      const isUrgent = URGENCY_PATTERNS.some((pattern) => pattern.test(desc));

      if (isDiagnostic || isTreatment || isUrgent) {
        logger.warn(
          {
            originalDescription: desc,
            isDiagnostic,
            isTreatment,
            isUrgent,
          },
          'SafetySuppressionEngine: Suppressed non-descriptive or diagnostic visual observation statement'
        );
        // Suppress/drop the observation or convert to safe neutral descriptive form if type is valid
        continue;
      }

      // Enforce safe qualitative certainty and provenance bounds
      const validCertainty = ['OBSERVED', 'APPARENT', 'UNCERTAIN'].includes(obs.certainty)
        ? obs.certainty
        : 'OBSERVED';

      safeObservations.push({
        ...obs,
        certainty: validCertainty,
        provenance: 'AI_GENERATED', // Provenance must strictly remain AI_GENERATED post-AI processing
      });
    }

    return safeObservations;
  }
}

export const safetySuppressionEngine = new SafetySuppressionEngine();
