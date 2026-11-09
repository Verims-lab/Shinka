import { PRODUCT_READ_MS, productFailureEvidence } from '@/services/productReadTransport';
import { isCalendarDate } from '../../../base44/shared/onboardingValidation.js';
import { isCalendarPrivacyError, assertCalendarMutation } from '@/services/calendarService';
const isRejection = code => /^(PERIOD_|CALENDAR_(STATE_CHANGED|ACTION_CONFLICT|ACTION_INVALID|DATA_CONFLICT|ATOMIC_CAPABILITY_REQUIRED)|CYCLE_RANGE_DECISION_REQUIRED|INVALID_REQUEST|WRITE_CONFLICT|ACTION_CONFLICT|MAINTENANCE_)/.test(code || '');

// Transient UI state only: no health values, receipts or dates in browser storage.
export function createCalendarController(request, now = () => Date.now()) {
  let state = { value: null, month: null, selected: '', editing: null, editMode: false, canContinue: false, confirmDelete: false, consent: false, loading: false, busy: false, checking: false, error: null, action: 'read', success: null, refreshError: null, readDiagnostic: null, outcome: null };
  let generation = 0, disposed = false, mutationPending = null, retry = null, readPending = null;
  let ended = false, offline = false, startedAt = -Infinity, retryAt = -Infinity;
  const listeners = new Set();
  const set = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const confirm = (value, operation) => {
    retry = null;
    set({ value, month: value.month, refreshError: null, readDiagnostic: null, error: null, outcome: 'confirmed', selected: '', editMode: false, canContinue: false, editing: null, confirmDelete: false, consent: false, success: operation === 'delete' ? 'deleted' : 'saved' });
  };
  const checked = value => {
    if (!retry || value.checkedAction?.action_id !== retry.payload.action_id) return false;
    if (['APPLIED','PENDING'].includes(value.checkedAction.status) && retry.action !== 'resume' &&
      (value.checkedAction.operation !== retry.action || value.checkedAction.revision !== retry.payload.revision ||
        (retry.payload.date && value.checkedAction.date !== retry.payload.date) ||
        (retry.payload.period_id && value.checkedAction.period_id !== retry.payload.period_id))) throw { code: 'CALENDAR_ACTION_CONFLICT' };
    if (value.checkedAction.status === 'APPLIED') {
      // Server checked receipt + full readback; still verify the original UI intent.
      assertCalendarMutation(retry.action, retry.payload, { ...value, mutationConfirmed: true });
      confirm(value, value.checkedAction.operation); return true;
    }
    if (value.checkedAction.status === 'CONFLICT') {
      retry = null; set({ value, month: value.month, error: 'CALENDAR_STATE_CHANGED', outcome: 'rejected', success: null }); return true;
    }
    return false;
  };
  const load = (month = state.month, { background = false } = {}) => {
    if (disposed || ended || offline || mutationPending || now() < retryAt) return Promise.resolve();
    if (readPending && month === readPending.month && now() - startedAt < PRODUCT_READ_MS) return readPending.promise;
    if (background && now() - startedAt < 1000) return Promise.resolve();
    readPending?.abort.abort();
    startedAt = now();
    const ticket = ++generation, task = { month, promise: null, abort: new AbortController() };
    readPending = task;
    const unresolved = state.outcome === 'unknown';
    set({ loading: true, refreshError: null, readDiagnostic: null,
      ...(!unresolved ? { error: null, success: null } : {}) });
    task.promise = (async () => {
      try {
        const value = await request('read', { ...(month ? { month } : {}), ...(retry ? { action_id: retry.payload.action_id, revision: retry.payload.revision } : {}) }, { signal: task.abort.signal });
        if (ticket !== generation || disposed) return;
        const denied = value.state === 'CONSENT_REQUIRED' && !value.recovery && !(retry?.payload.health_consent === true && value.checkedAction?.status === 'ABSENT');
        if (denied) retry = null;
        if (!denied && checked(value)) return;
        if (!retry && value.recovery) retry = { action: 'resume', payload: { action_id: value.recovery.action_id, revision: value.recovery.revision, month: value.recovery.date.slice(0, 7) } };
        set({ value, month: value.month, ...(value.recovery ? { action: 'resume', outcome: 'unknown', error: 'CALENDAR_PENDING_REVIEW', selected: value.recovery.date } : {}), ...(denied ? { selected: '', editing: null, editMode: false, canContinue: false, consent: false, outcome: null, error: null, confirmDelete: false } : {}) });
      } catch (e) {
        if (ticket !== generation || disposed) return;
        retryAt = now() + (e.retryAfterMs || 0);
        set({ readDiagnostic: productFailureEvidence(e) });
        if (isCalendarPrivacyError(e.code)) { retry = null; set({ value: null, selected: '', editing: null, editMode: false, canContinue: false, consent: false, confirmDelete: false, outcome: null, error: e.code }); }
        else set({ refreshError: state.value ? e.code || 'CALENDAR_READ_FAILED' : null, ...(!state.value && !unresolved ? { error: e.code || 'CALENDAR_READ_FAILED', action: 'read' } : {}) });
      } finally { if (ticket === generation) { readPending = null; set({ loading: false }); } }
    })();
    return task.promise;
  };
  const submit = async (action, replay = false, timeoutMs = PRODUCT_READ_MS) => {
    if (disposed || ended || mutationPending || state.loading || !state.value || (state.outcome === 'unknown' && !replay)) return;
    let payload = replay ? retry?.payload : null;
    if (!payload) {
      if (!['delete','resume'].includes(action) && !isCalendarDate(state.selected)) { set({ error: state.selected ? 'PERIOD_DATE_INVALID' : 'PERIOD_DATE_REQUIRED', action }); return; }
      if (['add', 'edit'].includes(action) && state.selected > state.value.today) { set({ error: 'PERIOD_START_FUTURE', action, success: null, outcome: 'rejected' }); return; }
      if (action === 'resume') {
        payload = { month: state.value.recovery.date.slice(0, 7), action_id: state.value.recovery.action_id, revision: state.value.recovery.revision };
      } else {
        payload = { month: action === 'delete' ? state.month : state.selected.slice(0, 7), action_id: crypto.randomUUID(), revision: state.value.revision };
        if (action === 'delete') payload.period_id = state.editing?.id;
        else {
          payload.date = state.selected;
          if (action === 'edit') payload.period_id = state.editing?.id;
          else payload.health_consent = state.consent;
        }
      }
      retry = { action, payload };
    }
    const task = {}; mutationPending = task;
    const ticket = ++generation;
    set({ busy: true, canContinue: false, error: null, success: null, action, outcome: 'pending' });
    try {
      const value = await request(action, payload, { timeoutMs });
      if (ticket !== generation || disposed) return;
      assertCalendarMutation(action, payload, value);
      confirm(value, action === 'resume' ? state.value.recovery?.operation : action);
    } catch (e) {
      if (ticket !== generation || disposed) return;
      if (isCalendarPrivacyError(e.code)) retry = null;
      const rejected = isRejection(e.code);
      set({ error: e.code || 'CALENDAR_OPERATION_FAILED', readDiagnostic: productFailureEvidence(e), outcome: rejected ? 'rejected' : 'unknown', ...(isCalendarPrivacyError(e.code) ? { value: null, editing: null, editMode: false, canContinue: false, selected: '', consent: false, confirmDelete: false, outcome: null } : {}) });
    } finally { if (mutationPending === task) { mutationPending = null; set({ busy: false }); } }
  };
  const reconcile = async (continueRequested = false) => {
    if (disposed || ended || mutationPending) return;
    if (!retry || !state.value) return load();
    generation++; readPending?.abort.abort(); readPending = null;
    const intent = retry, ticket = generation, task = { abort: new AbortController() }, started = now();
    mutationPending = task;
    set({ loading: false, busy: true, checking: true, success: null, canContinue: false });
    let continueIntent = false;
    try {
      const value = await request('read', { month: intent.payload.month, action_id: intent.payload.action_id, revision: intent.payload.revision }, { timeoutMs: PRODUCT_READ_MS, signal: task.abort.signal });
      if (ticket !== generation || disposed) return;
      if (value.state === 'CONSENT_REQUIRED' && !value.recovery && intent.payload.health_consent !== true) {
        retry = null; set({ value, error: null, selected: '', editing: null, editMode: false, canContinue: false, consent: false, confirmDelete: false, outcome: null }); return;
      }
      if (checked(value)) return;
      if (value.pendingReview && value.recovery?.action_id !== intent.payload.action_id) throw { code: 'CALENDAR_ACTION_CONFLICT' };
      if (!['PENDING','ABSENT'].includes(value.checkedAction?.status)) throw { code: 'CALENDAR_READBACK_CONFLICT' };
      // Status inspection alone never writes. Only the separately requested
      // continuation may resume this original ID/revision/payload.
      continueIntent = continueRequested;
      set({ value, month: value.month, canContinue: true });
    } catch (e) {
      if (ticket !== generation || disposed) return;
      if (isCalendarPrivacyError(e.code)) { retry = null; set({ value: null, selected: '', editing: null, editMode: false, canContinue: false, consent: false, confirmDelete: false, outcome: null }); }
      set({ error: e.code || 'CALENDAR_READ_FAILED', readDiagnostic: productFailureEvidence(e), ...(isRejection(e.code) ? { outcome: 'rejected' } : {}) });
    } finally {
      if (mutationPending === task) { mutationPending = null; set({ busy: false, checking: false }); }
    }
    if (continueIntent && ticket === generation && !disposed) {
      const remaining = PRODUCT_READ_MS - (now() - started);
      if (remaining <= 0) { set({ error: 'TIMEOUT', outcome: 'unknown' }); return; }
      await submit(intent.action, true, remaining);
    }
  };
  const select = (date, { toggle = false } = {}) => {
    if (state.busy || state.loading || state.outcome === 'unknown') return;
    const start = state.value?.starts.find(row => row.date === date);
    const clear = toggle && state.selected === date;
    retry = null;
    set({ selected: clear ? '' : date, editing: clear ? null : toggle ? start || state.editing : state.editing || start || null, confirmDelete: false, error: null, success: null, outcome: null });
  };
  return {
    getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    load, submit,
    refresh: (options = {}) => load(state.month, options),
    connectionLost() { offline = true; if (readPending) generation++; readPending?.abort.abort(); readPending = null; set({ loading: false, readDiagnostic: null, ...(state.value ? { refreshError: 'NETWORK' } : { error: 'NETWORK', refreshError: null }) }); },
    connectionRestored() { if (offline) { offline = false; startedAt = -Infinity; } },
    endSession() { ended = true; this.invalidate(); },
    select,
    beginEdit() { if (!state.busy && !state.loading && state.outcome !== 'unknown' && state.value?.writable) { retry = null; set({ editMode: true, selected: '', editing: null, error: null, success: null, outcome: null }); } },
    chooseDay(date) {
      if (state.busy || state.loading || state.outcome === 'unknown' || !state.value) return;
      const start = state.value.starts.find(row => row.date === date);
      if (state.editMode && date > state.value.today && !start) return;
      if (!state.editMode) { set({ selected: date, success: null }); return; }
      select(date, { toggle: true });
    },
    cancelEdit() { if (!state.busy && state.outcome !== 'unknown') { retry = null; set({ editing: null, selected: '', consent: false, editMode: false, canContinue: false, confirmDelete: false, error: null, outcome: null, success: null }); } },
    consent(value) { if (!state.busy && state.outcome !== 'unknown') { retry = null; set({ consent: value }); } },
    deletePrompt(open) { if (!open || !state.busy) set({ confirmDelete: open }); },
    retry: () => reconcile(false),
    continueIntent: () => reconcile(true),
    // Known session/consent signals hide synchronously; obsolete reads and
    // mutations are dropped. Ordinary refresh/offline retains the last view.
    invalidate() { generation++; startedAt = retryAt = -Infinity; retry = null; readPending?.abort.abort(); readPending = null; mutationPending?.abort?.abort(); mutationPending = null; set({ busy: false, checking: false, value: null, selected: '', editing: null, editMode: false, canContinue: false, consent: false, confirmDelete: false, loading: false, error: null, refreshError: null, readDiagnostic: null, success: null, outcome: null }); },
    dispose() { disposed = true; generation++; mutationPending?.abort?.abort(); readPending?.abort.abort(); readPending = null; listeners.clear(); retry = null; },
  };
}
