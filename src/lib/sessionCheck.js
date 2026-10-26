// Coalesces concurrent session checks (focus, visibilitychange, timer, route
// callbacks) into one request, and throttles passive triggers after success.
export function createSessionCoalescer(run, { minPassiveGapMs = 15000, now = () => Date.now() } = {}) {
  let inFlight = null, lastSuccess = -Infinity;
  const check = () => {
    if (inFlight) return inFlight;
    inFlight = Promise.resolve().then(run).then(ok => { if (ok) lastSuccess = now(); return ok; })
      .finally(() => { inFlight = null; });
    return inFlight;
  };
  // Passive triggers skip when a check recently succeeded; explicit checks never skip.
  const passive = () => (inFlight || now() - lastSuccess >= minPassiveGapMs ? check() : Promise.resolve(true));
  // Logout/account change: forget the last success so the next passive trigger re-verifies.
  const reset = () => { lastSuccess = -Infinity; };
  return { check, passive, reset };
}