// Cancellation owns registered fixture cleanup; late work cannot publish stages
// or become a successful cached result. No raw fixture/error enters progress.
export const cancelledTest = () => Object.assign(new Error('TEST_CANCELLED'), { code: 'TEST_CANCELLED' });
const PHASES = new Set(['START','HELPER','FRAME_CREATE','CSS_WAIT','FIXTURE_RENDER','INTERACTION','DELAY','ACTIVE_WAIT','FETCH_WAIT','BODY_WAIT','BACKEND_FIXTURE','SELECTION_EDIT','SELECTION_RETRY','SELECTION_CLEAR','DEADLINE','SETTLED_CHECK','CLEANUP','LATE_RESPONSE','COOLDOWN','DOM_MOUNT','DOM_WAIT','DOM_NAVIGATION','COMPLETE','FAILED','TIMEOUT','CANCELLED','REUSED']);
export const safeTestStage = value => PHASES.has(value) ? value : 'HELPER';
export const safeTestId = value => typeof value === 'string' && /^[A-Z]{1,4}[0-9]{2,3}$/.test(value) ? value : 'TEST';
export function testDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelledTest());
    const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); resolve(); };
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(cancelledTest()); };
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
/** @param {import('./tests/testTypes').FoundationTest} test @param {{signal?: AbortSignal, timeoutMs?: number, onStage?: (value: {id:string,stage:string,durationMs:number})=>void}} [options] */
export async function executeTest([id, , run], { signal, timeoutMs = 20000, onStage } = {}) {
  const controller = new AbortController(), started = performance.now(), disposers = new Set();
  let phase = 'START', timer, timedOut = false, closed = false, cleanupFailed = false;
  const dispose = () => {
    closed = true; clearTimeout(timer);
    for (const fn of disposers) { try { fn(); } catch { cleanupFailed = true; } }
    disposers.clear();
  };
  controller.signal.addEventListener('abort', dispose, { once:true });
  const stage = value => { if (!closed) { phase = safeTestStage(value); onStage?.({ id, stage: phase, durationMs: Math.round(performance.now()-started) }); } };
  const cleanup = fn => { if (closed || controller.signal.aborted) fn(); else disposers.add(fn); };
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const stoppedError = () => Object.assign(new Error(timedOut ? 'TEST_TIMEOUT' : 'TEST_CANCELLED'), { code: timedOut ? 'TEST_TIMEOUT' : 'TEST_CANCELLED' });
  let onAbort;
  try {
    if (controller.signal.aborted) throw cancelledTest();
    const stopped = new Promise((_, reject) => {
      onAbort = () => reject(stoppedError());
      controller.signal.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    });
    stage('START');
    const result = await Promise.race([Promise.resolve().then(() => {
      if (controller.signal.aborted) throw stoppedError();
      return run({ signal: controller.signal, stage, cleanup });
    }), stopped]);
    if (performance.now()-started >= timeoutMs) timedOut = true;
    if (controller.signal.aborted || timedOut) throw stoppedError();
    return result;
  } catch (caught) {
    const error = caught instanceof Error ? caught : new Error('TEST_FAILED');
    Object.assign(error, { testId: id, testStage: phase });
    throw error;
  } finally {
    closed = true;
    clearTimeout(timer); signal?.removeEventListener('abort', abort); controller.abort();
    if (onAbort) controller.signal.removeEventListener('abort', onAbort);
    controller.signal.removeEventListener('abort', dispose);
    // Registered cleanup is synchronous disposal (timers/listeners/roots), not
    // a remote cancellation promise. Every owner is attempted even if one fails.
    dispose();
    if (cleanupFailed) throw Object.assign(new Error('TEST_CLEANUP_FAILED'), { testId:id, testStage:'CLEANUP' });
  }
}

// Unique helper IDs are required before selection/report/cache joins. Reject a
// duplicate registry, even when a focused run would otherwise hide one entry.
export function assertUniqueTestIds(tests) {
  const ids = new Set();
  for (const [id] of tests) {
    if (ids.has(id)) throw new Error('DUPLICATE_TEST_ID');
    ids.add(id);
  }
}
