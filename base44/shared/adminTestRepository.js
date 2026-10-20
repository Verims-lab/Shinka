import { physicalName } from './domainSchemas.js';
import { DELETED_ENTITIES, RETAINED_ENTITIES, OPERATION_ENTITY, OPERATION_FIELDS, projectOperation, testToolError, hashToolValue } from './adminTestPolicy.js';

// SDK 0.8.54 positional pagination. No health values, email, names or snapshots.
const pageSize = 100;
const baseFields = ['id', 'user_id', 'updated_date'];
const extras = {
  user_profile: ['account_status'],
  user_cycle_prediction: ['reference_period_id'],
  user_cycle_phase_day: ['reference_period_id'],
  notification_delivery: ['daily_message_id', 'delivery_status'],
  health_data_deletion_job: ['protection_event_id', 'job_status'],
  admin_audit_log: ['admin_user_id', 'target_user_id'],
};
export function createTestRepository(client) {
  const entities = client.asServiceRole.entities;
  async function scan(name, query, fields, bounded = 20000) {
    const result = [], seen = new Set();
    for (let offset = 0; offset <= bounded; offset += pageSize) {
      const rows = await entities[name].filter(query, 'id', pageSize, offset, fields);
      if (!Array.isArray(rows) || rows.length > pageSize) testToolError('TEST_READ_UNCONFIRMED', 503);
      for (const row of rows) {
        if (!row?.id || seen.has(row.id)) testToolError('TEST_PAGINATION_CONFLICT');
        seen.add(row.id);
        result.push(Object.fromEntries(fields.filter(key => row[key] !== undefined).map(key => [key, row[key]])));
      }
      if (result.length > bounded) testToolError('TEST_SCOPE_TOO_LARGE', 503);
      if (rows.length < pageSize) return result;
    }
    testToolError('TEST_SCOPE_TOO_LARGE', 503);
  }
  async function owned(entity, target) {
    const rows = await scan(physicalName(entity), { user_id: target }, [...baseFields, ...(extras[entity] || [])]);
    if (rows.some(row => row.user_id !== target)) testToolError('TEST_OWNER_CONFLICT', 403);
    return rows;
  }
  async function user(target) {
    const rows = await entities.User.filter({ id: target }, 'id', 2, 0, ['id', 'role']);
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => row.id !== target || !['admin', 'user'].includes(row.role))) testToolError('TEST_USER_READ_UNCONFIRMED');
    return rows.length ? { id: rows[0].id, role: rows[0].role } : null;
  }
  async function operation(target, id) {
    const rows = await scan(OPERATION_ENTITY, { target_id: target, operation_id: id }, OPERATION_FIELDS, 100);
    if (rows.length > 1 || rows.some(row => row.target_id !== target || row.operation_id !== id)) testToolError('TEST_OPERATION_STATE_INVALID');
    return rows[0] ? projectOperation(rows[0]) : null;
  }
  async function lifecycle(target) {
    const rows = await scan(OPERATION_ENTITY, { target_id: target }, OPERATION_FIELDS);
    if (rows.some(row => row.target_id !== target)) testToolError('TEST_OWNER_CONFLICT', 403);
    const active = rows.map(projectOperation).filter(row => row.status !== 'COMPLETED' || row.operation === 'DELETE_USER');
    if (active.length > 1) testToolError('TEST_OPERATION_STATE_INVALID');
    return active[0] || null; // Completed DELETE is a permanent tombstone.
  }
  async function target(targetId) {
    const identity = await user(targetId);
    if (!identity) testToolError('TEST_USER_NOT_FOUND', 404);
    const profiles = await owned('user_profile', targetId);
    if (profiles.length > 1) testToolError('DUPLICATE_OWNER_STATE');
    if (profiles[0] && !['ACTIVE', 'INACTIVE'].includes(profiles[0].account_status)) testToolError('TEST_ACCOUNT_STATE_INVALID');
    const jobs = await owned('health_data_deletion_job', targetId);
    const admins = identity.role === 'admin' ? await entities.User.filter({ role: 'admin' }, 'id', 2, 0, ['id', 'role']) : [];
    if (!Array.isArray(admins) || admins.some(row => row.role !== 'admin')) testToolError('TEST_USER_READ_UNCONFIRMED');
    return { id: identity.id, role: identity.role, account_status: profiles[0]?.account_status || 'NO_PROFILE', open_deletion: jobs.some(row => row.job_status !== 'COMPLETED'), last_admin: identity.role === 'admin' && admins.length < 2 };
  }
  async function impact(targetId) {
    const records = {};
    for (const entity of [...DELETED_ENTITIES, ...RETAINED_ENTITIES.filter(e => !['admin_audit_log', 'system_error_log'].includes(e))]) records[entity] = await owned(entity, targetId);
    // Both outgoing and incoming indirect edges are checked, including children
    // with a forged owner. Never delete that child or silently repair its owner.
    const edges = [
      ['user_cycle_phase_day', 'reference_period_id', 'user_period_record'],
      ['user_cycle_prediction', 'reference_period_id', 'user_period_record'],
      ['notification_delivery', 'daily_message_id', 'user_daily_message'],
      ['health_data_deletion_job', 'protection_event_id', 'data_protection_event'],
    ];
    for (const [child, field, parent] of edges) {
      const parentIds = new Set(records[parent].map(row => row.id));
      if (records[child].some(row => !parentIds.has(row[field]))) testToolError('TEST_REFERENCE_CONFLICT');
      const ids = [...parentIds];
      for (let offset = 0; offset < ids.length; offset += pageSize) {
        const batch = ids.slice(offset, offset + pageSize);
        const incoming = await scan(physicalName(child), { [field]: { $in: batch } }, ['id', 'user_id', field]);
        if (incoming.some(row => row.user_id !== targetId || !batch.includes(row[field]))) testToolError('TEST_REFERENCE_CONFLICT');
      }
    }
    const audit = await scan('AdminAuditLog', { $or: [{ admin_user_id: targetId }, { target_user_id: targetId }] }, ['id', 'admin_user_id', 'target_user_id', 'updated_date']);
    if (audit.some(row => row.admin_user_id !== targetId && row.target_user_id !== targetId)) testToolError('TEST_OWNER_CONFLICT', 403);
    records.admin_audit_log = audit;
    const counts = Object.fromEntries(Object.entries(records).map(([entity, rows]) => [entity, rows.length]));
    const pending = records.notification_delivery.filter(row => ['PENDING', 'FAILED'].includes(row.delivery_status));
    return { counts, pending_notifications: pending.length, hash: await hashToolValue(records) };
  }
  async function cleanup(entity, targetId) {
    if (!DELETED_ENTITIES.includes(entity)) testToolError('INVALID_TEST_SCOPE');
    // Read all IDs before deletion so offset pagination cannot skip shrinking pages.
    for (const row of await owned(entity, targetId)) {
      await entities[physicalName(entity)].delete(row.id);
    }
    if ((await owned(entity, targetId)).length) testToolError('TEST_DELETE_UNCONFIRMED');
  }
  async function stopNotifications(targetId) {
    for (const row of await owned('notification_delivery', targetId)) {
      if (['PENDING', 'FAILED'].includes(row.delivery_status)) await entities.NotificationDelivery.update(row.id, { delivery_status: 'SKIPPED', error_code: 'ADMIN_TEST_USER_DELETED' });
    }
    if ((await owned('notification_delivery', targetId)).some(row => ['PENDING', 'FAILED'].includes(row.delivery_status))) testToolError('TEST_DELETE_UNCONFIRMED');
  }
  return { user, target, impact, operation, lifecycle, owned, cleanup, stopNotifications, deleteUser: id => entities.User.delete(id) };
}
