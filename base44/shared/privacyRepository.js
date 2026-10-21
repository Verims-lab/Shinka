import { privacyFail, privacyHash, privacyOwns, privacyQuery, readPrivacyRequests } from './privacyPolicy.js';
import { deleteAndVerifyAbsent } from './ownedCleanup.js';

export function privacyRepository(client, now = () => new Date(), { clock = () => performance.now() } = {}) {
  const store = client.asServiceRole.entities;
  let deadline = null;
  let deletes = 0;
  function takeDelete() {
    // Admission/read preparation may be slow; each retry must be able to make
    // its first bounded unit of progress, then enforce the cleanup deadline.
    if (deadline === null) deadline = clock() + 8000;
    if (deletes >= 40 || clock() >= deadline) return false;
    deletes++; return true;
  }
  async function one(name, query) {
    const rows = await store[name].filter(query, 'id', 2);
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => !row.id)) privacyFail('PRIVACY_STATE_UNCONFIRMED', 503);
    return rows[0] || null;
  }
  async function user(owner) {
    const row = await one('User', { id: owner });
    if (row && (row.id !== owner || !['admin', 'user'].includes(row.role))) privacyFail('PRIVACY_STATE_UNCONFIRMED');
    return row;
  }
  async function request(owner, key) {
    return (await readPrivacyRequests(client, owner)).find(row => row.request_key === key) || null;
  }
  async function patch(row, values) {
    await store.UserPrivacyRequest.update(row.id, values);
    const saved = await request(row.user_id, row.request_key);
    if (!saved || Object.entries(values).some(([key, value]) => saved[key] !== value)) privacyFail('PRIVACY_WRITE_UNCONFIRMED', 503);
    return saved;
  }
  async function receipt(row, secret) {
    const token_hash = await privacyHash(secret);
    const existing = await one('PrivacyRecoveryReceipt', { token_hash });
    if (existing && existing.request_id !== row.id) privacyFail('PRIVACY_RECOVERY_INVALID', 403);
    if (!existing) {
      const issued = await store.PrivacyRecoveryReceipt.filter({ request_id: row.id }, 'id', 6, 0, ['id']);
      if (!Array.isArray(issued) || issued.length >= 5) privacyFail('PRIVACY_RECOVERY_LIMIT');
      await store.PrivacyRecoveryReceipt.create({ token_hash, request_id: row.id, expires_at: new Date(now().getTime() + 86400000).toISOString() });
    }
    const saved = await one('PrivacyRecoveryReceipt', { token_hash });
    if (!saved || saved.request_id !== row.id) privacyFail('PRIVACY_WRITE_UNCONFIRMED', 503);
  }
  async function recover(secret) {
    const saved = await one('PrivacyRecoveryReceipt', { token_hash: await privacyHash(secret) });
    if (!saved || !Number.isFinite(Date.parse(saved.expires_at)) || Date.parse(saved.expires_at) <= now().getTime()) privacyFail('PRIVACY_RECOVERY_INVALID', 403);
    const row = await one('UserPrivacyRequest', { id: saved.request_id });
    if (!row || row.kind !== 'DELETE_ACCOUNT') privacyFail('PRIVACY_RECOVERY_INVALID', 403);
    return row;
  }
  async function page(name, owner, limit = 20) {
    const query = privacyQuery(name, owner);
    const rows = await store[name].filter(query, 'id', limit, 0, ['id', 'user_id', 'admin_user_id', 'target_user_id', 'actor_id', 'target_id']);
    if (!Array.isArray(rows) || rows.length > limit || rows.some(row => !row.id || !privacyOwns(name, row, owner)) || new Set(rows.map(row => row.id)).size !== rows.length) privacyFail('PRIVACY_OWNER_CONFLICT', 403);
    return rows;
  }
  async function empty(names, owner) {
    for (const name of names) if ((await page(name, owner, 1)).length) return false;
    return true;
  }
  async function clean(names, owner, admit) {
    for (const name of names) {
      const rows = await page(name, owner);
      for (const row of rows) {
        if (!takeDelete()) return false;
        await admit();
        // Check incoming ownership before removing the referenced parent. A
        // foreign edge is an integrity error, never permission to delete it.
        const edges = name === 'UserPeriodRecord' ? [['UserCyclePrediction', 'reference_period_id'], ['UserCyclePhaseDay', 'reference_period_id']]
          : name === 'UserDailyMessage' ? [['NotificationDelivery', 'daily_message_id']]
          : name === 'DataProtectionEvent' ? [['HealthDataDeletionJob', 'protection_event_id']] : [];
        for (const [child, field] of edges) {
          const foreign = await store[child].filter({ [field]: row.id, user_id: { $ne: owner } }, 'id', 1, 0, ['id']);
          if (!Array.isArray(foreign) || foreign.length) privacyFail('PRIVACY_REFERENCE_CONFLICT');
        }
        await deleteAndVerifyAbsent(store, name, row.id, privacyQuery(name, owner));
        await admit();
      }
      if ((await page(name, owner, 1)).length) return false;
    }
    return empty(names, owner);
  }
  return { one, user, request, patch, receipt, recover, page, empty, clean, store, takeDelete };
}
