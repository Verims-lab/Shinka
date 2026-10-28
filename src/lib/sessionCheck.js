/** @param {number} ms @param {AbortSignal} signal
 * @param {{set:(fn:()=>void,ms:number)=>any,clear:(id:any)=>void}} [timers] */
export function waitForSessionRetry(ms, signal, timers = { set:(fn,delay)=>setTimeout(fn,delay),clear:id=>clearTimeout(id) }) {
  return new Promise(resolve => {
    if (signal.aborted) return resolve(false);
    let timer;
    const done = completed => { timers.clear(timer); signal.removeEventListener('abort',abort); resolve(completed); };
    const abort = () => done(false);
    signal.addEventListener('abort',abort,{once:true});
    timer = timers.set(()=>done(true),ms);
  });
}

// Coalesces concurrent session checks (focus, visibilitychange, timer, route
// callbacks) into one request, and throttles passive triggers after success.
export function createSessionCoalescer(run, { minPassiveGapMs = 15000, now = () => Date.now() } = {}) {
  let inFlight = null, lastSuccess = -Infinity, generation = 0;
  const check = () => {
    if (inFlight) return inFlight;
    const ticket = generation;
    const pending = Promise.resolve().then(() => ticket === generation ? run() : false).then(ok => {
      if (ticket !== generation) return false;
      if (ok) lastSuccess = now(); return ok;
    }).finally(() => { if (inFlight === pending) inFlight = null; });
    inFlight = pending;
    return inFlight;
  };
  // Passive triggers skip when a check recently succeeded; explicit checks never skip.
  const passive = () => (inFlight || now() - lastSuccess >= minPassiveGapMs ? check() : Promise.resolve(true));
  // Logout/account change: forget the last success so the next passive trigger re-verifies.
  const reset = () => { generation++; inFlight = null; lastSuccess = -Infinity; };
  return { check, passive, reset };
}
export const SESSION_READ_BUDGET_MS = 15000;
export const SESSION_READ_TIMERS = { set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) };
// Bound the whole session read (including its existing retry waits), not each
// attempt. Abort releases our wait only; the SDK request may still complete.
export async function boundedSessionRead(work, signal, timers = SESSION_READ_TIMERS) {
  let timer, abort;
  try {
    return await Promise.race([
      new Promise((_, reject) => {
        abort = () => reject(Object.assign(new Error('SESSION_CANCELLED'), { code: 'SESSION_CANCELLED' }));
        if (signal.aborted) return abort();
        signal.addEventListener('abort', abort, { once: true });
        timer = timers.set(() => reject(Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' })), SESSION_READ_BUDGET_MS);
      }),
      Promise.resolve().then(() => { if (signal.aborted) throw Object.assign(new Error(), { code: 'SESSION_CANCELLED' }); return work(); }),
    ]);
  } finally { timers.clear(timer); signal.removeEventListener('abort', abort); }
}
