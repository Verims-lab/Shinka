// Synthetic identities and an injected SDK only. No live OAuth or product writes.
import { waitForFixture } from './domWait';
import { testEventTurn } from './testClock';
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminGate from '@/components/internal/AdminGate';
import ProfileAccess from '@/components/profile/ProfileAccess';
import AdminPanel from '@/pages/internal/AdminPanel';
import InternalNav from '@/components/internal/InternalNav';
import { INTERNAL_ROUTES, INTERNAL_TOOLS, internalLanguage } from '../internalNavigation';
import { t } from '../i18n/strings';

const assert = (ok, reason) => { if (!ok) throw new Error(reason); };
const deferred = () => { let resolve = (_value) => {}; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const admin = { id: 'isolated-admin', role: 'admin' };
const user = { id: 'isolated-user', role: 'user' };
async function fixture(identity, path, run, language = 'en', context = {}) {
  const f = { identity, me: () => Promise.resolve(f.identity), auth: null, logout: () => Promise.resolve() };
  const client = { app: { getPublicSettings: async () => ({}) }, auth: { me: async () => admin, logout: () => f.logout() }, functions: { invoke: async name => { assert(name === 'applicationSession', 'native session endpoint'); return { data: { ...await f.me(), authority: 'BASE44_NATIVE_V1' } }; } } };
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '-10000px', width: '360px' });
  context.stage?.('DOM_MOUNT');
  host.dataset.adminTestFixture='';
  document.body.appendChild(host);
  function Controls() { f.auth = useAuth(); return h(ProfileAccess, { language }); }
  const tool = h('div', { 'data-isolated-tool': true }, h(InternalNav));
  const root = createRoot(host);
  let disposed=false;
  const dispose=()=>{if(disposed)return;disposed=true;root.unmount();host.remove();};
  context.cleanup?.(dispose);
  const wait=check=>waitForFixture(check,host,context);
  root.render(h(AuthProvider, { client }, h(MemoryRouter, { initialEntries: [{ pathname: path, state: { language, role: 'admin' } }] },
    h(Controls), h(Routes, null,
      h(Route, { path: '/login', element: h('p', { 'data-isolated-login': true }, 'Synthetic login') }),
      h(Route, { path: '/', element: h('p', { 'data-isolated-app': true }, 'Existing app resolver destination') }),
      h(Route, { element: h(ProtectedRoute, { unauthenticatedElement: h(Navigate, { to: '/login', replace: true }) }) },
        h(Route, { element: h(AdminGate) },
          h(Route, { path: '/internal', element: h(AdminPanel) }),
          ...INTERNAL_TOOLS.map(({ path }) => h(Route, { key: path, path, element: tool }))))))));
  const q = selector => host.querySelector(selector);
  try { await wait(() => f.auth); await run(f, q, host, wait); }
  finally { dispose(); }
}

/** @type {import('./testTypes').FoundationTest[]} */
export const ADMIN_NAV_TESTS = [
  ['AN01', 'Internal inventory has exactly the panel and three tools; language is display-only', () => {
    assert(INTERNAL_ROUTES.join() === '/internal,/internal/test-tools,/internal/health,/internal/build', 'route inventory');
    assert(internalLanguage({ language: 'tr', role: 'admin' }) === 'tr', 'TR routing');
    assert(['en', 'tr'].includes(internalLanguage({ language: 'javascript:alert(1)' })), 'unsafe locale');
    assert(t('admin.healthDescription', 'tr') === 'Sağlık kontrolleri, testler ve sonuçlar.' && t('admin.buildDescription', 'tr') === 'Güncel sürüm, ortam bilgileri ve paket geçmişi.', 'approved copy');
  }],
  ['AN02', 'Pending identity never exposes admin entry or protected content', async (context = {}) => {
    const delayed = deferred();
    await fixture(delayed.promise, '/internal', async (f, q, _host, wait) => {
      await testEventTurn(context.signal);
      assert(!q('[data-admin-panel]') && q('[data-profile-trigger]').disabled, 'pending privilege flash');
      f.identity = admin; delayed.resolve(admin);
      await wait(() => q('[data-admin-panel]'));
      assert(!q('[data-profile-trigger]').disabled, 'verified admin missing');
    }, 'en', context);
  }],
  ['AN03', 'Ordinary user denied on all internal routes despite forged route state', async (context = {}) => {
    for (const path of INTERNAL_ROUTES) await fixture(user, path, async (_f, q, _host, wait) => {
      await wait(() => q('[data-error-code="FORBIDDEN"]'));
      assert(q('[data-profile-trigger]').disabled && !q('[data-admin-panel]') && !q('[data-isolated-tool]'), 'user access');
    }, 'en', context);
  }],
  ['AN04', 'Anonymous direct routes follow existing login redirect', async (context = {}) => {
    for (const path of INTERNAL_ROUTES) await fixture(null, path, async (_f, q, _host, wait) => {
      await wait(() => q('[data-isolated-login]'));
      assert(q('[data-profile-trigger]').disabled && !q('[data-admin-panel]'), 'anonymous privilege');
    }, 'en', context);
  }],
  ['AN05', 'Refresh hides admin UI immediately and verified role loss removes it', async (context = {}) => {
    await fixture(admin, '/internal', async (f, q, _host, wait) => {
      await wait(() => q('[data-admin-panel]'));
      const delayed = deferred(); f.me = () => delayed.promise;
      const refresh = f.auth.checkUserAuth();
      await wait(() => (!q('[data-admin-panel]') || q('[data-admin-panel]').closest('[hidden]')) && q('[data-profile-trigger]').disabled);
      assert((!q('[data-admin-panel]') || q('[data-admin-panel]').closest('[hidden]')) && q('[data-profile-trigger]').disabled, 'refresh retains privilege');
      delayed.resolve(user); await refresh;
      await wait(() => q('[data-error-code="FORBIDDEN"]'));
      assert(q('[data-profile-trigger]').disabled, 'revoked menu');
    }, 'en', context);
  }],
  ['AN06', 'Logout closes access even if transport fails and an older admin response arrives', async (context = {}) => {
    await fixture(admin, '/internal', async (f, q, _host, wait) => {
      await wait(() => q('[data-admin-panel]'));
      const delayed = deferred(); f.me = () => delayed.promise;
      const refresh = f.auth.checkUserAuth();
      f.logout = async () => { throw new Error('synthetic transport failure'); };
      await f.auth.logout(false); await wait(() => q('[data-isolated-login]'));
      delayed.resolve(admin); await refresh; await testEventTurn(context.signal);
      assert(!f.auth.isAdmin && !f.auth.isAuthenticated && q('[data-profile-trigger]').disabled, 'late response restored session');
    }, 'en', context);
  }],
  ['AN07', 'An obsolete admin response cannot overwrite a newer denied role', async (context = {}) => {
    await fixture(admin, '/internal', async (f, q, _host, wait) => {
      await wait(() => q('[data-admin-panel]'));
      const delayed = deferred(); f.me = () => delayed.promise;
      const old = f.auth.checkUserAuth();
      f.me = async () => user; await f.auth.checkUserAuth();
      await wait(() => q('[data-error-code="FORBIDDEN"]'));
      delayed.resolve(admin); await old; await testEventTurn(context.signal);
      assert(!f.auth.isAdmin && !q('[data-admin-panel]'), 'stale role restored');
    }, 'en', context);
  }],
  ['AN08', 'Admin panel TR/EN cards navigate to all three tools, return to panel and existing app entry', async (context = {}) => {
    for (const language of ['tr', 'en']) await fixture(admin, '/internal', async (_f, q, host, wait) => {
      await wait(() => q('[data-admin-panel]'));
      assert(q('[data-admin-panel]').querySelectorAll('a').length === 3, 'extra tools');
      for (const tool of INTERNAL_TOOLS) {
        assert(host.textContent.includes(t(tool.descriptionKey, language)), `localized description ${language} ${tool.path}: ${host.textContent}`);
        q(`[data-admin-panel] a[href="${tool.path}"]`).click(); context.stage?.('DOM_NAVIGATION');
        await wait(() => q('[data-isolated-tool]'));
        q('nav a[href="/internal"]').click(); context.stage?.('DOM_NAVIGATION'); await wait(() => q('[data-admin-panel]'));
      }
      q('nav a[href="/"]').click(); await wait(() => q('[data-isolated-app]'));
    }, language, context);
  }],
];
