import { testEventTurn } from './testClock';
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createCalendarController } from '@/features/calendar/calendarController';
import { useDailyMessage } from '@/features/daily/useDailyMessage';
import { routeMotion } from '@/features/mobile/RouteMotion';
import { waitForFixture } from './domWait';
import { check } from './dataModelTests';
const deferred = () => { let resolve = (_value) => {}, reject = (_error) => {}; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const view = () => ({ state: 'READY', month: '2026-10', today: '2026-10-20', revision: 'a'.repeat(64), writable: true, starts: [{ id: 'original', date: '2026-10-01' }], recordedDays: ['2026-10-01'], predictedDays: [] });
const fail = code => Object.assign(new Error(code), { code });

/** @type {import('./testTypes').FoundationTest[]} */
export const MOBILE_INTERACTION_TESTS = [
  ['MI01', 'Calendar read refresh coalesces and retains dirty draft / confirmed data on error', async () => {
    let calls = 0, pending;
    const request = async action => { check(action === 'read', 'refresh wrote'); calls++; return pending ? pending.promise : view(); };
    const c = createCalendarController(request);
    try {
      await c.load(); c.select('2026-10-01'); c.select('2026-10-02');
      pending = deferred(); const a = c.refresh(), b = c.refresh();
      check(a === b && calls === 2 && c.getSnapshot().value.starts[0].date === '2026-10-01', 'coalesce/content');
      pending.reject(fail('NETWORK')); await a;
      check(c.getSnapshot().selected === '2026-10-02' && c.getSnapshot().editing.id === 'original' && c.getSnapshot().refreshError === 'NETWORK', 'draft/error');
      pending = null; await c.refresh();
      check(c.getSnapshot().selected === '2026-10-02' && !c.getSnapshot().refreshError, 'retry');
    } finally { c.dispose(); }
  }],
  ['MI02', 'Calendar pending/rejected/unknown preserve confirmed view and replay one intent', async () => {
    let response = 'reject', mutations = [], pending;
    const c = createCalendarController(async (action, payload) => {
      if (action === 'read') return { ...view(), ...(payload.action_id ? { checkedAction: { action_id: payload.action_id, status: 'ABSENT' } } : {}) };
      mutations.push(payload);
      if (response === 'reject') throw fail('PERIOD_CONFLICT');
      if (response === 'unknown') throw fail('TIMEOUT');
      return pending.promise;
    });
    try {
      await c.load(); c.select('2026-10-01'); c.select('2026-10-02');
      await c.submit('edit'); check(c.getSnapshot().outcome === 'rejected' && c.getSnapshot().selected === '2026-10-02' && c.getSnapshot().value.starts[0].date === '2026-10-01', 'rejection draft');
      c.select('2026-10-03'); response = 'unknown'; await c.submit('edit');
      const intent = mutations[1]; await c.refresh(); c.select('2026-10-04'); await c.submit('edit');
      check(mutations.length === 2 && c.getSnapshot().selected === '2026-10-03' && c.getSnapshot().outcome === 'unknown', 'unknown overwritten');
      response = 'confirmed'; pending = deferred(); const replay = c.retry();
      check(c.getSnapshot().busy && c.getSnapshot().checking && c.getSnapshot().outcome === 'unknown', 'missing read-only check');
      await testEventTurn();
      check(c.getSnapshot().busy && c.getSnapshot().outcome === 'pending' && !c.getSnapshot().success && c.getSnapshot().value.starts[0].date === '2026-10-01', 'optimistic save');
      check(JSON.stringify(mutations[2]) === JSON.stringify(intent), 'new intent on retry');
      pending.resolve({ ...view(), starts: [{id:'original',date:'2026-10-03'}], mutationConfirmed:true }); await replay;
      check(c.getSnapshot().success === 'saved' && c.getSnapshot().outcome === 'confirmed', 'verified success');
    } finally { c.dispose(); }
  }],
  ['MI03', 'Calendar privacy, disposal and late refresh cannot revive a previous view', async () => {
    let pending = null;
    const c = createCalendarController(() => pending ? pending.promise : Promise.resolve(view()));
    await c.load(); c.select('2026-10-01'); pending = deferred(); const reading = c.refresh();
    c.invalidate(); pending.resolve(view()); await reading; check(!c.getSnapshot().value && !c.getSnapshot().selected, 'privacy late read');
    pending = null; await c.load(); pending = deferred(); const last = c.refresh(); c.dispose(); const before = c.getSnapshot(); pending.resolve(view()); await last; check(c.getSnapshot() === before, 'disposed result');
  }],
  ['MI04', 'Home refresh keeps daily snapshots, coalesces, retains offline view and drops late session result', async (context = {}) => {
    const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host);
    const initial = { state:'ACTIVE_EXISTING_USER', persisted:true, daily:{id:'saved-day', message_en_snapshot:'saved', suggestion_en_snapshot:'saved advice'} };
    /** @type {ReturnType<typeof useDailyMessage>} */
    let state; let calls = 0, pending = deferred();
    const request = () => { calls++; return pending.promise; };
    function Probe() { state = useDailyMessage(request, initial); return h('div', {'data-daily-probe':state.value?.daily.id || '', 'data-busy':state.loading, 'data-error':state.error || ''}); }
    let cleaned = false; const cleanup = () => { if(cleaned)return;cleaned=true;flushSync(()=>root.unmount());host.remove(); };
    context.cleanup?.(cleanup);
    try {
      flushSync(()=>root.render(h(Probe)));
      const a = state.reload(); await state.reload(); check(calls === 1, 'duplicate refresh');
      pending.reject(fail('NETWORK')); await a;
      await waitForFixture(()=>host.querySelector('[data-error="NETWORK"]'),host,context);
      check(state.value === initial, 'offline lost snapshots');
      pending = deferred(); const b = state.reload(); pending.resolve(initial); await b;
      await waitForFixture(()=>host.querySelector('[data-busy="false"][data-error=""]'),host,context);
      check(state.value.daily.id === 'saved-day' && state.value.daily.message_en_snapshot === 'saved', 'replaced daily');
      pending = deferred(); const late = state.reload(); window.dispatchEvent(new Event('shinka-session-ended')); pending.resolve(initial); await late;
      await waitForFixture(()=>host.querySelector('[data-daily-probe=""]'),host,context);
    } finally { cleanup(); }
  }],
  ['MI05', 'Route transitions distinguish tabs/hierarchy/back and respect reduced motion', () => {
    check(!routeMotion('/', '/calendar', 'PUSH', false).x, 'tabs slide');
    check(routeMotion('/you', '/account-privacy', 'PUSH', false).x[0] === 12, 'forward');
    check(routeMotion('/account-privacy', '/you', 'POP', false).x[0] === -12, 'back');
    check(!routeMotion('/', '/you', 'PUSH', true).x && routeMotion('/', '/you', 'PUSH', true).opacity[0] === 1, 'reduced');
  }],
];
