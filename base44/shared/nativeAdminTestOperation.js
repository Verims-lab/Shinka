import { testOperationOutcome } from './testDeletionResult.js';
import { requireInternalAdmin, InternalError } from './internalAuthorization.js';
import { createTestRepository } from './adminTestRepository.js';
import { validateTestRequest, testToolError, DELETED_ENTITIES, RETAINED_ENTITIES, SHARED_ENTITIES } from './adminTestPolicy.js';
import { targetGuard, testEnvironment } from './adminTestOperation.js';
import { executeTestJob } from './adminTestExecution.js';
import { nativeTestJournal } from './nativeTestJournal.js';

export async function nativeAdminTestOperation(client, body, { policy = {}, signer = null, now = () => new Date(), diagnostics = undefined, clock = undefined } = {}) {
  const actor = await requireInternalAdmin(client);
  validateTestRequest(body);
  diagnostics?.bind(body.operation_id || body.request_id);
  const repository = createTestRepository(client), environment = testEnvironment(client, policy);
  const freshAdmin = async () => {
    const fresh = await requireInternalAdmin(client);
    if (fresh.id !== actor.id) testToolError('FORBIDDEN_INTERNAL_TOOLING', 403);
  };
  const recovery = { resume_enabled: environment.authorized, mutation_blocker: environment.authorized ? null : 'TEST_ENVIRONMENT_UNVERIFIED' };
  // Every action reports the same fresh removal verification; a saved COMPLETED
  // status alone is not current absence evidence. Read errors propagate as unknown.
  const response = async (job, target = null) => {
    const result_state = await testOperationOutcome(repository, job);
    return { job, target: result_state === 'COMPLETED' && job?.operation === 'DELETE_USER' ? null : target,
      result_state, environment, ...recovery, retained: RETAINED_ENTITIES };
  };
  if (body.action === 'status') {
    const job = await repository.operation(body.target_id, body.operation_id);
    if (!job) testToolError('TEST_OPERATION_NOT_FOUND', 404);
    return response(job);
  }
  if (body.action === 'lookup') {
    const job = await repository.lifecycle(body.target_id), identity = await repository.user(body.target_id);
    if (!identity && job?.operation !== 'DELETE_USER') testToolError('TEST_USER_NOT_FOUND', 404);
    return response(job, identity ? await repository.target(body.target_id) : null);
  }
  const binding = { actor: actor.id, target: body.target_id, operation: body.operation, app: environment.app_id };
  if (body.action === 'preview') {
    const target = await repository.target(body.target_id), impact = await repository.impact(target.id), active = await repository.lifecycle(target.id);
    const blockers = [];
    try { targetGuard(actor, target, body.operation); } catch (error) { if (error instanceof InternalError) blockers.push(error.code); else throw error; }
    if (body.operation === 'RESET_ONBOARDING' && target.account_status !== 'ACTIVE') blockers.push('TEST_INACTIVE_ACCOUNT');
    if (active) blockers.push('TEST_TARGET_BUSY');
    if (!environment.authorized) blockers.push('TEST_ENVIRONMENT_UNVERIFIED');
    if (!signer) blockers.push('TEST_PREVIEW_SIGNER_REQUIRED');
    return { target, environment, operation: body.operation, counts: impact.counts, pending_notifications: impact.pending_notifications,
      scope: { deleted: body.operation === 'DELETE_USER' ? [...DELETED_ENTITIES, 'calendar_actions', 'User'] : [], retained: RETAINED_ENTITIES, shared: SHARED_ENTITIES },
      job:undefined, result_state:undefined, blockers, enabled: !blockers.length, preview_token: blockers.length ? null : await signer.sign({ ...binding, scope_hash: impact.hash }),
      expires_at: new Date(now().getTime() + 300000).toISOString(), active_operation: active };
  }
  if (!environment.authorized) testToolError('TEST_ENVIRONMENT_UNVERIFIED', 403);
  const previous = await repository.operation(body.target_id, body.operation_id || body.request_id);
  if (previous && previous.actor_id !== actor.id) testToolError('TEST_OPERATION_CONFLICT');
  if (body.action === 'resume' && !previous) testToolError('TEST_OPERATION_NOT_FOUND', 404);
  const operation = previous?.operation || body.operation;
  if (previous && body.operation && previous.operation !== body.operation) testToolError('TEST_OPERATION_CONFLICT');
  const guard = async () => {
    const [, active, identity] = await Promise.all([freshAdmin(), repository.lifecycle(body.target_id), repository.user(body.target_id)]);
    if(active && active.operation_id !== (previous?.operation_id || body.request_id))testToolError('TEST_OPERATION_CONFLICT');
    if (identity) targetGuard(actor, await repository.target(body.target_id, identity, { deletionGuard: operation === 'DELETE_USER' }), operation);
  };
  await guard();
  let scopeHash = previous?.preview_hash;
  if (body.action === 'execute') {
    if (!signer) testToolError('TEST_PREVIEW_SIGNER_REQUIRED');
    const signed = await signer.verify(body.preview_token, binding);
    if (scopeHash && scopeHash !== signed.scope_hash) testToolError('TEST_PREVIEW_STALE');
    scopeHash = signed.scope_hash;
    if (!previous && (await repository.impact(body.target_id)).hash !== scopeHash) testToolError('TEST_PREVIEW_STALE');
  }
  const identity = await repository.user(body.target_id);
  if (!identity && !previous) testToolError('TEST_USER_NOT_FOUND', 404);
  if (operation === 'RESET_ONBOARDING' && (await repository.target(body.target_id)).account_status !== 'ACTIVE') testToolError('TEST_INACTIVE_ACCOUNT');
  // Every destructive call repeats actor/target checks. The durable target journal
  // blocks app writers; native Entity calls do not provide distributed exclusion.
  const mutationMethods = new Set(['create', 'update', 'delete']);
  const guardedClient = { ...client, asServiceRole: { ...client.asServiceRole, entities: new Proxy(client.asServiceRole.entities, {
    get(target, name) { return new Proxy(target[name], { get(entity, method) {
      if (!mutationMethods.has(String(method))) return entity[method];
      // Every write is admitted by a fresh pre-write guard; the next write's (or the
      // final) guard covers what a post-write guard re-read, halving guard reads.
      return async (...args) => { await guard(); return entity[method](...args); };
    } }); },
  }) } };
  const guardedRepository = createTestRepository(guardedClient, { clock });
  const job = await executeTestJob({ journal: nativeTestJournal(guardedClient, guard, now), repository: guardedRepository, actor,
    target: { id: body.target_id }, operation, requestId: previous?.request_id || body.request_id, previewHash: scopeHash, now, diagnostics, clock });
  await guard();
  return response(job);
}