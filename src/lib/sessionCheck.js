// Coalesces concurrent session checks (focus, visibilitychange, timer, route
// callbacks) into one request, and throttles passive triggers after success.
export function createSessionCoalescer(run, { minPassiveGapMs = 15000, now = () => Date.now() } = {}) {
  let inFlight = null, lastSuccess = 0;
  const check = () => {
    if (inFlight) return inFlight;
    inFlight = Promise.resolve().then(run).then(ok => { if (ok) lastSuccess = now(); return ok; })
      .finally(() => { inFlight = null; });
    return inFlight;
  };
  // Passive triggers skip when a check recently succeeded; explicit checks never skip.
  const passive = () => (inFlight || now() - lastSuccess >= minPassiveGapMs ? check() : Promise.resolve(true));
  const reset = () => { lastSuccess = 0; };
  return { check, passive, reset };
}