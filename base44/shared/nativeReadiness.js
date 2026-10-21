import { requireInternalAdmin } from './internalAuthorization.js';
// Names/booleans only. Does not mutate a user, inspect SQL, or certify concurrency.
export async function nativeReadiness(client) {
  await requireInternalAdmin(client);
  const schemas = await Promise.all(['AdminTestOperation', 'UserCalendarAction', 'InternalHealthRun', 'UserPrivacyRequest', 'PrivacyRecoveryReceipt'].map(async name => {
    try { await client.asServiceRole.entities[name].filter({}, 'id', 1, 0, ['id']); return { name, readable: true }; }
    catch { return { name, readable: false }; }
  }));
  return { authority: 'BASE44_NATIVE_V1', strategyVersion: 'native-continuation/2', schemas, daily: 'IMMUTABLE_CANDIDATES', calendar: 'OBSERVATIONS_AND_RECEIPTS', reset: 'VERIFIED_STEPS', deletion: 'TARGET_LIFECYCLE_RESUMABLE', distributedFence: false, hostedMutationVerified: false };
}
