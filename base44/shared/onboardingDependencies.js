import { resolveSunSign } from './sunSign.js';
// Explicit user-approved decisions in the current onboarding package Final Closure request.
export const ONBOARDING_DECISION_STATUS=Object.freeze({
  SUN_SIGN_CALCULATION_RULE_SOURCE_GAP:'RESOLVED_BY_PRODUCT_DECISION',
  TR_ONBOARDING_COPY_SOURCE_GAP:'RESOLVED_BY_PRODUCT_DECISION',
  HEALTH_CONSENT_VERSION_SOURCE_GAP:'RESOLVED_BY_PRODUCT_DECISION',
  ONBOARDING_DURABLE_COMPLETION_MARKER_SOURCE_GAP:'RESOLVED_BY_PRODUCT_DECISION',
});
export const ONBOARDING_DEPENDENCIES=Object.freeze({
  sunSign:'SUN_SIGN_CALCULATION_RULE_SOURCE_GAP',
  copyTR:'TR_ONBOARDING_COPY_SOURCE_GAP',
  durableCompletion:'ONBOARDING_DURABLE_COMPLETION_MARKER_SOURCE_GAP',
  firstShinka:'FIRST_SHINKA_ENGINE_REQUIRED',
  persistence:'BASE44_KEYED_UPSERT_VERIFIED_READBACK',
  consentVersion:'HEALTH_CONSENT_VERSION_SOURCE_GAP',
});
export const SUN_SIGN_RESOLVER=resolveSunSign;
// Canonical approved version: never client or environment supplied.
export const HEALTH_CONSENT_VERSION='health-consent-v1.0';
