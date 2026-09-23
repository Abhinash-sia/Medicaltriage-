import { MissingInformationItem, FollowUpQuestion } from './ai.types.js';
import { IMissingInformationItem, IFollowUpQuestionItem } from '../triage/triage-note.types.js';

const DIAGNOSTIC_TERMS = [
  'pneumonia',
  'infection',
  'malaria',
  'covid',
  'typhoid',
  'dengue',
  'appendicitis',
  'stroke',
  'infarction',
  'cancer',
  'tumor',
  'sepsis',
  'bronchitis',
  'fracture',
  'meningitis',
  'tuberculosis',
  'diabetes',
  'hypertension',
  'diagnos',
];

const LEADING_TERMS = [
  'right?',
  "isn't it?",
  'probably getting',
  'must be getting',
  'worse right',
  'surely',
];

const TREATMENT_TERMS = [
  'should take',
  'recommend taking',
  'need antibiotic',
  'prescribe',
  'take this medicine',
];

/**
 * Normalizes missing information items and follow-up questions deterministically.
 * Enforces strict safety validation: rejects diagnostic, leading, treatment, or unsupported questions.
 * Ensures system-authoritative ID linking.
 */
export function normalizeMissingInformationAndQuestions(
  rawMissingItems: MissingInformationItem[] = [],
  rawQuestions: FollowUpQuestion[] = [],
  symptoms: Array<{ name: string; status: string; onset?: string | null; duration?: string | null; frequency?: string | null }> = [],
  uncertainties: string[] = []
): {
  missingInformationItems: IMissingInformationItem[];
  followUpQuestionItems: IFollowUpQuestionItem[];
} {
  const missingInformationItems: IMissingInformationItem[] = [];
  const rawIdToSystemIdMap = new Map<string, string>();
  const seenGapDescriptions = new Set<string>();

  let gapCounter = 1;

  // 1. Process explicit missing information items from LLM extraction
  for (const rawItem of rawMissingItems) {
    if (!rawItem.description || !rawItem.description.trim()) continue;

    const desc = rawItem.description.trim();
    const descKey = desc.toLowerCase();

    if (seenGapDescriptions.has(descKey)) continue;
    seenGapDescriptions.add(descKey);

    const systemId = `gap-${gapCounter++}`;
    if (rawItem.id) {
      rawIdToSystemIdMap.set(rawItem.id, systemId);
    }

    let importance: IMissingInformationItem['importance'] = 'IMPORTANT';
    if (rawItem.importance === 'CRITICAL') importance = 'CRITICAL';
    else if (rawItem.importance === 'OPTIONAL') importance = 'OPTIONAL';

    let source: IMissingInformationItem['source'] = 'PATIENT_NARRATIVE';
    if (rawItem.source === 'STRUCTURED_SYMPTOMS') source = 'STRUCTURED_SYMPTOMS';
    else if (rawItem.source === 'TIMELINE') source = 'TIMELINE';
    else if (rawItem.source === 'REPORT') source = 'REPORT';

    missingInformationItems.push({
      id: systemId,
      field: rawItem.field?.trim() || rawItem.topic?.trim() || 'symptom_detail',
      topic: rawItem.topic?.trim() || rawItem.field?.trim() || 'Symptom Clarification',
      description: desc,
      importance,
      reason: rawItem.reason?.trim() || 'Information gap in reported narrative',
      source,
      provenance: 'AI_GENERATED',
    });
  }

  // 2. Synthesize missing information items for explicit uncertainties if not already covered
  for (const u of uncertainties) {
    if (!u || !u.trim()) continue;
    const uText = u.trim();
    const uKey = uText.toLowerCase();

    if (!seenGapDescriptions.has(uKey)) {
      seenGapDescriptions.add(uKey);
      const systemId = `gap-${gapCounter++}`;

      missingInformationItems.push({
        id: systemId,
        field: 'narrative_uncertainty',
        topic: 'Narrative Ambiguity',
        description: uText,
        importance: 'IMPORTANT',
        reason: 'Explicit narrative uncertainty reported during intake',
        source: 'PATIENT_NARRATIVE',
        provenance: 'AI_GENERATED',
      });
    }
  }

  // Build a fast lookup set of all valid system gap IDs
  const validGapIds = new Set<string>(missingInformationItems.map((g) => g.id));

  // Build a set of reported symptom names for unsupported symptom validation
  const reportedSymptomNames = symptoms.map((s) => s.name.toLowerCase());

  const followUpQuestionItems: IFollowUpQuestionItem[] = [];
  const seenQuestionTexts = new Set<string>();
  let questionCounter = 1;

  // 3. Process and strictly validate follow-up questions
  for (const rawQ of rawQuestions) {
    if (!rawQ.question || !rawQ.question.trim()) continue;

    const qText = rawQ.question.trim();
    const qLower = qText.toLowerCase();

    // Check duplicate questions
    if (seenQuestionTexts.has(qLower)) continue;

    // Safety Filter 1: Reject Diagnostic Assertions
    if (DIAGNOSTIC_TERMS.some((term) => qLower.includes(term))) {
      continue; // REJECT diagnostic question
    }

    // Safety Filter 2: Reject Leading Phrasing
    if (LEADING_TERMS.some((term) => qLower.includes(term))) {
      continue; // REJECT leading question
    }

    // Safety Filter 3: Reject Treatment / Medication Recommendations
    if (TREATMENT_TERMS.some((term) => qLower.includes(term))) {
      continue; // REJECT treatment question
    }

    // Resolve linked missing information ID
    let resolvedGapId: string | undefined;
    if (rawQ.linkedMissingInformationId) {
      const rawId = rawQ.linkedMissingInformationId.trim();
      if (validGapIds.has(rawId)) {
        resolvedGapId = rawId;
      } else if (rawIdToSystemIdMap.has(rawId)) {
        resolvedGapId = rawIdToSystemIdMap.get(rawId);
      }
      // If explicit linkedMissingInformationId was provided but is invalid, leave resolvedGapId undefined
    } else if (missingInformationItems.length > 0) {
      // Only apply auto-fallback when no explicit linked ID was specified
      const matchedGap = missingInformationItems.find((gap) =>
        qLower.includes(gap.description.toLowerCase().split(' ')[0]) ||
        (gap.field && qLower.includes(gap.field.toLowerCase()))
      );
      if (matchedGap) {
        resolvedGapId = matchedGap.id;
      } else {
        // Default link to first missing information gap if only one exists
        resolvedGapId = missingInformationItems.length === 1 ? missingInformationItems[0].id : undefined;
      }
    }

    // Safety Filter 4: Reject Invalid Question Link (Question must link to a valid missing information gap)
    if (!resolvedGapId || !validGapIds.has(resolvedGapId)) {
      continue; // REJECT question referencing invalid/non-existent missing info ID
    }

    // Safety Filter 5: Reject Unsupported Symptoms
    // If the question asks about a specific symptom, that symptom MUST be in reported symptoms or mentioned in linked gap
    const linkedGap = missingInformationItems.find((g) => g.id === resolvedGapId);
    const gapDescLower = linkedGap ? linkedGap.description.toLowerCase() : '';

    const mentionsUnreportedSymptom = ['chest pain', 'abdominal pain', 'rash', 'numbness', 'vision loss', 'seizure'].some(
      (unreportedTerm) =>
        qLower.includes(unreportedTerm) &&
        !reportedSymptomNames.some((sName) => sName.includes(unreportedTerm)) &&
        !gapDescLower.includes(unreportedTerm)
    );

    if (mentionsUnreportedSymptom) {
      continue; // REJECT question asking about unsupported symptom
    }

    seenQuestionTexts.add(qLower);

    let priority: IFollowUpQuestionItem['priority'] = 'MEDIUM';
    if (rawQ.priority === 'HIGH') priority = 'HIGH';
    else if (rawQ.priority === 'LOW') priority = 'LOW';

    let answerType: IFollowUpQuestionItem['answerType'] = 'TEXT';
    if (
      rawQ.answerType === 'YES_NO' ||
      rawQ.answerType === 'DATE' ||
      rawQ.answerType === 'DURATION' ||
      rawQ.answerType === 'NUMBER' ||
      rawQ.answerType === 'SINGLE_CHOICE' ||
      rawQ.answerType === 'MULTI_CHOICE'
    ) {
      answerType = rawQ.answerType;
    } else if (qLower.startsWith('when') || qLower.includes('date')) {
      answerType = 'DATE';
    } else if (qLower.startsWith('how long') || qLower.includes('duration')) {
      answerType = 'DURATION';
    } else if (qLower.startsWith('are you') || qLower.startsWith('do you') || qLower.startsWith('have you')) {
      answerType = 'YES_NO';
    }

    followUpQuestionItems.push({
      id: `q-${questionCounter++}`,
      question: qText,
      linkedMissingInformationId: resolvedGapId,
      priority,
      reason: rawQ.reason?.trim() || `Clarify gap: ${linkedGap?.description || 'patient narrative'}`,
      answerType,
      provenance: 'AI_GENERATED',
    });
  }

  return {
    missingInformationItems,
    followUpQuestionItems,
  };
}
