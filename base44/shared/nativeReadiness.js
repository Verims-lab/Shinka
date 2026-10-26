import { requireInternalAdmin } from './internalAuthorization.js';
import { healthReadDiagnostic, healthReadError } from './healthReadDiagnostics.js';
export const NATIVE_READINESS_SCHEMAS = Object.freeze(['AdminTestOperation', 'UserCalendarAction', 'InternalHealthRun', 'UserPrivacyRequest', 'PrivacyRecoveryReceipt']);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
// Names, bounded sample size and closed diagnostics only. Never return records.
// Reads are sequential (no 5-read burst after the admission reads) with at most
// one bounded wait+retry per schema on RATE_LIMITED, inside a fixed total budget.
export async function nativeReadiness(client, { wait = pause, retryDelayMs = 800, budgetMs = 6000, clock = () => Date.now() } = {}) {
  await requireInternalAdmin(client);
  const deadline = clock() + budgetMs, schemas = [];
  for (const name of NATIVE_READINESS_SCHEMAS) {
    const started = clock();
    const read = async () => {
      const entity = client.asServiceRole.entities[name];
      if (typeof entity?.filter !== 'function') throw healthReadError('SDK_METHOD_UNAVAILABLE');
      const rows = await entity.filter({}, 'id', 1, 0, ['id']);
      if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => typeof row?.id !== 'string' || !row.id)) throw healthReadError('INVALID_RESPONSE');
      return { name, readable: true, sampledRows: rows.length };
    };
    try { schemas.push(await read()); }
    catch (first) {
      let error = first, diagnostic = healthReadDiagnostic(first, { stage: 'ENTITY_READ', durationMs: clock() - started });
      if (diagnostic.code === 'RATE_LIMITED' && clock() + retryDelayMs < deadline) {
        await wait(retryDelayMs);
        try { schemas.push(await read()); continue; }
        catch (second) { error = second; diagnostic = healthReadDiagnostic(error, { stage: 'ENTITY_READ', durationMs: clock() - started }); }
      }
      schemas.push({ name, readable: false, diagnostic });
    }
  }
  return { authority: 'BASE44_NATIVE_V1', strategyVersion: 'native-continuation/2', schemas, daily: 'IMMUTABLE_CANDIDATES', calendar: 'OBSERVATIONS_AND_RECEIPTS', reset: 'VERIFIED_STEPS', deletion: 'TARGET_LIFECYCLE_RESUMABLE', distributedFence: false, hostedMutationVerified: false };
}