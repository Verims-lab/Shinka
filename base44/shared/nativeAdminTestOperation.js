import { requireInternalAdmin, InternalError } from './internalAuthorization.js';
import { createTestRepository } from './adminTestRepository.js';
import { validateTestRequest, testToolError, DELETED_ENTITIES, RETAINED_ENTITIES, SHARED_ENTITIES } from './adminTestPolicy.js';
import { targetGuard, testEnvironment } from './adminTestOperation.js';
import { executeTestJob } from './adminTestExecution.js';
import { nativeTestJournal } from './nativeTestJournal.js';

export async function nativeAdminTestOperation(client, body, { policy = {}, signer = null, maintenance = { paused: false, actorId: null, windowId: null, drainAck: null }, now = () => new Date() } = {}) {
  const actor = await requireInternalAdmin(client);
  validateTestRequest(body);
  const repository = createTestRepository(client), environment = testEnvironment(client, policy);
  const freshAdmin = async () => {
    const fresh = await requireInternalAdmin(client);
    if (fresh.id !== actor.id || (await repository.user(actor.id))?.role !== 'admin') testToolError('FORBIDDEN_INTERNAL_TOOLING', 403);
  };
  await freshAdmin();
  // Operator attests that ingress/schedulers/other editors are stopped and
  // already-started writes have drained. The flag itself proves no such drain.
  const maintenanceReady = () => maintenance.paused === true && maintenance.actorId === actor.id &&
    typeof maintenance.windowId === 'string' && /^[a-zA-Z0-9_-]{16,100}$/.test(maintenance.windowId) &&
    maintenance.drainAck === `${maintenance.windowId}:${actor.id}`;
  const recovery = { resume_enabled: environment.authorized, mutation_blocker: environment.authorized ? null : 'TEST_ENVIRONMENT_UNVERIFIED' };
  if (body.action === 'status') {
    const job = await repository.operation(body.target_id, body.operation_id);
    if (!job) testToolError('TEST_OPERATION_NOT_FOUND', 404);
    return { job, environment, ...recovery, resume_enabled: recovery.resume_enabled && (job.operation !== 'DELETE_USER' || maintenanceReady()) };
  }
  if (body.action === 'lookup') {
    const job = await repository.lifecycle(body.target_id), identity = await repository.user(body.target_id);
    if (!identity && job?.operation !== 'DELETE_USER') testToolError('TEST_USER_NOT_FOUND', 404);
    return { target: identity ? await repository.target(body.target_id) : null, job, environment, ...recovery,
      resume_enabled: recovery.resume_enabled && (job?.operation !== 'DELETE_USER' || maintenanceReady()) };
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
    if (body.operation === 'DELETE_USER' && !maintenanceReady()) blockers.push('TEST_OPERATOR_MAINTENANCE_REQUIRED');
    return { target, environment, operation: body.operation, counts: impact.counts, pending_notifications: impact.pending_notifications,
      scope: { deleted: body.operation === 'DELETE_USER' ? [...DELETED_ENTITIES, 'UserCalendarAction', 'User'] : [], retained: RETAINED_ENTITIES, shared: SHARED_ENTITIES },
      blockers, enabled: !blockers.length, preview_token: blockers.length ? null : await signer.sign({ ...binding, scope_hash: impact.hash }),
      expires_at: new Date(now().getTime() + 300000).toISOString(), active_operation: active };
  }
  if (!environment.authorized) testToolError('TEST_ENVIRONMENT_UNVERIFIED', 403);
  const previous = await repository.operation(body.target_id, body.operation_id || body.request_id);
  if (previous && previous.actor_id !== actor.id) testToolError('TEST_OPERATION_CONFLICT');
  if (body.action === 'resume' && !previous) testToolError('TEST_OPERATION_NOT_FOUND', 404);
  const operation = previous?.operation || body.operation;
  if (previous && body.operation && previous.operation !== body.operation) testToolError('TEST_OPERATION_CONFLICT');
  const guard = async () => {
    await freshAdmin();
    if (operation === 'DELETE_USER' && !maintenanceReady()) testToolError('TEST_OPERATOR_MAINTENANCE_REQUIRED');
    const identity = await repository.user(body.target_id);
    if (identity) targetGuard(actor, await repository.target(body.target_id), operation);
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
  // Every destructive step repeats role/target/maintenance checks. A controlled
  // maintenance window, not this function, excludes privileged out-of-band writes.
  const mutationMethods = new Set(['create', 'update', 'delete']);
  const guardedClient = { ...client, asServiceRole: { ...client.asServiceRole, entities: new Proxy(client.asServiceRole.entities, {
    get(target, name) { return new Proxy(target[name], { get(entity, method) {
      if (!mutationMethods.has(String(method))) return entity[method];
      return async (...args) => { await guard(); const value = await entity[method](...args); await guard(); return value; };
    } }); },
  }) } };
  const guardedRepository = createTestRepository(guardedClient);
  const job = await executeTestJob({ journal: nativeTestJournal(guardedClient, guard, now), repository: guardedRepository, actor,
    target: { id: body.target_id }, operation, requestId: previous?.request_id || body.request_id, previewHash: scopeHash, now });
  await guard();
  return { job, environment, retained: RETAINED_ENTITIES };
}
