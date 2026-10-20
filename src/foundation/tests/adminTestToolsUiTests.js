import { nativeFixture } from './nativeFixture';
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TestTools from '@/pages/internal/TestTools';
import { TEST_TOOLS_COPY } from '../i18n/testToolsCopy';
import { adminTestFixture } from './adminTestFixture';
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const pause = () => new Promise(resolve => setTimeout(resolve, 25));
async function until(predicate) { for (let i = 0; i < 160; i++) { if (predicate()) return; await pause(); } throw new Error('TEST_TOOLS_UI_TIMEOUT'); }
function input(node, value) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, value);
  node.dispatchEvent(new Event('input', { bubbles: true }));
}
async function fixture(language, request, run) {
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '-10000px', width: '320px' }); document.body.appendChild(host);
  const root = createRoot(host);
  root.render(h(MemoryRouter, { initialEntries: [{ pathname: '/internal/test-tools', state: { language } }] }, h(TestTools, { request })));
  const q = selector => host.querySelector(selector);
  try { await until(() => q('#test-user-id')); await run(q, host); }
  finally { root.unmount(); host.remove(); }
}
async function lookup(q, id = 'ownerA') {
  input(q('#test-user-id'), id); await pause(); q('#test-lookup-button').click();
  await until(() => q('[data-test-target]'));
}
/** @type {import('./testTypes').FoundationTest[]} */
export const ADMIN_TEST_UI_TESTS = [
  ['AU01', 'Test Tools TR/EN, mobile touch controls and explicit blocked preview', async () => {
    assert(JSON.stringify(Object.keys(TEST_TOOLS_COPY.tr).sort()) === JSON.stringify(Object.keys(TEST_TOOLS_COPY.en).sort()), 'catalog parity');
    for (const language of ['tr', 'en']) {
      const f = adminTestFixture(); f.state.time = new Date().toISOString();
      await fixture(language, (action, body) => f.request({ action, ...body }, { ...f.dependencies, coordinator: null }), async (q, host) => {
        assert([...host.querySelectorAll('[data-destructive]')].every(button => button.disabled), 'buttons before target');
        await lookup(q);
        q('[data-destructive="true"]').click(); await until(() => q('[data-test-preview]'));
        assert(host.textContent.includes(TEST_TOOLS_COPY[language].ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED), 'missing capability explanation');
        assert(!q('#test-confirmation') && q('[data-test-preview] [data-variant="primary"]').disabled, 'unsafe execution enabled');
        assert(host.textContent.includes('fixture-app') && host.textContent.includes(TEST_TOOLS_COPY[language].sharedDatabase), 'environment missing');
        assert(document.activeElement === q('[data-test-preview] h2'), 'preview focus');
        assert(host.scrollWidth <= 321, 'mobile overflow');
        for (const node of host.querySelectorAll('button,input,nav a')) {
          const box = node.getBoundingClientRect();
          assert(box.width >= 44 && box.height >= 44, 'touch target too small');
        }
      });
      assert(!f.state.calls.some(c => c.method !== 'filter'), 'read-only UI mutated');
    }
  }],
  ['AU02', 'Changing User ID invalidates target/preview/confirmation and ignores late lookup', async () => {
    let resolve;
    const slow = new Promise(r => { resolve = r; });
    const f = adminTestFixture(); f.state.time = new Date().toISOString();
    await fixture('tr', () => slow, async q => {
      input(q('#test-user-id'), 'ownerA'); await pause(); q('#test-lookup-button').click(); await pause();
      input(q('#test-user-id'), 'ownerB'); await pause();
      resolve(await f.request({ action: 'lookup', target_id: 'ownerA' })); await pause();
      assert(!q('[data-test-target]') && q('[data-destructive="true"]').disabled, 'late target accepted');
    });
    await fixture('tr', (action, body) => f.request({ action, ...body }), async q => {
      await lookup(q); q('[data-destructive="true"]').click(); await until(() => q('[data-test-preview]'));
      input(q('#test-user-id'), 'ownerB'); await pause();
      assert(!q('[data-test-preview]') && !q('[data-test-target]'), 'old approval retained');
    });
  }],
  ['AU03', 'Single explicit confirmation shows target; cancel restores focus without mutation', async () => {
    const f = adminTestFixture(); f.state.time = new Date().toISOString();
    await fixture('en', (action, body) => f.request({ action, ...body }), async q => {
      await lookup(q); q('[data-destructive="true"]').click(); await until(() => q('[data-test-preview]'));
      assert(!q('[data-test-preview] [data-variant="primary"]').disabled, 'explicit confirmation unavailable');
      q('[data-test-preview] [data-variant="secondary"]').click(); await pause();
      assert(!q('[data-test-preview]') && document.activeElement === q('#test-user-id'), 'cancel focus');
    });
    assert(!f.tables.AdminTestOperation.length && f.state.calls.every(c => c.method === 'filter'), 'cancel mutation');
  }],
  ['AU04', 'Double click submits one reset; resulting operation remains visible for status', async () => {
    const f = adminTestFixture(); f.state.time = new Date().toISOString(); let executions = 0;
    await fixture('en', (action, body) => { if (action === 'execute') executions++; return f.request({ action, ...body }); }, async (q, host) => {
      await lookup(q); q('[data-destructive="false"]').click(); await until(() => q('[data-test-preview]'));
      const button = q('[data-test-preview] [data-variant="primary"]'); button.click(); button.click();
      await until(() => host.textContent.includes(TEST_TOOLS_COPY.en.resetResult));
      assert(executions === 1 && f.tables.AdminTestOperation.length === 1, 'double submit');
      assert(!q('[data-test-preview]'), 'approval reusable');
    });
  }],
  ['AU05','Native delete shows current identity and needs one confirmation in TR/EN',async()=>{
    for(const language of ['tr','en']) {
      const f=nativeFixture();f.state.time=new Date().toISOString();
      Object.assign(f.tables.User.find(row=>row.id==='ownerA'),{full_name:'Synthetic Target',email:'target@example.invalid'});
      let executions=0;
      await fixture(language,(action,body)=>{if(action==='execute')executions++;return f.tools({action,...body});},async(q,host)=>{
        await lookup(q);q('[data-destructive="true"]').click();await until(()=>q('[data-test-preview]'));
        assert(host.textContent.includes('Synthetic Target')&&host.textContent.includes('target@example.invalid')&&!q('#test-confirmation'),'identity or single confirmation');
        const button=q('[data-test-preview] [data-variant="primary"]');assert(!button.disabled,'native delete unavailable');button.click();button.click();
        await until(()=>host.textContent.includes(TEST_TOOLS_COPY[language].deletedResult));
        assert(executions===1&&!f.tables.User.some(row=>row.id==='ownerA')&&f.tables.AdminTestOperation.length===1,'native UI did not verify removal');
      });
    }
  }],
];
