import { PRODUCT_READ_MS, productFailureEvidence } from '@/services/productReadTransport';
import { isCalendarDate } from '../../../base44/shared/onboardingValidation.js';
import { isCalendarPrivacyError, assertCalendarMutation } from '@/services/calendarService';
const isRejection = code => /^(PERIOD_|CALENDAR_(STATE_CHANGED|ACTION_CONFLICT|ACTION_INVALID|DATA_CONFLICT|ATOMIC_CAPABILITY_REQUIRED)|CYCLE_RANGE_DECISION_REQUIRED|INVALID_REQUEST|WRITE_CONFLICT|ACTION_CONFLICT|MAINTENANCE_)/.test(code || '');

// Inspection and the immutable original write intent have independent lifetimes.
// Both are account-scoped React memory only; no dates/receipts in browser storage.
export function createCalendarController(request, now = () => Date.now()) {
  let state = { value: null, month: null, selected: '', editing: null, moving: false, pendingOperation: null, serverPending: false, canContinue: false, confirmDelete: false, consent: false, loading: false, busy: false, checking: false, error: null, action: 'read', success: null, refreshError: null, readDiagnostic: null, outcome: null };
  let generation = 0, readGeneration = 0, inspection = 0, disposed = false, mutationPending = null, retry = null, readPending = null;
  let ended = false, offline = false, startedAt = -Infinity, retryAt = -Infinity;
  const listeners = new Set();
  const set = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const unresolved = () => !!state.pendingOperation || state.outcome === 'unknown' || state.serverPending;
  const operationView = (intent, status = 'UNCONFIRMED') => Object.freeze({
    action_id: intent.payload.action_id, revision: intent.payload.revision,
    operation: intent.operation || intent.action, date: intent.date || intent.payload.date,
    ...(intent.payload.period_id || intent.period_id ? { period_id: intent.payload.period_id || intent.period_id } : {}), status,
  });
  const hide = () => {
    retry = null;
    return { value: null, pendingOperation: null, serverPending: false, selected: '', editing: null, moving: false, canContinue: false, consent: false, confirmDelete: false, outcome: null };
  };
  // Pending receipt metadata is global, even when the month projection is kept.
  const displayed = (value, adopt = false) => ({ serverPending: value.pendingReview === true,
    ...(adopt || !state.value || value.month === state.month ? { value, month: value.month } : {}) });
  const refreshInspection = () => queueMicrotask(() => { if (!disposed && !ended) void load(state.month, { keepFeedback: true }); });
  const confirm = (value, operation, adopt = false) => {
    const show = adopt || !state.value || value.month === state.month;
    retry = null;
    set({ ...displayed(value, adopt), refreshError: null, readDiagnostic: null, error: null, outcome: 'confirmed', pendingOperation: null,
      selected: state.selected && state.selected.slice(0, 7) === (show ? value.month : state.month) ? state.selected : '',
      moving: false, canContinue: false, editing: null, confirmDelete: false, consent: false,
      success: operation === 'delete' ? 'deleted' : 'saved', ...(!show ? { loading: true } : {}) });
    // Never replace an inspected month with the original operation's projection.
    // Refresh that month by read; no repeat mutation or local data projection.
    if (!show) refreshInspection();
  };
  const checked = (value, adopt = false) => {
    if (!retry || value.checkedAction?.action_id !== retry.payload.action_id) return false;
    const status = value.checkedAction.status, expected = retry.operation || retry.action;
    if (['APPLIED','PENDING'].includes(status) &&
      ((expected !== 'resume' && value.checkedAction.operation !== expected) || value.checkedAction.revision !== retry.payload.revision ||
        ((retry.date || retry.payload.date) && value.checkedAction.date !== (retry.date || retry.payload.date)) ||
        ((retry.payload.period_id || retry.period_id) && value.checkedAction.period_id !== (retry.payload.period_id || retry.period_id)))) throw { code: 'CALENDAR_ACTION_CONFLICT' };
    if (status === 'APPLIED') {
      assertCalendarMutation(retry.action, retry.payload, { ...value, mutationConfirmed: true });
      confirm(value, value.checkedAction.operation, adopt); return true;
    }
    if (status === 'CONFLICT') {
      if (value.pendingReview) {
        set({ ...displayed(value, adopt), error: 'CALENDAR_STATE_CHANGED', outcome: 'unknown', success: null, canContinue: false, pendingOperation: operationView(retry, status) });
      } else {
        retry = null; set({ ...displayed(value, adopt), error: 'CALENDAR_STATE_CHANGED', outcome: 'rejected', success: null, pendingOperation: null, canContinue: false, confirmDelete: false, editing: null, moving: false });
      }
      return true;
    }
    if (status === 'ABSENT' && state.outcome === 'rejected' && !value.pendingReview && !value.recovery) {
      retry = null; set({ ...displayed(value, adopt), pendingOperation: null, canContinue: false }); return true;
    }
    if (state.outcome === 'unknown') set({ pendingOperation: operationView(retry, status) });
    return false;
  };
  const load = (month = state.month, { background = false, keepFeedback = false } = {}) => {
    if (disposed || ended || offline || now() < retryAt) return Promise.resolve();
    if (readPending && month === readPending.month && now() - startedAt < PRODUCT_READ_MS) return readPending.promise;
    if (background && now() - startedAt < 1000) return Promise.resolve();
    readPending?.abort.abort();
    startedAt = now();
    const ticket = ++readGeneration, owner = generation, intent = retry, changedMonth = month && state.month && month !== state.month;
    const task = { month, promise: null, abort: new AbortController() };
    readPending = task;
    const wasUncertain = unresolved();
    if (changedMonth) inspection++;
    set({ loading: true, ...(month ? { month } : {}), refreshError: null, readDiagnostic: null,
      ...(changedMonth && (!state.moving || wasUncertain) ? { selected: '', editing: null, moving: false, consent: state.value?.state === 'CONSENT_REQUIRED' && !wasUncertain ? state.consent : false } : {}),
      ...(!wasUncertain && !keepFeedback ? { error: null, success: null } : {}) });
    task.promise = (async () => {
      try {
        const value = await request('read', { ...(month ? { month } : {}), ...(intent ? { action_id: intent.payload.action_id, revision: intent.payload.revision } : {}) }, { signal: task.abort.signal });
        if (owner !== generation || ticket !== readGeneration || disposed) return;
        if (intent && retry !== intent) { refreshInspection(); return; }
        const denied = value.state === 'CONSENT_REQUIRED' && !value.recovery && !(retry?.payload.health_consent === true && value.checkedAction?.status === 'ABSENT');
        if (denied) {
          // Retain only an explicit, unsaved checkbox intent after an unchanged,
          // admitted read. This never establishes persisted consent or write authority.
          const consent = state.consent && state.value?.state === 'CONSENT_REQUIRED' && state.value.revision === value.revision &&
            value.hasPeriods === false && value.pendingReview === false && value.writable && !wasUncertain && !unresolved();
          set({ ...hide(), value, month: value.month, error: null, consent }); return;
        }
        if (checked(value, true)) return;
        if (retry && value.recovery && value.recovery.action_id !== retry.payload.action_id) {
          set({ value, month: value.month, serverPending: value.pendingReview === true, error: 'CALENDAR_ACTION_CONFLICT', outcome: 'unknown', canContinue: false, pendingOperation: operationView(retry, 'CONFLICT') }); return;
        }
        if (!retry && value.recovery) {
          retry = { action: 'resume', payload: { action_id: value.recovery.action_id, revision: value.recovery.revision, month: value.recovery.date.slice(0, 7) },
            operation: value.recovery.operation, date: value.recovery.date, period_id: value.recovery.period_id };
        }
        set({ value, month: value.month, serverPending: value.pendingReview === true,
          ...(!state.moving && state.selected && state.selected.slice(0, 7) !== value.month ? { selected: '' } : {}),
          ...(!retry && !value.pendingReview && state.outcome === 'unknown' ? { outcome: null, error: null, canContinue: false } : {}),
          ...(value.pendingReview ? { outcome: 'unknown', error: 'CALENDAR_PENDING_REVIEW' } : {}),
          ...(value.recovery ? { action: retry.action, outcome: 'unknown', error: 'CALENDAR_PENDING_REVIEW', pendingOperation: operationView(retry, value.checkedAction?.status || 'PENDING') } : {}) });
      } catch (e) {
        if (owner !== generation || ticket !== readGeneration || disposed) return;
        retryAt = now() + (e.retryAfterMs || 0);
        set({ readDiagnostic: productFailureEvidence(e) });
        if (isCalendarPrivacyError(e.code)) set({ ...hide(), error: e.code });
        else set({ refreshError: state.value ? e.code || 'CALENDAR_READ_FAILED' : null,
          ...(wasUncertain ? { canContinue: false } : {}),
          ...(!state.value && !wasUncertain ? { error: e.code || 'CALENDAR_READ_FAILED', action: 'read' } : {}) });
      } finally { if (ticket === readGeneration) { readPending = null; set({ loading: false }); } }
    })();
    return task.promise;
  };
  const submit = async (action, replay = false, timeoutMs = PRODUCT_READ_MS) => {
    if (disposed || ended || mutationPending || (state.loading && !replay) || !state.value || (unresolved() && !replay)) return;
    let payload = replay ? retry?.payload : null;
    if (!payload) {
      if (!['delete','resume'].includes(action) && !isCalendarDate(state.selected)) { set({ error: state.selected ? 'PERIOD_DATE_INVALID' : 'PERIOD_DATE_REQUIRED', action }); return; }
      if (['add','edit'].includes(action) && state.selected > state.value.today) { set({ error: 'PERIOD_START_FUTURE', action, success: null, outcome: 'rejected' }); return; }
      if (action === 'resume') {
        if (!state.value.recovery) return;
        payload = { month: state.value.recovery.date.slice(0, 7), action_id: state.value.recovery.action_id, revision: state.value.recovery.revision };
      } else {
        payload = { month: action === 'delete' ? state.value.month : state.selected.slice(0, 7), action_id: crypto.randomUUID(), revision: state.value.revision };
        if (action === 'delete') payload.period_id = state.editing?.id;
        else { payload.date = state.selected; if (action === 'edit') payload.period_id = state.editing?.id; else payload.health_consent = state.consent; }
      }
      retry = { action, payload, date: action === 'delete' ? state.editing?.date : state.selected, operation: action };
    }
    const intent = retry, task = {}, owner = generation, startedInspection = inspection; mutationPending = task;
    readGeneration++; readPending?.abort.abort(); readPending = null;
    set({ loading: false, busy: true, canContinue: false, error: null, success: null, action, outcome: 'pending', pendingOperation: operationView(intent) });
    try {
      const value = await request(action, payload, { timeoutMs });
      if (owner !== generation || disposed || retry !== intent) return;
      assertCalendarMutation(action, payload, value);
      confirm(value, intent.operation || action, !replay && startedInspection === inspection);
    } catch (e) {
      if (owner !== generation || disposed || retry !== intent) return;
      // A rejection during continuation cannot erase a known unresolved intent.
      // Only receipt reconciliation can retire it; privacy still hides it below.
      const rejected = isRejection(e.code) && !replay && !state.serverPending;
      set({ error: e.code || 'CALENDAR_OPERATION_FAILED', readDiagnostic: productFailureEvidence(e), outcome: rejected ? 'rejected' : 'unknown',
        pendingOperation: rejected ? null : operationView(intent), ...(isCalendarPrivacyError(e.code) ? hide() : {}) });
    } finally { if (mutationPending === task) { mutationPending = null; set({ busy: false }); } }
  };
  const reconcile = async (continueRequested = false) => {
    if (disposed || ended || mutationPending) return;
    if (!retry || !state.value) return load();
    const intent = retry, owner = generation, task = { abort: new AbortController() }, started = now(), wasUncertain = unresolved();
    mutationPending = task;
    set({ busy: true, checking: true, success: null, canContinue: false });
    let continueIntent = false;
    try {
      const value = await request('read', { month: state.month || intent.payload.month, action_id: intent.payload.action_id, revision: intent.payload.revision }, { timeoutMs: PRODUCT_READ_MS, signal: task.abort.signal });
      if (owner !== generation || disposed || retry !== intent) return;
      if (value.state === 'CONSENT_REQUIRED' && !value.recovery && intent.payload.health_consent !== true) {
        set({ ...hide(), value, error: null }); return;
      }
      if (checked(value)) return;
      if (value.pendingReview && value.recovery?.action_id !== intent.payload.action_id) throw { code: 'CALENDAR_ACTION_CONFLICT' };
      if (value.checkedAction?.action_id !== intent.payload.action_id || !['PENDING','ABSENT'].includes(value.checkedAction?.status)) throw { code: 'CALENDAR_READBACK_CONFLICT' };
      const dateAllowed = (intent.operation || intent.action) === 'delete' || (intent.date || intent.payload.date) <= value.today;
      continueIntent = continueRequested && wasUncertain && dateAllowed;
      set({ ...displayed(value), canContinue: dateAllowed, outcome: 'unknown', pendingOperation: operationView(intent, value.checkedAction.status), error: 'CALENDAR_PENDING_REVIEW' });
    } catch (e) {
      if (owner !== generation || disposed || retry !== intent) return;
      set({ error: e.code || 'CALENDAR_READ_FAILED', readDiagnostic: productFailureEvidence(e), ...(!wasUncertain && isRejection(e.code) ? { outcome: 'rejected' } : {}),
        ...(isCalendarPrivacyError(e.code) ? hide() : {}) });
    } finally { if (mutationPending === task) { mutationPending = null; set({ busy: false, checking: false }); } }
    if (continueIntent && owner === generation && !disposed && retry === intent) {
      const remaining = PRODUCT_READ_MS - (now() - started);
      if (remaining <= 0) { set({ error: 'TIMEOUT', outcome: 'unknown' }); return; }
      await submit(intent.action, true, remaining);
    }
  };
  const select = date => {
    if (!state.value || !isCalendarDate(date)) return;
    inspection++;
    if (unresolved() || state.busy) {
      set({ selected: date, moving: false, editing: null, confirmDelete: false }); return;
    }
    const start = state.value.starts.find(row => row.date === date);
    retry = null;
    set({ selected: date, editing: state.moving ? state.editing : start || null, canContinue: false, confirmDelete: false, error: null, success: null, outcome: null });
  };
  return {
    getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    load, submit, select, chooseDay: select,
    refresh: (options = {}) => load(state.month, options),
    connectionLost() { offline = true; readGeneration++; readPending?.abort.abort(); readPending = null; set({ loading: false, readDiagnostic: null, ...(state.value ? { refreshError: 'NETWORK' } : { error: 'NETWORK', refreshError: null }) }); },
    connectionRestored() { if (offline) { offline = false; startedAt = -Infinity; } },
    endSession() { ended = true; this.invalidate(); },
    beginMove() {
      const start = state.value?.starts.find(row => row.date === state.selected);
      if (!state.busy && !state.loading && !unresolved() && state.value?.writable && start) { retry = null; set({ moving: true, editing: start, canContinue: false, error: null, success: null, outcome: null }); }
    },
    cancelMove() { if (!state.busy && !unresolved()) { const date=state.value?.starts.find(row=>row.id===state.editing?.id)?.date || ''; retry = null; set({ editing: null, selected: date, consent: false, moving: false, canContinue: false, confirmDelete: false, error: null, outcome: null, success: null }); } },
    consent(value) { if (!state.busy && !unresolved()) { retry = null; set({ consent: value }); } },
    deletePrompt(open) {
      if (!open) { set({ confirmDelete: false }); return; }
      const start=state.value?.starts.find(row=>row.date===state.selected);
      if (!state.busy && !state.loading && !unresolved() && state.value?.writable && start) set({ confirmDelete: true, editing: start, moving: false });
    },
    retry: () => reconcile(false), continueIntent: () => reconcile(true),
    invalidate() { generation++; readGeneration++; startedAt = retryAt = -Infinity; readPending?.abort.abort(); readPending = null; mutationPending?.abort?.abort(); mutationPending = null; set({ ...hide(), busy: false, checking: false, loading: false, error: null, refreshError: null, readDiagnostic: null, success: null }); },
    dispose() { disposed = true; generation++; readGeneration++; mutationPending?.abort?.abort(); readPending?.abort.abort(); readPending = null; listeners.clear(); retry = null; },
  };
}
