import { InternalError } from './internalAuthorization.js';
import { assertActiveAccount, assertHealthConsent } from './domainSecurity.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from './onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
import { HEALTH_ENTITIES } from './domainSchemas.js';
import { readUserLifecycle } from './userLifecycle.js';

export async function guardDomainOwner(client, owner, entity) {
  const store = client.asServiceRole.entities;
  if (await readUserLifecycle(client, owner)) throw new InternalError('ONBOARDING_RESTART_REQUIRED', 409);
  const identities = await store.User.filter({ id: owner }, 'id', 2, 0, ['id']);
  if (identities.length !== 1 || identities[0].id !== owner) throw new InternalError('AUTH_REQUIRED', 401);
  const profiles = await store.UserProfile.filter({ user_id: owner }, 'id', 2);
  assertActiveAccount(owner, profiles.length === 1 ? profiles[0] : null);
  if (HEALTH_ENTITIES.includes(entity)) {
    const consents = await store.UserHealthConsent.filter({ user_id: owner }, 'id', 2);
    const consent = consents.length === 1 ? consents[0] : null;
    const jobs = await store.HealthDataDeletionJob.filter({ user_id: owner, job_status: { $ne: 'COMPLETED' } }, 'id', 1);
    assertHealthConsent(owner, consent, jobs);
    const grant = validatedOnboardingGrant(consent, HEALTH_CONSENT_VERSION), expected = onboardingGrantEvent(grant);
    const events = await store.UserHealthConsentEvent.filter({ user_id: owner, occurred_at: { $gte: grant.granted_at } }, 'id', 3);
    if (events.length !== 1 || Object.entries(expected).some(([key, value]) => events[0][key] !== value)) throw new InternalError('CONSENT_EVENT_UNCONFIRMED', 409);
  }
}
