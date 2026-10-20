import { createTestRepository } from './adminTestRepository.js';
import { projectOperation, testToolError } from './adminTestPolicy.js';
import { testAuditRecord } from './adminTestAudit.js';

// Sequential, readback-verified journal. No lock, transaction or rollback claim.
export function nativeTestJournal(client, guard, now = () => new Date()) {
  const store = client.asServiceRole.entities, repository = createTestRepository(client);
  const read = job => repository.operation(job.target_id, job.operation_id);
  const patch = async (job, values) => {
    await guard();
    await store.AdminTestOperation.update(job.id, { ...values, progressed_at: now().toISOString() });
    const saved = await read(job);
    if (!saved || Object.entries(values).some(([key, value]) => JSON.stringify(saved[key]) !== JSON.stringify(value))) testToolError('TEST_JOB_STATUS_UNCONFIRMED', 503);
    return saved;
  };
  const audit = async record => {
    const rows = await store.AdminAuditLog.filter(record, 'id', 2);
    if (!Array.isArray(rows) || rows.length > 1) testToolError('TEST_AUDIT_UNCONFIRMED');
    if (!rows.length) await store.AdminAuditLog.create(record);
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
    async reopen(job) { return patch(job,{status:'RUNNING',stage:'START',completed_at:null,error_code:null}); },
    async checkpoint(job, stage) {
      const saved = await read(job);
      return patch(job, { stage, checkpoints: [...new Set([...saved.checkpoints, stage])] });
    },
    async finish(job, values, record) {
      // Stable business instant makes a lost audit acknowledgement resumable.
      await audit({ ...record, performed_at: job.started_at, error_code: values.status === 'RESET_ACTIVE' ? 'TEST_RESET_PREPARED' : 'TEST_OPERATION_COMPLETED' });
      return patch(job, values);
    },
    async failed(job, code) { await audit(testAuditRecord(job, 'FAILED', job.started_at, code)); return patch(job, { status: 'RETRY_REQUIRED', error_code: code }); },
  };
}
