// Isolated durable-store MODEL shared by simulated workers. This in-memory
// serialization is not a Base44 adapter and cannot enable a production mutation.
import { DOMAIN_SCHEMAS, physicalName } from '../../../base44/shared/domainSchemas.js';
import { adminTestOperation } from '../../../base44/shared/adminTestOperation.js';
import { createPreviewSigner } from '../../../base44/shared/adminTestPreview.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { testToolError, hashToolValue } from '../../../base44/shared/adminTestPolicy.js';
import { dailyFixture, DAILY_NOW } from './dailyFixture';
import { testAuditRecord } from '../../../base44/shared/adminTestAudit.js';

const clone = value => structuredClone(value);
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(item => matches(row, item));
    if (value && typeof value === 'object') {
      if ('$ne' in value) return row[key] !== value.$ne;
      if ('$in' in value) return value.$in.includes(row[key]);
    }
    return row[key] === value;
  });
}
export function adminTestFixture() {
  const daily = dailyFixture();
  const tables = Object.fromEntries(Object.keys(DOMAIN_SCHEMAS).map(name => [physicalName(name), clone(daily.rows[name])]));
  tables.User = [{ id: 'adminA', role: 'admin' }, { id: 'adminB', role: 'admin' }, { id: 'ownerA', role: 'user' }, { id: 'ownerB', role: 'user' }];
  tables.AdminTestOperation = [];
  tables.UserCalendarAction = [];
  tables.UserPrivacyRequest = [];
  tables.PrivacyRecoveryReceipt = [];
  const state = { tables, actor: 'adminA', fail: null, time: DAILY_NOW, calls: [], audit: [], serial: Promise.resolve(), resetReceipts: new Map() };
  const fault = name => { if (state.fail === name) { state.fail = null; throw new Error('synthetic hidden exception'); } };
  /** @type {Record<string, any>} */
  const entities = new Proxy({}, { get: (_, name) => ({
    async filter(query, sort, limit = 100, skip = 0, fields) {
      state.calls.push({ name, method: 'filter', query: clone(query), limit, skip, fields });
      fault(`read:${String(name)}`);
      return tables[name].filter(row => matches(row, query)).sort((a, b) => String(a.id).localeCompare(String(b.id))).slice(skip, skip + limit).map(row => fields ? Object.fromEntries(fields.filter(key => row[key] !== undefined).map(key => [key, clone(row[key])])) : clone(row));
    },
    async delete(id) {
      state.calls.push({ name, method: 'delete', id }); fault(`delete:${String(name)}`);
      tables[name] = tables[name].filter(row => row.id !== id);
      fault(`afterDelete:${String(name)}`);
      return { success: true };
    },
    async update(id, patch) {
      state.calls.push({ name, method: 'update', id }); fault(`update:${String(name)}`);
      const row = tables[name].find(row => row.id === id);
      if (!row) throw new Error('missing fixture row');
      Object.assign(row, patch); return clone(row);
    },
  }) });
  const client = {
    auth: { me: async () => state.actor ? { id: state.actor, role: tables.User.find(row => row.id === state.actor)?.role || 'user' } : null },
    asServiceRole: { entities },
    getConfig: () => ({ appId: 'fixture-app', serverUrl: 'https://fixture.invalid' }),
  };
  const now = () => new Date(state.time);
  function journal() {
    return {
      async begin(input) {
        let job = tables.AdminTestOperation.find(row => row.operation_id === input.request_id);
        if (job) return clone(job);
        fault('start');
        job = { id: input.request_id, operation_id: input.request_id, ...input, status: 'RUNNING', stage: 'START', progressed_at: state.time, completed_at: null, checkpoints: [], error_code: null };
        tables.AdminTestOperation.push(job);
        state.audit.push({ actor: input.actor_id, target: input.target_id, operation: input.operation, operationId: job.operation_id, status: 'STARTED', time: state.time });
        return clone(job);
      },
      async isDone(job, stage) { return tables.AdminTestOperation.find(row => row.id === job.id).checkpoints.includes(stage); },
      async checkpoint(job, values) {
        for(const stage of values.checkpoints)fault(`checkpoint:${stage}`);
        const saved = tables.AdminTestOperation.find(row => row.id === job.id);
        Object.assign(saved,{...values,checkpoints:[...new Set([...saved.checkpoints,...values.checkpoints])]});
        return clone(saved);
      },
      async finish(job, patch, audit) {
        fault('finish');
        const saved = tables.AdminTestOperation.find(row => row.id === job.id);
        Object.assign(saved, patch);
        tables.AdminAuditLog.push({ id: `tool-audit-${state.audit.length}`, ...clone(audit) });
        state.audit.push({ actor: saved.actor_id, target: saved.target_id, operation: saved.operation, operationId: saved.operation_id, status: patch.status, time: state.time });
        fault('afterFinish');
        return clone(saved);
      },
      async failed(job, code, audit) {
        fault('failure');
        Object.assign(tables.AdminTestOperation.find(row => row.id === job.id), { status: 'RETRY_REQUIRED', error_code: code });
        tables.AdminAuditLog.push({ id: `tool-failure-${tables.AdminAuditLog.length}`, ...clone(audit) });
      },
    };
  }
  function exclusive(work) {
    const result = state.serial.then(work);
    state.serial = result.then(() => undefined, () => undefined);
    return result;
  }
  const worker = () => ({
    contract: 'shinka.target-lifecycle/1',
    run: (_input, callback) => exclusive(() => callback(journal())),
    resetStep: (input, callback) => exclusive(async () => {
      const job = tables.AdminTestOperation.find(row => row.operation_id === input.operationId);
      const profile = tables.UserProfile.find(row => row.user_id === input.owner);
      if (!tables.User.some(row => row.id === input.owner) || profile?.account_status === 'INACTIVE' || tables.HealthDataDeletionJob.some(row => row.user_id === input.owner && row.job_status !== 'COMPLETED')) testToolError('ACTIVE_ACCOUNT_REQUIRED');
      const key = `${input.operationId}:${input.expectedStage}:${input.body.action}`;
      const fingerprint = await hashToolValue(input.body);
      const receipt = state.resetReceipts.get(key);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) testToolError('ACTION_CONFLICT');
        return clone(receipt.result);
      }
      if (!job || job.status !== 'RESET_ACTIVE' || job.stage !== input.expectedStage) testToolError('TEST_RESET_STEP_CONFLICT');
      const snapshot = clone(tables);
      try {
        const outcome = await callback({ persistence: {
          savePreferences: async record => {
            const previous = tables.UserPreferences.find(row => row.user_id === input.owner);
            if (previous) Object.assign(previous, record);
            else tables.UserPreferences.push({ id: 'reset-preferences', user_id: input.owner, ...record });
          },
          saveProfile: async record => { Object.assign(profile, record); return clone(profile); },
          saveCycle: async () => testToolError('ISOLATED_CYCLE_WRITER_NOT_CONFIGURED'),
          hasVerifiedCycle: async () => false,
        } });
        fault('resetCommit');
        job.stage = outcome.nextStage;
        if (job.stage === 'DONE') {
          job.status = 'COMPLETED'; job.completed_at = state.time;
          tables.AdminAuditLog.push({ id: `reset-finish-${job.id}`, ...testAuditRecord(job, 'SUCCESS', state.time) });
        }
        state.resetReceipts.set(key, { fingerprint, result: clone(outcome.result) });
        return outcome.result;
      } catch (error) { for (const name of Object.keys(tables)) tables[name] = snapshot[name]; throw error; }
    }),
  });
  const dependencies = { coordinator: worker(), signer: createPreviewSigner('isolated-test-signing-key-at-least-32-characters', now), policy: { appId: 'fixture-app', label: 'TEST' }, now };
  const request = (body, deps = dependencies) => adminTestOperation(client, body, deps);
  const preview = (operation = 'DELETE_USER', target_id = 'ownerA') => request({ action: 'preview', operation, target_id });
  const execute = async (view, request_id = crypto.randomUUID()) => request({ action: 'execute', target_id: view.target.id, operation: view.operation, confirmation: true, preview_token: view.preview_token, request_id });
  const resume = id => request({ action: 'resume', target_id: 'ownerA', operation_id: id });
  const ownerClient = () => withUserLifecycle({ ...client, auth: { me: async () => ({ id: 'ownerA', role: 'user' }) } });
  return { state, tables, client, worker, dependencies, request, preview, execute, resume, ownerClient, now };
}
