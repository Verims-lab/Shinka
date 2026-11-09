import { privacyRequest } from '@/services/privacyService';
import { createPrivacyController } from '@/features/privacy/privacyController';
import { privacyFixture, privacyIntent, memoryRecovery } from './privacyFixture';
import { check, rejects } from './dataModelTests';
import { withTestClock, testEventTurn } from './testClock';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { privacyRepository } from '../../../base44/shared/privacyRepository.js';
const intent = () => ({ kind: 'DELETE_ACCOUNT', recovery_key: 'a'.repeat(64) });
const sdk = invoke => ({ functions: { invoke } });
const value = state => ({ kind: 'DELETE_ACCOUNT', state, activeDataRemoved: state === 'PLATFORM_PENDING', permanentDeletionVerified: false });
const writes = f => f.state.calls.filter(c => c.method !== 'filter').length;
const deferred = () => {
  /** @type {(value?:any)=>void} */
  let resolve = () => {};
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
/** @type {import('./testTypes').FoundationTest[]} */
export const PRIVACY_STATUS_TESTS = [
  ['PR21', 'Status separates HTTP auth, transient service/network, timeout and malformed success without automatic writes/retries', withTestClock(async clock => {
    for (const [fault, code] of [[{ response: { status: 429 } }, 'PRIVACY_STATUS_UNAVAILABLE'], [{ response: { status: 500 } }, 'PRIVACY_STATUS_UNAVAILABLE'], [{ response: { status: 503 } }, 'PRIVACY_STATUS_UNAVAILABLE'], [{ code: 'ERR_NETWORK' }, 'PRIVACY_STATUS_UNAVAILABLE'], [{ response: { status: 401 } }, 'AUTH_REQUIRED'], [{ response: { status: 403 } }, 'AUTH_REQUIRED']]) {
      let calls = 0;
      await rejects(() => privacyRequest('status', intent(), sdk(async () => { calls++; throw fault; }), 20000, { scheduler: clock.timers, clock: clock.now }), code);
      check(calls === 1 && clock.pending() === 0);
    }
    const held = deferred();
    await rejects(() => clock.run(() => privacyRequest('status', intent(), sdk(() => held.promise), 20000, { scheduler: clock.timers, clock: clock.now })), 'PRIVACY_STATUS_TIMEOUT');
    check(clock.pending() === 0); held.resolve({ data: value('PLATFORM_PENDING') });
    const next = await privacyRequest('status', intent(), sdk(async () => ({ data: value('IN_PROGRESS') })), 20000, { scheduler: clock.timers, clock: clock.now });
    check(next.state === 'IN_PROGRESS' && clock.pending() === 0);
    for (const bad of [{}, { ...value('PLATFORM_PENDING'), activeDataRemoved: false }, { ...value('IN_PROGRESS'), kind: 'WITHDRAW_HEALTH' }, { ...value('PLATFORM_PENDING'), permanentDeletionVerified: true }]) {
      await rejects(() => privacyRequest('status', intent(), sdk(async () => ({ data: bad }))), 'PRIVACY_RESPONSE_INVALID');
    }
  })],
  ['PR22', 'Double confirm creates one account operation; repeated anonymous status coalesces and never resumes or writes', async () => {
    const f = privacyFixture(), recovery = memoryRecovery(), held = deferred(); let begins = 0;
    const c = createPrivacyController(async (action, body, options) => { if (action === 'begin') { begins++; await held.promise; } return f.request(action, body, options); }, recovery, { signal: () => {} });
    await c.load(); c.select('DELETE_ACCOUNT'); const first = c.confirm(), second = c.confirm();
    check(first === second); held.resolve(); await first;
    check(begins === 1 && f.tables.UserPrivacyRequest.length === 1); c.dispose();
    const operation = f.tables.UserPrivacyRequest[0].id, receipt = JSON.stringify(f.tables.PrivacyRecoveryReceipt), count = writes(f), gate = deferred(); let reads = 0;
    const reopened = createPrivacyController(async (action, body) => { check(action === 'status'); reads++; await gate.promise; return f.request(action, body, null); }, recovery, { signal: () => {} });
    const a = reopened.load(), b = reopened.check(); check(a === b); gate.resolve(); await a;
    await reopened.check(); check(reads === 2 && reopened.getSnapshot().value.state === 'PLATFORM_PENDING');
    check(writes(f) === count && f.tables.UserPrivacyRequest[0].id === operation && JSON.stringify(f.tables.PrivacyRecoveryReceipt) === receipt); reopened.dispose();
  }],
  ['PR23', 'Expired recovery is denied anonymously; current owner can only reread its existing request without renewing or replacing the receipt', async () => {
    const f = privacyFixture(), recovery = memoryRecovery(); f.once('before', c => c.method === 'delete');
    await rejects(() => f.request('begin', privacyIntent('DELETE_ACCOUNT'))); recovery.save(intent()); f.state.time = '2026-10-23T12:00:00.000Z';
    const count = writes(f), original = JSON.stringify(f.tables.UserPrivacyRequest), receipt = JSON.stringify(f.tables.PrivacyRecoveryReceipt);
    let reads = 0;
    const anonymous = createPrivacyController((action, body) => { reads++; return f.request(action, body, null); }, recovery, { signal: () => {} });
    await rejects(() => f.request('status', { kind: 'DELETE_ACCOUNT', recovery_key: 'malformed' }, null), 'PRIVACY_RECOVERY_INVALID');
    await anonymous.load(); check(anonymous.getSnapshot().error === 'PRIVACY_RECOVERY_INVALID' && reads === 1); anonymous.dispose();
    await rejects(() => withUserLifecycle(f.raw()).auth.me(), 'ACCOUNT_DELETION_IN_PROGRESS');
    const owner = createPrivacyController(f.request, recovery, { signal: () => {} }); await owner.load();
    check(owner.getSnapshot().value.state === 'IN_PROGRESS' && !owner.getSnapshot().error); owner.dispose();
    check(JSON.stringify(f.tables.UserPrivacyRequest) === original && JSON.stringify(f.tables.PrivacyRecoveryReceipt) === receipt && writes(f) === count);
    await rejects(() => f.request('status', intent(), 'ownerB'), 'PRIVACY_RECOVERY_INVALID');
    const other = await f.request('status', { kind: 'DELETE_ACCOUNT' }, 'ownerB'); check(other.state === 'IDLE');
    check((await f.http({ action: 'status', ...intent(), request_id: f.tables.UserPrivacyRequest[0].id }, 'ownerB')).status === 400);
  }],
  ['PR24', 'A recovery receipt and returned operation must match their queried hash and ID', async () => {
    const f = privacyFixture(); await f.request('begin', privacyIntent('DELETE_ACCOUNT')); const count = writes(f);
    for (const name of ['PrivacyRecoveryReceipt', 'UserPrivacyRequest']) {
      const raw = f.raw(null), entities = raw.asServiceRole.entities;
      const forged = { ...raw, asServiceRole: { entities: new Proxy(entities, { get(target, key) {
        return key === name ? { filter: async () => [{ ...f.tables[name][0], ...(name === 'PrivacyRecoveryReceipt' ? { token_hash: 'b'.repeat(64) } : { id: 'another-operation' }) }] } : target[key];
      } }) } };
      await rejects(() => privacyRepository(forged, f.now).recover(intent().recovery_key), 'PRIVACY_RECOVERY_INVALID');
    }
    check(writes(f) === count);
  }],
  ['PR25', 'Unmount/session invalidation aborts local status wait and timers; late completion cannot publish or sign out another account', withTestClock(async clock => {
    for (const exit of ['invalidate', 'dispose']) {
      const held = deferred(), recovery = memoryRecovery(); recovery.save(intent()); let removed = 0;
      const c = createPrivacyController((action, body, options) => privacyRequest(action, body, sdk(() => held.promise), 20000, { ...options, clock: clock.now, scheduler: clock.timers }), recovery, { signal: () => {}, onRemoved: async () => { removed++; } });
      const pending = c.load(); await testEventTurn(); check(clock.pending() === 1); c[exit](); await pending;
      check(clock.pending() === 0); held.resolve({ data: value('PLATFORM_PENDING') }); await testEventTurn();
      check(!c.getSnapshot().value && removed === 0); c.dispose();
    }
  })],
  ['PR26', 'Verified status clears loading independently of delayed logout; synchronous failure permits a fresh read', async () => {
    const recovery = memoryRecovery(); recovery.save(intent()); const held = deferred(); let calls = 0, logout = 0;
    const c = createPrivacyController(() => { calls++; if (calls === 1) throw { code: 'PRIVACY_STATUS_UNAVAILABLE' }; return Promise.resolve(value('PLATFORM_PENDING')); }, recovery, { signal: () => {}, onRemoved: () => { logout++; return held.promise; } });
    await c.load(); check(!c.getSnapshot().busy && c.getSnapshot().error === 'PRIVACY_STATUS_UNAVAILABLE');
    await c.check(); check(!c.getSnapshot().busy && !c.getSnapshot().error && c.getSnapshot().value.activeDataRemoved && logout === 1);
    held.resolve(); c.dispose();
  }],
  ['PR27', 'Real read handler preserves 429/5xx/auth distinction; failure never proves absence or starts cleanup', async () => {
    for (const [status, code] of [[429, 'PRIVACY_STATUS_UNAVAILABLE'], [500, 'PRIVACY_STATUS_UNAVAILABLE'], [401, 'AUTH_REQUIRED'], [403, 'AUTH_REQUIRED']]) {
      const f = privacyFixture(); await f.request('begin', privacyIntent('DELETE_ACCOUNT')); const count = writes(f);
      f.state.before = async c => { if (c.method === 'filter' && c.name === 'UserProfile') throw { response: { status }, message: 'PRIVATE_NEVER_SERIALIZE' }; };
      const response = await f.http({ action: 'status', ...intent() }, null), body = await response.json();
      check(body.error_code === code && !JSON.stringify(body).includes('PRIVATE_NEVER_SERIALIZE') && !body.activeDataRemoved && writes(f) === count);
      check(response.status === (status === 500 ? 503 : status));
    }
  }],
];
