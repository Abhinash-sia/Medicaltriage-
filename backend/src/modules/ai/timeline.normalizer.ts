import { TimelineEvent } from './ai.types.js';
import { ITimelineEvent } from '../triage/triage-note.types.js';

/**
  Normalizes, deduplicates, and sorts timeline events chronologically.
  Strictly non-diagnostic: preserves uncertainty and relative wording without fabricating exact calendar dates.
 */
export function normalizeAndSortTimelineEvents(
  rawTimelineEvents: TimelineEvent[],
  symptoms: Array<{ name: string; onset?: string | null; duration?: string | null }>,
  intakeDate: Date = new Date()
): ITimelineEvent[] {
  const normalizedEvents: ITimelineEvent[] = [];
  const seenEventKeys = new Set<string>();

  // 1. Process explicit timeline events from LLM extraction
  for (const raw of rawTimelineEvents) {
    if (!raw.description || !raw.description.trim()) continue;

    const description = raw.description.trim();
    const relativeTime = raw.relativeTime?.trim() || null;
    const date = raw.date?.trim() || null;
    let certainty: 'CERTAIN' | 'APPROXIMATE' | 'UNCERTAIN' = raw.certainty || 'CERTAIN';

    // Check for explicit keywords indicating approximation or uncertainty in wording
    const combinedText = `${relativeTime || ''} ${description}`.toLowerCase();
    if (
      combinedText.includes('approx') ||
      combinedText.includes('around') ||
      combinedText.includes('about') ||
      combinedText.includes('maybe') ||
      combinedText.includes('think')
    ) {
      certainty = 'APPROXIMATE';
    }
    if (
      combinedText.includes('unclear') ||
      combinedText.includes('unknown') ||
      combinedText.includes('sometime') ||
      combinedText.includes('conflicting') ||
      combinedText.includes('not sure')
    ) {
      certainty = 'UNCERTAIN';
    }

    // Map or infer event type safely
    let eventType: ITimelineEvent['eventType'] = raw.eventType || 'OTHER';
    if (!raw.eventType) {
      if (combinedText.includes('start') || combinedText.includes('began') || combinedText.includes('onset')) {
        eventType = 'SYMPTOM_ONSET';
      } else if (combinedText.includes('worse') || combinedText.includes('change') || combinedText.includes('improve')) {
        eventType = 'SYMPTOM_CHANGE';
      } else if (combinedText.includes('hospital') || combinedText.includes('clinic') || combinedText.includes('doctor') || combinedText.includes('visit')) {
        eventType = 'MEDICAL_ENCOUNTER';
      } else if (combinedText.includes('took') || combinedText.includes('medication') || combinedText.includes('paracetamol') || combinedText.includes('tablet')) {
        eventType = 'MEDICATION';
      }
    }

    const key = `${eventType}:${date || ''}:${relativeTime || ''}:${description.toLowerCase()}`;
    if (!seenEventKeys.has(key)) {
      seenEventKeys.add(key);
      normalizedEvents.push({
        eventType,
        date,
        relativeTime,
        description,
        source: 'AI_EXTRACTION',
        provenance: 'AI_GENERATED',
        certainty,
        sourceQuote: raw.sourceQuote?.trim() || null,
      });
    }
  }

  // 2. Synthesize symptom onset events if not already present in timeline
  for (const s of symptoms) {
    if (s.onset || s.duration) {
      const desc = `Onset of ${s.name}${s.onset ? ` (${s.onset})` : ''}`;
      const relTime = s.onset || s.duration || null;
      const key = `SYMPTOM_ONSET::${relTime || ''}:${desc.toLowerCase()}`;

      // Avoid duplicating if description already mentions the symptom onset
      const exists = normalizedEvents.some(
        (e) => e.description.toLowerCase().includes(s.name.toLowerCase()) && e.eventType === 'SYMPTOM_ONSET'
      );

      if (!exists && !seenEventKeys.has(key)) {
        seenEventKeys.add(key);
        normalizedEvents.push({
          eventType: 'SYMPTOM_ONSET',
          date: null,
          relativeTime: relTime,
          description: desc,
          source: 'AI_EXTRACTION',
          provenance: 'AI_GENERATED',
          certainty: relTime && (relTime.includes('about') || relTime.includes('around')) ? 'APPROXIMATE' : 'CERTAIN',
          sourceQuote: relTime,
        });
      }
    }
  }

  // 3. Helper to estimate offset in days relative to intake date (negative numbers = past)
  function parseDayOffset(rel?: string | null, dateStr?: string | null): number {
    if (dateStr) {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        const diffMs = parsedDate.getTime() - intakeDate.getTime();
        return diffMs / (1000 * 60 * 60 * 24);
      }
    }

    if (!rel) return Number.MAX_SAFE_INTEGER;

    const lower = rel.toLowerCase().trim();
    if (lower === 'today' || lower === 'now') return 0;
    if (lower === 'yesterday') return -1;
    if (lower === 'day before yesterday') return -2;

    const matchDays = lower.match(/(\d+)\s*day/);
    if (matchDays) return -parseInt(matchDays[1], 10);

    const matchWeeks = lower.match(/(\d+)\s*week/);
    if (matchWeeks) return -parseInt(matchWeeks[1], 10) * 7;

    const matchMonths = lower.match(/(\d+)\s*month/);
    if (matchMonths) return -parseInt(matchMonths[1], 10) * 30;

    if (lower.includes('monday') || lower.includes('tuesday') || lower.includes('wednesday') || lower.includes('thursday') || lower.includes('friday') || lower.includes('saturday') || lower.includes('sunday')) {
      return -3; // Default reasonable approximate placement for weekday references without exact date
    }

    return Number.MAX_SAFE_INTEGER; // Unknown / ambiguous timing placed at end ("Time unclear")
  }

  // 4. Sort events chronologically (oldest to newest, with unknown timing at end)
  normalizedEvents.sort((a, b) => {
    const offsetA = parseDayOffset(a.relativeTime, a.date);
    const offsetB = parseDayOffset(b.relativeTime, b.date);

    if (offsetA !== offsetB) {
      return offsetA - offsetB;
    }

    return a.description.localeCompare(b.description);
  });

  return normalizedEvents;
}
