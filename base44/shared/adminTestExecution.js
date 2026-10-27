import { verifyTestDeletion, testDeletionResiduals } from './testDeletionResult.js';
import { DELETE_STEPS, DELETED_ENTITIES, testToolError, projectOperation } from './adminTestPolicy.js';
import { testAuditRecord } from './adminTestAudit.js';
import { safeTestOperationError } from './adminTestDiagnostics.js';
import { testDeletionPass } from './testDeletionPass.js';

// Durable admission precedes destruction. Forward checkpoints reduce repeated
// work; fresh full-scope verification, never checkpoints alone, proves absence.
export async function executeTestJob({ journal, repository, actor, target, operation, requestId, previewHash, now, clock = () => performance.now(), diagnostics = undefined, pass = testDeletionPass(clock), acknowledgeStart = false, separatePasses = false }) {
  let job = projectOperation(await journal.begin({ actor_id: actor.id, target_id: target.id, operation, request_id: requestId, preview_hash: previewHash, started_at: now().toISOString() }));
  if (job.operation_id !== requestId || job.actor_id !== actor.id || job.target_id !== target.id || job.operation !== operation || job.request_id !== requestId || job.preview_hash !== previewHash) testToolError('TEST_OPERATION_CONFLICT');
  const started = await repository.operation(target.id, job.operation_id);
  if (!started || JSON.stringify(started) !== JSON.stringify(job)) testToolError('TEST_JOB_START_UNCONFIRMED', 503);
  pass.start(job,acknowledgeStart);
  const verified = () => verifyTestDeletion(repository, target.id);
  if (job.status === 'RESET_ACTIVE') return job;
  const reconcile = async residual => {
    if(!journal.reopen)testToolError('TEST_JOB_STATUS_UNCONFIRMED',503);
    pass.stage(residual[0]);pass.more();pass.stop('RESIDUAL_RECHECK_REQUIRED');
    return journal.reopen(job,residual[0]);
  };
  if (job.status === 'COMPLETED') {
    if(operation!=='DELETE_USER')return job;
    pass.stage('VERIFY');
    const residual=await testDeletionResiduals(repository,target.id);
    if(!residual.length)return job;
    return reconcile(residual);
  }
  const finish = async patch => {
    await journal.finish(job, patch, testAuditRecord(job, 'SUCCESS', now().toISOString()));
    const saved = await repository.operation(target.id, job.operation_id);
    if (!saved || saved.actor_id !== actor.id || saved.operation !== operation || saved.request_id !== requestId || Object.entries(patch).some(([key, value]) => saved[key] !== value)) testToolError('TEST_JOB_STATUS_UNCONFIRMED', 503);
    return saved;
  };
  let activeStage='START';const completed=[];
  const checkpoint = async (code=null) => {
    if(!completed.length&&!code)return job;
    job=projectOperation(await journal.checkpoint(job,{checkpoints:completed,stage:code?activeStage:completed.at(-1),status:code?'RETRY_REQUIRED':'RUNNING',error_code:code}));
    completed.length=0;
    return job;
  };
  try {
    if (operation === 'RESET_ONBOARDING') return await finish({ status: 'RESET_ACTIVE', stage: 'PROFILE', error_code: null });
    // Acknowledging the durable start has its own response. This prevents
    // admission/start-audit work plus cleanup from overrunning one service call.
    if(acknowledgeStart){pass.stop('START_SAVED');return job;}
    if(job.checkpoints.includes('VERIFY')) {
      pass.stage('VERIFY');
      const residual=await testDeletionResiduals(repository,target.id);
      if(residual.length)return await reconcile(residual);
      return await finish({status:'COMPLETED',stage:'VERIFY',completed_at:now().toISOString(),error_code:null});
    }
    pass.work();
    for (const stage of DELETE_STEPS) {
      if(stage!=='VERIFY'&&job.checkpoints.includes(stage))continue;
      if(pass.exhausted())break;
      activeStage=stage;pass.stage(stage);diagnostics?.stage(stage);
      if(stage==='NOTIFICATIONS')await repository.stopNotifications(target.id);
      else if(DELETED_ENTITIES.includes(stage))await repository.cleanup(stage,target.id);
      else if(stage==='USER'){
        if(await repository.user(target.id))await repository.deleteUser(target.id);
        if(await repository.user(target.id))testToolError('TEST_DELETE_UNCONFIRMED');
      } else {
        const residual=await testDeletionResiduals(repository,target.id);
        if(residual.length){await checkpoint();return await reconcile(residual);}
      }
      completed.push(stage);diagnostics?.end();
    }
    const complete=completed.includes('VERIFY');
    // One merged, readback-verified checkpoint per pass, including empty scopes.
    // An interrupted batch can repeat reads, but cannot skip a final residual.
    await checkpoint(complete?null:'TEST_CLEANUP_MORE_REQUIRED');
    if(!complete){pass.stop(pass.remainingWrites===0?'WRITE_BUDGET':'TIME_BUDGET');return job;}
    if(!separatePasses)return await finish({status:'COMPLETED',stage:'VERIFY',completed_at:now().toISOString(),error_code:null});
    pass.stop('VERIFICATION_SAVED');
    return job; // Final audit/terminal write is a separately acknowledged pass.
  } catch(cause) {
    const error=safeTestOperationError(cause,activeStage);
    // An explicit revocation cannot authorize even a journal/audit write.
    if(['AUTH_REQUIRED','FORBIDDEN_INTERNAL_TOOLING','ACCOUNT_DELETION_IN_PROGRESS'].includes(error.code))throw error;
    if(error.code==='TEST_CLEANUP_MORE_REQUIRED'){
      await checkpoint(error.code);pass.stop(pass.remainingWrites===0?'WRITE_BUDGET':'TIME_BUDGET');return job;
    }
    try {
      const current=await repository.operation(target.id,job.operation_id);
      if(current?.status==='RESET_ACTIVE'||current?.status==='COMPLETED'&&await verified())return current;
      await checkpoint();
      await journal.failed(job,error.code,testAuditRecord(job,'FAILED',now().toISOString(),error.code),activeStage);
    } catch {
      const unconfirmed=safeTestOperationError(cause,activeStage);unconfirmed.code='TEST_JOB_STATUS_UNCONFIRMED';throw unconfirmed;
    }
    throw error;
  }
}
