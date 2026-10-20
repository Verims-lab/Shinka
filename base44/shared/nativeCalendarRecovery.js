import { InternalError } from './internalAuthorization.js';
import { assertActiveAccount } from './domainSecurity.js';
import { validatedOnboardingGrant } from './onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
// A read exposes only the authenticated owner's persisted explicit grant intent.
// It does not manufacture consent or complete a write as a read side effect.
export async function nativeCalendarRecovery(client, owner) {
  const e = client.asServiceRole.entities;
  const rows = await e.UserCalendarAction.filter({ user_id: owner, status: 'PENDING', initial_grant: true }, 'id', 2);
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].user_id !== owner) throw new InternalError('CONSENT_EVENT_UNCONFIRMED', 409);
  const [profiles, consents, jobs] = await Promise.all([
    e.UserProfile.filter({ user_id: owner }, 'id', 2), e.UserHealthConsent.filter({ user_id: owner }, 'id', 2),
    e.HealthDataDeletionJob.filter({ user_id: owner, job_status: { $ne: 'COMPLETED' } }, 'id', 1),
  ]);
  if (profiles.length !== 1 || consents.length > 1 || jobs.length) throw new InternalError('CONSENT_STATE_CHANGED', 409);
  assertActiveAccount(owner, profiles[0]);
  if (consents.length) {
    validatedOnboardingGrant(consents[0], HEALTH_CONSENT_VERSION);
    if (consents[0].user_id !== owner || consents[0].granted_at !== rows[0].grant_at) throw new InternalError('CONSENT_STATE_CHANGED', 409);
  }
  return { action_id: rows[0].action_id, revision: rows[0].base_revision, date: rows[0].desired_date };
}
