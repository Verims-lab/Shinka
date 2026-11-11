import { InternalError, requireInternalAdmin, handleInternalRequest } from './internalAuthorization.js';
import { createTestRepository } from './adminTestRepository.js';
import { validateTestRequest, requireTestOperationWrite, requireTestCoordinator, testToolError, DELETED_ENTITIES, RETAINED_ENTITIES, SHARED_ENTITIES } from './adminTestPolicy.js';
import { executeTestJob } from './adminTestExecution.js';

export function targetGuard(actor, target, operation) {
  if (target.open_deletion) testToolError('HEALTH_DELETION_PENDING');
  if (operation === 'DELETE_USER' && actor.id === target.id) testToolError('TEST_SELF_DELETE_DENIED', 403);
  if (operation === 'DELETE_USER' && target.last_admin) testToolError('TEST_LAST_ADMIN_DENIED', 403);
}
export function testEnvironment(client, policy = {}) {
  const config = client.getConfig();
  const appId = config.appId;
  // This is the SDK's actual destination; no body field or branch-derived label.
  if (typeof appId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(appId)) testToolError('TEST_ENVIRONMENT_UNVERIFIED', 503);
  let host;
  try { host = new URL(config.serverUrl).origin; } catch { testToolError('TEST_ENVIRONMENT_UNVERIFIED', 503); }
  return { app_id: appId, server: host, label: ['TEST', 'PREVIEW'].includes(policy.label) ? policy.label : 'UNVERIFIED', authorized: policy.appId === appId && ['TEST', 'PREVIEW'].includes(policy.label) };
}
export async function adminTestOperation(client, body, { coordinator = null, signer = null, policy = {}, now = () => new Date() } = {}) {
  const actor = await requireInternalAdmin(client);
  validateTestRequest(body);
  const repository = createTestRepository(client);
  const currentActor = await repository.user(actor.id);
  if (currentActor?.role !== 'admin') testToolError('FORBIDDEN_INTERNAL_TOOLING', 403);
  const environment = testEnvironment(client, policy);
  const hasCoordinator = coordinator?.contract === 'shinka.target-lifecycle/1' && typeof coordinator?.run === 'function';
  const recovery = { resume_enabled: hasCoordinator && environment.authorized, mutation_blocker: !hasCoordinator ? 'ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED' : !environment.authorized ? 'TEST_ENVIRONMENT_UNVERIFIED' : null };
  if (body.action === 'status') {
    const job = await repository.operation(body.target_id, body.operation_id);
    if (!job) testToolError('TEST_OPERATION_NOT_FOUND', 404);
    return { job, environment, ...recovery, ...(job.operation==='RESET_ONBOARDING'?{resume_enabled:false,mutation_blocker:'TEST_RESET_RETIRED'}:{}) };
  }
  if (body.action === 'lookup') {
    const job = await repository.lifecycle(body.target_id);
    const identity = await repository.user(body.target_id);
    if (!identity && job?.operation !== 'DELETE_USER') testToolError('TEST_USER_NOT_FOUND', 404);
    return { target: identity ? await repository.target(body.target_id) : null, job, environment, ...recovery, ...(job?.operation==='RESET_ONBOARDING'?{resume_enabled:false,mutation_blocker:'TEST_RESET_RETIRED'}:{}) };
  }
  const binding = { actor: actor.id, target: body.target_id, operation: body.operation, app: environment.app_id };
  if (body.action === 'preview') {
    const target = await repository.target(body.target_id);
    const impact = await repository.impact(target.id);
    const active = await repository.lifecycle(target.id);
    const blockers = [];
    try { targetGuard(actor, target, body.operation); } catch (e) { if (e instanceof InternalError) blockers.push(e.code); else throw e; }
    if (active) blockers.push('TEST_TARGET_BUSY');
    if (!environment.authorized) blockers.push('TEST_ENVIRONMENT_UNVERIFIED');
    try { requireTestCoordinator(coordinator); } catch { blockers.push('ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED'); }
    if (!signer) blockers.push('TEST_PREVIEW_SIGNER_REQUIRED');
    return {
      target, environment, operation: body.operation, counts: impact.counts, pending_notifications: impact.pending_notifications,
      scope: { deleted: [...DELETED_ENTITIES, 'User'], retained: RETAINED_ENTITIES, shared: SHARED_ENTITIES },
      blockers, enabled: blockers.length === 0,
      preview_token: blockers.length ? null : await signer.sign({ ...binding, scope_hash: impact.hash }),
      expires_at: new Date(now().getTime() + 300000).toISOString(),
      active_operation: active,
    };
  }
  // Unconditional production refusal precedes any mutation or job write.
  requireTestCoordinator(coordinator);
  if (!environment.authorized) testToolError('TEST_ENVIRONMENT_UNVERIFIED', 403);
  let receipt;
  let signed;
  if (body.action === 'execute') {
    if (!signer) testToolError('TEST_PREVIEW_SIGNER_REQUIRED', 503);
    signed = await signer.verify(body.preview_token, binding);
  } else {
    receipt = await repository.operation(body.target_id, body.operation_id);
    if (!receipt || receipt.actor_id !== actor.id) testToolError('TEST_OPERATION_NOT_FOUND', 404);
  }
  const operation = receipt?.operation || body.operation;
  requireTestOperationWrite(operation);
  const requestId = receipt?.request_id || body.request_id;
  return coordinator.run({ actorId: actor.id, targetId: body.target_id, operation, requestId }, async journal => {
    // Coordinator must hold target AND admin-roster exclusion, rechecking after
    // acquisition and keeping all participating product writers fenced.
    const fresh = await requireInternalAdmin(client);
    if (fresh.id !== actor.id || (await repository.user(actor.id))?.role !== 'admin') testToolError('FORBIDDEN_INTERNAL_TOOLING', 403);
    const previous = await repository.operation(body.target_id, requestId);
    if (previous && (previous.actor_id !== actor.id || previous.operation !== operation || signed && previous.preview_hash !== signed.scope_hash)) testToolError('TEST_OPERATION_CONFLICT');
    if (receipt && (!previous || previous.operation_id !== receipt.operation_id)) testToolError('TEST_OPERATION_CONFLICT');
    const identity = await repository.user(body.target_id);
    const target = identity ? await repository.target(body.target_id) : previous?.operation === 'DELETE_USER' ? { id: body.target_id, role: 'deleted', last_admin: false, open_deletion: false, account_status: 'DELETED' } : null;
    if (!target) testToolError('TEST_USER_NOT_FOUND', 404);
    targetGuard(actor, target, operation);
    if (!previous) {
      if (await repository.lifecycle(target.id)) testToolError('TEST_TARGET_BUSY');
      if ((await repository.impact(target.id)).hash !== signed.scope_hash) testToolError('TEST_PREVIEW_STALE');
    }
    const job = await executeTestJob({ journal, repository, actor, target, operation, requestId, previewHash: previous?.preview_hash || signed.scope_hash, now });
    return { job, environment, retained: RETAINED_ENTITIES };
  });
}
export const handleAdminTestRequest = (req, createClient, dependencies = {}) => handleInternalRequest(req, createClient, (client, body) => adminTestOperation(client, body, dependencies));
