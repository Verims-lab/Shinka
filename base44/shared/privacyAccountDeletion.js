import { ACCOUNT_CLEANUP, privacyFail, readPrivacyRequests } from './privacyPolicy.js';
import { deleteAndVerifyAbsent } from './ownedCleanup.js';

export async function accountRemovalState(repo, request) {
  const empty = await repo.empty(ACCOUNT_CLEANUP, request.user_id);
  const remaining = await repo.store.UserPrivacyRequest.filter({ user_id: request.user_id, id: { $ne: request.id } }, 'id', 1, 0, ['id']);
  if (!Array.isArray(remaining)) privacyFail('PRIVACY_STATE_UNCONFIRMED');
  const user = await repo.user(request.user_id);
  return { activeRemoved: empty && !remaining.length && !user, userPresent: !!user };
}
export async function runAccountDeletion(client, repo, request, admit) {
  const owner = request.user_id;
  await admit();
  const profile = await repo.one('UserProfile', { user_id: owner });
  if (profile && profile.account_status !== 'INACTIVE') {
    await repo.store.UserProfile.update(profile.id, { account_status: 'INACTIVE' });
    if ((await repo.one('UserProfile', { user_id: owner }))?.account_status !== 'INACTIVE') privacyFail('PRIVACY_WRITE_UNCONFIRMED', 503);
  }
  if (!await repo.clean(ACCOUNT_CLEANUP, owner, admit)) return;
  // Retired withdrawal requests/receipts are personal metadata too. The current
  // erasure request alone remains pending platform erasure; no legal retention
  // period or permission to retain the other personal history is invented.
  for (const old of await readPrivacyRequests(client, owner)) {
    if (old.id === request.id) continue;
    const receipts = await repo.store.PrivacyRecoveryReceipt.filter({ request_id: old.id }, 'id', 20, 0, ['id', 'request_id']);
    if (!Array.isArray(receipts) || receipts.some(row => row.request_id !== old.id)) privacyFail('PRIVACY_STATE_UNCONFIRMED');
    for (const row of receipts) {
      if (!repo.takeDelete()) return;
      await admit(); await deleteAndVerifyAbsent(repo.store, 'PrivacyRecoveryReceipt', row.id, { request_id: old.id });
    }
    if (receipts.length === 20) return;
    if (!repo.takeDelete()) return;
    await admit(); await deleteAndVerifyAbsent(repo.store, 'UserPrivacyRequest', old.id, { user_id: owner });
  }
  await admit();
  if (!await repo.empty(ACCOUNT_CLEANUP, owner)) privacyFail('PRIVACY_DELETE_UNCONFIRMED');
  if ((await readPrivacyRequests(client, owner)).some(row => row.id !== request.id)) privacyFail('PRIVACY_DELETE_UNCONFIRMED');
  // Persist before native identity removal. A lost acknowledgement is reconciled
  // by scoped read-only recovery, never by requiring an already removed User.
  await repo.patch(request, { status: 'NATIVE_REMOVAL_PENDING' });
  await admit();
  await deleteAndVerifyAbsent(repo.store, 'User', owner, { id: owner });
  if (!(await accountRemovalState(repo, request)).activeRemoved) privacyFail('PRIVACY_DELETE_UNCONFIRMED');
  await repo.patch(request, { status: 'PLATFORM_PENDING' });
}
