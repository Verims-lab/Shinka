import { InternalError } from './internalAuthorization.js';
import { calendarReader } from './base44CalendarReader.js';
import { calendarRevision, validateCalendarAccess, validateCalendarHealth } from './calendarState.js';
import { validatePeriodChange, validatePeriodDate } from './calendarCalculation.js';
import { resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { completeCalendarGrant } from './nativeCalendarGrant.js';
import { hashToolValue } from './adminTestPolicy.js';
import { calendarResultMatches } from './calendarActionStatus.js';

const fail = code => { throw new InternalError(code, 409); };
const fingerprint = body => hashToolValue([body.action, body.period_id ?? null, body.date ?? null, body.health_consent === true]);
// This receipt records intent/result, not a lock or an atomic commit. Dates are
// health data: backend-only, owner/consent scoped, included in health cleanup.
export async function nativeCalendarChange(client, principal, body, now, stage = (_name) => {}) {
  stage('CALENDAR_RECEIPT_READ');
  const owner = principal.id, entities = client.asServiceRole.entities;
  const journal = entities.UserCalendarAction;
  let receiptActionId = body.action_id;
  const lookup = async () => {
    const rows = await journal.filter({ user_id: owner, action_id: receiptActionId }, 'id', 3);
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => row.user_id !== owner)) fail('CALENDAR_ACTION_CONFLICT');
    return rows[0] || null;
  };
  if (body.action === 'resume') {
    const saved = await lookup();
    if (!saved || !['PENDING', 'APPLIED'].includes(saved.status)) fail('CALENDAR_STATE_CHANGED');
    body = { ...body, action: saved.operation, date: saved.desired_date, period_id: saved.period_id, health_consent: saved.initial_grant, revision: saved.base_revision };
  }
  const digest = await fingerprint(body);
  let receipt = await lookup();
  if (!receipt) {
    const pending = await journal.filter({ user_id: owner, fingerprint: digest, status: 'PENDING' }, 'id', 3);
    if (!Array.isArray(pending) || pending.length > 1 || pending.some(row => row.user_id !== owner)) fail('CALENDAR_ACTION_CONFLICT');
    if (pending.length) { receipt = pending[0]; receiptActionId = receipt.action_id; }
  }
  if (receipt?.status === 'CANCELLED') fail('CALENDAR_STATE_CHANGED');
  if (receipt && receipt.fingerprint !== digest) fail('ACTION_CONFLICT');
  const reader = calendarReader(client, principal);
  // Server date is checked before any receipt/grant recovery, including APPLIED replay.
  // Read preferences independently: a partial grant may not yet have its event.
  const assertDate = async () => {
    const preferences = await reader.preferences();
    validatePeriodDate(body.action, body.date, serverLocalDate(now(), resolveTimezone(body.timezone, preferences?.timezone)));
  };
  await assertDate();
  // Recover the same explicit initial grant after consent/event/period failure.
  if (receipt?.status === 'PENDING' && receipt.initial_grant && body.health_consent === true) {
    stage('CALENDAR_GRANT');
    await completeCalendarGrant(client, owner, receipt, assertDate);
  }
  stage('CALENDAR_SNAPSHOT');
  let state = await reader.confirmedSnapshot();
  const revision = await calendarRevision(state);
  const sameResult = state => calendarResultMatches(state, { operation: body.action, period_id: body.period_id, desired_date: body.date });
  const finish = async state => {
    stage('CALENDAR_READBACK');
    await assertDate();
    validateCalendarHealth(state, owner);
    if (!validateCalendarAccess(state, owner) || !sameResult(state)) fail('CALENDAR_READBACK_CONFLICT');
    await client.auth.me();
    const resultRevision = await calendarRevision(state);
    if ((await lookup())?.status !== 'PENDING') fail('CALENDAR_STATE_CHANGED');
    stage('CALENDAR_RECEIPT_FINISH');
    await journal.update(receipt.id, { status: 'APPLIED', result_revision: resultRevision });
    const saved = await lookup();
    if (saved?.status !== 'APPLIED' || saved.result_revision !== resultRevision) fail('CALENDAR_READBACK_CONFLICT');
    await client.shinkaAssertWritable?.();
    return state;
  };
  if (receipt?.status === 'APPLIED') {
    if (receipt.result_revision !== revision || !sameResult(state)) fail('CALENDAR_STATE_CHANGED');
    return state;
  }
  if (receipt && sameResult(state) && (receipt.initial_grant || body.action !== 'delete' || receipt.previous_date)) return finish(state);
  if (revision !== (receipt?.base_revision || body.revision)) fail('CALENDAR_STATE_CHANGED');
  const timezone = resolveTimezone(body.timezone, state.preferences?.timezone);
  const today = serverLocalDate(now(), timezone);
  const consent = validateCalendarAccess(state, owner);
  if (!consent && (body.action !== 'add' || body.health_consent !== true)) fail('HEALTH_CONSENT_REQUIRED');
  validateCalendarHealth(state, owner);
  validatePeriodChange(state.periods, body.action, body.period_id, body.date, today);
  if (!receipt) {
    stage('CALENDAR_RECEIPT_CREATE');
    await client.shinkaAssertWritable?.();
    await journal.create({ user_id: owner, action_id: body.action_id, fingerprint: digest, base_revision: revision,
      operation: body.action, ...(body.period_id ? { period_id: body.period_id } : {}), ...(body.date ? { desired_date: body.date } : {}),
      ...(body.period_id ? { previous_date: state.periods.find(row => row.id === body.period_id).period_start_date } : {}),
      initial_grant: !consent, ...(!consent ? { grant_at: now().toISOString() } : {}), status: 'PENDING', started_at: now().toISOString() });
    receipt = await lookup();
    if (!receipt || receipt.fingerprint !== digest) fail('CALENDAR_ACTION_CONFLICT');
  }
  // Detect visible competing intents on the same screen revision. A filtered
  // update is not advertised as linearizable CAS; a later reader may find a race.
  const rivals = await journal.filter({ user_id: owner, base_revision: revision, status: { $ne: 'CANCELLED' } }, 'id', 101);
  if (!Array.isArray(rivals) || rivals.length > 100 || rivals.some(row => row.user_id !== owner || row.fingerprint !== digest)) fail('CALENDAR_ACTION_CONFLICT');
  if (!consent) {
    stage('CALENDAR_GRANT');
    await completeCalendarGrant(client, owner, receipt, assertDate);
    return finish(await reader.confirmedSnapshot());
  }
  stage('CALENDAR_PREFLIGHT');
  state = await reader.confirmedSnapshot();
  if (await calendarRevision(state) !== revision) fail('CALENDAR_STATE_CHANGED');
  await client.shinkaAssertWritable?.();
  if ((await lookup())?.status !== 'PENDING') fail('CALENDAR_STATE_CHANGED');
  await assertDate();
  stage('CALENDAR_PERIOD_WRITE');
  if (body.action === 'add') await entities.UserPeriodRecord.create({ user_id: owner, period_start_date: body.date });
  else {
    const before = state.periods.find(row => row.id === body.period_id);
    const query = { id: before.id, user_id: owner, period_start_date: before.period_start_date };
    if (body.action === 'edit') {
      const result = await entities.UserPeriodRecord.updateMany(query, { $set: { period_start_date: body.date } });
      if (result?.success !== true || result.updated !== 1 || result.has_more !== false) fail('CALENDAR_WRITE_UNCONFIRMED');
    } else {
      const result = await entities.UserPeriodRecord.deleteMany(query);
      if (result?.success !== true || result.deleted !== 1) fail('CALENDAR_WRITE_UNCONFIRMED');
    }
  }
  stage('CALENDAR_READBACK');
  const after = await reader.confirmedSnapshot();
  const competing = await journal.filter({ user_id: owner, base_revision: revision, status: { $ne: 'CANCELLED' } }, 'id', 101);
  if (!Array.isArray(competing) || competing.length > 100 || competing.some(row => row.user_id !== owner || row.fingerprint !== digest)) fail('CALENDAR_ACTION_CONFLICT');
  return finish(after);
}
