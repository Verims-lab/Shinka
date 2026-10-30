import { base44 } from '@/api/base44Client';
import { ShinkaError, classifyError, withTimeout } from '@/foundation/errors';
import { healthReadDiagnostic, healthReadError } from '../../../base44/shared/healthReadDiagnostics.js';
import { healthReadRetryAllowed, retryAfterMs } from '../../../base44/shared/healthReadRetry.js';

const cancelled = () => new ShinkaError('TEST_CANCELLED');
const pause = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) { reject(cancelled()); return; }
  const done = () => { signal?.removeEventListener('abort', abort); resolve(); };
  const timer = setTimeout(done, ms);
  const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(cancelled()); };
  signal?.addEventListener('abort', abort, { once: true });
});
async function bounded(work, ms, signal) {
  if (signal?.aborted) throw cancelled();
  let abort;
  const cancellation = new Promise((_, reject) => { abort = () => reject(cancelled()); });
  signal?.addEventListener('abort', abort, { once: true });
  try { return await withTimeout(Promise.race([work(), cancellation]), ms); }
  finally { signal?.removeEventListener('abort', abort); }
}

// One shared read, at most two completed transport attempts, never overlapping.
// Case deadline and the original 18s bound include backoff. No timeout retry:
// the SDK promise may still be settling and cannot be claimed cancelled remotely.
export async function invokeHealthRead(name, body, invoke = (name, body) => base44.functions.invoke(name, body), options = {}) {
  const { signal, remainingMs = () => Infinity, clock = () => performance.now(), sleep = pause, wallClock = () => Date.now() } = options;
  const started = clock();
  const remaining = () => Math.max(0, Math.min(18000 - (clock() - started), Math.max(0, remainingMs() - 250)));
  let attempts = 0;
  try {
    while (true) {
      if (signal?.aborted) throw cancelled();
      if (remaining() <= 0) throw new ShinkaError('TIMEOUT');
      attempts++;
      try {
        const result = await bounded(() => invoke(name, body), remaining(), signal);
        if (signal?.aborted) throw cancelled();
        if (remaining() <= 0) throw new ShinkaError('TIMEOUT');
        if (!result || !Object.hasOwn(result, 'data') || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) throw healthReadError('INVALID_RESPONSE');
        return result.data;
      } catch (error) {
        const diagnostic = healthReadDiagnostic(error, { durationMs: Math.round(clock() - started) });
        const retryable = healthReadRetryAllowed(name, body, error, diagnostic);
        const delay = Math.max(500, retryAfterMs(error, wallClock()) ?? 500);
        // Reserve at least 1s for the second read; a long Retry-After is not shortened.
        const retryState = signal?.aborted ? 'CANCELLED' : !retryable ? 'NOT_RETRYABLE' : attempts > 1 ? 'EXHAUSTED' : remaining() < delay + 1000 ? 'BUDGET_EXHAUSTED' : 'RETRY';
        if (retryState !== 'RETRY') {
          const failure = new ShinkaError(classifyError(error));
          Object.assign(failure, { diagnostic, readAttempt: { attempts, state: retryState, elapsedMs: Math.round(clock() - started) } });
          throw failure;
        }
        await sleep(delay, signal);
      }
    }
  } catch (error) {
    if (error.diagnostic) throw error;
    const failure = new ShinkaError(classifyError(error));
    Object.assign(failure, { diagnostic: healthReadDiagnostic(error, { durationMs: Math.round(clock() - started) }),
      readAttempt: { attempts, state: signal?.aborted ? 'CANCELLED' : 'BUDGET_EXHAUSTED', elapsedMs: Math.round(clock() - started) } });
    throw failure;
  }
}
