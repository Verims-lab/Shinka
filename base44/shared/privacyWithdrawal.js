import { privacyFail, HEALTH_CLEANUP } from './privacyPolicy.js';
import { validateDomainRecord } from './domainValidation.js';
import { SYSTEM_AUTHORITIES, assertProtectedRecordMutationAllowed } from './domainSecurity.js';

const consentFields = ['user_id', 'consent_status', 'consent_version', 'granted_at', 'withdrawn_at'];
const same = (a, b) => a && Object.entries(b).every(([key, value]) => (a[key] ?? null) === value);
export async function withdrawalState(repo, request) {
  const consent = await repo.one('UserHealthConsent', { user_id: request.user_id });
  const withdrawn = consent?.consent_status === 'WITHDRAWN' && consent.withdrawn_at === request.requested_at && consent.granted_at === request.grant_at;
  const event = await repo.one('UserHealthConsentEvent', { user_id: request.user_id, event_type: 'WITHDRAWN', occurred_at: request.requested_at });
  const protection = await repo.one('DataProtectionEvent', { user_id: request.user_id, event_type: 'HEALTH_DATA_DELETION', requested_at: request.requested_at });
  const job = protection && await repo.one('HealthDataDeletionJob', { user_id: request.user_id, protection_event_id: protection.id });
  const historical = request.status === 'COMPLETED' && consent?.consent_status === 'GRANTED' && consent.granted_at > request.requested_at;
  const cleanupVerified = !!(event?.consent_version === request.consent_version && job?.requested_at === request.requested_at && job?.job_status === 'COMPLETED' && job.completed_at && protection?.event_status === 'COMPLETED' && protection.completed_at === job.completed_at && (historical || withdrawn && await repo.empty(HEALTH_CLEANUP, request.user_id)));
  return { withdrawn: !!(withdrawn || historical), cleanupVerified, complete: request.status === 'COMPLETED' && cleanupVerified };
}
export async function runWithdrawal(repo, request, admit, now) {
  const owner = request.user_id;
  const exact = async (name, query, record, entity) => {
    await admit();
    let row = await repo.one(name, query);
    if (!row) {
      assertProtectedRecordMutationAllowed(entity, 'create', SYSTEM_AUTHORITIES[entity === 'health_data_deletion_job' ? 'DELETION' : entity === 'data_protection_event' ? 'PROTECTION' : 'CONSENT']);
      validateDomainRecord(entity, record);
      await repo.store[name].create(record);
      row = await repo.one(name, query);
    }
    if (!row) privacyFail('PRIVACY_WRITE_UNCONFIRMED', 503);
    return row;
  };
  let current = await repo.one('UserHealthConsent', { user_id: owner });
  if (!current || current.granted_at !== request.grant_at || current.consent_version !== request.consent_version) privacyFail('CONSENT_STATE_CHANGED');
  validateDomainRecord('user_health_consent', Object.fromEntries(consentFields.map(key => [key, current[key] ?? null])));
  const otherJob = await repo.store.HealthDataDeletionJob.filter({ user_id: owner, job_status: { $ne: 'COMPLETED' }, requested_at: { $ne: request.requested_at } }, 'id', 1, 0, ['id']);
  if (!Array.isArray(otherJob) || otherJob.length) privacyFail('PRIVACY_OTHER_OPERATION_PENDING');
  const protection = await exact('DataProtectionEvent', { user_id: owner, event_type: 'HEALTH_DATA_DELETION', requested_at: request.requested_at }, { user_id: owner, event_type: 'HEALTH_DATA_DELETION', event_status: 'PENDING', requested_at: request.requested_at }, 'data_protection_event');
  let job = await exact('HealthDataDeletionJob', { user_id: owner, protection_event_id: protection.id }, { user_id: owner, protection_event_id: protection.id, job_status: 'PENDING', requested_at: request.requested_at, retry_count: 0 }, 'health_data_deletion_job');
  if (job.requested_at !== request.requested_at || !['PENDING', 'PROCESSING', 'RETRYING', 'FAILED', 'COMPLETED'].includes(job.job_status) || !['PENDING', 'COMPLETED', 'FAILED'].includes(protection.event_status)) privacyFail('PRIVACY_STATE_UNCONFIRMED');
  await admit();
  if (current.consent_status === 'GRANTED') {
    const result = await repo.store.UserHealthConsent.updateMany({ id: current.id, user_id: owner, consent_status: 'GRANTED', granted_at: request.grant_at }, { $set: { consent_status: 'WITHDRAWN', withdrawn_at: request.requested_at } });
    if (result?.success !== true || result.updated !== 1 || result.has_more) privacyFail('PRIVACY_WRITE_UNCONFIRMED', 503);
  }
  current = await repo.one('UserHealthConsent', { user_id: owner });
  if (!same(current, { consent_status: 'WITHDRAWN', withdrawn_at: request.requested_at, granted_at: request.grant_at, consent_version: request.consent_version })) privacyFail('CONSENT_STATE_CHANGED');
  const eventValues = { user_id: owner, event_type: 'WITHDRAWN', consent_version: request.consent_version, occurred_at: request.requested_at };
  const event = await exact('UserHealthConsentEvent', eventValues, eventValues, 'user_health_consent_event');
  if (!same(event, eventValues)) privacyFail('CONSENT_EVENT_UNCONFIRMED');
  await admit();
  if (job.job_status !== 'PROCESSING' && job.job_status !== 'COMPLETED') await repo.store.HealthDataDeletionJob.update(job.id, { job_status: 'PROCESSING', started_at: job.started_at || request.requested_at });
  if (!await repo.clean(HEALTH_CLEANUP, owner, admit)) return;
  await admit();
  if (!await repo.empty(HEALTH_CLEANUP, owner)) privacyFail('HEALTH_DELETION_UNCONFIRMED');
  const completed_at = job.completed_at || now().toISOString();
  await repo.store.HealthDataDeletionJob.update(job.id, { job_status: 'COMPLETED', completed_at });
  job = await repo.one('HealthDataDeletionJob', { id: job.id });
  if (job?.job_status !== 'COMPLETED' || job.completed_at !== completed_at) privacyFail('HEALTH_DELETION_UNCONFIRMED');
  await repo.store.DataProtectionEvent.update(protection.id, { event_status: 'COMPLETED', completed_at });
  if (!(await withdrawalState(repo, request)).cleanupVerified) privacyFail('HEALTH_DELETION_UNCONFIRMED');
  await repo.patch(request, { status: 'COMPLETED', completed_at });
}
