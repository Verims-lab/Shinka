// Local-only fault injection. Never used by a published Health case.
import { HEALTH_CASES } from '@/foundation/health/catalog';
import { executeCase } from '@/foundation/health/runner';
export async function runHealthTiming(id, slowTimers = false) {
  const events = [], original = window.setTimeout;
  // Reproducible scheduler stress, not a claim about actual browser visibility.
  if (slowTimers) window.setTimeout = (fn, ms, ...args) => original(fn, ms < 100 ? 1000 : ms, ...args);
  try {
    const result = await executeCase(HEALTH_CASES.find(c => c.id === id), {
      testResults: new Map(), onTestProgress: value => events.push(value),
    });
    return { id, slowTimers, status:result.status, durationMs:result.durationMs, evidence:result.evidence, events };
  } finally { window.setTimeout = original; }
}
