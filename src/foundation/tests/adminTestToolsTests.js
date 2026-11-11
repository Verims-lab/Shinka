import { seedLegacyReset } from './historicalResetFixture';
import { nativeFixture } from './nativeFixture';
import { adminTestFixture } from './adminTestFixture';
import { DELETED_ENTITIES, RETAINED_ENTITIES, SHARED_ENTITIES } from '../../../base44/shared/adminTestPolicy.js';
import { createTestRepository } from '../../../base44/shared/adminTestRepository.js';
import { physicalName } from '../../../base44/shared/domainSchemas.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';
import { adminTestOperation, handleAdminTestRequest } from '../../../base44/shared/adminTestOperation.js';
import { dailyAssignment } from '../../../base44/shared/dailySelection.js';
const assert = (ok, reason) => { if (!ok) throw new Error(reason); };
async function rejects(run, code) {
  try { await run(); } catch (e) { assert(!code || e.code === code, `expected ${code}, got ${e.code}`); return; }
  throw new Error(`expected refusal ${code}`);
}
const bytes = f => JSON.stringify(Object.fromEntries(Object.entries(f.tables).sort(([a], [b]) => a.localeCompare(b))));
const noMutations = f => assert(f.state.calls.every(row => row.method === 'filter'), 'unexpected mutation');
const deleted = f => !f.tables.User.some(row => row.id === 'ownerA');
const retained = f => JSON.stringify(Object.fromEntries([...RETAINED_ENTITIES, ...SHARED_ENTITIES].filter(e => e !== 'notification_delivery').map(e => [e, f.tables[physicalName(e)].filter(row => e !== 'admin_audit_log' || row.target_entity !== 'AdminTestOperation')])));
const reset = async f => seedLegacyReset(f);
function daily(f) {
  const pair = f.tables.MessagePair[0];
  f.tables.UserDailyMessage.push({ id: 'old-daily', ...dailyAssignment({ owner: 'ownerA', day: '2026-10-20', timezone: 'Europe/Istanbul', pair, now: f.now() }) });
}
/** @type {import('./testTypes').FoundationTest[]} */
export const ADMIN_TEST_TOOLS_TESTS = [
  ['AT18', 'Retired admin reset rejects preview/execute/resume with zero writes; legacy receipts remain readable', async () => {
    for (const native of [false,true]) for (const status of ['RUNNING','RETRY_REQUIRED','AUDIT_PENDING','RESET_ACTIVE','COMPLETED']) {
      const f=native?nativeFixture():adminTestFixture();
      const request=body=>native?f.tools(body):f.request(body);
      const job=seedLegacyReset(f,{status,stage:status==='COMPLETED'?'DONE':'PROFILE',completed_at:status==='COMPLETED'?f.now().toISOString():null});
      const before=bytes(f);
      for(const body of [
        {action:'preview',operation:'RESET_ONBOARDING'},
        {action:'execute',operation:'RESET_ONBOARDING',confirmation:true,preview_token:'old-preview',request_id:crypto.randomUUID()},
        {action:'resume',operation_id:job.operation_id},
      ]) await rejects(()=>request({target_id:'ownerA',...body}),'TEST_RESET_RETIRED');
      const read=await request({action:'status',target_id:'ownerA',operation_id:job.operation_id});
      assert(read.job.operation_id===job.operation_id&&read.job.status===status&&!read.resume_enabled&&read.mutation_blocker==='TEST_RESET_RETIRED','legacy receipt unavailable or writable');
      const view=await request({action:'preview',target_id:'ownerA',operation:'DELETE_USER'});
      assert(status==='COMPLETED'?view.enabled:view.blockers.includes('TEST_TARGET_BUSY'),'legacy lifecycle fence lost');
      assert(bytes(f)===before,'retired reset changed persisted state');noMutations(f);
    }
  }],

  ['AT17', 'Missing lifecycle schema fails closed before product work; additive schema restores reads', async () => {
    const f = adminTestFixture(), owner = f.ownerClient(), saved = bytes(f);
    const schemaRows = f.tables.AdminTestOperation;
    delete f.tables.AdminTestOperation;
    await rejects(() => onboardingOperation(owner, { action: 'hydrate' }), 'TEST_LIFECYCLE_UNAVAILABLE');
    await rejects(() => dailyMessageOperation(owner, { action: 'today' }), 'TEST_LIFECYCLE_UNAVAILABLE');
    await rejects(() => adminTestOperation(withUserLifecycle(f.client), { action: 'lookup', target_id: 'ownerA' }), 'TEST_LIFECYCLE_UNAVAILABLE');
    noMutations(f);
    f.tables.AdminTestOperation = schemaRows;
    assert((await owner.auth.me()).id === 'ownerA', 'schema-only repair did not restore admission');
    assert(bytes(f) === saved, 'schema repair changed product records');
  }],
  ['AT01', 'Every Test Tools action denies anonymous/user/forged roles before entity access', async () => {
    for (const actor of [null, 'ownerA']) for (const action of ['lookup', 'preview', 'execute', 'status', 'resume']) {
      const f = adminTestFixture(); f.state.actor = actor;
      const req = new Request('https://fixture.invalid', { method: 'POST', body: JSON.stringify({ action, target_id: 'ownerB', role: 'admin' }) });
      const response = await handleAdminTestRequest(req, () => f.client, f.dependencies);
      assert(response.status === (actor ? 403 : 401), 'HTTP guard'); assert(f.state.calls.length === 0, 'read before admin guard');
    }
  }],
  ['AT02', 'Closed payload, absent target and real server environment; no client authority', async () => {
    const f = adminTestFixture();
    await rejects(() => f.request({ action: 'lookup', target_id: 'ownerA', environment: 'TEST' }), 'INVALID_REQUEST');
    await rejects(() => f.request({ action: 'lookup', target_id: 'absent' }), 'TEST_USER_NOT_FOUND');
    await rejects(() => f.preview('__proto__'), 'INVALID_REQUEST');
    const view = await f.preview();
    assert(view.environment.app_id === 'fixture-app' && view.environment.authorized, 'destination');
    const blocked = await f.request({ action: 'preview', operation: 'DELETE_USER', target_id: 'ownerA' }, { ...f.dependencies, coordinator: null, signer: null, policy: { appId: '', label: '' } });
    assert(!blocked.enabled && blocked.blockers.includes('ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED') && blocked.blockers.includes('TEST_ENVIRONMENT_UNVERIFIED'), 'production blocker');
    noMutations(f);
  }],
  ['AT03', 'Lookup/preview shows selected identity only; excludes health, snapshots and credentials', async () => {
    const f = adminTestFixture(); const before = bytes(f);
    f.tables.User[2].email = 'private-canary@example.invalid';
    const baseline = bytes(f);
    const result = await f.request({ action: 'lookup', target_id: 'ownerA' });
    const view = await f.preview();
    const output = JSON.stringify([result, view]);
    assert(output.includes('private-canary') && !output.includes('birth_date') && !output.includes('TR fixture'), 'private payload');
    assert(bytes(f) === baseline && before !== baseline, 'preview mutation'); noMutations(f);
  }],
  ['AT04', 'Confirmation is actor/target/action/app/expiry bound; changed scope fails', async () => {
    const f = adminTestFixture(), view = await f.preview();
    const body = { action: 'execute', operation: view.operation, target_id: 'ownerA', confirmation: true, preview_token: view.preview_token, request_id: crypto.randomUUID() };
    for (const patch of [{ confirmation: false }, { target_id: 'ownerB', confirmation: true }, { operation: 'RESET_ONBOARDING' }, { preview_token: view.preview_token + 'x' }]) await rejects(() => f.request({ ...body, ...patch }));
    f.state.actor = 'adminB'; await rejects(() => f.request(body), 'TEST_PREVIEW_INVALID'); f.state.actor = 'adminA';
    f.tables.UserProfile[0].updated_date = 'changed';
    await rejects(() => f.request(body), 'TEST_PREVIEW_STALE');
    f.state.time = '2026-10-20T13:00:00Z'; await rejects(() => f.request(body), 'TEST_PREVIEW_INVALID'); noMutations(f);
  }],
  ['AT05', 'Self-delete and last admin denied in backend, including role changes after preview', async () => {
    const f = adminTestFixture();
    assert((await f.preview('DELETE_USER', 'adminA')).blockers.includes('TEST_SELF_DELETE_DENIED'), 'self delete');
    const view = await f.preview('DELETE_USER', 'adminB');
    f.tables.User.find(u => u.id === 'adminA').role = 'user';
    await rejects(() => f.execute(view), 'FORBIDDEN_INTERNAL_TOOLING');
    f.tables.User.find(u => u.id === 'adminA').role = 'admin';
    f.tables.User = f.tables.User.filter(u => u.id !== 'adminB');
    // A sole current admin cannot delete itself; both reasons remain explicit.
    const last = await f.preview('DELETE_USER', 'adminA');
    assert(last.blockers.includes('TEST_SELF_DELETE_DENIED'), 'last self guard');
    noMutations(f);
    const g = adminTestFixture(), handlers = g.client.asServiceRole.entities;
    const rosterClient = { ...g.client, asServiceRole: { entities: new Proxy(handlers, { get(target, name) {
      if (typeof name !== 'string') return Reflect.get(target, name);
      if (name !== 'User') return target[name];
      return { ...target.User, filter: (query, ...args) => query.role === 'admin' ? Promise.resolve([{ id: 'adminB', role: 'admin' }]) : target.User.filter(query, ...args) };
    } }) } };
    const lastTarget = await adminTestOperation(rosterClient, { action: 'preview', target_id: 'adminB', operation: 'DELETE_USER' }, g.dependencies);
    assert(!lastTarget.enabled && lastTarget.blockers.includes('TEST_LAST_ADMIN_DENIED'), 'last-admin predicate');
  }],
  ['AT06', 'Delete pages through operational rows, stops pending jobs, preserves history/shared/other owner', async () => {
    const f = adminTestFixture(); daily(f);
    f.tables.UserPeriodRecord = Array.from({ length: 205 }, (_, i) => ({ id: `period-${String(i).padStart(3, '0')}`, user_id: 'ownerA' }));
    f.tables.UserPeriodRecord.push({ id: 'other-owner', user_id: 'ownerB' });
    f.tables.NotificationDelivery.push({ id: 'notification', user_id: 'ownerA', daily_message_id: 'old-daily', delivery_status: 'PENDING' });
    const before = retained(f), view = await f.preview(), id = crypto.randomUUID();
    assert(view.counts.user_period_record === 205, 'first-page truncation');
    let result=await f.execute(view,id);
    assert(result.job.error_code==='TEST_CLEANUP_MORE_REQUIRED','bounded pass not acknowledged');
    for(let i=0;i<4&&result.job.status!=='COMPLETED';i++) result=await f.resume(id);
    assert(result.job.status === 'COMPLETED' && deleted(f), 'not removed');
    assert(f.tables.UserPeriodRecord.length === 1 && f.tables.UserPeriodRecord[0].user_id === 'ownerB', 'other owner changed');
    assert(retained(f) === before && f.tables.NotificationDelivery[0].delivery_status === 'SKIPPED', 'retention');
    assert(f.state.audit.length >= 2 && !JSON.stringify(f.state.audit).includes('birth_date'), 'audit');
    assert(f.state.calls.some(c => c.name === 'UserPeriodRecord' && c.skip === 200), 'pagination not exercised');
    const referenceCalls = f.state.calls.filter(c => c.query?.reference_period_id);
    assert(referenceCalls.length <= 24 && referenceCalls.every(c => c.query.reference_period_id.$in.length <= 100), 'unbounded per-parent requests');
    const lookup = await f.request({ action: 'lookup', target_id: 'ownerA' });
    assert(!lookup.target && lookup.job.operation_id === id, 'post-delete recovery lookup');
  }],
  ['AT07', 'Incoming and outgoing foreign-reference corruption blocks deletion', async () => {
    for (const owner of ['ownerA', 'ownerB']) {
      const f = adminTestFixture();
      f.tables.UserPeriodRecord.push({ id: 'periodA', user_id: 'ownerA' });
      f.tables.UserCyclePrediction.push({ id: 'prediction', user_id: owner, reference_period_id: owner === 'ownerA' ? 'missing-parent' : 'periodA' });
      await rejects(() => f.preview(), 'TEST_REFERENCE_CONFLICT'); noMutations(f);
    }
  }],
  ['AT08', 'No coordinator and failed start audit never mutate a user', async () => {
    const f = adminTestFixture(), view = await f.preview();
    const body = { action: 'execute', target_id: 'ownerA', operation: 'DELETE_USER', confirmation: true, preview_token: view.preview_token, request_id: crypto.randomUUID() };
    await rejects(() => f.request(body, { ...f.dependencies, coordinator: null }), 'ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED');
    f.state.fail = 'start'; await rejects(() => f.request(body));
    assert(!deleted(f) && !f.tables.AdminTestOperation.length, 'unaudited deletion'); noMutations(f);
  }],
  ['AT09', 'Partial cleanup/retry and lost delete response resume one durable operation', async () => {
    for (const fault of ['delete:UserProfile', 'afterDelete:User', 'checkpoint:USER', 'finish']) {
      const f = adminTestFixture(), view = await f.preview(), id = crypto.randomUUID();
      const protectedBefore = retained(f);
      f.state.fail = fault; await rejects(() => f.execute(view, id), 'TEST_STORAGE_UNAVAILABLE');
      assert(f.tables.AdminTestOperation[0].status !== 'COMPLETED', 'false success');
      const result = await f.resume(id);
      assert(result.job.status === 'COMPLETED' && deleted(f) && retained(f) === protectedBefore, `retry ${fault}`);
      assert(f.tables.AdminTestOperation.length === 1, 'duplicate operation');
    }
    const f = adminTestFixture(), view = await f.preview();
    f.state.fail = 'afterFinish';
    assert((await f.execute(view)).job.status === 'COMPLETED' && f.tables.AdminAuditLog.length === 1, 'lost final acknowledgement regressed state');
  }],
  ['AT10', 'Duplicate deletion serializes in fixture workers; retired reset cannot compete', async () => {
    const f = adminTestFixture(), view = await f.preview(), id = crypto.randomUUID();
    const other = { ...f.dependencies, coordinator: f.worker() };
    const body = { action: 'execute', target_id: 'ownerA', operation: 'DELETE_USER', confirmation: true, preview_token: view.preview_token, request_id: id };
    const results = await Promise.all([f.request(body), f.request(body, other)]);
    assert(results.every(r => r.job.status === 'COMPLETED') && f.tables.AdminTestOperation.length === 1, 'duplicate job');
    const g = adminTestFixture(), del = await g.preview();
    const racing = await Promise.allSettled([g.request({action:'execute',target_id:'ownerA',operation:'RESET_ONBOARDING',confirmation:true,preview_token:'retired',request_id:crypto.randomUUID()}), g.execute(del)]);
    assert(racing[0].status==='rejected'&&racing[0].reason.code==='TEST_RESET_RETIRED'&&racing[1].status==='fulfilled'&&deleted(g)&&g.tables.AdminTestOperation.length===1, 'retired reset interfered with deletion');
  }],
  ['AT11', 'Deleted user with old auth token is denied; deletion tombstone also denies recreated ID', async () => {
    const f = adminTestFixture(), stale = f.ownerClient();
    await f.execute(await f.preview());
    await rejects(() => onboardingOperation(stale, { action: 'initialize', language_code: 'tr', timezone: 'Europe/Istanbul', action_id: crypto.randomUUID() }), 'AUTH_REQUIRED');
    await rejects(() => dailyMessageOperation(stale, { action: 'today' }), 'AUTH_REQUIRED');
    f.tables.User.push({ id: 'ownerA', role: 'user' });
    await rejects(() => stale.auth.me(), 'ACCOUNT_DELETION_IN_PROGRESS');
    assert(f.tables.UserProfile.length === 0, 'stale token recreated profile');
  }],
  ['AT13', 'Legacy receipt: normal profile validation, Skip and final readback reuse the same daily without new consent', async () => {
    const f = adminTestFixture(); daily(f); await reset(f);
    const protectedBefore = retained(f);
    const deps = { now: f.now, lifecycleCoordinator: f.worker() };
    const payload = { action: 'saveProfile', birth_date: '1990-01-01', display_name: 'Ada', birth_time: null, birthplace_geonames_id: null, action_id: crypto.randomUUID() };
    await rejects(() => onboardingOperation(f.ownerClient(), { ...payload, birth_date: '2020-01-01' }, deps));
    assert(f.tables.AdminTestOperation[0].stage === 'PROFILE', 'invalid DOB advanced');
    assert((await onboardingOperation(f.ownerClient(), payload, deps)).state === 'AUTHENTICATED_CYCLE_STEP', 'profile');
    assert((await onboardingOperation(f.ownerClient(), payload, deps)).state === 'AUTHENTICATED_CYCLE_STEP', 'profile receipt lost-response replay');
    assert((await onboardingOperation(f.ownerClient(), { action: 'hydrate' }, deps)).state === 'AUTHENTICATED_CYCLE_STEP', 'cycle durability');
    await onboardingOperation(f.ownerClient(), { action: 'skipCycle' }, deps);
    assert((await onboardingOperation(f.ownerClient(), { action: 'hydrate' }, deps)).state === 'FIRST_SHINKA_DEPENDENCY', 'first stage');
    const result = await dailyMessageOperation(f.ownerClient(), { action: 'today' }, deps);
    assert(result.daily.id === 'old-daily' && !result.created && f.tables.UserDailyMessage.length === 1, 'duplicate Pair');
    assert(f.tables.AdminTestOperation[0].status === 'COMPLETED' && retained(f) === protectedBefore, 'completion/history');
    assert((await onboardingOperation(f.ownerClient(), { action: 'hydrate' }, deps)).state === 'ACTIVE_EXISTING_USER', 'completion persisted');
  }],
  ['AT15', 'Legacy receipt: lifecycle guard reads current role; progress commit failure retains previous stage/product state', async () => {
    const f = adminTestFixture(); await reset(f);
    f.tables.User.find(u => u.id === 'adminA').role = 'user';
    const forgedSession = { ...f.client, auth: { me: async () => ({ id: 'adminA', role: 'admin' }) } };
    assert((await withUserLifecycle(forgedSession).auth.me()).role === 'user', 'stale role trusted');
    const before = bytes(f); f.state.fail = 'resetCommit';
    await rejects(() => onboardingOperation(f.ownerClient(), { action: 'saveProfile', birth_date: '1990-01-01', birth_time: null, display_name: 'Changed', birthplace_geonames_id: null, action_id: crypto.randomUUID() }, { now: f.now, lifecycleCoordinator: f.worker() }));
    assert(bytes(f) === before, 'fixture atomic rollback failed');
    await rejects(() => onboardingOperation(f.ownerClient(), { action: 'skipCycle' }), 'ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED');
    await rejects(() => onboardingOperation(f.ownerClient(), { action: 'skipCycle' }, {
      lifecycleCoordinator: { resetStep: async () => ({ state: 'FIRST_SHINKA_DEPENDENCY', persisted: false }) },
    }), 'TEST_RESET_STEP_UNCONFIRMED');
  }],
  ['AT16', 'Scope explicitly covers all product schemas; shared/error/history never enter delete allowlist', async () => {
    assert(DELETED_ENTITIES.length === 7 && RETAINED_ENTITIES.length === 8 && SHARED_ENTITIES.length === 5, 'scope inventory');
    const f = adminTestFixture();
    await rejects(() => createTestRepository(f.client).cleanup('user_daily_message', 'ownerA'), 'INVALID_TEST_SCOPE');
    noMutations(f);
  }],
];
