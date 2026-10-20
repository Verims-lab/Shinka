import { verifyTestDeletion } from './testDeletionResult.js';
import { DELETE_STEPS, DELETED_ENTITIES, testToolError, projectOperation } from './adminTestPolicy.js';
import { testAuditRecord } from './adminTestAudit.js';
import { safeTestOperationError } from './adminTestDiagnostics.js';

// Caller supplies the historical test coordinator or native target journal. journal.begin persists before any destructive call.
// Each checkpoint is recoverable; failure never rolls back already deleted rows.
export async function executeTestJob({ journal, repository, actor, target, operation, requestId, previewHash, now, clock = () => performance.now(), diagnostics = undefined }) {
  let job = await journal.begin({ actor_id: actor.id, target_id: target.id, operation, request_id: requestId, preview_hash: previewHash, started_at: now().toISOString() });
  job = projectOperation(job);
  if (job.operation_id !== requestId || job.actor_id !== actor.id || job.target_id !== target.id || job.operation !== operation || job.request_id !== requestId || job.preview_hash !== previewHash) testToolError('TEST_OPERATION_CONFLICT');
  const started = await repository.operation(target.id, job.operation_id);
  if (!started || JSON.stringify(started) !== JSON.stringify(job)) testToolError('TEST_JOB_START_UNCONFIRMED', 503);
  const verified = () => verifyTestDeletion(repository, target.id);
  if (job.status === 'RESET_ACTIVE') return job;
  if (job.status === 'COMPLETED') {
    if (operation !== 'DELETE_USER' || await verified()) return job;
    if (!journal.reopen) testToolError('TEST_JOB_STATUS_UNCONFIRMED',503);
    job = await journal.reopen(job);
  }
  const finish = async patch => {
    await journal.finish(job, patch, testAuditRecord(job, 'SUCCESS', now().toISOString()));
    const saved = await repository.operation(target.id, job.operation_id);
    if (!saved || saved.actor_id !== actor.id || saved.operation !== operation || saved.request_id !== requestId || Object.entries(patch).some(([key, value]) => saved[key] !== value)) testToolError('TEST_JOB_STATUS_UNCONFIRMED', 503);
    return saved;
  };
  let activeStage = 'START';
  try {
    if (operation === 'RESET_ONBOARDING') {
      // No product row is touched. This durable state defeats old daily evidence.
      return await finish({ status: 'RESET_ACTIVE', stage: 'PROFILE', error_code: null });
    }
    const passStarted=clock();
    for (const stage of DELETE_STEPS) {
      activeStage = stage;
      diagnostics?.stage(stage);
      // Checkpoints describe progress, never an exemption from rechecking late rows.
      // Cleanup is idempotent and bounded; a resumed deletion reconciles every scope.
      if (stage === 'NOTIFICATIONS') await repository.stopNotifications(target.id);
      else if (DELETED_ENTITIES.includes(stage)) await repository.cleanup(stage, target.id);
      else if (stage === 'USER') {
        if (await repository.user(target.id)) await repository.deleteUser(target.id);
        if (await repository.user(target.id)) testToolError('TEST_DELETE_UNCONFIRMED');
      } else if (!await verified()) testToolError('TEST_DELETE_UNCONFIRMED');
      if (!job.checkpoints.includes(stage)) await journal.checkpoint(job, stage);
      diagnostics?.end();
      // Rechecking old checkpoints must not consume every retry without progress.
      if(stage!=='VERIFY' && !job.checkpoints.includes(stage) && clock()-passStarted>=8000) return await repository.operation(target.id,job.operation_id);
    }
    // If final audit persistence fails, status remains recoverable, not success.
    return await finish({ status: 'COMPLETED', stage: 'VERIFY', completed_at: now().toISOString(), error_code: null });
  } catch (cause) {
    const error = safeTestOperationError(cause, activeStage);
    try {
      // A lost acknowledgement may follow a successful final audit.
      // Never regress a confirmed terminal job or append a duplicate result.
      const current = await repository.operation(target.id, job.operation_id);
      if (current?.status === 'RESET_ACTIVE' || current?.status === 'COMPLETED' && await verified()) return current;
      await journal.failed(job, error.code, testAuditRecord(job, 'FAILED', now().toISOString(), error.code), activeStage);
    }
    catch { const unconfirmed = safeTestOperationError(cause, activeStage); unconfirmed.code = 'TEST_JOB_STATUS_UNCONFIRMED'; throw unconfirmed; }
    // A bounded pass is expected progress, not an unknown transport failure.
    if (error.code === 'TEST_CLEANUP_MORE_REQUIRED') return await repository.operation(target.id, job.operation_id);
    throw error;
  }
}
