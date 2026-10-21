import { CLASS } from './constants';
import { ev, verdict } from './evidence';

const STRATEGIES = Object.freeze({ daily: 'IMMUTABLE_CANDIDATES', calendar: 'OBSERVATIONS_AND_RECEIPTS', reset: 'VERIFIED_STEPS', deletion: 'TARGET_LIFECYCLE_RESUMABLE' });
const SCHEMAS = Object.freeze(['AdminTestOperation', 'UserCalendarAction', 'InternalHealthRun', 'UserPrivacyRequest', 'PrivacyRecoveryReceipt']);
// Explicit contract comparisons: truthy strategy text is neither a predicate nor
// proof that any mutation ran. The strict shared verdict remains unchanged.
export async function nativePrerequisite(ctx, feature) {
  let value;
  try { value = await ctx.nativeReadiness(); }
  catch { return { status: 'BLOCKED', evidence: ev(CLASS.BLOCKED_EXTERNAL, 'internalHealth nativeReadiness', 'UNAVAILABLE', 'deployed native strategy and readable schemas', 'Read-only prerequisite; hosted mutation acceptance remains separate.') }; }
  const valid = Object.hasOwn(STRATEGIES, feature) && value?.authority === 'BASE44_NATIVE_V1' &&
    value.strategyVersion === 'native-continuation/2' &&
    Object.entries(STRATEGIES).every(([key, expected]) => value[key] === expected) &&
    Array.isArray(value.schemas) && value.schemas.length === SCHEMAS.length &&
    SCHEMAS.every(name => value.schemas.filter(row => row?.name === name && row.readable === true).length === 1);
  return verdict(valid, ev(CLASS.LIVE_RUNTIME, 'internalHealth nativeReadiness', value ?? null,
    { authority: 'BASE44_NATIVE_V1', strategyVersion: 'native-continuation/2', strategies: STRATEGIES, readableSchemas: SCHEMAS },
    'Read-only prerequisites; does not prove permissions, concurrent mutation, removal or permanent erasure.'));
}
