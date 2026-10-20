import { isCalendarDate } from '../../../base44/shared/onboardingValidation.js';
import { isCalendarPrivacyError } from '@/services/calendarService';

// Transient UI state only: no health values, receipts or dates in browser storage.
export function createCalendarController(request) {
  let state = { value: null, month: null, selected: '', editing: null, confirmDelete: false, consent: false, loading: false, busy: false, error: null, action: 'read', success: null };
  let generation = 0, disposed = false, mutationPending = false, retry = null;
  const listeners = new Set();
  const set = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const load = async (month = state.month) => {
    const navigating = !!month && month !== state.month;
    const draft = navigating ? { editing: state.editing, selected: state.selected } : { editing: null, selected: '' };
    const ticket = ++generation;
    set({ value: null, loading: true, error: null, success: null, consent: false, confirmDelete: false });
    try {
      const value = await request('read', month ? { month } : {});
      if (ticket !== generation || disposed) return;
      set({ value, month: value.month, ...draft, busy: mutationPending });
    } catch (e) { if (ticket === generation) set({ error: e.code, action: 'read', editing: null, selected: '' }); }
    finally { if (ticket === generation) set({ loading: false }); }
  };
  const submit = async (action, replay = false) => {
    if (mutationPending || state.loading || !state.value) return;
    let payload = replay ? retry?.payload : null;
    if (!payload) {
      if (!['delete','acknowledge','resume'].includes(action) && !isCalendarDate(state.selected)) { set({ error: state.selected ? 'PERIOD_DATE_INVALID' : 'PERIOD_DATE_REQUIRED', action }); return; }
      payload = { month: state.month, action_id: crypto.randomUUID(), revision: state.value.revision,
        ...(action === 'resume' ? { action_id: state.value.recovery.action_id, revision: state.value.recovery.revision } : action === 'acknowledge' ? {} : action === 'delete' ? { period_id: state.editing?.id } : { date: state.selected, ...(action === 'edit' ? { period_id: state.editing?.id } : { health_consent: state.consent }) }) };
      retry = { action, payload };
    }
    mutationPending = true;
    const ticket = ++generation;
    set({ busy: true, error: null, success: null, action });
    try {
      const value = await request(action, payload);
      if (ticket !== generation || disposed) return;
      retry = null;
      set({ value, month: value.month, editing: null, confirmDelete: false, consent: false, success: action === 'acknowledge' ? 'reviewed' : action === 'delete' ? 'deleted' : 'saved' });
    } catch (e) {
      if (ticket !== generation || disposed) return;
      set({ error: e.code, ...(isCalendarPrivacyError(e.code) ? { value: null, editing: null, selected: '', consent: false, confirmDelete: false } : {}) });
    } finally { mutationPending = false; if (!disposed) set({ busy: false }); }
  };
  return {
    getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    load, submit,
    select(date) {
      if (state.busy || state.loading) return;
      const start = state.value?.starts.find(row => row.date === date);
      retry = null;
      set({ selected: date, editing: state.editing || start || null, confirmDelete: false, error: null, success: null });
    },
    cancelEdit() { if (!state.busy) { retry = null; set({ editing: null, selected: '', confirmDelete: false, error: null }); } },
    consent(value) { if (!state.busy) { retry = null; set({ consent: value }); } },
    deletePrompt(open) { if (!state.busy) set({ confirmDelete: open, error: null }); },
    retry() { return retry && state.value ? submit(retry.action, true) : load(); },
    // Hide synchronously before starting a fresh check on focus/visibility,
    // session/consent signals or offline. Obsolete reads and mutations are dropped.
    invalidate() { generation++; retry = null; set({ value: null, selected: '', editing: null, consent: false, confirmDelete: false, loading: false, error: null, success: null }); },
    dispose() { disposed = true; generation++; listeners.clear(); retry = null; },
  };
}
