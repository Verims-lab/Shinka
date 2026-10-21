import { check, rejects } from './dataModelTests';
import { privacyFixture, privacyIntent, memoryRecovery } from './privacyFixture';
import { HEALTH_CLEANUP, ACCOUNT_CLEANUP } from '../../../base44/shared/privacyPolicy.js';
import { createPrivacyController } from '@/features/privacy/privacyController';
import { privacyRequest } from '@/services/privacyService';
import { createOnboardingCycleGate } from '../../../base44/shared/onboardingCycleGate.js';
import { privacyRepository } from '../../../base44/shared/privacyRepository.js';
const writes = f => f.state.calls.filter(c => c.method !== 'filter');
const unchanged = (f, names) => JSON.stringify(names.map(name => f.tables[name]));
/** @type {import('./testTypes').FoundationTest[]} */
export const PRIVACY_TESTS = [
  ['PR20', 'Cleanup cannot report complete before the durable request fence is released', async () => {
    const f = privacyFixture();
    f.once('before', c => c.name === 'UserPrivacyRequest' && c.method === 'update' && c.args[1].status === 'COMPLETED');
    await rejects(() => f.request('begin', privacyIntent('WITHDRAW_HEALTH')), 'PRIVACY_OUTCOME_UNCONFIRMED');
    check(f.tables.HealthDataDeletionJob[0].job_status === 'COMPLETED');
    const pending = await f.request('status', { kind: 'WITHDRAW_HEALTH' });
    check(pending.state === 'IN_PROGRESS' && pending.consentWithdrawn && !pending.healthCleanupVerified);
    await rejects(() => f.cal(), 'HEALTH_DELETION_PENDING');
    check((await f.request('resume', { kind: 'WITHDRAW_HEALTH' })).healthCleanupVerified);
    check(f.tables.UserPrivacyRequest[0].status === 'COMPLETED' && f.tables.UserHealthConsentEvent.length === 2);
    check((await f.cal()).state === 'CONSENT_REQUIRED');
  }],
  ['PR19', 'Slow preparation allows first cleanup progress, then deadline stops the next delete', async () => {
    const f = privacyFixture(); let clock = 0;
    f.tables.UserCalendarAction.push({ id: 'second-receipt', user_id: 'ownerA' });
    const repo = privacyRepository(f.raw(), f.now, { clock: () => clock });
    clock = 30000;
    f.state.after = async c => { if (c.method === 'delete') clock += 9000; };
    check(await repo.clean(['UserCalendarAction'], 'ownerA', async () => {}) === false);
    check(f.tables.UserCalendarAction.length === 1 && writes(f).length === 1);
  }],
  ['PR18', 'An unrelated open health deletion job is not overwritten or duplicated', async () => {
    const f = privacyFixture();
    f.tables.HealthDataDeletionJob.push({ id: 'legacy-job', user_id: 'ownerA', requested_at: '2026-10-20T00:00:00.000Z', job_status: 'FAILED' });
    await rejects(() => f.request('begin', privacyIntent('WITHDRAW_HEALTH')), 'PRIVACY_OTHER_OPERATION_PENDING');
    check(f.tables.HealthDataDeletionJob.length === 1 && f.tables.UserHealthConsentEvent.length === 1);
    await rejects(() => f.cal(), 'HEALTH_DELETION_PENDING');
  }],
  ['PR15', 'Reload only reads the retained request; disposal discards a delayed personal result', async () => {
    const f = privacyFixture(), storage = memoryRecovery();
    f.once('before', c => c.method === 'delete');
    const first = createPrivacyController(f.request, storage, { signal: () => {} });
    await first.load(); first.select('WITHDRAW_HEALTH'); await first.confirm(); first.dispose();
    const count = writes(f).length, second = createPrivacyController(f.request, storage, { signal: () => {} });
    await second.load(); check(writes(f).length === count && second.getSnapshot().value.state === 'IN_PROGRESS');
    await second.resume(); check(second.getSnapshot().value.healthCleanupVerified); second.dispose();
    let release = () => {};
    const delayed = new Promise(resolve => { release = () => resolve({ state: 'IDLE', permanentDeletionVerified: false }); });
    const late = createPrivacyController(() => delayed, memoryRecovery(), { signal: () => {} });
    const pending = late.load(); late.invalidate(); late.dispose(); release(); await pending;
    check(late.getSnapshot().value === null);
  }],
  ['PR16', 'Ambiguous duplicate requests and restored residuals never certify erasure', async () => {
    const f = privacyFixture(); f.once('after', c => c.name === 'UserPrivacyRequest' && c.method === 'create');
    await rejects(() => f.request('begin', privacyIntent('DELETE_ACCOUNT')), 'PRIVACY_OUTCOME_UNCONFIRMED');
    f.tables.UserPrivacyRequest.push({ ...f.tables.UserPrivacyRequest[0], id: 'independent-worker-duplicate' });
    const before = writes(f).length;
    await rejects(() => f.request('resume', privacyIntent('DELETE_ACCOUNT')), 'PRIVACY_CONCURRENT_CONFLICT');
    check(writes(f).length === before && f.tables.User.some(row => row.id === 'ownerA'));
    const g = privacyFixture(); await g.request('begin', privacyIntent('DELETE_ACCOUNT'));
    g.tables.UserDailyMessage.push({ id: 'late-row', user_id: 'ownerA' });
    check((await g.request('status', privacyIntent('DELETE_ACCOUNT'), null)).state === 'PLATFORM_REVIEW_REQUIRED');
  }],
  ['PR17', 'Old native session cannot recreate data, and a new identity has no old personal history', async () => {
    const f = privacyFixture(); await f.request('begin', privacyIntent('DELETE_ACCOUNT'));
    await rejects(() => f.client().auth.me(), 'AUTH_REQUIRED');
    check((await f.http({ action: 'read' }, 'ownerA')).status === 401);
    f.tables.User.push({ id: 'new-provider-identity', role: 'user' });
    const read = await f.request('read', {}, 'new-provider-identity');
    check(read.state === 'IDLE' && !read.canWithdraw && !read.activeDataRemoved);
    check(ACCOUNT_CLEANUP.every(name => f.tables[name].every(row => row.user_id !== 'new-provider-identity')));
  }],
  ['PR01', 'Opening/cancelling never mutates; one explicit confirmation before dispatch', async () => {
    const f = privacyFixture(), storage = memoryRecovery(), c = createPrivacyController(f.request, storage, { signal: () => {} });
    await c.load(); c.select('WITHDRAW_HEALTH'); c.cancel(); check(writes(f).length === 0 && storage.read() === null);
    check((await f.http({ action: 'begin', ...privacyIntent('WITHDRAW_HEALTH'), confirmed: false })).status === 400);
    check(writes(f).length === 0); c.dispose();
  }],
  ['PR02', 'Actual withdrawal stops grant, cleans all five health scopes and preserves account/history', async () => {
    const f = privacyFixture(), keep = ['User', 'UserProfile', 'UserPreferences', 'UserDailyMessage', 'MessagePair', 'MoonPhaseLookup'];
    const before = unchanged(f, keep), grant = f.tables.UserHealthConsent[0].granted_at;
    const result = await f.request('begin', privacyIntent('WITHDRAW_HEALTH'));
    check(result.state === 'HEALTH_CLEANUP_COMPLETED' && result.consentWithdrawn && !result.permanentDeletionVerified);
    check(HEALTH_CLEANUP.every(name => f.tables[name].length === 0) && unchanged(f, keep) === before);
    check(f.tables.UserHealthConsent[0].granted_at === grant && f.tables.UserHealthConsentEvent.length === 2);
    check(f.tables.HealthDataDeletionJob[0].job_status === 'COMPLETED');
  }],
  ['PR03', 'Partial withdrawal remains revoked; reconstructed worker resumes same time/event/job', async () => {
    const f = privacyFixture(); f.once('before', c => c.method === 'delete' && c.name === 'UserPeriodRecord');
    await rejects(() => f.request('begin', privacyIntent('WITHDRAW_HEALTH')), 'PRIVACY_OUTCOME_UNCONFIRMED');
    const time = f.tables.UserHealthConsent[0].withdrawn_at;
    check((await f.request('status', { kind: 'WITHDRAW_HEALTH' })).consentWithdrawn);
    check(f.tables.HealthDataDeletionJob[0].job_status !== 'COMPLETED');
    await rejects(() => f.cal(), 'HEALTH_DELETION_PENDING');
    await rejects(() => f.change('add', { date: '2026-10-10', health_consent: true }), 'HEALTH_DELETION_PENDING');
    const response = await f.http({ action: 'resume', kind: 'WITHDRAW_HEALTH' }, 'ownerA', { gate: createOnboardingCycleGate() });
    check((await response.json()).state === 'HEALTH_CLEANUP_COMPLETED');
    check(time === f.tables.UserHealthConsent[0].withdrawn_at && f.tables.UserHealthConsentEvent.length === 2 && f.tables.HealthDataDeletionJob.length === 1);
  }],
  ['PR04', 'After verified withdrawal only a fresh explicit Calendar consent grants new time', async () => {
    const f = privacyFixture(); await f.request('begin', privacyIntent('WITHDRAW_HEALTH'));
    check((await f.cal()).state === 'CONSENT_REQUIRED');
    f.state.time = '2026-10-21T12:01:00.000Z';
    await rejects(() => f.change('add', { date: '2026-10-21' }), 'HEALTH_CONSENT_REQUIRED');
    const r = await f.change('add', { date: '2026-10-21', health_consent: true });
    check(r.state === 'READY' && f.tables.UserPeriodRecord.length === 1 && f.tables.UserHealthConsentEvent.length === 3);
    check(f.tables.UserHealthConsent[0].granted_at === f.state.time);
  }],
  ['PR05', 'Normal self-delete includes personal history, leaves shared content and other users intact', async () => {
    const f = privacyFixture();
    for (const name of ACCOUNT_CLEANUP.filter(n => !['AdminAuditLog', 'AdminTestOperation'].includes(n))) f.tables[name].push({ id: `other-${name}`, user_id: 'ownerB' });
    const shared = unchanged(f, ['MessagePair', 'MoonPhaseLookup', 'MessageCategoryMapping', 'MessageCategoryLookup']);
    const r = await f.request('begin', privacyIntent('DELETE_ACCOUNT'));
    check(r.state === 'PLATFORM_PENDING' && r.activeDataRemoved && r.permanentDeletionVerified === false);
    check(ACCOUNT_CLEANUP.every(name => f.tables[name].every(row => row.user_id !== 'ownerA')));
    check(ACCOUNT_CLEANUP.filter(n => !['AdminAuditLog', 'AdminTestOperation'].includes(n)).every(name => f.tables[name].some(row => row.user_id === 'ownerB')));
    check(shared === unchanged(f, ['MessagePair', 'MoonPhaseLookup', 'MessageCategoryMapping', 'MessageCategoryLookup']));
    check(!f.tables.User.some(row => row.id === 'ownerA') && f.tables.User.some(row => row.id === 'ownerB'));
  }],
  ['PR06', 'Incomplete profile/daily absence does not prevent self deletion; inactive alone is not success', async () => {
    const f = privacyFixture(); f.tables.UserProfile = []; f.tables.UserPreferences = []; f.tables.UserDailyMessage = [];
    f.once('before', c => c.name === 'User' && c.method === 'delete');
    await rejects(() => f.request('begin', privacyIntent('DELETE_ACCOUNT')), 'PRIVACY_OUTCOME_UNCONFIRMED');
    check((await f.request('status', privacyIntent('DELETE_ACCOUNT'))).state === 'IN_PROGRESS');
    check((await f.request('resume', privacyIntent('DELETE_ACCOUNT'))).state === 'PLATFORM_PENDING');
  }],
  ['PR07', 'Lost native User deletion reply resolves by scoped read-only receipt after auth is gone', async () => {
    const f = privacyFixture(); f.once('after', c => c.name === 'User' && c.method === 'delete');
    await rejects(() => f.request('begin', privacyIntent('DELETE_ACCOUNT')), 'PRIVACY_OUTCOME_UNCONFIRMED');
    const before = writes(f).length;
    const result = await f.request('status', privacyIntent('DELETE_ACCOUNT'), null);
    check(result.state === 'PLATFORM_PENDING' && writes(f).length === before && !JSON.stringify(result).includes('ownerA'));
    check((await f.http({ action: 'resume', ...privacyIntent('DELETE_ACCOUNT') }, null)).status === 401);
    check((await f.http({ action: 'status', kind: 'DELETE_ACCOUNT', recovery_key: 'b'.repeat(64) }, null)).status === 403);
  }],
  ['PR08', 'Forged owner/role, anonymous/stale identities and admin self-delete remain refused', async () => {
    const f = privacyFixture();
    for (const extra of [{ user_id: 'ownerB' }, { role: 'admin' }, { target_id: 'ownerB' }, { operationId: 'known-id' }, { account_status: 'ACTIVE' }]) check((await f.http({ action: 'begin', ...privacyIntent('DELETE_ACCOUNT'), ...extra })).status === 400);
    for (const actor of [null, 'missing']) check((await f.http({ action: 'begin', ...privacyIntent('DELETE_ACCOUNT') }, actor)).status === 401);
    check((await f.http({ action: 'begin', ...privacyIntent('DELETE_ACCOUNT') }, 'adminA')).status === 403);
    check(writes(f).length === 0);
  }],
  ['PR09', 'Bounded first-page cleanup resumes without skipping and checks residuals after every pass', async () => {
    const f = privacyFixture(); f.tables.UserPeriodRecord.push(...Array.from({ length: 65 }, (_, i) => ({ id: `many-${i}`, user_id: 'ownerA', period_start_date: '2020-01-01' })));
    const first = await f.request('begin', privacyIntent('WITHDRAW_HEALTH')); check(first.state === 'IN_PROGRESS');
    let result;
    for (let i = 0; i < 6; i++) { result = await f.request('resume', { kind: 'WITHDRAW_HEALTH' }); if (result.state === 'HEALTH_CLEANUP_COMPLETED') break; }
    check(result.state === 'HEALTH_CLEANUP_COMPLETED' && f.tables.UserPrivacyRequest.length === 1 && f.tables.UserHealthConsentEvent.length === 2);
    f.tables.UserCalendarAction.push({ id: 'late', user_id: 'ownerA', desired_date: '2026-01-01' });
    check((await f.request('status', { kind: 'WITHDRAW_HEALTH' })).state === 'IN_PROGRESS');
  }],
  ['PR10', 'Foreign indirect edge and failed absence read cannot claim cleanup success', async () => {
    const f = privacyFixture(); f.tables.UserCyclePrediction.push({ id: 'foreign', user_id: 'ownerB', reference_period_id: 'privacy-period' });
    await rejects(() => f.request('begin', privacyIntent('WITHDRAW_HEALTH')), 'PRIVACY_REFERENCE_CONFLICT');
    check(f.tables.UserPeriodRecord.length === 1 && f.tables.UserCyclePrediction.some(row => row.id === 'foreign'));
    const g = privacyFixture(); await g.request('begin', privacyIntent('DELETE_ACCOUNT'));
    g.once('before', c => c.name === 'UserProfile' && c.method === 'filter');
    await rejects(() => g.request('status', privacyIntent('DELETE_ACCOUNT'), null), 'PRIVACY_OUTCOME_UNCONFIRMED');
  }],
  ['PR11', 'Withdrawal/account deletion collisions and admin reset respect persisted target admission', async () => {
    const f = privacyFixture(); f.once('before', c => c.method === 'delete');
    await rejects(() => f.request('begin', privacyIntent('WITHDRAW_HEALTH')), 'PRIVACY_OUTCOME_UNCONFIRMED');
    await rejects(() => f.preview(), 'PRIVACY_OTHER_OPERATION_PENDING');
    const r = await f.request('begin', privacyIntent('DELETE_ACCOUNT')); check(r.state === 'PLATFORM_PENDING');
    check(f.tables.UserPrivacyRequest.length === 1 && f.tables.UserPrivacyRequest[0].kind === 'DELETE_ACCOUNT');
    check((await f.http({ action: 'resume', kind: 'WITHDRAW_HEALTH' })).status === 401);
  }],
  ['PR12', 'Double tap/warm-worker duplicate, lost response, reopen, and disposed late reply', async () => {
    const f = privacyFixture(), store = memoryRecovery(); let release = () => {};
    const delay = new Promise(resolve => { release = () => resolve(undefined); });
    const c = createPrivacyController(async (action, payload) => { if (action === 'begin') await delay; return f.request(action, payload); }, store, { signal: () => {} });
    await c.load(); c.select('WITHDRAW_HEALTH'); const a = c.confirm(), b = c.confirm(); release(); await Promise.all([a, b]);
    check(f.tables.UserPrivacyRequest.length === 1 && f.tables.UserHealthConsentEvent.length === 2);
    c.dispose();
    const g = privacyFixture(); const both = await Promise.all([g.request('begin', privacyIntent('WITHDRAW_HEALTH')), g.request('begin', privacyIntent('WITHDRAW_HEALTH'))]);
    check(both.every(r => r.healthCleanupVerified) && g.tables.UserPrivacyRequest.length === 1);
  }],
  ['PR13', 'Partial durable request fences product writes even before consent mutation', async () => {
    const f = privacyFixture(); f.once('after', c => c.name === 'UserPrivacyRequest' && c.method === 'create');
    await rejects(() => f.request('begin', privacyIntent('WITHDRAW_HEALTH')), 'PRIVACY_OUTCOME_UNCONFIRMED');
    check(f.tables.UserHealthConsent[0].consent_status === 'GRANTED');
    await rejects(() => f.cal(), 'HEALTH_DELETION_PENDING');
    await rejects(() => f.client().asServiceRole.entities.UserPeriodRecord.create({ user_id: 'ownerA', period_start_date: '2026-10-21' }), 'HEALTH_DELETION_PENDING');
    check((await f.request('resume', { kind: 'WITHDRAW_HEALTH' })).healthCleanupVerified);
  }],
  ['PR14', 'Recovery expires and malformed or permanent-success claims are refused', async () => {
    const f = privacyFixture(); await f.request('begin', privacyIntent('DELETE_ACCOUNT'));
    f.state.time = '2026-10-23T12:00:00.000Z';
    check((await f.http({ action: 'status', ...privacyIntent('DELETE_ACCOUNT') }, null)).status === 403);
    await rejects(() => privacyRequest('status', {}, { functions: { invoke: async () => ({ data: { state: 'PLATFORM_PENDING', activeDataRemoved: true, permanentDeletionVerified: true } }) } }), 'PRIVACY_OUTCOME_UNCONFIRMED');
  }],
];
