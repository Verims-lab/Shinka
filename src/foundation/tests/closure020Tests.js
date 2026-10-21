import { nativeFixture } from './nativeFixture';
import { nativeReadiness } from '../../../base44/shared/nativeReadiness.js';
import { createTestRepository } from '../../../base44/shared/adminTestRepository.js';

const check = (ok, message = '020 contract') => { if (!ok) throw new Error(message); };
const READINESS_IDS = ['H04-019', 'H08-005', 'H09-004', 'H12-031'];
async function readinessCases() {
  const { HEALTH_CASES } = await import('../health/catalog');
  return READINESS_IDS.map(id => { const c = HEALTH_CASES.find(c => c.id === id); check(typeof c?.run === 'function', id); return c; });
}
const context = value => ({ nativeReadiness: async () => structuredClone(value), contentLibrary: async () => ({ ready: true }), moonReadiness: async () => ({ ready: true }) });
const pristine = async () => nativeReadiness(nativeFixture().client('adminA'));
const rejected = async work => { try { await work(); } catch (error) { return error; } throw new Error('Unconfirmed read accepted'); };

/** @type {import('./testTypes').FoundationTest[]} */
export const CLOSURE020_READINESS_TESTS = [
  ['RG01', 'All four actual readiness cases pass a successful native backend shape with evaluated boolean assertions', async () => {
    const value = await pristine(), actual = [];
    check(value.hostedMutationVerified === false && value.distributedFence === false);
    for (const c of await readinessCases()) {
      const result = await c.run(context(value));
      check(result.status === 'PASS' && result.assertion?.evaluated === true && result.assertion?.passed === true, `${c.id}:${result.status}`);
      actual.push({ id: c.id, status: result.status, assertion: result.assertion });
    }
    return { evidence: { actual, backendShape: value, scope: 'SYNTHETIC_RESPONSE_THROUGH_REAL_CASE_RUNNERS_NOT_HOSTED_MUTATION' } };
  }],
  ['RG02', 'Wrong strategy/version/authority and missing, duplicate, foreign or unreadable schemas fail all four readiness cases', async () => {
    const changes = [
      ...['daily', 'calendar', 'reset', 'deletion'].map(key => value => { value[key] = 'SOME_NONEMPTY_TEXT'; }),
      value => { value.authority = 'OTHER'; }, value => { value.strategyVersion = 'native-continuation/1'; },
      value => { value.schemas.pop(); }, value => { value.schemas[2] = { ...value.schemas[0] }; },
      value => { value.schemas[2].name = 'UnrelatedTable'; }, value => { value.schemas[1].readable = false; },
      value => { value.schemas[1].readable = 'true'; }, value => { value.schemas = {}; }, value => { value.schemas[1] = null; },
    ];
    const cases = await readinessCases();
    for (const change of changes) {
      const value = await pristine(); change(value);
      for (const c of cases) { const r = await c.run(context(value)); check(r.status === 'FAIL' && r.assertion?.evaluated === true && r.assertion?.passed === false, c.id); }
    }
    for (const c of cases) { const r = await c.run(context(null)); check(r.status === 'FAIL' && r.assertion?.evaluated === true, c.id); }
    return { evidence: { negativeResponses: (changes.length + 1) * cases.length, cases: READINESS_IDS } };
  }],
  ['RG03', 'Unavailable readiness is BLOCKED, never PASS; daily content and Moon prerequisites remain required', async () => {
    const ctx = context(await pristine()); ctx.nativeReadiness = async () => { throw new Error('backend unavailable'); };
    for (const c of await readinessCases()) { const r = await c.run(ctx); check(r.status === 'BLOCKED' && r.evidence.actual.state === 'UNAVAILABLE', c.id); }
    const c = (await readinessCases()).find(c => c.id === 'H09-004');
    for (const dependency of ['contentLibrary', 'moonReadiness']) {
      const unavailable = context(await pristine()); unavailable[dependency] = async () => { throw new Error('unavailable'); };
      check((await c.run(unavailable)).status === 'BLOCKED', dependency);
    }
  }],
];

/** @type {import('./testTypes').FoundationTest[]} */
export const CLOSURE020_REMOVAL_TESTS = [
  ['RM01', 'Execute and resume reverify active User and operational residuals after completion persistence', async () => {
    for (const action of ['execute', 'resume']) for (const entity of ['User', 'UserProfile']) {
      const f = nativeFixture(), preview = await f.preview('DELETE_USER');
      const body = { action: 'execute', target_id: 'ownerA', operation: 'DELETE_USER', confirmation: true, preview_token: preview.preview_token, request_id: crypto.randomUUID() };
      if (action === 'resume') {
        f.once('before', c => c.name === 'UserProfile' && c.method === 'delete');
        await rejected(() => f.tools(body));
      }
      let injected = false;
      f.state.after = async c => {
        if (!injected && c.name === 'AdminTestOperation' && c.method === 'filter' && f.tables.AdminTestOperation[0]?.status === 'COMPLETED') {
          injected = true; f.tables[entity].push(entity === 'User' ? { id: 'ownerA', role: 'user' } : { id: 'late-profile', user_id: 'ownerA', account_status: 'ACTIVE' });
        }
      };
      const response = await f.tools(action === 'execute' ? body : { action, target_id: 'ownerA', operation_id: body.request_id });
      check(injected && response.job.status === 'COMPLETED' && response.result_state === 'PARTIAL', `${action}:${entity}:false completion`);
      f.state.after = null;
      for (const read of ['status','lookup']) {
        const start = f.state.calls.length;
        const result = await f.tools({ action: read, target_id: 'ownerA', ...(read === 'status' ? { operation_id: body.request_id } : {}) });
        check(result.result_state === 'PARTIAL' && f.state.calls.slice(start).every(c => c.method === 'filter'), read);
      }
    }
  }],
  ['RM02', 'Absent active User is separate from retained history and same-operation read-only recovery', async () => {
    const f = nativeFixture(); f.tables.UserDailyMessage.push({ id: 'retained-day', user_id: 'ownerA' });
    const retained = JSON.stringify([f.tables.UserHealthConsent, f.tables.UserHealthConsentEvent, f.tables.UserDailyMessage]);
    const done = await f.execute(await f.preview('DELETE_USER'));
    check(done.result_state === 'COMPLETED' && done.target === null);
    for (const action of ['lookup', 'status']) {
      const start = f.state.calls.length;
      const result = await f.tools({ action, target_id: 'ownerA', ...(action === 'status' ? { operation_id: done.job.operation_id } : {}) });
      check(result.result_state === 'COMPLETED' && result.target === null && result.job.operation_id === done.job.operation_id);
      check(f.state.calls.slice(start).every(c => c.method === 'filter'));
    }
    check(JSON.stringify([f.tables.UserHealthConsent, f.tables.UserHealthConsentEvent, f.tables.UserDailyMessage]) === retained);
  }],
  ['RM03', 'Denied, failed, malformed or wrong-owner native User reads never establish absence', async () => {
    for (const response of [null, {}, [{ id: 'another-user', role: 'user' }], [{ id: 'ownerA', role: 'unknown' }], [{ id: 'ownerA', role: 'user' }, { id: 'ownerA', role: 'user' }]]) {
      const repo = createTestRepository({ asServiceRole: { entities: { User: { filter: async () => response } } } });
      await rejected(() => repo.user('ownerA'));
    }
    for (const status of [403, 503]) for (const action of ['status', 'lookup']) {
      const f = nativeFixture(), done = await f.execute(await f.preview('DELETE_USER'));
      f.state.before = async c => { if (c.name === 'User' && c.method === 'filter' && c.args[0]?.id === 'ownerA') throw { response: { status } }; };
      const error = await rejected(() => f.tools({ action, target_id: 'ownerA', ...(action === 'status' ? { operation_id: done.job.operation_id } : {}) }));
      check(error.code !== 'TEST_USER_NOT_FOUND');
    }
  }],
];
