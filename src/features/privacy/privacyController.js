import { privacySecret, signalPrivacyChange } from '@/services/privacyService';

export function createPrivacyController(request, recovery, { onRemoved = async () => {}, signal = signalPrivacyChange } = {}) {
  let state = { value: null, busy: false, error: null, selected: null, pending: recovery.read() }, generation = 0, active = true;
  const listeners = new Set();
  const set = patch => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
  async function call(action, payload = {}) {
    if (state.busy || !active) return;
    const ticket = ++generation;
    set({ busy: true, error: null });
    try {
      const result = await request(action, payload);
      if (!active || ticket !== generation) return;
      set({ value: result, selected: null });
      if (['begin', 'resume'].includes(action) || result.consentWithdrawn || result.activeDataRemoved) signal();
      if (result.state === 'PLATFORM_PENDING') {
        // The verified minimal result remains visible when auth is cleared.
        await onRemoved();
      } else if (result.state === 'HEALTH_CLEANUP_COMPLETED') { recovery.clear(); set({ pending: null }); }
    } catch (error) {
      if (active && ticket === generation) set({ error: error.code || 'PRIVACY_OUTCOME_UNCONFIRMED', selected: null });
      if (['begin', 'resume'].includes(action)) signal();
    } finally { if (active && ticket === generation) set({ busy: false }); }
  }
  return {
    getSnapshot: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    load: () => state.pending ? call('status', state.pending) : call('read'),
    select: kind => { if (!state.busy && !state.pending && state.value?.state !== 'IN_PROGRESS') set({ selected: kind, error: null }); },
    // Dismissal never cancels a dispatched request or discards durable recovery.
    cancel: () => set({ selected: null }),
    confirm: () => {
      if (!state.selected || state.busy) return;
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
    invalidate: () => { generation++; set({ value: null, selected: null, busy: false, error: null }); },
    dispose: () => { active = false; generation++; listeners.clear(); },
  };
}
