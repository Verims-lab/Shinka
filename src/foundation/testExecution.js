// One cancellation boundary for local regressions and lightweight Health helpers.
export const cancelledTest = () => Object.assign(new Error('TEST_CANCELLED'), { code: 'TEST_CANCELLED' });
export function testDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelledTest());
    const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); resolve(); };
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(cancelledTest()); };
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
/** @param {import('./tests/testTypes').FoundationTest} test @param {{signal?: AbortSignal, timeoutMs?: number, onStage?: (value: {id:string,stage:string})=>void}} [options] */
export async function executeTest([id, , run], { signal, timeoutMs = 20000, onStage } = {}) {
  const controller = new AbortController();
  let phase = 'START', timer, timedOut = false;
  const stage = value => { phase = value; onStage?.({ id, stage: value }); };
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  try {
    if (controller.signal.aborted) throw cancelledTest();
    const stopped = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(Object.assign(new Error(timedOut ? 'TEST_TIMEOUT' : 'TEST_CANCELLED'), { code: timedOut ? 'TEST_TIMEOUT' : 'TEST_CANCELLED' })), { once: true });
      timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    });
    return await Promise.race([Promise.resolve().then(() => run({ signal: controller.signal, stage })), stopped]);
  } catch (error) {
    // Diagnostics contain test ID/phase only, never fixture or provider data.
    error.testId = id; error.testStage = phase;
    throw error;
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', abort); controller.abort();
  }
}
