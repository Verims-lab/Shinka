// One five-minute freshness read while visible, plus coalesced return/online
// events. Ordinary refresh retains data; privacy/session boundaries clear it.
export const PATTERN_REFRESH_MS = 300000;
export const PATTERN_RUNTIME = Object.freeze({
  now: () => Date.now(), set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id),
});
/** @param {any} controller @param {typeof PATTERN_RUNTIME} runtime @param {EventTarget} target @param {EventTarget & {visibilityState:string}} doc */
export function bindPatternLifecycle(controller, runtime = PATTERN_RUNTIME, target = window, doc = document) {
  let stopped = false, sessionEnded = false, timer;
  const refresh = () => { if (!sessionEnded && doc.visibilityState === 'visible') return controller.refresh({ background: true }); };
  const tick = () => { if (stopped) return; void refresh(); timer = runtime.set(tick, PATTERN_REFRESH_MS); };
  const privacy = () => { controller.invalidate(); void refresh(); };
  const ended = () => { sessionEnded = true; controller.invalidate(); };
  const offline = () => controller.connectionLost();
  void controller.refresh(); timer = runtime.set(tick, PATTERN_REFRESH_MS);
  target.addEventListener('focus', refresh); target.addEventListener('online', refresh); target.addEventListener('offline', offline);
  target.addEventListener('shinka-health-access-changed', privacy); target.addEventListener('shinka-session-ended', ended);
  doc.addEventListener('visibilitychange', refresh);
  return () => {
    stopped = true; runtime.clear(timer); controller.dispose();
    target.removeEventListener('focus', refresh); target.removeEventListener('online', refresh); target.removeEventListener('offline', offline);
    target.removeEventListener('shinka-health-access-changed', privacy); target.removeEventListener('shinka-session-ended', ended);
    doc.removeEventListener('visibilitychange', refresh);
  };
}
