import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { requireAuthenticatedUser, InternalError } from '../../../base44/shared/internalAuthorization.js';
import { calendarReader } from '../../../base44/shared/base44CalendarReader.js';
import { calendarRevision, validateCalendarAccess } from '../../../base44/shared/calendarState.js';
import { calendarOperation } from '../../../base44/shared/calendarOperation.js';
import { HEALTH_CONSENT_VERSION } from '../../../base44/shared/onboardingDependencies.js';

export const CALENDAR_NOW = '2026-10-20T12:00:00.000Z';
// Isolated model of a durable transaction/receipt store. Shared between fixture
// workers only; NOT an implementation or evidence of Base44 transactions.
export function calendarFixture({ granted = true } = {}) {
  const f = sdkOnboardingFixture();
  f.rows.user_profile.push({ id: 'profile', user_id: 'ownerA', account_status: 'ACTIVE', birth_date: '1990-03-21', sun_sign_code: 'ARIES' });
  f.rows.user_preferences.push({ id: 'preferences', user_id: 'ownerA', language_code: 'en', notifications_enabled: false, notification_time: '06:00', timezone: 'Europe/Istanbul' });
  if (granted) {
    f.rows.user_health_consent.push({ id: 'consent', user_id: 'ownerA', consent_status: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, granted_at: '2026-01-01T12:00:00.000Z', withdrawn_at: null });
    f.rows.user_health_consent_event.push({ id: 'grant', user_id: 'ownerA', event_type: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, occurred_at: '2026-01-01T12:00:00.000Z' });
  }
  let queue = Promise.resolve(), seq = 0, fault = null, calculationDay = '2026-10-20';
  const receipts = new Map();
  const snapshot = async () => {
    const principal = await requireAuthenticatedUser(f.client);
    const value = await calendarReader(f.client, principal).snapshot();
    return { ...value,
      events: structuredClone(f.rows.user_health_consent_event.filter(row => row.user_id === principal.id)),
      periods: structuredClone(f.rows.user_period_record.filter(row => row.user_id === principal.id)),
      settings: structuredClone(f.rows.user_cycle_settings.find(row => row.user_id === principal.id) || null),
      predictions: structuredClone(f.rows.user_cycle_prediction.filter(row => row.user_id === principal.id)),
      phases: structuredClone(f.rows.user_cycle_phase_day.filter(row => row.user_id === principal.id)),
      completedDeletion: f.rows.health_data_deletion_job.filter(row => row.user_id === principal.id && row.job_status === 'COMPLETED').sort((a,b)=>b.completed_at.localeCompare(a.completed_at))[0] || null,
    };
  };
  const worker = () => ({
    transactCalendar(request) {
      const work = queue.then(async () => {
        const before = await snapshot();
        const prior = receipts.get(`${request.owner}/${request.actionId}`);
        if (prior) {
          if (prior.fingerprint !== request.fingerprint) throw new InternalError('ACTION_CONFLICT', 409);
          if (!validateCalendarAccess(before, request.owner)) throw new InternalError('HEALTH_CONSENT_REQUIRED', 403);
          return { status: 'REPLAYED', snapshot: before, revision: await calendarRevision(before), committedRevision: prior.revision, calculationDay };
        }
        if (await calendarRevision(before) !== request.revision) throw new InternalError('WRITE_CONFLICT', 409);
        const plan = request.reduce(before, () => `calendar-fixture-${++seq}`), next = plan.snapshot;
        const revision = await calendarRevision(next);
        if (fault === 'beforeCommit') throw new InternalError('CALENDAR_OPERATION_FAILED', 503);
        // Single publication in this model; no Base44 write sequence is invoked.
        const replacements = { user_health_consent: [next.consent], user_health_consent_event: next.events, user_period_record: next.periods, user_cycle_prediction: next.predictions, user_cycle_phase_day: next.phases };
        for (const [entity, rows] of Object.entries(replacements)) f.rows[entity] = [...f.rows[entity].filter(row => row.user_id !== request.owner), ...structuredClone(rows)];
        calculationDay = plan.calculationDay;
        receipts.set(`${request.owner}/${request.actionId}`, { fingerprint: request.fingerprint, revision });
        if (fault === 'lostResponse') throw new InternalError('CALENDAR_OPERATION_FAILED', 503);
        return { status: 'COMMITTED', snapshot: next, revision, committedRevision: revision, calculationDay };
      });
      queue = work.then(() => undefined, () => undefined);
      return work;
    },
  });
  const atomic = worker();
  const request = (action, body = {}) => calendarOperation(f.client, { action, timezone: 'Europe/Istanbul', ...body }, { atomic, now: () => new Date(CALENDAR_NOW) });
  const change = async (action, body = {}) => {
    const current = await request('read');
    return request(action, { month: current.month, revision: current.revision, action_id: crypto.randomUUID(), ...body });
  };
  return { ...f, worker, request, change, snapshot, fault: value => { fault = value; } };
}
