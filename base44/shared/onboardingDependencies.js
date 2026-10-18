// Source gaps remain explicit. Neither boundary algorithms nor translations are invented.
export const ONBOARDING_DEPENDENCIES=Object.freeze({
  sunSign:'SUN_SIGN_CALCULATION_RULE_SOURCE_GAP',
  copyTR:'SOURCE_COPY_GAP',
  durableCompletion:'ONBOARDING_DURABLE_COMPLETION_MARKER_SOURCE_GAP',
  firstShinka:'FIRST_SHINKA_ENGINE_REQUIRED',
  persistence:'ATOMIC_CAPABILITY_REQUIRED',
  consentVersion:'HEALTH_CONSENT_VERSION_SOURCE_GAP',
});
export const SUN_SIGN_RESOLVER=null;
// Source describes versioned consent, but supplies no approved consent-text version.
export const HEALTH_CONSENT_VERSION=null;
