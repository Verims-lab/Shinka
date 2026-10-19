import { InternalError } from './internalAuthorization.js';
import { validateDomainRecord } from './domainValidation.js';

export function validatedOnboardingGrant(consent, version) {
  if (consent?.consent_status === 'WITHDRAWN') throw new InternalError('CONSENT_REGRANT_WORKFLOW_REQUIRED', 409);
  if (consent?.consent_version !== version) throw new InternalError('CONSENT_VERSION_CONFLICT', 409);
  if (!consent.id || consent.consent_status !== 'GRANTED' || consent.withdrawn_at != null) {
    throw new InternalError('ONBOARDING_READBACK_CONFLICT', 409);
  }
  const grant = {
    user_id: consent.user_id, consent_status: consent.consent_status,
    consent_version: consent.consent_version, granted_at: consent.granted_at, withdrawn_at: null,
  };
  // Reuse the canonical UTC business-instant validator. Native created_at is
  // storage metadata, never evidence from which to manufacture consent time.
  try { validateDomainRecord('user_health_consent', grant); }
  catch { throw new InternalError('CONSENT_TIMESTAMP_INVALID', 409); }
  return grant;
}

export function onboardingGrantEvent(grant) {
  return { user_id: grant.user_id, event_type: 'GRANTED', consent_version: grant.consent_version, occurred_at: grant.granted_at };
}
