import { isCalendarDate } from '../../../base44/shared/onboardingValidation.js';
import { isCalendarPrivacyError, assertCalendarMutation } from '@/services/calendarService';

// Transient UI state only: no health values, receipts or dates in browser storage.
export function createCalendarController(request) {
  let state = { value: null, month: null, selected: '', editing: null, confirmDelete: false, consent: false, loading: false, busy: false, error: null, action: 'read', success: null, refreshError: null, outcome: null };
  let generation = 0, disposed = false, mutationPending = false, retry = null, readPending = null;
  const listeners = new Set();
  const set = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const load = (month = state.month) => {
    if (disposed || mutationPending) return Promise.resolve();
    if (readPending && month === state.month) return readPending;
    const ticket = ++generation;
    const unresolved = state.outcome === 'unknown';
    set({ loading: true, refreshError: null,
      ...(!unresolved ? { error: null, success: null } : {}) });
    const job = (async () => {
      try {
        const value = await request('read', month ? { month } : {});
        if (ticket !== generation || disposed) return;
        const denied = value.state === 'CONSENT_REQUIRED';
        if (denied) retry = null;
        set({ value, month: value.month, ...(denied ? { selected: '', editing: null, consent: false, outcome: null, error: null, confirmDelete: false } : {}) });
      } catch (e) {
        if (ticket !== generation || disposed) return;
        if (isCalendarPrivacyError(e.code)) { retry = null; set({ value: null, selected: '', editing: null, consent: false, confirmDelete: false, outcome: null, error: e.code }); }
        else set({ refreshError: e.code || 'CALENDAR_READ_FAILED', ...(!state.value && !unresolved ? { error: e.code, action: 'read' } : {}) });
      } finally { if (ticket === generation) { readPending = null; set({ loading: false }); } }
    })();
    readPending = job;
    return job;
  };
  const submit = async (action, replay = false) => {
    if (mutationPending || state.loading || !state.value || (state.outcome === 'unknown' && !replay)) return;
    let payload = replay ? retry?.payload : null;
    if (!payload) {
      if (!['delete','acknowledge','resume'].includes(action) && !isCalendarDate(state.selected)) { set({ error: state.selected ? 'PERIOD_DATE_INVALID' : 'PERIOD_DATE_REQUIRED', action }); return; }
      if (['add', 'edit'].includes(action) && state.selected > state.value.today) { set({ error: 'PERIOD_START_FUTURE', action, success: null, outcome: 'rejected' }); return; }
      payload = { month: state.month, action_id: crypto.randomUUID(), revision: state.value.revision,
        ...(action === 'resume' ? { action_id: state.value.recovery.action_id, revision: state.value.recovery.revision } : action === 'acknowledge' ? {} : action === 'delete' ? { period_id: state.editing?.id } : { date: state.selected, ...(action === 'edit' ? { period_id: state.editing?.id } : { health_consent: state.consent }) }) };
      retry = { action, payload };
    }
    mutationPending = true;
    const ticket = ++generation;
    set({ busy: true, error: null, success: null, action, outcome: 'pending' });
    try {
      const value = await request(action, payload);
      if (ticket !== generation || disposed) return;
      assertCalendarMutation(action, payload, value);
      retry = null;
      set({ value, month: value.month, outcome: 'confirmed', editing: null, confirmDelete: false, consent: false, success: action === 'acknowledge' ? 'reviewed' : action === 'delete' ? 'deleted' : 'saved' });
    } catch (e) {
      if (ticket !== generation || disposed) return;
      const rejected = /^(PERIOD_|CALENDAR_(STATE_CHANGED|ACTION_CONFLICT|ATOMIC_CAPABILITY_REQUIRED)|WRITE_CONFLICT|ACTION_CONFLICT|MAINTENANCE_)/.test(e.code || '');
      set({ error: e.code, outcome: rejected ? 'rejected' : 'unknown', ...(isCalendarPrivacyError(e.code) ? { value: null, editing: null, selected: '', consent: false, confirmDelete: false, outcome: null } : {}) });
    } finally { mutationPending = false; if (!disposed) set({ busy: false }); }
  };
  return {
    getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    load, submit,
    refresh: () => load(),
    connectionLost: () => set({ refreshError: 'NETWORK' }),
    select(date) {
      if (state.busy || state.loading || state.outcome === 'unknown') return;
      const start = state.value?.starts.find(row => row.date === date);
      retry = null;
      set({ selected: date, editing: state.editing || start || null, confirmDelete: false, error: null, success: null, outcome: null });
    },
    cancelEdit() { if (!state.busy && state.outcome !== 'unknown') { retry = null; set({ editing: null, selected: '', confirmDelete: false, error: null }); } },
    consent(value) { if (!state.busy && state.outcome !== 'unknown') { retry = null; set({ consent: value }); } },
    deletePrompt(open) { if (!open || !state.busy) set({ confirmDelete: open }); },
    retry() { return retry && state.value ? submit(retry.action, true) : load(); },
    // Known session/consent signals hide synchronously; obsolete reads and
    // mutations are dropped. Ordinary refresh/offline retains the last view.
    invalidate() { generation++; retry = null; readPending = null; set({ value: null, selected: '', editing: null, consent: false, confirmDelete: false, loading: false, error: null, success: null, outcome: null }); },
    dispose() { disposed = true; generation++; listeners.clear(); retry = null; },
  };
}
