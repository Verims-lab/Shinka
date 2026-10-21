import { InternalError } from './internalAuthorization.js';
import { assertActiveAccount } from './domainSecurity.js';
import { validateDomainRecord } from './domainValidation.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from './onboardingConsent.js';
import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
import { HEALTH_CLEANUP, assertPrivacyAccess } from './privacyPolicy.js';

const fail = code => { throw new InternalError(code, 409); };
// Only an explicit add+consent with a persisted owner receipt can enter here.
export async function completeCalendarGrant(client, owner, receipt) {
  const store = client.asServiceRole.entities;
  const one = async (name, query = {}) => {
    const rows = await store[name].filter({ user_id: owner, ...query }, 'id', 3);
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => row.user_id !== owner)) fail('DUPLICATE_OWNER_STATE');
    return rows[0] || null;
  };
  const guard = async () => {
    if (client.shinkaNative) await assertPrivacyAccess(client, owner, { health: true });
    await client.auth.me();
    await client.shinkaAssertWritable?.();
    assertActiveAccount(owner, await one('UserProfile'));
    if (await one('HealthDataDeletionJob', { job_status: { $ne: 'COMPLETED' } })) fail('HEALTH_DELETION_PENDING');
  };
  await guard();
  const grant = { user_id: owner, consent_status: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, granted_at: receipt.grant_at, withdrawn_at: null };
  validateDomainRecord('user_health_consent', grant);
  let current = await one('UserHealthConsent');
  if (current?.consent_status === 'WITHDRAWN') {
    validateDomainRecord('user_health_consent', { user_id: owner, consent_status: current.consent_status, consent_version: current.consent_version, granted_at: current.granted_at, withdrawn_at: current.withdrawn_at });
    const completed = await store.HealthDataDeletionJob.filter({ user_id: owner, job_status: 'COMPLETED', requested_at: { $gte: current.withdrawn_at } }, '-completed_at', 1);
    const job = completed[0];
    if (job) validateDomainRecord('health_data_deletion_job', Object.fromEntries(Object.keys(DOMAIN_SCHEMAS.health_data_deletion_job.properties).map(key => [key, job[key]])));
    if (!job || job.user_id !== owner || !job.completed_at || job.completed_at < job.requested_at) fail('HEALTH_DELETION_UNCONFIRMED');
    const withdrawal = await one('UserHealthConsentEvent', { event_type: 'WITHDRAWN', occurred_at: current.withdrawn_at, consent_version: current.consent_version });
    if (!withdrawal) fail('CONSENT_EVENT_UNCONFIRMED');
    for (const name of HEALTH_CLEANUP) {
      if (name === 'UserCalendarAction') {
        const others = await store.UserCalendarAction.filter({ user_id: owner, id: { $ne: receipt.id } }, 'id', 1, 0, ['id']);
        if (!Array.isArray(others) || others.length) fail('HEALTH_DELETION_UNCONFIRMED');
        continue;
      }
      if (await one(name)) fail('HEALTH_DELETION_UNCONFIRMED');
    }
    if (receipt.grant_at <= current.withdrawn_at) fail('CONSENT_STATE_CHANGED');
    await guard();
    const result = await store.UserHealthConsent.updateMany({ id: current.id, user_id: owner, consent_status: 'WITHDRAWN', withdrawn_at: current.withdrawn_at }, { $set: grant });
    if (result?.success !== true || result.updated !== 1 || result.has_more !== false) fail('CONSENT_WRITE_UNCONFIRMED');
  } else if (!current) {
    for (const name of ['UserHealthConsentEvent', 'UserCycleSettings', 'UserPeriodRecord', 'UserCyclePrediction', 'UserCyclePhaseDay']) if (await one(name)) fail('CONSENT_STATE_CHANGED');
    await guard();
    await store.UserHealthConsent.create(grant);
  }
  const confirm = async () => {
    await guard();
    current = await one('UserHealthConsent');
    validatedOnboardingGrant(current, HEALTH_CONSENT_VERSION);
    if (current.granted_at !== grant.granted_at) fail('CONSENT_STATE_CHANGED');
  };
  await confirm();
  const event = onboardingGrantEvent(grant);
  let savedEvent = await one('UserHealthConsentEvent', { occurred_at: { $gte: grant.granted_at } });
  if (!savedEvent) { await confirm(); await store.UserHealthConsentEvent.create(event); }
  savedEvent = await one('UserHealthConsentEvent', { occurred_at: { $gte: grant.granted_at } });
  if (!savedEvent || Object.entries(event).some(([key, value]) => savedEvent[key] !== value)) fail('CONSENT_EVENT_UNCONFIRMED');
  const period = await one('UserPeriodRecord');
  if (period && period.period_start_date !== receipt.desired_date) fail('CALENDAR_STATE_CHANGED');
  if (!period) { await confirm(); await store.UserPeriodRecord.create({ user_id: owner, period_start_date: receipt.desired_date }); }
  await confirm();
}
