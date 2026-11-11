import { createBase44OnboardingAdapter } from './base44OnboardingAdapter.js';
import { createTestRepository } from './adminTestRepository.js';
import { hashToolValue, testToolError } from './adminTestPolicy.js';
import { testAuditRecord } from './adminTestAudit.js';
import { calendarReader } from './base44CalendarReader.js';
import { requireAuthenticatedUser } from './internalAuthorization.js';
import { assertActiveAccount } from './domainSecurity.js';

// Compatibility only for already persisted RESET_ACTIVE receipts. Admin reset
// creation/resume is retired; owner writes must still settle these old stages.
export async function nativeResetStep({ client, reset, owner, body, perform, expected, nextStage }) {
  const repository = createTestRepository(client), store = client.asServiceRole.entities;
  const principal = await requireAuthenticatedUser(client);
  if (principal.id !== owner) testToolError('FORGED_OWNER', 403);
  const persistence = createBase44OnboardingAdapter(client, principal, { allowReadyProfile: true });
  const guard = async () => {
    await client.shinkaAssertWritable?.();
    assertActiveAccount(owner, await persistence.read('user_profile'));
    if (await persistence.read('health_data_deletion_job', { job_status: { $ne: 'COMPLETED' } })) testToolError('HEALTH_DELETION_PENDING');
  };
  await guard();
  const digest = await hashToolValue(Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'action_id').sort(([a], [b]) => a.localeCompare(b))));
  const rows = await store.AdminTestOperation.filter({ operation_id: reset.operation_id, target_id: owner }, 'id', 2);
  if (rows.length !== 1 || rows[0].id !== reset.id) testToolError('TEST_RESET_STEP_CONFLICT');
  const receipts = rows[0].step_fingerprints || {};
  const key = body.action === 'initialize' ? 'initialize' : expected;
  if (receipts[key] && receipts[key] !== digest) testToolError('TEST_RESET_STEP_CONFLICT');
  const stages = ['PROFILE', 'CYCLE', 'FIRST_SHINKA', 'DONE'];
  if (stages.indexOf(reset.stage) > stages.indexOf(expected)) {
    if (receipts[key] !== digest) testToolError('TEST_RESET_STEP_CONFLICT');
    return { persisted: body.action !== 'skipCycle', profile: await persistence.read('user_profile') };
  }
  if (reset.stage !== expected) testToolError('TEST_RESET_STEP_CONFLICT');
  // Durable intent fingerprint, never profile or cycle values in this journal.
  await store.AdminTestOperation.update(reset.id, { step_fingerprints: { ...receipts, [key]: digest } });
  const originalSaveCycle = persistence.saveCycle;
  persistence.saveCycle = async input => {
    const snapshot = await calendarReader(client, principal).confirmedSnapshot();
    if (!snapshot.periods.length) return originalSaveCycle(input);
    // Reset does not edit historic dates/settings. Matching existing input is
    // verified; changes belong to Calendar. Skip remains a no-health-write path.
    if (!snapshot.periods.some(row => row.period_start_date === input.period_start_date) ||
      ['period_duration_days', 'initial_cycle_length_days'].some(field => input[field] != null && input[field] !== snapshot.settings?.[field])) testToolError('TEST_RESET_CYCLE_USE_CALENDAR');
    return { persisted: true };
  };
  const { result } = await perform({ persistence });
  await guard();
  const checked = await store.AdminTestOperation.filter({ id: reset.id, target_id: owner }, 'id', 2);
  if (checked.length !== 1 || checked[0].step_fingerprints?.[key] !== digest || checked[0].stage !== expected) testToolError('TEST_RESET_STEP_CONFLICT');
  const completed = nextStage === 'DONE';
  if (completed) {
    const audit = testAuditRecord(reset, 'SUCCESS', reset.started_at, 'TEST_RESET_COMPLETED');
    const existing = await store.AdminAuditLog.filter(audit, 'id', 2);
    if (!existing.length) await store.AdminAuditLog.create(audit);
    if ((await store.AdminAuditLog.filter(audit, 'id', 2)).length !== 1) testToolError('TEST_AUDIT_UNCONFIRMED');
  }
  await store.AdminTestOperation.update(reset.id, { stage: nextStage, status: completed ? 'COMPLETED' : 'RESET_ACTIVE',
    progressed_at: new Date().toISOString(), ...(completed ? { completed_at: new Date().toISOString() } : {}) });
  const saved = await repository.operation(owner, reset.operation_id);
  if (saved?.stage !== nextStage || saved.status !== (completed ? 'COMPLETED' : 'RESET_ACTIVE')) testToolError('TEST_RESET_STEP_UNCONFIRMED');
  await guard();
  return result;
}
