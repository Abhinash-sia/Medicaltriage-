import { CasePriority } from '../cases/case.types.js';
import { SafetyRegistry } from './safety.registry.js';
import { SafetyEvaluationContext, EngineResult, ISafetySignal } from './safety.types.js';

export class SafetyEngine {
  public static evaluate(context: SafetyEvaluationContext): EngineResult {
    const rules = SafetyRegistry.getAllRules();
    const matchedSignals: ISafetySignal[] = [];

    for (const rule of rules) {
      const signal = rule.evaluate(context);
      if (signal) {
        matchedSignals.push(signal);
      }
    }

    let calculatedPriority = CasePriority.ROUTINE;

    const hasUrgent = matchedSignals.some((s) => s.priority === CasePriority.URGENT);
    const hasPriority = matchedSignals.some((s) => s.priority === CasePriority.PRIORITY);

    if (hasUrgent) {
      calculatedPriority = CasePriority.URGENT;
    } else if (hasPriority) {
      calculatedPriority = CasePriority.PRIORITY;
    }

    return {
      calculatedPriority,
      matchedSignals,
      evaluatedAt: new Date(),
    };
  }
}
