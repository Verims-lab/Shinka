import { InternalError } from './internalAuthorization.js';
import { calendarReader } from './base44CalendarReader.js';
import { calendarRevision, validateCalendarAccess, validateCalendarHealth } from './calendarState.js';
import { validatePeriodChange, validatePeriodDate } from './calendarCalculation.js';
import { resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { completeCalendarGrant } from './nativeCalendarGrant.js';
import { hashToolValue } from './adminTestPolicy.js';
import { calendarResultMatches, calendarResultRevisionMatches } from './calendarActionStatus.js';

const fail = code => { throw new InternalError(code, 409); };
const fingerprint = body => hashToolValue([body.action, body.period_id ?? null, body.date ?? null, body.health_consent === true]);
const intentFields = ['id','user_id','action_id','fingerprint','base_revision','operation','period_id','desired_date','previous_date','initial_grant','grant_at','started_at'];
const signature = row => JSON.stringify(intentFields.map(key => row?.[key] ?? null));
// Receipts are durable intent/result evidence, not a lock or multi-row transaction.
export async function nativeCalendarChange(client, principal, body, now, stage = (_name) => {}) {
  stage('CALENDAR_RECEIPT_READ');
  const owner = principal.id, entities = client.asServiceRole.entities, journal = entities.UserCalendarAction;
  let receiptActionId = body.action_id;
  const lookup = async () => {
    const rows = await journal.filter({ user_id: owner, action_id: receiptActionId }, 'id', 3);
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => row.user_id !== owner)) fail('CALENDAR_ACTION_CONFLICT');
    return rows[0] || null;
  };
  let receipt = await lookup();
  if (body.action === 'resume') {
    if (!receipt || !['PENDING','APPLIED'].includes(receipt.status) || body.revision !== receipt.base_revision) fail('CALENDAR_STATE_CHANGED');
    const original = { ...body, action: receipt.operation, date: receipt.desired_date, period_id: receipt.period_id, health_consent: false };
    // initial_grant describes the server's consent state, not necessarily the
    // original checkbox payload. Recover that bit from the saved fingerprint.
    if (await fingerprint(original) !== receipt.fingerprint) original.health_consent = true;
    if (receipt.initial_grant && !original.health_consent) fail('ACTION_CONFLICT');
    body = original;
  }
  const digest = await fingerprint(body);
  if (!receipt) {
    const pending = await journal.filter({ user_id: owner, status: 'PENDING' }, 'id', 3);
    if (!Array.isArray(pending) || pending.length > 1 || pending.some(row => row.user_id !== owner || row.fingerprint !== digest)) fail('CALENDAR_ACTION_CONFLICT');
    if (pending.length) { receipt = pending[0]; receiptActionId = receipt.action_id; }
  }
  if (receipt && receipt.fingerprint !== digest) fail('ACTION_CONFLICT');
  if (receipt && (!['PENDING','APPLIED'].includes(receipt.status) || receipt.base_revision !== body.revision)) fail('CALENDAR_STATE_CHANGED');
  let expected = signature(receipt);
  const freshReceipt = async () => {
    const saved = await lookup();
    if (!saved || signature(saved) !== expected || !['PENDING','APPLIED'].includes(saved.status)) fail('CALENDAR_STATE_CHANGED');
    return saved;
  };
  const rivals = async () => {
    const rows = await journal.filter({ user_id: owner, base_revision: receipt.base_revision, status: { $ne: 'CANCELLED' } }, 'id', 101);
    if (!Array.isArray(rows) || rows.length > 100 || rows.some(row => row.user_id !== owner || row.fingerprint !== digest)) fail('CALENDAR_ACTION_CONFLICT');
    const pending = await journal.filter({ user_id: owner, status: 'PENDING' }, 'id', 3);
    if (!Array.isArray(pending) || pending.length > 1 || pending.some(row => row.user_id !== owner || row.id !== receipt.id)) fail('CALENDAR_ACTION_CONFLICT');
  };
  const reader = calendarReader(client, principal);
  const assertDate = async () => {
    const preferences = await reader.preferences();
    validatePeriodDate(body.action, body.date, serverLocalDate(now(), resolveTimezone(body.timezone, preferences?.timezone)));
  };
  await assertDate();
  const sameResult = state => calendarResultMatches(state, { operation: body.action, period_id: body.period_id, desired_date: body.date });
  const finish = async state => {
    stage('CALENDAR_RESULT_VERIFY');
    await assertDate(); validateCalendarHealth(state, owner);
    if (!validateCalendarAccess(state, owner) || !sameResult(state)) fail('CALENDAR_READBACK_CONFLICT');
    // Complete grants reuse their exact original event/timestamp; normal
    // changes must reproduce the original revision when this change is reversed.
    if (!await calendarResultRevisionMatches(state, receipt)) fail(receipt.initial_grant ? 'CONSENT_STATE_CHANGED' : 'CALENDAR_STATE_CHANGED');
    await client.auth.me();
    await rivals();
    const access = await reader.access();
    for (const key of ['profile','consent','events','jobs']) if (JSON.stringify(access[key]) !== JSON.stringify(state[key])) fail('CONSENT_STATE_CHANGED');
    const resultRevision = await calendarRevision(state), saved = await freshReceipt();
    if (saved.status === 'APPLIED') {
      if (saved.result_revision !== resultRevision) fail('CALENDAR_STATE_CHANGED');
      return state;
    }
    stage('CALENDAR_RECEIPT_FINISH');
    // Narrow predicate fences changed/cancelled receipts. Ordinary SDK updateMany
    // is NOT assumed to be linearizable CAS; fresh readback still decides success.
    const predicate = Object.fromEntries(intentFields.map(key => [key, receipt[key] ?? null]));
    const result = await journal.updateMany({ ...predicate, status: 'PENDING' }, { $set: { status: 'APPLIED', result_revision: resultRevision } });
    if (result?.success !== true || ![0,1].includes(result.updated) || result.has_more !== false) fail('CALENDAR_WRITE_UNCONFIRMED');
    stage('CALENDAR_RECEIPT_VERIFY');
    const final = await freshReceipt();
    if (final.status !== 'APPLIED' || final.result_revision !== resultRevision) fail('CALENDAR_READBACK_CONFLICT');
    await rivals(); await client.shinkaAssertWritable?.();
    return state;
  };
  const recoverGrant = async () => {
    if ((await freshReceipt()).status !== 'PENDING') fail('CALENDAR_STATE_CHANGED');
    await rivals(); stage('CALENDAR_GRANT');
    await completeCalendarGrant(client, owner, receipt, assertDate);
    stage('CALENDAR_READBACK');
    return finish(await reader.confirmedSnapshot());
  };
  stage('CALENDAR_SNAPSHOT');
  let state;
  try { state = await reader.confirmedSnapshot(); }
  catch (error) {
    if (error.code !== 'CONSENT_EVENT_UNCONFIRMED' || receipt?.status !== 'PENDING' || !receipt.initial_grant || body.health_consent !== true) throw error;
    return recoverGrant();
  }
  const revision = await calendarRevision(state);
  if (receipt?.status === 'APPLIED') {
    if (receipt.result_revision !== revision || !sameResult(state)) fail('CALENDAR_STATE_CHANGED');
    await freshReceipt(); await rivals();
    return state;
  }
  if (receipt && validateCalendarAccess(state, owner) && sameResult(state)) return finish(state);
  // A verified same-receipt partial grant may have advanced the revision before
  // the period write. All incomplete grant safeguards stay inside its helper.
  if (receipt?.initial_grant && body.health_consent === true && state.consent?.consent_status === 'GRANTED' && state.consent.granted_at === receipt.grant_at) return recoverGrant();
  if (revision !== (receipt?.base_revision || body.revision)) fail('CALENDAR_STATE_CHANGED');
  const today = serverLocalDate(now(), resolveTimezone(body.timezone, state.preferences?.timezone));
  const consent = validateCalendarAccess(state, owner);
  if (!consent && (body.action !== 'add' || body.health_consent !== true)) fail('HEALTH_CONSENT_REQUIRED');
  validateCalendarHealth(state, owner);
  validatePeriodChange(state.periods, body.action, body.period_id, body.date, today);
  if (!receipt) {
    stage('CALENDAR_RECEIPT_CREATE'); await client.shinkaAssertWritable?.();
    await journal.create({ user_id: owner, action_id: body.action_id, fingerprint: digest, base_revision: revision,
      operation: body.action, ...(body.period_id ? { period_id: body.period_id } : {}), ...(body.date ? { desired_date: body.date } : {}),
      ...(body.period_id ? { previous_date: state.periods.find(row => row.id === body.period_id).period_start_date } : {}),
      initial_grant: !consent, ...(!consent ? { grant_at: now().toISOString() } : {}), status: 'PENDING', started_at: now().toISOString() });
    receipt = await lookup();
    if (!receipt || receipt.fingerprint !== digest || receipt.base_revision !== revision) fail('CALENDAR_ACTION_CONFLICT');
    expected = signature(receipt);
  }
  await rivals();
  if (!consent) return recoverGrant();
  stage('CALENDAR_PREFLIGHT');
  state = await reader.confirmedSnapshot();
  if (await calendarRevision(state) !== revision) fail('CALENDAR_STATE_CHANGED');
  await client.shinkaAssertWritable?.();
  if ((await freshReceipt()).status !== 'PENDING') fail('CALENDAR_STATE_CHANGED');
  await assertDate();
  stage('CALENDAR_PERIOD_WRITE');
  if (body.action === 'add') await entities.UserPeriodRecord.create({ user_id: owner, period_start_date: body.date });
  else {
    const before = state.periods.find(row => row.id === body.period_id), query = { id: before.id, user_id: owner, period_start_date: before.period_start_date };
    if (body.action === 'edit') {
      const result = await entities.UserPeriodRecord.updateMany(query, { $set: { period_start_date: body.date } });
      if (result?.success !== true || result.updated !== 1 || result.has_more !== false) fail('CALENDAR_WRITE_UNCONFIRMED');
    } else {
      const result = await entities.UserPeriodRecord.deleteMany(query);
      if (result?.success !== true || result.deleted !== 1) fail('CALENDAR_WRITE_UNCONFIRMED');
    }
  }
  stage('CALENDAR_READBACK');
  return finish(await reader.confirmedSnapshot());
}
