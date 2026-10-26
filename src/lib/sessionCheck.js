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
