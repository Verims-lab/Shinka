import { check } from './dataModelTests';
import { BUILD_MARKER } from '../buildMarker';
import { contentFixture, dailyFixture, DAILY_NOW } from './dailyFixture';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { contentBlueprint, planContentImport } from '../../../base44/shared/contentImportPlan.js';
import { inspectContentLibrary, applyContentBatch, librarySummary } from '../../../base44/shared/base44ContentLibrary.js';
import { contentLibraryOperation } from '../../../base44/shared/contentLibraryOperation.js';
import { cyclePhaseAtDay, estimatedCycleLength, resolveDailyCycle } from '../../../base44/shared/dailyCycle.js';
import { generateMoonIntervals, resolveMoonPhase, validateMoonIntervals } from '../../../base44/shared/moonIntervals.js';
import { selectDailyPair, repeatWindowStart } from '../../../base44/shared/dailySelection.js';
import { dailyMessageOperation, handleDailyMessageRequest } from '../../../base44/shared/dailyMessageOperation.js';
import { serverLocalDate } from '../../../base44/shared/onboardingValidation.js';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { CONTENT_SOURCE_SHA256 } from '../../../base44/shared/contentSourceReceipt.js';
import { evaluateContentState, CONTENT_ENTITY_NAMES } from '../../../base44/shared/contentStateContract.js';
import { inspectMoonImport, applyMoonBatch } from '../../../base44/shared/moonImport.js';
import { HEALTH_CONSENT_VERSION } from '../../../base44/shared/onboardingDependencies.js';
import { CONTENT_CATEGORY_DECISION } from '../../../base44/shared/contentCategoryDecision.js';
import { OPEN_DECISIONS } from '../openDecisions';
const rejects = async (fn, code) => { try { await fn(); } catch (e) { check(!code || e.code === code, `expected ${code}, received ${e.code}`); return; } throw new Error(`expected rejection ${code}`); };
const request = { action: 'today', timezone: 'Europe/Istanbul' };
const call = f => dailyMessageOperation(f.client, request, f.dependencies);
const grant = f => {
  f.rows.user_health_consent.push({ id: 'consent', user_id: 'ownerA', consent_status: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, granted_at: DAILY_NOW, withdrawn_at: null });
  f.rows.user_health_consent_event.push({ id: 'event', user_id: 'ownerA', event_type: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, occurred_at: DAILY_NOW });
};
/** @type {import('./testTypes').FoundationTest[]} */
export const DAILY_TESTS = [
 ['DM01', 'Category decision required; source blueprint preserves exact paired texts', async () => {
  const { source, decision } = contentFixture();
  await rejects(() => contentBlueprint(source, { ...decision, status: 'PENDING_PRODUCT_DECISION' }), 'CONTENT_CATEGORY_DECISION_REQUIRED');
  const b = contentBlueprint(source, decision); check(b.message_pair.length === 260 && b.message_category_mapping.length === 240 && b.message_category_lookup.length === 6);
  check(b.message_pair[0].record.message_tr === source.pairs[0][2] && b.message_pair[0].key === 'SHF-001');
 }],
 ['DM02', 'Import dry-run, bounded batches, repeat and source/native crosswalk', async () => {
  const f = sdkOnboardingFixture({ role: 'admin' }), { source, decision } = contentFixture();
  let result = await inspectContentLibrary(f.client, source, decision);
  check(result.plan.missing.length === 506 && !result.plan.ready && !f.calls.some(c => c.method !== 'filter'));
  let iterations = 0;
  while (!result.plan.ready) {
    check(++iterations < 24); await applyContentBatch(f.client, result, result.digest);
    result = await inspectContentLibrary(f.client, source, decision);
  }
  check(result.plan.pairIds.length === 260 && result.plan.same.length === 506);
  const before = f.calls.filter(c => c.method === 'upsert').length;
  await applyContentBatch(f.client, result, result.digest);
  check(f.calls.filter(c => c.method === 'upsert').length === before && librarySummary(result).phase === 'VERIFIED_IMPORTED');
 }],
 ['DM03', 'Partial/lost-response import resumes without overwrite; conflicting content blocks', async () => {
  const f = sdkOnboardingFixture({ role: 'admin' }), { source, decision } = contentFixture();
  let result = await inspectContentLibrary(f.client, source, decision);
  f.failWrite('message_category_lookup', true); await rejects(() => applyContentBatch(f.client, result, result.digest)); f.fail(null);
  result = await inspectContentLibrary(f.client, source, decision); check(librarySummary(result).phase === 'PARTIAL_IMPORT');
  await applyContentBatch(f.client, result, result.digest); check(f.rows.message_category_lookup.length === 6);
  result = await inspectContentLibrary(f.client, source, decision);
  f.rows.message_category_lookup[0].display_name_en = 'conflicting edit';
  const conflict = await inspectContentLibrary(f.client, source, decision); check(!conflict.plan.ready && conflict.plan.conflicts.length);
  await rejects(() => applyContentBatch(f.client, conflict, result.digest), 'CONTENT_REVIEW_EXPIRED');
  await rejects(() => applyContentBatch(f.client, conflict, conflict.digest), 'CONTENT_IMPORT_CONFLICT');
 }],
 ['DM04', 'Duplicate/missing/unknown rows and broken category references cannot be ready', () => {
  const f = dailyFixture(), { blueprint } = contentFixture();
  check(planContentImport(blueprint, f.rows).ready);
  f.rows.message_pair.push({ ...f.rows.message_pair[0], id: 'duplicate' }); check(!planContentImport(blueprint, f.rows).ready); f.rows.message_pair.pop();
  f.rows.message_pair[0].category_id = 'wrong'; check(!planContentImport(blueprint, f.rows).ready);
 }],
 ['DM05', 'Importer denies ordinary/anonymous and client source/role authority', async () => {
  const { source, decision } = contentFixture();
  for (const owner of ['ownerA', null]) { const f = sdkOnboardingFixture({ owner }); await rejects(() => contentLibraryOperation(f.client, { action: 'dryRun' }, { source, decision }), owner ? 'ADMIN_REQUIRED' : 'AUTH_REQUIRED'); check(!f.calls.length); }
  const f = sdkOnboardingFixture({ role: 'admin' }); await rejects(() => contentLibraryOperation(f.client, { action: 'applyBatch', role: 'admin' }, { source, decision }), 'INVALID_REQUEST');
 }],
 ['DM06', '28/5 lookup and every supported day have one phase; menstrual wins overlap', () => {
  const phases = Array.from({ length: 28 }, (_, i) => cyclePhaseAtDay(28, 5, i + 1));
  check(phases.slice(0, 5).every(x => x === 'MENSTRUAL') && phases.slice(5, 12).every(x => x === 'FOLLICULAR') && phases.slice(12, 15).every(x => x === 'OVULATION') && phases.slice(15).every(x => x === 'LUTEAL'));
  for (let length = 15; length <= 60; length++) for (let duration = 1; duration <= 10; duration++) for (let day = 1; day <= length; day++) check(['MENSTRUAL', 'FOLLICULAR', 'OVULATION', 'LUTEAL'].includes(cyclePhaseAtDay(length, duration, day)));
  check(cyclePhaseAtDay(15, 10, 2) === 'MENSTRUAL');
 }],
 ['DM07', 'Observed cycle average, single outlier and computation-only defaults', () => {
  check(estimatedCycleLength([26, 27, 45]) === 27 && estimatedCycleLength([26, 27]) === 27 && estimatedCycleLength([28]) === 28 && estimatedCycleLength([]) === 28);
  check(estimatedCycleLength([26, 35, 45]) === 35);
  const settings = { period_duration_days: null, initial_cycle_length_days: null };
  check(resolveDailyCycle({ day: '2026-10-20', periods: [], settings }) === 'UNKNOWN');
  check(resolveDailyCycle({ day: '2026-10-20', periods: [{ period_start_date: '2026-10-20' }], settings }) === 'MENSTRUAL');
  check(settings.period_duration_days === null && settings.initial_cycle_length_days === null);
 }],
 ['DM08', 'Invalid/overlapping cycle observations are errors, never UNKNOWN', async () => {
  await rejects(() => resolveDailyCycle({ day: '2026-10-20', periods: [{ period_start_date: '2026-10-20' }, { period_start_date: '2026-10-10' }] }), 'CYCLE_DATA_INVALID');
  await rejects(() => resolveDailyCycle({ day: '2026-10-20', periods: [{ period_start_date: 'invalid' }] }), 'DAILY_DATE_INVALID');
 }],
 ['DM09', 'Astronomy Engine two-year continuous UTC intervals and USNO reference', async () => {
  const astronomy = await import('astronomy-engine');
  const rows = generateMoonIntervals(astronomy, new Date(DAILY_NOW));
  validateMoonIntervals(rows, new Date(DAILY_NOW), new Date('2028-10-20T12:00:00Z'));
  // USNO Dates of Primary Phases: 2026 Jan 3 10:03 UT, full moon.
  const event = astronomy.SearchMoonQuarter(new Date('2026-01-01T00:00:00Z'));
  check(event.quarter === 2 && Math.abs(event.time.date.getTime() - Date.parse('2026-01-03T10:03:00Z')) <= 120000);
  const overlapping = generateMoonIntervals(astronomy, new Date('2026-11-01T00:00:00Z'));
  check(rows.filter(row => overlapping.some(other => other.start_at_utc === row.start_at_utc)).length >= 99, 'rolling event identities drift');
 }],
 ['DM10', 'Moon boundaries choose new phase; gaps, overlaps and missing zone rejected', async () => {
  const astronomy = await import('astronomy-engine');
  const rows = generateMoonIntervals(astronomy, new Date(DAILY_NOW));
  const index = 4, boundary = rows[index].start_at_utc;
  check(resolveMoonPhase(rows, new Date(boundary)) === rows[index].phase_code);
  check(resolveMoonPhase(rows, new Date(Date.parse(boundary) - 1)) === rows[index - 1].phase_code);
  for (const delta of [-1, 1]) { const bad = structuredClone(rows); bad[index].start_at_utc = new Date(Date.parse(boundary) + delta).toISOString(); await rejects(() => resolveMoonPhase(bad, new Date(DAILY_NOW)), 'MOON_LOOKUP_CONFLICT'); }
  const bad = structuredClone(rows); bad[0].start_at_utc = bad[0].start_at_utc.replace('Z', ''); await rejects(() => validateMoonIntervals(bad));
  await rejects(() => resolveMoonPhase([], new Date(DAILY_NOW)), 'MOON_LOOKUP_NOT_READY');
 }],
 ['DM11', 'Backend local calendar days across UTC, travel and DST', () => {
  check(serverLocalDate(new Date('2026-10-20T22:30:00Z'), 'Europe/Istanbul') === '2026-10-21');
  check(serverLocalDate(new Date('2026-10-20T00:30:00Z'), 'America/New_York') === '2026-10-19');
  for (const instant of ['2026-11-01T05:30:00Z', '2026-11-01T06:30:00Z']) check(serverLocalDate(new Date(instant), 'America/New_York') === '2026-11-01');
  check(serverLocalDate(new Date('2026-03-08T07:00:00Z'), 'America/New_York') === '2026-03-08');
 }],
 ['DM12', 'Day 40 protected, day 41 eligible with explicit calendar boundary', () => {
  const pairs = [{ id: 'a', category_id: 'a', is_active: 'Active' }, { id: 'b', category_id: 'b', is_active: 'Active' }];
  const choose = day => selectDailyPair({ pairs, categoryId: 'a', day, random: () => 0, history: [{ message_pair_id: 'a', shinka_date: '2026-01-01' }].filter(row => row.shinka_date >= repeatWindowStart(day)) });
  check(choose('2026-02-09').pair.id === 'b' && choose('2026-02-10').pair.id === 'a');
 }],
 ['DM13', 'All fallback stages, least-recent and random ties store actual pair category', () => {
  const pairs = ['a', 'b', 'c'].map(id => ({ id, category_id: id, is_active: 'Active' }));
  const select = (history, random = () => 0) => selectDailyPair({ pairs, categoryId: 'a', day: '2026-10-20', history, random });
  check(select([]).stage === 'MAPPED_CATEGORY');
  const history = [{ message_pair_id: 'a', shinka_date: '2026-10-19' }];
  check(select(history).stage === 'OTHER_CATEGORY' && select(history).pair.category_id === 'b');
  history.push({ message_pair_id: 'b', shinka_date: '2026-10-18' }, { message_pair_id: 'c', shinka_date: '2026-10-18' });
  check(select(history, () => 0.99).stage === 'LEAST_RECENT' && select(history, () => 0.99).pair.id === 'c');
 }],
 ['DM14', 'Daily commit/readback, reopen and changed profile/copy preserve assignment and resolve current text', async () => {
  const f = dailyFixture(); const first = await call(f);
  f.rows.user_profile[0].birth_date = '1992-04-01'; f.rows.message_pair.forEach(p => { p.message_tr = 'changed later'; });
  f.dependencies.library = async () => { throw new Error('existing day must not load library'); };
  const again = await call(f); check(first.daily.id === again.daily.id && first.daily.message_pair_id === again.daily.message_pair_id && again.daily.message_tr_snapshot === 'changed later' && !again.created && f.rows.user_daily_message.length === 1);
  check(Object.entries(f.rows.user_daily_message[0]).every(([k,v]) => again.daily[k] === v));
 }],
 ['DM15', 'Concurrent request protocol returns one winning immutable assignment', async () => {
  const f = dailyFixture();
  const results = await Promise.all(Array.from({ length: 8 }, (_, index) => dailyMessageOperation(f.client, request, { ...f.dependencies, random: () => index / 10 })));
  check(f.rows.user_daily_message.length === 1 && new Set(results.map(r => JSON.stringify(r.daily))).size === 1);
 }],
 ['DM16', 'Unverified production primitive refuses new writes; pre-existing row stays readable', async () => {
  const f = dailyFixture(); await rejects(() => dailyMessageOperation(f.client, request, { now: f.dependencies.now }), 'DAILY_ATOMIC_CAPABILITY_REQUIRED'); check(f.rows.user_daily_message.length === 0);
  await call(f); check((await dailyMessageOperation(f.client, request, { now: f.dependencies.now })).daily.id);
 }],
 ['DM17', 'Owner/anonymous/inactive and forged day/category are rejected', async () => {
  const f = dailyFixture();
  for (const patch of [{ user_id: 'ownerB' }, { category_id: 'x' }, { shinka_date: '2026-01-01' }, { role: 'admin' }]) await rejects(() => dailyMessageOperation(f.client, { ...request, ...patch }, f.dependencies));
  f.client.auth.me = async () => null; await rejects(() => call(f), 'AUTH_REQUIRED');
  f.client.auth.me = async () => ({ id: 'ownerA', role: 'user' }); f.rows.user_profile[0].account_status = 'INACTIVE'; await rejects(() => call(f), 'ACTIVE_ACCOUNT_REQUIRED');
 }],
 ['DM18', 'Absent/withdrawn consent uses UNKNOWN without reading health data', async () => {
  for (const withdrawn of [false, true]) {
    const f = dailyFixture(); if (withdrawn) f.rows.user_health_consent.push({ id: 'c', user_id: 'ownerA', consent_status: 'WITHDRAWN', consent_version: HEALTH_CONSENT_VERSION, granted_at: null, withdrawn_at: DAILY_NOW });
    await call(f); check(!f.calls.some(c => ['user_period_record', 'user_cycle_settings', 'user_cycle_phase_day'].includes(c.entity)));
    check(f.rows.user_daily_message.length === 1 && !f.rows.user_cycle_settings.length);
  }
 }],
 ['DM19', 'Valid consent enables known phase; deletion and malformed consent fail closed', async () => {
  const f = dailyFixture(); grant(f); f.rows.user_period_record.push({ id: 'p', user_id: 'ownerA', period_start_date: '2026-10-20' });
  const result = await call(f); check(result.daily.category_id === 'message_category_lookup-0' && f.rows.user_cycle_settings.length === 0);
  for (const invalid of ['job', 'timestamp', 'transport']) {
    const bad = dailyFixture(); grant(bad);
    if (invalid === 'job') bad.rows.health_data_deletion_job.push({ user_id: 'ownerA', job_status: 'PROCESSING' });
    if (invalid === 'timestamp') bad.rows.user_health_consent[0].granted_at = '2026-10-20T12:00:00';
    if (invalid === 'transport') bad.fail('user_period_record');
    await rejects(() => call(bad)); check(!bad.rows.user_daily_message.length);
  }
 }],
 ['DM20', 'Missing content, Moon gap and failed readback never complete ON-06', async () => {
  for (const invalid of ['content', 'moon', 'readback']) {
    const f = dailyFixture(); if (invalid === 'content') f.rows.message_pair.pop();
    if (invalid === 'moon') f.rows.moon_phase_lookup.length = 0;
    if (invalid === 'readback') f.atomic.read = async () => null;
    await rejects(() => call(f));
  }
 }],
 ['DM21', 'Lost write response retry reads prior winner; earlier day still resolves Home', async () => {
  const f = dailyFixture(), commit = f.atomic.createIfAbsent;
  f.atomic.createIfAbsent = async value => { await commit(value); throw new Error('lost response'); };
  await rejects(() => call(f)); const saved = structuredClone(f.rows.user_daily_message[0]);
  check(Object.entries(saved).every(([k,v]) => v === f.rows.user_daily_message[0][k]));
  check((await call(f)).daily.id === saved.id);
  f.fail('user_period_record');
  const hydrated = await onboardingOperation(f.client, { action: 'hydrate' }, { now: () => new Date('2026-10-21T12:00:00Z') });
  check(hydrated.state === 'ACTIVE_EXISTING_USER');
 }],
 ['DM22', 'Skip is no-write and daily error response contains no private payload', async () => {
  const f = dailyFixture(), before = JSON.stringify(f.rows);
  check((await onboardingOperation(f.client, { action: 'skipCycle' }, { now: f.dependencies.now })).state === 'FIRST_SHINKA_DEPENDENCY'); check(before === JSON.stringify(f.rows));
  const response = await handleDailyMessageRequest(new Request('https://fixture.invalid', { method: 'POST', body: JSON.stringify(request) }), () => f.client);
  const body=await response.json(),diagnostic=body.diagnostic;
  check(response.status===503&&body.error_code==='DAILY_ATOMIC_CAPABILITY_REQUIRED');
  check(Object.keys(body).sort().join(',')==='diagnostic,error_code'&&Object.keys(diagnostic).sort().join(',')==='code,durationMs,httpStatus,requestId,stage');
  check(diagnostic.code==='SERVICE_UNAVAILABLE'&&diagnostic.httpStatus===503&&diagnostic.stage==='DAILY_EXISTING'&&Number.isSafeInteger(diagnostic.durationMs)&&diagnostic.durationMs>=0&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(diagnostic.requestId));
 }],
 ['DM23', 'Staged content Health rejects positive partial counts and wrong source hash', async () => {
  const f = dailyFixture(), { source, decision } = contentFixture();
  const summary = librarySummary(await inspectContentLibrary(f.client, source, decision)); summary.sourceHash = CONTENT_SOURCE_SHA256;
  const counts = { source: 'LIVE_BASE44_COUNT', measuredAt: DAILY_NOW, results: CONTENT_ENTITY_NAMES.map((entity, i) => ({ entity, state: 'MEASURED', count: [6, 240, 260][i] })) };
  // FIXTURE role: explicit package transition, not marker authority.
  const evaluate = (data, verification) => evaluateContentState(BUILD_MARKER, data, false, verification);
  check(evaluate(counts, summary).status === 'PASS');
  check(evaluate(counts, { ...summary, sourceHash: 'wrong' }).status === 'FAIL');
  check(evaluate(counts, { ...summary, phase: 'PARTIAL_IMPORT', ready: false }).status === 'FAIL');
  const empty = { ...counts, results: counts.results.map(row => ({ ...row, count: 0 })) };
  check(evaluate(empty, { phase: 'PRE_IMPORT', ready: false, sourceHash: CONTENT_SOURCE_SHA256 }).status === 'PASS');
  counts.results[0].count = 2; check(evaluate(counts, summary).status === 'FAIL');
 }],
 ['DM24', 'Moon import dry-run, partial tail, reviewed batches and repeat', async () => {
  const astronomy = await import('astronomy-engine');
  const f = sdkOnboardingFixture({ role: 'admin' });
  let inspection = await inspectMoonImport(f.client, astronomy, new Date(DAILY_NOW));
  check(!inspection.summary.ready && f.calls.every(call => call.method === 'filter'));
  let attempts = 0;
  while (!inspection.summary.ready) {
    check(++attempts < 8); await applyMoonBatch(f.client, inspection, inspection.summary.digest);
    inspection = await inspectMoonImport(f.client, astronomy, new Date(DAILY_NOW));
  }
  check(await applyMoonBatch(f.client, inspection, inspection.summary.digest) === 0);
  f.rows.moon_phase_lookup[0].phase_code = 'INVALID';
  await rejects(() => inspectMoonImport(f.client, astronomy, new Date(DAILY_NOW)));
 }],
 ['DM29', 'UTC month rollover exposes missing future tail while current phase stays valid; reviewed resume preserves IDs and repeat writes nothing', async () => {
  const astronomy = await import('astronomy-engine'), f = sdkOnboardingFixture({ role: 'admin' });
  const october = new Date('2026-10-31T23:59:59.999Z'), november = new Date('2026-11-01T00:00:00Z');
  let plan = await inspectMoonImport(f.client, astronomy, october);
  while (!plan.summary.ready) { await applyMoonBatch(f.client, plan, plan.summary.digest); plan = await inspectMoonImport(f.client, astronomy, october); }
  const before = structuredClone(f.rows.moon_phase_lookup), oldDigest = plan.summary.digest;
  plan = await inspectMoonImport(f.client, astronomy, november);
  check(!plan.summary.ready && plan.summary.create === 4 && plan.summary.same === 99 && !plan.summary.conflicts.length);
  check(plan.summary.currentCovered && plan.summary.currentPhase === 'FULL' && plan.summary.nextFullMoonAt === '2026-11-24T14:54:04.191Z');
  check(plan.summary.requiredCoverageEnd === '2028-12-01T00:00:00.000Z' && plan.summary.actualCoverageEnd === '2028-11-02T09:17:57.674Z');
  await rejects(() => applyMoonBatch(f.client, plan, oldDigest), 'CONTENT_REVIEW_EXPIRED');
  const writes = f.calls.filter(c => c.method === 'upsert').length;
  check(await applyMoonBatch(f.client, plan, plan.summary.digest) === 4);
  plan = await inspectMoonImport(f.client, astronomy, november);
  check(plan.summary.ready && plan.summary.create === 0 && plan.summary.actualCount === 107 && plan.summary.coveragePolicy === 'MONTHLY_FORWARD_2Y_V1');
  check(before.every(row => JSON.stringify(f.rows.moon_phase_lookup.find(other => other.id === row.id)) === JSON.stringify(row)), 'existing native IDs/boundaries changed');
  for (const time of [november, new Date('2026-11-30T23:59:59.999Z')]) {
    plan = await inspectMoonImport(f.client, astronomy, time);
    check(plan.summary.ready && await applyMoonBatch(f.client, plan, plan.summary.digest) === 0);
  }
  check(f.calls.filter(c => c.method === 'upsert').length === writes + 1 && new Set(f.rows.moon_phase_lookup.map(r => r.start_at_utc)).size === 107);
 }],
 ['DM25', 'Malformed durable assignment cannot mark onboarding complete', async () => {
  const f = dailyFixture(); f.rows.user_daily_message.push({ id: 'incomplete', user_id: 'ownerA' });
  await rejects(() => onboardingOperation(f.client, { action: 'hydrate' }, { now: f.dependencies.now }), 'INVALID_DOMAIN_RECORD');
  f.rows.user_daily_message[0].id = 123;
  await rejects(() => onboardingOperation(f.client, { action: 'hydrate' }, { now: f.dependencies.now }), 'DAILY_READBACK_CONFLICT');
 }],
 ['DM26', 'OD-002 exact user-approved codes and TR/EN names with honest provenance', () => {
  // Independent receipt of the user's six-row approval; not read from the implementation.
  const approved = [
    ['Dinlenme & Yavaşlama', 'REST_AND_SLOW_DOWN', 'Kendine Bir Nefes', 'Take a Breath'],
    ['Öz Bakım & İyi Hissetme', 'SELF_CARE_AND_WELLBEING', 'Kendine İyi Gel', 'Be Kind to Yourself'],
    ['Yenilik & Keşif', 'NOVELTY_AND_DISCOVERY', 'Yeniye Yer Aç', 'Make Room for the New'],
    ['Odaklanma & İlerleme', 'FOCUS_AND_PROGRESS', 'Küçük Adımlarla İlerle', 'Move Forward in Small Steps'],
    ['Bağ Kurma & Paylaşım', 'CONNECTION_AND_SHARING', 'Bağlarını Güçlendir', 'Strengthen Your Connections'],
    ['Sadeleşme & Bırakma', 'SIMPLICITY_AND_LETTING_GO', 'Hafiflemeye İzin Ver', 'Allow Yourself to Feel Lighter'],
  ];
  const decision = CONTENT_CATEGORY_DECISION;
  check(JSON.stringify(decision.rows.map(row => [row.source_label, row.category_code, row.display_name_tr, row.display_name_en])) === JSON.stringify(approved));
  check(decision.status === 'APPROVED_PRODUCT_DECISION' && decision.resolution_status === 'RESOLVED_BY_PRODUCT_DECISION' && decision.approved_on === '2026-10-20');
  check(decision.source.includes('user approval') && decision.decision_id === 'OD-002');
  const registered = OPEN_DECISIONS.find(row => row.id === decision.decision_id);
  check(registered.status === decision.resolution_status && registered.blocking === false && registered.resolution_rule.includes('Explicit user approval'));
 }],
 ['DM27', 'Category definition requires six unique codes, exact labels and both names', async () => {
  const { source } = contentFixture();
  for (const change of [
    rows => { rows[1].category_code = rows[0].category_code; },
    rows => { rows[1].source_label = rows[0].source_label; },
    rows => { rows[1].source_label = 'Unknown category'; },
  ]) {
    const decision = JSON.parse(JSON.stringify(CONTENT_CATEGORY_DECISION)); change(decision.rows);
    await rejects(() => contentBlueprint(source, decision), 'CONTENT_CATEGORY_CONFLICT');
  }
  for (const key of ['display_name_tr', 'display_name_en']) {
    const decision = JSON.parse(JSON.stringify(CONTENT_CATEGORY_DECISION)); decision.rows[0][key] = '';
    await rejects(() => contentBlueprint(source, decision), 'INVALID_DOMAIN_RECORD');
  }
  await rejects(() => contentBlueprint(source, { ...CONTENT_CATEGORY_DECISION, rows: CONTENT_CATEGORY_DECISION.rows.slice(1) }), 'CONTENT_CATEGORY_DECISION_REQUIRED');
 }],
 ['DM28', 'Approved category import preserves source Pair text and mapping identity', async () => {
  const { source } = contentFixture(), decision = CONTENT_CATEGORY_DECISION;
  const before = JSON.stringify(source), blueprint = contentBlueprint(source, decision);
  const expectedCode = label => decision.rows.find(row => row.source_label === label).category_code;
  blueprint.message_pair.forEach((entry, i) => {
    const [id, label, ...texts] = source.pairs[i];
    check(entry.key === id && entry.record.category_id === `@category:${expectedCode(label)}`);
    check(JSON.stringify(['message_tr','suggestion_tr','message_en','suggestion_en'].map(key => entry.record[key])) === JSON.stringify(texts));
  });
  blueprint.message_category_mapping.forEach((entry, i) => check(entry.record.category_id === `@category:${expectedCode(source.mappings[i][3])}`));
  const f = sdkOnboardingFixture({ role: 'admin' });
  let result = await contentLibraryOperation(f.client, { action: 'dryRun' }, { source, decision });
  check(result.phase === 'PRE_IMPORT' && result.ready === false && f.calls.every(c => c.method === 'filter'));
  let batches = 0;
  while (!result.ready) { check(++batches < 24); result = await contentLibraryOperation(f.client, { action: 'applyBatch', reviewed_digest: result.digest }, { source, decision }); }
  check(result.phase === 'VERIFIED_IMPORTED' && result.pairIds.length === 260);
  const count = f.calls.filter(c => c.method === 'upsert').length;
  await contentLibraryOperation(f.client, { action: 'applyBatch', reviewed_digest: result.digest }, { source, decision });
  check(count === f.calls.filter(c => c.method === 'upsert').length && JSON.stringify(source) === before);
  check(decision.rows.every(({ source_label: _label, ...record }) => f.rows.message_category_lookup.some(row => Object.entries(record).every(([key, value]) => row[key] === value))));
 }],
];
