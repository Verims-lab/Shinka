import { privacySecret, signalPrivacyChange } from '@/services/privacyService';

export function createPrivacyController(request, recovery, { onRemoved = async () => {}, signal = signalPrivacyChange } = {}) {
  let state = { value: null, busy: false, error: null, selected: null, action: null, pending: recovery.read() }, generation = 0, active = true;
  let flight = null, aborter = null;
  const listeners = new Set();
  const set = patch => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
  function call(action, payload = {}) {
    if (!active) return Promise.resolve();
    if (flight) return flight;
    const ticket = ++generation, controller = new AbortController();
    aborter = controller;
    set({ busy: true, error: null, action });
    const current = () => active && ticket === generation;
    flight = Promise.resolve().then(async () => {
      try {
        const result = await request(action, payload, { signal: controller.signal, timeoutMs: 20000 });
        if (!current()) return;
        set({ value: result, selected: null });
        if (['begin', 'resume'].includes(action) || result.consentWithdrawn || result.activeDataRemoved) signal();
        if (result.state === 'PLATFORM_PENDING') {
          // Auth cleanup is independent of the completed status read. A pending
          // provider logout must not leave Checking status indefinitely.
          void Promise.resolve().then(() => { if (current()) return onRemoved(); }).catch(() => {});
        } else if (result.state === 'HEALTH_CLEANUP_COMPLETED') { recovery.clear(); set({ pending: null }); }
      } catch (error) {
        if (current() && error.code !== 'PRIVACY_CANCELLED') set({ value: null, error: error.code || 'PRIVACY_OUTCOME_UNCONFIRMED', selected: null });
        if (current() && ['begin', 'resume'].includes(action)) signal();
      } finally {
        if (current()) { flight = null; aborter = null; set({ busy: false, action: null }); }
      }
    });
    return flight;
  }
  return {
    getSnapshot: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    load: () => state.pending ? call('status', state.pending) : call('read'),
    select: kind => { if (!state.busy && !state.pending && state.value?.state !== 'IN_PROGRESS') set({ selected: kind, error: null }); },
    // Dismissal never cancels a dispatched request or discards durable recovery.
    cancel: () => set({ selected: null }),
    confirm: () => {
      if (state.busy) return flight;
      if (!state.selected) return;
      const pending = { kind: state.selected, recovery_key: privacySecret() };
      // Recovery must be durable before dispatch. Storage failure sends nothing.
      try { recovery.save(pending); } catch { set({ error: 'PRIVACY_RECOVERY_STORAGE_REQUIRED' }); return; }
      set({ pending }); signal();
      return call('begin', { ...pending, confirmed: true });
    },
    check: () => state.pending || state.value?.kind ? call('status', state.pending || { kind: state.value.kind }) : call('read'),
    resume: () => state.pending && state.value?.state === 'IDLE'
      ? call('begin', { ...state.pending, confirmed: true })
      : call('resume', state.pending || { kind: state.value?.kind }),
    invalidate: () => { generation++; aborter?.abort(); aborter = null; flight = null; set({ value: null, pending: null, selected: null, busy: false, action: null, error: null }); },
    dispose: () => { active = false; generation++; aborter?.abort(); aborter = null; flight = null; listeners.clear(); },
  };
}
