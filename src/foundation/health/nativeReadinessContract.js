import { CLASS } from './constants.js';
import { ev, verdict } from './evidence.js';
import { healthReadDiagnostic } from '../../../base44/shared/healthReadDiagnostics.js';

const STRATEGIES = Object.freeze({ daily: 'IMMUTABLE_CANDIDATES', calendar: 'OBSERVATIONS_AND_RECEIPTS', reset: 'VERIFIED_STEPS', deletion: 'TARGET_LIFECYCLE_RESUMABLE' });
const TRANSIENT = new Set(['RATE_LIMITED', 'TIMEOUT', 'SERVICE_UNAVAILABLE', 'NETWORK_UNAVAILABLE']);
const SCHEMAS = Object.freeze(['AdminTestOperation', 'UserCalendarAction', 'InternalHealthRun', 'UserPrivacyRequest', 'PrivacyRecoveryReceipt']);
// Explicit contract comparisons: truthy strategy text is neither a predicate nor
// proof that any mutation ran. The strict shared verdict remains unchanged.
export async function nativePrerequisite(ctx, feature) {
  if (!Object.hasOwn(STRATEGIES, feature)) return verdict(false, ev(CLASS.LIVE_RUNTIME,
    'internalHealth nativeReadiness feature', { feature }, Object.keys(STRATEGIES),
    'Unknown feature is a contract mismatch even when the backend is unavailable.'));
  let value;
  try { value = await ctx.nativeReadiness(); }
  catch (error) { return { status: 'BLOCKED', evidence: ev(CLASS.BLOCKED_EXTERNAL, 'internalHealth nativeReadiness', { state: 'UNAVAILABLE', diagnostic: healthReadDiagnostic(error) }, 'deployed native strategy and readable schemas', 'Read-only prerequisite; hosted mutation acceptance remains separate.') }; }
  // Unreadable only because of transient unavailability = missing evidence (BLOCKED),
  // unless the readable part already proves a contract mismatch (FAIL).
  const rows = Array.isArray(value?.schemas) ? value.schemas : [];
  const transient = rows.filter(row => row?.readable === false && TRANSIENT.has(row?.diagnostic?.code));
  const wellFormed = row => row && typeof row === 'object' && !Array.isArray(row) && SCHEMAS.includes(row.name) &&
    ((row.readable === true && Number.isInteger(row.sampledRows) && row.sampledRows >= 0 && row.sampledRows <= 1) ||
      (row.readable === false && TRANSIENT.has(row.diagnostic?.code) &&
        (row.diagnostic.httpStatus == null || (Number.isInteger(row.diagnostic.httpStatus) && row.diagnostic.httpStatus >= 100 && row.diagnostic.httpStatus <= 599))));
  const contractOk = Object.hasOwn(STRATEGIES, feature) && value?.authority === 'BASE44_NATIVE_V1' && value.strategyVersion === 'native-continuation/2' &&
    Object.entries(STRATEGIES).every(([key, expected]) => value[key] === expected) && Array.isArray(value.schemas) &&
    rows.length === SCHEMAS.length && rows.every(wellFormed) &&
    SCHEMAS.every(name => rows.filter(row => row.name === name).length === 1);
  if (transient.length && contractOk) return { status: 'BLOCKED', evidence: ev(CLASS.BLOCKED_EXTERNAL, 'internalHealth nativeReadiness',
    { state: 'TRANSIENT_UNAVAILABLE', unreadable: transient.map(row => ({ name: row.name, code: row.diagnostic.code, httpStatus: row.diagnostic.httpStatus ?? null })) },
    'every native schema readable', 'Temporary unavailability (rate limit/timeout/outage) is missing evidence, not a contract mismatch.') };
  const valid = contractOk && rows.every(row => row.readable === true);
  return verdict(valid, ev(CLASS.LIVE_RUNTIME, 'internalHealth nativeReadiness', value ?? null,
    { authority: 'BASE44_NATIVE_V1', strategyVersion: 'native-continuation/2', strategies: STRATEGIES, readableSchemas: SCHEMAS },
    'Read-only prerequisites; does not prove permissions, concurrent mutation, removal or permanent erasure.'));
}
