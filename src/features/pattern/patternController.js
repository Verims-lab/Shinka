import { PRODUCT_READ_MS, productFailureEvidence } from '@/services/productReadTransport';
import { isPatternPrivacyError } from '@/services/patternService';
const empty = () => ({ value: null, loading: false, error: null, diagnostic: null });
export function createPatternController(request, now = () => Date.now()) {
  let state = { themes: empty(), lunar: empty() }, generation = 0, disposed = false, refreshedAt = -Infinity, ended = false, offline = false;
  const retryAt = { themes: -Infinity, lunar: -Infinity };
  const pending = { themes: null, lunar: null }, listeners = new Set();
  const publish = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const invalidate = (error = null) => {
    generation++; refreshedAt = -Infinity; retryAt.themes = retryAt.lunar = -Infinity; Object.values(pending).forEach(task => task?.abort.abort()); pending.themes = pending.lunar = null;
    publish({ themes: { ...empty(), error }, lunar: { ...empty(), error } });
  };
  function load(section) {
    if (disposed || ended || offline || now() < retryAt[section]) return Promise.resolve();
    if (pending[section] && now() - pending[section].startedAt < PRODUCT_READ_MS) return pending[section].promise;
    pending[section]?.abort.abort();
    refreshedAt = now();
    const epoch = generation, task = { promise: null, startedAt: now(), abort: new AbortController() }; pending[section] = task;
    publish({ [section]: { ...state[section], loading: true, error: null, diagnostic: null } });
    task.promise = (async () => {
      try {
        const value = await request(section, { signal: task.abort.signal });
        if (disposed || epoch !== generation || pending[section] !== task) return;
        publish({ [section]: { value, loading: false, error: null, diagnostic: null } });
      } catch (error) {
        if (disposed || epoch !== generation || pending[section] !== task) return;
        retryAt[section] = now() + (error.retryAfterMs || 0);
        if (isPatternPrivacyError(error.code)) invalidate(error.code);
        else publish({ [section]: { ...state[section], loading: false, error: error.code || 'PATTERN_READ_FAILED', diagnostic: productFailureEvidence(error) } });
      } finally { if (pending[section] === task) pending[section] = null; }
    })();
    return task.promise;
  }
  return { getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    refresh({ background = false } = {}) {
      if (background && now() - refreshedAt < 1000) return Promise.all(Object.values(pending).map(task => task?.promise));
      refreshedAt = now(); return Promise.all([load('themes'), load('lunar')]);
    }, invalidate,
    connectionLost() { offline = true; generation++; Object.values(pending).forEach(task => task?.abort.abort()); pending.themes = pending.lunar = null; publish(Object.fromEntries(['themes','lunar'].map(key => [key, { ...state[key], loading: false, error: 'NETWORK', diagnostic: null }]))); },
    connectionRestored() { if (offline) { offline = false; refreshedAt = -Infinity; } },
    endSession() { ended = true; invalidate(); },
    dispose() { disposed = true; generation++; Object.values(pending).forEach(task => task?.abort.abort()); pending.themes = pending.lunar = null; listeners.clear(); },
  };
}
