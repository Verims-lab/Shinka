import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import PrivacyActions from '@/features/privacy/PrivacyActions';
import { privacyFixture, memoryRecovery } from './privacyFixture';
import { privacyCopy } from '@/foundation/i18n/privacyCopy';
import { check } from './dataModelTests';
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(fn) { for (let i = 0; i < 100; i++) { if (fn()) return; await pause(); } throw new Error('PRIVACY_UI_TIMEOUT'); }
const button = (host, text) => [...host.querySelectorAll('button')].find(el => el.textContent === text);
async function probe(run) {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;width:320px'; document.body.appendChild(host);
  const root = createRoot(host); try { await run(root, host); } finally { root.unmount(); host.remove(); }
}
/** @type {import('./testTypes').FoundationTest[]} */
export const PRIVACY_UI_TESTS = [
  ['PV01', 'Real confirmation cancel/Escape restores focus and causes zero mutation', async () => probe(async (root, host) => {
    const f = privacyFixture(), recovery = memoryRecovery(); root.render(createElement(PrivacyActions, { request: f.request, recovery }));
    await until(() => button(host, 'Delete my account') && !button(host, 'Delete my account').disabled);
    const trigger = button(host, 'Delete my account'); trigger.focus(); trigger.click(); await until(() => host.querySelector('dialog[open]'));
    check(document.activeElement === button(host, 'Cancel'));
    host.querySelector('dialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await until(() => !host.querySelector('dialog'));
    check(document.activeElement === trigger && f.state.calls.every(c => c.method === 'filter') && !recovery.read());
  })],
  ['PV02', 'Actual withdrawal confirms active cleanup separately and keeps account; pending scope does not lie', async () => probe(async (root, host) => {
    const f = privacyFixture(), recovery = memoryRecovery(); root.render(createElement(PrivacyActions, { request: f.request, recovery, language: 'tr' }));
    await until(() => button(host, privacyCopy('withdraw', 'tr')) && !button(host, privacyCopy('withdraw', 'tr')).disabled);
    button(host, privacyCopy('withdraw', 'tr')).click(); await until(() => host.querySelector('dialog'));
    button(host, privacyCopy('confirmWithdraw', 'tr')).click(); await until(() => host.textContent.includes(privacyCopy('cleaned', 'tr')));
    check(f.tables.User.some(row => row.id === 'ownerA') && f.tables.UserCalendarAction.length === 0);
  })],
  ['PV03', 'Lost removal reply offers read-only check and truthful platform-pending result, not permanent success', async () => probe(async (root, host) => {
    const f = privacyFixture(), recovery = memoryRecovery(); let removed = 0;
    f.once('after', c => c.name === 'User' && c.method === 'delete');
    root.render(createElement(PrivacyActions, { request: f.request, recovery, onRemoved: async () => { removed++; } }));
    await until(() => button(host, 'Delete my account') && !button(host, 'Delete my account').disabled);
    button(host, 'Delete my account').click(); await until(() => host.querySelector('dialog')); button(host, 'Delete Account').click();
    await until(() => host.querySelector('[role=alert]')); check(removed === 0 && !host.querySelector('[data-privacy-platform-pending]'));
    button(host, 'Check status').click(); await until(() => host.querySelector('[data-privacy-platform-pending]'));
    check(removed === 1 && host.textContent.includes('remain pending'));
  })],
  ['PV04', 'TR/EN 200% modal has labelled scope, keyboard containment and minimum controls', async () => probe(async (root, host) => {
    for (const language of ['tr', 'en']) {
      const f = privacyFixture(); root.render(createElement(PrivacyActions, { key: language, request: f.request, recovery: memoryRecovery(), language }));
      await until(() => button(host, privacyCopy('delete', language)) && !button(host, privacyCopy('delete', language)).disabled);
      button(host, privacyCopy('delete', language)).click(); await until(() => host.querySelector('dialog'));
      const dialog = host.querySelector('dialog'); dialog.style.fontSize = '200%';
      check(dialog.textContent.includes(privacyCopy('deleteBody', language)) && !dialog.textContent.includes('Base44'));
      check(!!document.getElementById(dialog.getAttribute('aria-describedby')) && dialog.querySelector('h2').textContent === privacyCopy('deleteTitle', language));
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      check(dialog.contains(document.activeElement));
      check([...dialog.querySelectorAll('button')].every(el => el.getBoundingClientRect().height >= 44));
      button(host, privacyCopy('cancel', language)).click(); await until(() => !host.querySelector('dialog'));
    }
  })],
  ['PV05', 'TR/EN status read distinguishes expired authority, timeout and transient failures, then recovers without mutation', async () => probe(async (root, host) => {
    for (const language of ['tr', 'en']) for (const [error, key] of [['PRIVACY_RECOVERY_INVALID', 'signInRequired'], ['AUTH_REQUIRED', 'signInRequired'], ['PRIVACY_STATUS_TIMEOUT', 'timeout'], ['PRIVACY_STATUS_UNAVAILABLE', 'unavailable']]) {
      const recovery = memoryRecovery(); recovery.save({ kind: 'DELETE_ACCOUNT', recovery_key: 'a'.repeat(64) }); let reads = 0;
      const request = async (action, body) => {
        check(action === 'status' && body.recovery_key === recovery.read().recovery_key); reads++;
        if (reads === 1) throw { code: error };
        return { kind: 'DELETE_ACCOUNT', state: 'IN_PROGRESS', permanentDeletionVerified: false };
      };
      root.render(createElement(PrivacyActions, { key: language + error, language, request, recovery, authenticated: false }));
      await until(() => host.querySelector('[role=alert]')?.textContent === privacyCopy(key, language));
      check(!button(host, privacyCopy('resume', language)) && !button(host, privacyCopy('delete', language)));
      if (key === 'signInRequired') check(host.querySelector('a').getAttribute('href') === `/login?returnTo=${encodeURIComponent(`/account-privacy?lang=${language}`)}`);
      button(host, privacyCopy('check', language)).click(); button(host, privacyCopy('check', language)).click();
      await until(() => host.textContent.includes(privacyCopy('inProgress', language)));
      check(!!host.querySelector('a'), 'confirmed partial anonymous request retains provider sign-in path');
      check(reads === 2 && !host.querySelector('[role=alert]') && !host.textContent.includes(privacyCopy('platform', language)));
    }
  })],
  ['PV06', 'Checking state is labelled, coalesced and cleared; account replacement and unmount discard old response', async () => probe(async (root, host) => {
    const recovery = memoryRecovery(); recovery.save({ kind: 'DELETE_ACCOUNT', recovery_key: 'a'.repeat(64) }); let release = () => {}, reads = 0, removed = 0;
    const request = () => { reads++; return new Promise(resolve => { release = () => resolve({ state: 'PLATFORM_PENDING', kind: 'DELETE_ACCOUNT', activeDataRemoved: true, permanentDeletionVerified: false }); }); };
    root.render(createElement(PrivacyActions, { request, recovery, authenticated: false, onRemoved: async () => { removed++; } }));
    await until(() => host.textContent.includes('Checking status'));
    check(button(host, 'Check status').disabled && !host.textContent.includes('Processing your request') && reads === 1);
    window.dispatchEvent(new Event('shinka-session-ended'));
    const otherRequest = async () => ({ state: 'IDLE', permanentDeletionVerified: false, canWithdraw: false, accountProtected: true });
    root.render(createElement(PrivacyActions, { request: otherRequest, recovery: memoryRecovery(), authenticated: true }));
    await until(() => host.textContent.includes('last-admin protection')); release(); await pause();
    check(!host.querySelector('[data-privacy-platform-pending]') && removed === 0 && !host.textContent.includes('Checking status'));
  })],

];
