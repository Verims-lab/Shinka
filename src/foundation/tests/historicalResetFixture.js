// Historical persisted receipt only. Never invoke the retired admin writer to
// arrange compatibility tests; production has no corresponding seed endpoint.
export function seedLegacyReset(f, patch = {}) {
  const id = crypto.randomUUID(), time = f.now().toISOString();
  const job = { id, operation_id: id, request_id: id, actor_id: 'adminA', target_id: 'ownerA',
    operation: 'RESET_ONBOARDING', status: 'RESET_ACTIVE', stage: 'PROFILE',
    preview_hash: 'a'.repeat(64), started_at: time, progressed_at: time,
    completed_at: null, checkpoints: [], error_code: null, ...patch };
  f.tables.AdminTestOperation.push(job);
  return job;
}
