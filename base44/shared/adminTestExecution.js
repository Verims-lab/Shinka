import { DELETE_STEPS, DELETED_ENTITIES, testToolError, projectOperation } from './adminTestPolicy.js';
import { testAuditRecord } from './adminTestAudit.js';

// Called ONLY inside a verified coordinator's durable target + admin-roster
// exclusion boundary. journal.begin must persist before any destructive call.
// Each checkpoint is recoverable; failure never rolls back already deleted rows.
export async function executeTestJob({ journal, repository, actor, target, operation, requestId, previewHash, now }) {
  let job = await journal.begin({ actor_id: actor.id, target_id: target.id, operation, request_id: requestId, preview_hash: previewHash, started_at: now().toISOString() });
  job = projectOperation(job);
  if (job.operation_id !== requestId || job.actor_id !== actor.id || job.target_id !== target.id || job.operation !== operation || job.request_id !== requestId || job.preview_hash !== previewHash) testToolError('TEST_OPERATION_CONFLICT');
  const started = await repository.operation(target.id, job.operation_id);
  if (!started || JSON.stringify(started) !== JSON.stringify(job)) testToolError('TEST_JOB_START_UNCONFIRMED', 503);
  if (job.status === 'COMPLETED' || job.status === 'RESET_ACTIVE') return job;
  const finish = async patch => {
    await journal.finish(job, patch, testAuditRecord(job, 'SUCCESS', now().toISOString()));
    const saved = await repository.operation(target.id, job.operation_id);
    if (!saved || saved.actor_id !== actor.id || saved.operation !== operation || saved.request_id !== requestId || Object.entries(patch).some(([key, value]) => saved[key] !== value)) testToolError('TEST_JOB_STATUS_UNCONFIRMED', 503);
    return saved;
  };
  try {
    if (operation === 'RESET_ONBOARDING') {
      // No product row is touched. This durable state defeats old daily evidence.
      return await finish({ status: 'RESET_ACTIVE', stage: 'PROFILE', error_code: null });
    }
    for (const stage of DELETE_STEPS) {
      if (await journal.isDone(job, stage)) continue;
      if (stage === 'NOTIFICATIONS') await repository.stopNotifications(target.id);
      else if (DELETED_ENTITIES.includes(stage)) await repository.cleanup(stage, target.id);
      else if (stage === 'USER') {
        if (await repository.user(target.id)) await repository.deleteUser(target.id);
        if (await repository.user(target.id)) testToolError('TEST_DELETE_UNCONFIRMED');
      } else {
        if (await repository.user(target.id)) testToolError('TEST_DELETE_UNCONFIRMED');
        for (const entity of DELETED_ENTITIES) if ((await repository.owned(entity, target.id)).length) testToolError('TEST_DELETE_UNCONFIRMED');
        if ((await repository.owned('notification_delivery', target.id)).some(row => ['PENDING', 'FAILED'].includes(row.delivery_status))) testToolError('TEST_DELETE_UNCONFIRMED');
      }
      await journal.checkpoint(job, stage);
    }
    // If final audit persistence fails, status remains recoverable, not success.
    return await finish({ status: 'COMPLETED', stage: 'VERIFY', completed_at: now().toISOString(), error_code: null });
  } catch {
    try {
      // A lost acknowledgement may follow a successful atomic final audit.
      // Never regress a confirmed terminal job or append a duplicate result.
      const current = await repository.operation(target.id, job.operation_id);
      if (current && ['COMPLETED', 'RESET_ACTIVE'].includes(current.status)) return current;
      await journal.failed(job, 'TEST_JOB_RETRY_REQUIRED', testAuditRecord(job, 'FAILED', now().toISOString(), 'TEST_JOB_RETRY_REQUIRED'));
    }
    catch { testToolError('TEST_JOB_STATUS_UNCONFIRMED', 503); }
    testToolError('TEST_JOB_RETRY_REQUIRED', 503);
  }
}
