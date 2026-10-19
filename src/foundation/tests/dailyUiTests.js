import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import FirstShinka from '@/features/daily/FirstShinka';
import Home from '@/pages/Home';
import { dailyFixture } from './dailyFixture';
import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';
import { check } from './dataModelTests';
import { useDailyMessage } from '@/features/daily/useDailyMessage';
const pause = () => new Promise(resolve => setTimeout(resolve, 30));
async function eventually(predicate) { for (let i = 0; i < 60; i++) { if (predicate()) return; await pause(); } throw new Error('DAILY_UI_TIMEOUT'); }
async function renderProbe(run) {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;width:360px'; document.body.appendChild(host);
  const root = createRoot(host); try { await run(root, host); } finally { root.unmount(); host.remove(); }
}
/** @type {import('./testTypes').FoundationTest[]} */
export const DAILY_UI_TESTS = [
 ['DU01', 'ON-06 failed write, retry readback, Home and locale retain same pair', async () => renderProbe(async (root, host) => {
  const f = dailyFixture(); let fail = true, requests = 0, advances = 0;
  const request = async () => { requests++; if (fail) throw Object.assign(new Error(), { code: 'DAILY_ATOMIC_CAPABILITY_REQUIRED' }); return dailyMessageOperation(f.client, { action: 'today', timezone: 'Europe/Istanbul' }, f.dependencies); };
  root.render(createElement(FirstShinka, { language: 'en', request, onReady: result => { advances++; root.render(createElement(Home, { language: 'en', initialDaily: result, request })); } }));
  await eventually(() => host.querySelector('[data-daily-state="notReady"]'));
  check(advances === 0 && f.rows.user_daily_message.length === 0);
  fail = false; host.querySelector('button').click();
  await eventually(() => host.querySelector('[data-daily-id]'));
  check(advances === 1 && f.rows.user_daily_message.length === 1 && requests === 2);
  const before = host.querySelector('[data-daily-id]').getAttribute('data-daily-id');
  [...host.querySelectorAll('button')].find(button => button.textContent === 'TR').click(); await pause();
  check(host.querySelector('[data-daily-message]').textContent === f.rows.user_daily_message[0].message_tr_snapshot);
  check(host.querySelector('[data-daily-id]').getAttribute('data-daily-id') === before && requests === 2);
 })],
 ['DU02', 'Completed Home error stays Home; late unmounted preparation cannot navigate', async () => renderProbe(async (root, host) => {
  const failure = async () => { throw Object.assign(new Error(), { code: 'NETWORK' }); };
  root.render(createElement(Home, { language: 'tr', request: failure }));
  await eventually(() => host.querySelector('[data-daily-state="failure"]'));
  check(host.querySelector('[data-home-root]') && !host.querySelector('[data-onboarding-state]'));
  const onlineDescriptor = Object.getOwnPropertyDescriptor(navigator, 'onLine');
  try {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    root.render(createElement(Home, { key: 'offline', language: 'tr', request: failure }));
    await eventually(() => host.querySelector('[data-daily-state="offline"]'));
  } finally {
    if (onlineDescriptor) Object.defineProperty(navigator, 'onLine', onlineDescriptor);
    else Reflect.deleteProperty(navigator, 'onLine');
  }
  /** @type {(value:any)=>void} */
  let release = () => { throw new Error("NOT_WAITING"); };
  let waiting = false, advanced = false;
  const delayed = () => new Promise(resolve => { release = resolve; waiting = true; });
  root.render(createElement(FirstShinka, { language: 'tr', request: delayed, onReady: () => { advanced = true; } }));
  await eventually(() => waiting); root.render(createElement('div', null, 'left')); await pause();
  release({ persisted: true, state: 'ACTIVE_EXISTING_USER', daily: { id: 'late' } }); await pause(); check(!advanced);
 })],
 ['DU03', 'A day or timezone change during preparation discards the stale response', async () => renderProbe(async (root, host) => {
  let context = 'day-a/zone-a', calls = 0;
  const readContext = () => context;
  const request = async () => {
    calls++; const id = calls === 1 ? 'old-day' : 'current-day';
    if (calls === 1) context = 'day-b/zone-b';
    return { persisted: true, state: 'ACTIVE_EXISTING_USER', daily: { id } };
  };
  function Probe() { const state = useDailyMessage(request, null, readContext); return createElement('div', { 'data-current': state.value?.daily.id || '' }); }
  root.render(createElement(Probe));
  await eventually(() => host.querySelector('[data-current="current-day"]'));
  check(calls === 2 && !host.querySelector('[data-current="old-day"]'));
 })],
];
