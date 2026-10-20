import { requireAdmin, InternalError, handleInternalRequest } from './internalAuthorization.js';
import { withAdminAudit } from './domainAudit.js';
import { inspectContentLibrary, librarySummary, applyContentBatch } from './base44ContentLibrary.js';
import { inspectMoonImport, applyMoonBatch } from './moonImport.js';
const DAILY_PERSISTENCE = { strategy: 'IMMUTABLE_CANDIDATES', transaction: false, duplicates: 'RECONCILE_AND_RETAIN', hostedMutationVerified: false };

export async function contentLibraryOperation(client, body, { astronomy = null, source = null, decision = null } = {}) {
  const principal = await requireAdmin(client);
  const fields = ['applyBatch', 'moonApplyBatch'].includes(body.action) ? ['action', 'reviewed_digest'] : ['action'];
  if (!['dryRun', 'verify', 'applyBatch', 'moonDryRun', 'moonApplyBatch'].includes(body.action) || Object.keys(body).some(key => !fields.includes(key))) throw new InternalError('INVALID_REQUEST', 400);
  if (body.action.startsWith('moon')) {
    if (!astronomy) throw new InternalError('ASTRONOMY_UNAVAILABLE', 503);
    const moon = await inspectMoonImport(client, astronomy);
    if (body.action === 'moonDryRun') return moon.summary;
    return withAdminAudit(client, principal, { target_entity: 'moon_phase_lookup', action_type: 'UPDATE' }, async () => {
      const attempted = await applyMoonBatch(client, moon, body.reviewed_digest);
      return { ...(await inspectMoonImport(client, astronomy)).summary, attempted };
    });
  }
  if (!source || !decision) throw new InternalError('CONTENT_NOT_READY', 503);
  if (decision.status !== 'APPROVED_PRODUCT_DECISION' && body.action !== 'applyBatch') return { phase: 'SOURCE_DECISION_REQUIRED', ready: false, sourceHash: source.sha256, sourceSet: source.sourceSet, dailyPersistence: DAILY_PERSISTENCE };
  const inspection = await inspectContentLibrary(client, source, decision);
  if (body.action !== 'applyBatch') return { ...librarySummary(inspection), dailyPersistence: DAILY_PERSISTENCE };
  return withAdminAudit(client, principal, { target_entity: 'message_pair', action_type: 'UPDATE' }, async () => {
    const batch = await applyContentBatch(client, inspection, body.reviewed_digest);
    return { ...librarySummary(await inspectContentLibrary(client, source, decision)), batch };
  });
}
export const handleContentLibraryRequest = (req, createClient, dependencies = {}) => handleInternalRequest(req, createClient, (client, body) => contentLibraryOperation(client, body, dependencies));
