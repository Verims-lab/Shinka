import { check } from './dataModelTests';
import { cycleEstimate, resolveDailyCycle } from '../../../base44/shared/dailyCycle.js';
import { calculateCalendar, addCalendarDays } from '../../../base44/shared/calendarCalculation.js';
import { calendarFixture } from './calendarFixture';
import { dailyFixture } from './dailyFixture';
import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';

const history = (intervals, start = '2026-01-01') => {
  const rows = [{ id: 'start-0', user_id: 'ownerA', period_start_date: start }];
  intervals.forEach((days, i) => rows.push({ id: `start-${i + 1}`, user_id: 'ownerA', period_start_date: addCalendarDays(rows.at(-1).period_start_date, days) }));
  return rows;
};
const rejects = async (run, code) => {
  try { await run(); } catch (error) { check(error.code === code, `${error.code} != ${code}`); return; }
  throw new Error(`Expected ${code}`);
};
/** @type {import('./testTypes').FoundationTest[]} */
export const CYCLE_RANGE_TESTS = [
  ['CR01', 'OD-012 filters after the last-three window; no older backfill or invented dates', () => {
    const periods = history([28, 61, 62, 63]), before = JSON.stringify(periods);
    const result = calculateCalendar({ periods, today: periods.at(-1).period_start_date, settings: { initial_cycle_length_days: 29 } });
    check(result.estimate.length === null && !result.predictions.length && result.coverageEnd === null);
    check(result.phases.length === 28 && result.phases.every(row => row.reference_period_id === 'start-0'));
    check(JSON.stringify(periods) === before && result.observations.map(row => row.days).join() === '28,61,62,63');
    check(resolveDailyCycle({ day: periods.at(-1).period_start_date, periods: periods.slice(-4) }) === 'UNKNOWN');
  }],
  ['CR02', 'Empty history differs from unsupported history; inclusive 15/60, mean/outlier and half-up remain', async () => {
    check(cycleEstimate([]).length === 28 && cycleEstimate([], 31).length === 31);
    check(cycleEstimate([61], 31).length === null && cycleEstimate([61, 90, 61]).length === null);
    check(cycleEstimate([15, 60, 61]).length === 38 && cycleEstimate([61, 26, 27]).length === 27);
    check(cycleEstimate([26, 27, 45]).length === 27 && cycleEstimate([26, 35, 45]).length === 35);
    check(cycleEstimate([26, 61, 90]).length === 26 && cycleEstimate([60]).length === 60);
    await rejects(() => cycleEstimate([14, 61]), 'CYCLE_DATA_INVALID');
    await rejects(() => cycleEstimate([NaN]), 'CYCLE_DATA_INVALID');
    await rejects(() => cycleEstimate([28, 28, 28, 28]), 'CYCLE_DATA_INVALID');
  }],
  ['CR03', 'Mixed supported/unsupported real cycles keep history; no phases inside >60-day closed interval', () => {
    const periods = history([26, 61, 27]), today = periods.at(-1).period_start_date;
    const result = calculateCalendar({ periods, today, settings: { period_duration_days: null, initial_cycle_length_days: null } });
    check(result.estimate.length === 27 && result.estimate.used.join() === '26,27' && result.estimate.excluded.join() === '61');
    check(!result.phases.some(row => row.reference_period_id === 'start-1'));
    check(result.phases.filter(row => row.reference_period_id === 'start-0').length === 26);
    check(result.phases.filter(row => row.reference_period_id === 'start-2').length === 27);
    check(result.predictions.length === 3 && resolveDailyCycle({ day: today, periods }) === 'MENSTRUAL');
  }],
  ['CR04', 'Accepted long add/edit remove stale current predictions; null settings, grant and daily stay unchanged', async () => {
    const f = calendarFixture();
    f.rows.user_cycle_settings.push({ id: 'settings', user_id: 'ownerA', period_duration_days: null, initial_cycle_length_days: null });
    await f.change('add', { date: '2026-01-01' });
    const settings = JSON.stringify(f.rows.user_cycle_settings), consent = JSON.stringify(f.rows.user_health_consent);
    check(f.rows.user_cycle_prediction.length > 0);
    const result = await f.change('add', { date: '2026-04-01' });
    check(result.mutationConfirmed && result.calculationNotice === 'CYCLE_ESTIMATE_UNAVAILABLE' && !result.calculationError);
    check(!f.rows.user_cycle_prediction.length && !f.rows.user_cycle_phase_day.length);
    const id = f.rows.user_period_record[1].id;
    await f.change('edit', { period_id: id, date: '2026-05-01' });
    check(f.rows.user_period_record[1].id === id && f.rows.user_period_record[1].period_start_date === '2026-05-01');
    check(JSON.stringify(f.rows.user_cycle_settings) === settings && JSON.stringify(f.rows.user_health_consent) === consent);
    await f.change('edit', { period_id: id, date: '2026-02-01' });
    check(f.rows.user_cycle_prediction.length > 0 && !(await f.request('read')).calculationNotice);
  }],
  ['CR05', 'Long-interval partial transaction failure and retry use the existing receipt model', async () => {
    const f = calendarFixture(); await f.change('add', { date: '2026-01-01' });
    const before = JSON.stringify(f.rows), view = await f.request('read');
    const body = { date: '2026-04-01', revision: view.revision, action_id: 'range-retry-000001' };
    f.fault('beforeCommit');
    await rejects(() => f.request('add', body), 'CALENDAR_OPERATION_FAILED');
    check(JSON.stringify(f.rows) === before);
    f.fault('lostResponse'); await rejects(() => f.request('add', body), 'CALENDAR_OPERATION_FAILED');
    const saved = JSON.stringify(f.rows); f.fault(null);
    check((await f.request('add', body)).calculationNotice === 'CYCLE_ESTIMATE_UNAVAILABLE');
    check(JSON.stringify(f.rows) === saved && f.rows.user_period_record.length === 2);
  }],
  ['CR06', 'Home generates UNKNOWN for unsupported window; existing daily snapshot never changes', async () => {
    const f = dailyFixture(), consent = calendarFixture();
    f.rows.user_health_consent = structuredClone(consent.rows.user_health_consent);
    f.rows.user_health_consent_event = structuredClone(consent.rows.user_health_consent_event);
    f.rows.user_period_record = history([61, 62, 63]);
    const result = await dailyMessageOperation(f.client, { action: 'today' }, f.dependencies);
    const mapping = f.rows.message_category_mapping.find(row => row.sun_sign_code === 'CAPRICORN' && row.moon_phase_code === 'NEW' && row.cycle_phase_code === 'UNKNOWN');
    check(result.persisted && result.daily.category_id === mapping.category_id);
    const saved = JSON.stringify(f.rows.user_daily_message);
    f.rows.user_period_record = history([28, 28, 28]);
    await dailyMessageOperation(f.client, { action: 'today' }, f.dependencies);
    check(JSON.stringify(f.rows.user_daily_message) === saved);
  }],
  ['CR07', 'Unsupported observations do not conceal invalid duration, access, consent or storage errors', async () => {
    const periods = history([61]);
    await rejects(() => resolveDailyCycle({ day: '2026-10-20', periods, settings: { period_duration_days: 11 } }), 'CYCLE_DATA_INVALID');
    /** @type {Array<[(f: ReturnType<typeof calendarFixture>) => void, string]>} */
    const guards = [
      [f => { f.rows.user_profile[0].account_status = 'INACTIVE'; }, 'ACTIVE_ACCOUNT_REQUIRED'],
      [f => { f.rows.user_health_consent_event.length = 0; }, 'CONSENT_EVENT_UNCONFIRMED'],
      [f => { f.rows.health_data_deletion_job.push({ id: 'open', user_id: 'ownerA', job_status: 'PENDING' }); }, 'HEALTH_DELETION_PENDING'],
    ];
    for (const [change, code] of guards) {
      const f = calendarFixture(); f.rows.user_period_record = periods; change(f);
      await rejects(() => f.request('read'), code);
    }
    const f = calendarFixture(); f.rows.user_period_record = periods;
    f.client.asServiceRole.entities.UserPeriodRecord.filter = async () => { throw new Error('storage unavailable'); };
    try { await f.request('read'); throw new Error('unexpected success'); }
    catch (error) { check(error.message !== 'unexpected success'); }
  }],
];
