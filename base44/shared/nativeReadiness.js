import { requireInternalAdmin } from './internalAuthorization.js';
import { healthReadDiagnostic, healthReadError } from './healthReadDiagnostics.js';
// Names, bounded sample size and closed diagnostics only. Never return records.
export async function nativeReadiness(client) {
  await requireInternalAdmin(client);
  const schemas = await Promise.all(['AdminTestOperation', 'UserCalendarAction', 'InternalHealthRun', 'UserPrivacyRequest', 'PrivacyRecoveryReceipt'].map(async name => {
    const started = Date.now();
    try {
      const entity = client.asServiceRole.entities[name];
      if (typeof entity?.filter !== 'function') throw healthReadError('SDK_METHOD_UNAVAILABLE');
      const rows = await entity.filter({}, 'id', 1, 0, ['id']);
      if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => typeof row?.id !== 'string' || !row.id)) throw healthReadError('INVALID_RESPONSE');
      return { name, readable: true, sampledRows: rows.length };
    } catch (error) { return { name, readable: false, diagnostic: healthReadDiagnostic(error, { stage: 'ENTITY_READ', durationMs: Date.now() - started }) }; }
  }));
  return { authority: 'BASE44_NATIVE_V1', strategyVersion: 'native-continuation/2', schemas, daily: 'IMMUTABLE_CANDIDATES', calendar: 'OBSERVATIONS_AND_RECEIPTS', reset: 'VERIFIED_STEPS', deletion: 'TARGET_LIFECYCLE_RESUMABLE', distributedFence: false, hostedMutationVerified: false };
}
