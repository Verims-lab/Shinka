import { isPatternPrivacyError } from '@/services/patternService';
const empty = () => ({ value: null, loading: false, error: null });
export function createPatternController(request, now = () => Date.now()) {
  let state = { themes: empty(), lunar: empty() }, generation = 0, disposed = false, refreshedAt = -Infinity;
  const pending = { themes: null, lunar: null }, listeners = new Set();
  const publish = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const invalidate = (error = null) => {
    generation++; refreshedAt = -Infinity; pending.themes = pending.lunar = null;
    publish({ themes: { ...empty(), error }, lunar: { ...empty(), error } });
  };
  function load(section) {
    if (disposed) return Promise.resolve();
    if (pending[section]) return pending[section].promise;
    const epoch = generation, task = { promise: null }; pending[section] = task;
    publish({ [section]: { ...state[section], loading: true, error: null } });
    task.promise = (async () => {
      try {
        const value = await request(section);
        if (disposed || epoch !== generation || pending[section] !== task) return;
        publish({ [section]: { value, loading: false, error: null } });
      } catch (error) {
        if (disposed || epoch !== generation || pending[section] !== task) return;
        if (isPatternPrivacyError(error.code)) invalidate(error.code);
        else publish({ [section]: { ...state[section], loading: false, error: error.code || 'PATTERN_READ_FAILED' } });
      } finally { if (pending[section] === task) pending[section] = null; }
    })();
    return task.promise;
  }
  return { getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    refresh({ background = false } = {}) {
      if (background && now() - refreshedAt < 1000) return Promise.all(Object.values(pending).map(task => task?.promise));
      refreshedAt = now(); return Promise.all([load('themes'), load('lunar')]);
    }, invalidate,
    connectionLost() { refreshedAt = -Infinity; publish(Object.fromEntries(['themes','lunar'].map(key => [key, { ...state[key], error: 'NETWORK' }]))); },
    dispose() { disposed = true; generation++; pending.themes = pending.lunar = null; listeners.clear(); },
  };
}
