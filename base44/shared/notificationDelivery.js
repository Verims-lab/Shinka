import { validateDomainRecord } from './domainValidation.js';
import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { notificationEligible, notificationFail as fail, NOTIFICATION_TYPE, NOTIFICATION_LIMITS, retryAt, currentNotificationDay } from './notificationPolicy.js';

const active = new Map(); // One worker only; not a distributed lock.
const terminal = new Set(['ACCEPTED','PERMANENT','UNKNOWN','INELIGIBLE']);
export async function deliverDailyNotification({ client, owner, daily, window, admit, provider, now = () => new Date() }) {
  const key = `${owner}:${window.day}`;
  if (active.has(key)) return active.get(key);
  const work = dispatch({ client, owner, daily, window, admit, provider, now });
  active.set(key, work);
  try { return await work; } finally { active.delete(key); }
}
async function dispatch({ client, owner, daily, window, admit, provider, now }) {
  const store = client.asServiceRole.entities.NotificationDelivery;
  const read = async () => {
    const rows = await store.filter({ user_id: owner, notification_type: NOTIFICATION_TYPE, $or: [{ shinka_date: window.day }, { daily_message_id: daily.id }] }, 'id', 11, 0, ['id',...Object.keys(DOMAIN_SCHEMAS.notification_delivery.properties)]);
    if (!Array.isArray(rows) || rows.length > 10 || rows.some(row => !row.id || row.user_id !== owner || row.notification_type !== NOTIFICATION_TYPE)) fail('NOTIFICATION_RECONCILIATION_BLOCKED');
    for (const row of rows) validateDomainRecord('notification_delivery', Object.fromEntries(Object.keys(DOMAIN_SCHEMAS.notification_delivery.properties).map(key => [key,row[key]])));
    const ids = [...new Set(rows.map(row=>row.daily_message_id))];
    if (ids.length) {
      const linked = await client.asServiceRole.entities.UserDailyMessage.filter({user_id:owner,id:{$in:ids}},'id',ids.length+1,0,['id','user_id','shinka_date']);
      if (!Array.isArray(linked) || linked.length !== ids.length || new Set(linked.map(r=>r.id)).size !== ids.length || linked.some(r=>r.user_id!==owner||!ids.includes(r.id)) || rows.some(row=>!linked.some(r=>r.id===row.daily_message_id&&(!row.shinka_date||r.shinka_date===row.shinka_date)))) fail('NOTIFICATION_RECONCILIATION_BLOCKED');
    }
    return rows.sort((a,b) => a.id.localeCompare(b.id));
  };
  const eligible = async (state = null) => {
    const { preferences } = state || await admit();
    if (preferences.timezone !== window.timezone || !currentNotificationDay(now(), preferences.timezone, window.day)) return { reason:'NOTIFICATION_WINDOW_CHANGED', preferences };
    const device = await provider.eligibility(owner);
    return { reason: notificationEligible(preferences, device), preferences };
  };
  const admitted = await admit();
  let rows = await read();
  const protectedRow = rows.find(row => terminal.has(row.dispatch_state) || ['SENT','SKIPPED'].includes(row.delivery_status) || row.dispatch_state === 'IN_FLIGHT');
  if (protectedRow) return { state: protectedRow.dispatch_state || protectedRow.delivery_status };
  // Settled/uncertain rows still require fresh owner admission and validation,
  // but cannot send, so they need no device/provider eligibility lookup.
  const first = await eligible(admitted);
  let row = rows[0];
  if (first.reason) {
    if (row) await store.update(row.id, { delivery_status:'SKIPPED',dispatch_state:'INELIGIBLE',error_code:first.reason,error_stage:'ADMISSION' });
    return { state:'INELIGIBLE', code:first.reason };
  }
  if (!row) {
    // Readback on the next bounded scheduler pass leaves competing candidates
    // visible before dispatch. There is still no native unique/CAS guarantee.
    await store.create({ user_id:owner,daily_message_id:daily.id,shinka_date:window.day,notification_type:NOTIFICATION_TYPE,scheduled_at:window.scheduledAt,delivery_status:'PENDING',dispatch_state:'READY',attempt_count:0,next_attempt_at:new Date(+now()+60000).toISOString() });
    rows = await read();
    if (!rows.length) fail('NOTIFICATION_READBACK_UNCONFIRMED');
    return { state:'QUEUED' };
  }
  if (!Number.isInteger(row.attempt_count) || row.attempt_count < 0 || row.attempt_count >= NOTIFICATION_LIMITS.attempts) return { state:'ATTEMPT_LIMIT' };
  if (!['READY','RETRYABLE'].includes(row.dispatch_state) || !Number.isFinite(Date.parse(row.next_attempt_at))) return { state:'UNKNOWN' };
  if (Date.parse(row.next_attempt_at) > +now()) return { state:'WAITING' };
  const last = await eligible();
  if (last.reason) {
    await store.update(row.id, { delivery_status:'SKIPPED',dispatch_state:'INELIGIBLE',error_code:last.reason,error_stage:'ADMISSION' });
    return { state:'INELIGIBLE',code:last.reason };
  }
  const claim = crypto.randomUUID(), attempt = row.attempt_count + 1;
  await store.update(row.id, { dispatch_state:'IN_FLIGHT',attempt_count:attempt,last_attempt_at:now().toISOString(),claim_id:claim });
  rows = await read();
  if (rows[0]?.id !== row.id || rows[0].claim_id !== claim || rows.some(other => other.id !== row.id && (other.attempt_count > 0 || terminal.has(other.dispatch_state)))) return { state:'COLLISION' };
  // Last admission follows the persisted intent/readback, immediately before
  // the irreversible call. No user-provided title, message, URL or recipient.
  const final = await eligible();
  if (final.reason) {
    await store.update(row.id, { delivery_status:'SKIPPED',dispatch_state:'INELIGIBLE',error_code:final.reason,error_stage:'ADMISSION' });
    return { state:'INELIGIBLE',code:final.reason };
  }
  let outcome;
  try { outcome = await provider.send({ owner, language:final.preferences.language_code }); }
  catch { outcome = { kind:'unknown' }; }
  const next = retryAt(attempt, now());
  const patch = outcome?.kind === 'accepted'
    ? { delivery_status:'SENT',dispatch_state:'ACCEPTED',sent_at:now().toISOString(),error_code:'NONE',error_stage:'PROVIDER_ACCEPTANCE' }
    : outcome?.kind === 'transient' && next
      ? { delivery_status:'FAILED',dispatch_state:'RETRYABLE',next_attempt_at:next,error_code:'PROVIDER_REJECTED_RETRYABLE',error_stage:'PROVIDER' }
      : { delivery_status:outcome?.kind === 'ineligible' ? 'SKIPPED' : 'FAILED',dispatch_state:outcome?.kind === 'permanent' || outcome?.kind === 'transient' ? 'PERMANENT' : outcome?.kind === 'ineligible' ? 'INELIGIBLE' : 'UNKNOWN',error_code:outcome?.kind === 'transient' ? 'ATTEMPT_LIMIT' : outcome?.kind === 'permanent' ? 'PROVIDER_REJECTED_PERMANENT' : outcome?.kind === 'ineligible' ? 'DEVICE_INELIGIBLE' : 'PROVIDER_OUTCOME_UNKNOWN',error_stage:'PROVIDER' };
  // Failure here leaves IN_FLIGHT, so another invocation never blindly resends.
  await store.update(row.id, patch);
  const saved = await read();
  const actual = saved.find(value => value.id === row.id);
  if (!actual || Object.entries(patch).some(([field,value]) => actual[field] !== value)) fail('NOTIFICATION_READBACK_UNCONFIRMED');
  return { state:patch.dispatch_state };
}
