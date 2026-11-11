import { createTestRepository } from './adminTestRepository.js';
import { projectOperation, testToolError, DELETE_STEPS } from './adminTestPolicy.js';
import { testAuditRecord } from './adminTestAudit.js';

// Sequential, readback-verified journal. No lock, transaction or rollback claim.
export function nativeTestJournal(client, guard, now = () => new Date()) {
  const store = client.asServiceRole.entities, repository = createTestRepository(client);
  const read = job => repository.operation(job.target_id, job.operation_id);
  const patch = async (job, values) => {
    // The supplied client already guards every write before and after.
    await store.AdminTestOperation.update(job.id, { ...values, progressed_at: now().toISOString() });
    const saved = await read(job);
    if (!saved || Object.entries(values).some(([key, value]) => JSON.stringify(saved[key]) !== JSON.stringify(value))) testToolError('TEST_JOB_STATUS_UNCONFIRMED', 503);
    return saved;
  };
  const audit = async record => {
    const rows = await store.AdminAuditLog.filter(record, 'id', 2);
    if (!Array.isArray(rows) || rows.length > 1) testToolError('TEST_AUDIT_UNCONFIRMED');
    if (rows.length === 1) return; // Exact persisted audit already confirmed.
    await store.AdminAuditLog.create(record);
    const saved = await store.AdminAuditLog.filter(record, 'id', 2);
    if (!Array.isArray(saved) || saved.length !== 1) testToolError('TEST_AUDIT_UNCONFIRMED');
  };
  return {
    async begin(input) {
      await guard();
      let job = await repository.operation(input.target_id, input.request_id);
      if (!job) {
        if (await repository.lifecycle(input.target_id)) testToolError('TEST_TARGET_BUSY');
        await store.AdminTestOperation.create({ ...input, operation_id: input.request_id, status: 'RUNNING', stage: 'START', checkpoints: [], progressed_at: input.started_at, completed_at: null, error_code: null });
        job = await repository.operation(input.target_id, input.request_id);
      }
      if (!job || (await repository.lifecycle(input.target_id))?.operation_id !== job.operation_id && job.status !== 'COMPLETED') testToolError('TEST_JOB_START_UNCONFIRMED');
      await audit(testAuditRecord(job, 'SUCCESS', job.started_at, 'TEST_OPERATION_STARTED'));
      return projectOperation(job);
    },
    async reopen(job, stage='NOTIFICATIONS') {
      const checkpoints=DELETE_STEPS.slice(0,DELETE_STEPS.indexOf(stage));
      return patch(job,{status:'RUNNING',stage:checkpoints.at(-1)||'START',checkpoints,completed_at:null,error_code:null});
    },
    async checkpoint(job, values) {
      const saved = await read(job);
      if(!saved)testToolError('TEST_JOB_STATUS_UNCONFIRMED',503);
      if(saved.status==='COMPLETED')return saved; // Response still verifies actual absence.
      const checkpoints=DELETE_STEPS.filter(stage=>saved.checkpoints.includes(stage)||values.checkpoints.includes(stage));
      return patch(job,{...values,checkpoints});
    },
    async finish(job, values, record) {
      // Stable business instant makes a lost audit acknowledgement resumable.
      await audit({ ...record, performed_at: job.started_at, error_code: 'TEST_OPERATION_COMPLETED' });
      return patch(job, values);
    },
    async failed(job, code, _record, stage = job.stage) { await audit(testAuditRecord(job, 'FAILED', job.started_at, code)); return patch(job, { status: 'RETRY_REQUIRED', error_code: code, stage }); },
  };
}
