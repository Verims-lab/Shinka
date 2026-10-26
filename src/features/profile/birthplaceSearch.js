// Birthplace search controller (v1.0 rules). Transient UI state only: it never
// saves. Every response is bound to a generation, so typing, a new query, a
// language change, cancel or dispose make older responses inert.
export const PLACE_MIN_CHARS = 3;
export const PLACE_DEBOUNCE_MS = 350;
const idle = { status: "IDLE", query: "", results: [], next_page: null, limited: false, loadingMore: false, error: null };
const defaultTimers = { set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) };

export function createBirthplaceSearch({ request, language = "en", debounceMs = PLACE_DEBOUNCE_MS, timers = defaultTimers }) {
  let state = idle, lang = language, generation = 0, timer = null, disposed = false;
  const listeners = new Set();
  const emit = (patch) => {
    if (disposed) return;
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  const stop = () => {
    generation++;
    timers.clear(timer);
    timer = null;
  };
  async function fetchPage(page) {
    const ticket = generation, query = state.query;
    emit(page ? { loadingMore: true, error: null } : { status: "LOADING", error: null });
    try {
      const data = await request("searchPlaces", { query, language_code: lang, page });
      if (ticket !== generation || disposed) return;
      const seen = new Set(page ? state.results.map((r) => r.birthplace_geonames_id) : []);
      const added = (data?.places ?? []).filter((p) => !seen.has(p.birthplace_geonames_id) && seen.add(p.birthplace_geonames_id));
      emit({ status: "READY", results: page ? [...state.results, ...added] : added, next_page: data?.next_page ?? null, limited: !!data?.limited, loadingMore: false });
    } catch (error) {
      if (ticket !== generation || disposed) return;
      emit({ status: page ? state.status : "ERROR", loadingMore: false, error: error?.code === "GEONAMES_RATE_LIMITED" ? "GEONAMES_RATE_LIMITED" : "GEONAMES_UNAVAILABLE" });
    }
  }
  const run = () => {
    stop();
    if ([...state.query].length < PLACE_MIN_CHARS) {
      emit({ ...idle, query: state.query, status: state.query ? "SHORT" : "IDLE" });
      return;
    }
    emit({ status: "LOADING", results: [], next_page: null, limited: false, loadingMore: false, error: null });
    timer = timers.set(() => { timer = null; void fetchPage(0); }, debounceMs);
  };
  return {
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    getSnapshot: () => state,
    setQuery(text) {
      state = { ...state, query: String(text).normalize("NFKC").trim().replace(/\s+/g, " ") };
      run();
    },
    setLanguage(next) {
      if (next === lang) return;
      lang = next;
      if (state.status !== "IDLE" && state.status !== "SHORT") run();
    },
    more() {
      if (state.next_page == null || state.loadingMore || state.status !== "READY") return Promise.resolve();
      return fetchPage(state.next_page);
    },
    retry() {
      stop();
      return state.results.length && state.next_page != null && state.error ? fetchPage(state.next_page) : fetchPage(0);
    },
    cancel() { stop(); emit(idle); },
    dispose() { stop(); disposed = true; listeners.clear(); },
  };
}