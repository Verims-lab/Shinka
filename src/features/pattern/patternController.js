import { isPatternPrivacyError } from '@/services/patternService';
const empty = () => ({ value: null, loading: false, error: null });
export function createPatternController(request) {
  let state = { themes: empty(), lunar: empty() }, generation = 0, disposed = false;
  const tickets = { themes: 0, lunar: 0 }, listeners = new Set();
  const publish = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const invalidate = (error = null) => { generation++; publish({ themes: { ...empty(), error }, lunar: { ...empty(), error } }); };
  async function load(section) {
    if (disposed || state[section].loading) return;
    const epoch = generation, ticket = ++tickets[section];
    publish({ [section]: { value: null, loading: true, error: null } });
    try {
      const value = await request(section);
      if (disposed || epoch !== generation || ticket !== tickets[section]) return;
      publish({ [section]: { value, loading: false, error: null } });
    } catch (error) {
      if (disposed || epoch !== generation || ticket !== tickets[section]) return;
      if (isPatternPrivacyError(error.code)) {
        invalidate();
        publish({ themes: { ...empty(), error: error.code }, lunar: { ...empty(), error: error.code } });
      } else publish({ [section]: { value: null, loading: false, error: error.code || 'PATTERN_READ_FAILED' } });
    }
  }
  return { getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    refresh() { invalidate(); return Promise.all([load('themes'), load('lunar')]); }, invalidate,
    dispose() { invalidate(); disposed = true; listeners.clear(); },
  };
}
