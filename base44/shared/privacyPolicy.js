import { InternalError } from './internalAuthorization.js';

export const PRIVACY_KINDS = Object.freeze(['WITHDRAW_HEALTH', 'DELETE_ACCOUNT']);
export const HEALTH_CLEANUP = Object.freeze(['UserCalendarAction', 'UserCyclePhaseDay', 'UserCyclePrediction', 'UserPeriodRecord', 'UserCycleSettings']);
// No source authorizes personal-history retention for an owner's erasure request.
export const ACCOUNT_CLEANUP = Object.freeze([...HEALTH_CLEANUP, 'NotificationDelivery', 'UserPatternSummary', 'UserDailyMessage', 'UserHealthConsentEvent', 'UserHealthConsent', 'HealthDataDeletionJob', 'DataProtectionEvent', 'UserPreferences', 'UserProfile', 'AdminAuditLog', 'AdminTestOperation', 'UserTermsAcceptance']);
export const privacyFail = (code, status = 409) => { throw new InternalError(code, status); };
export async function privacyHash(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export const privacyQuery = (name, owner) => name === 'AdminAuditLog'
  ? { $or: [{ admin_user_id: owner }, { target_user_id: owner }] }
  : name === 'AdminTestOperation' ? { $or: [{ actor_id: owner }, { target_id: owner }] } : { user_id: owner };
export const privacyOwns = (name, row, owner) => name === 'AdminAuditLog'
  ? row.admin_user_id === owner || row.target_user_id === owner
  : name === 'AdminTestOperation' ? row.actor_id === owner || row.target_id === owner : row.user_id === owner;
export const PRIVACY_REQUEST_FIELDS = ['id', 'user_id', 'request_key', 'kind', 'status', 'requested_at', 'grant_at', 'consent_version', 'completed_at'];
export async function readPrivacyRequests(client, owner) {
  const rows = await client.asServiceRole.entities.UserPrivacyRequest.filter({ user_id: owner }, '-requested_at', 51, 0, PRIVACY_REQUEST_FIELDS);
  if (!Array.isArray(rows) || rows.length > 50 || rows.some(row => !row.id || row.user_id !== owner || !PRIVACY_KINDS.includes(row.kind) || !['IN_PROGRESS','COMPLETED','NATIVE_REMOVAL_PENDING','PLATFORM_PENDING'].includes(row.status) || typeof row.request_key !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(row.requested_at) || !Number.isFinite(Date.parse(row.requested_at)))) privacyFail('PRIVACY_STATE_UNCONFIRMED', 503);
  if (new Set(rows.map(row => row.request_key)).size !== rows.length) privacyFail('PRIVACY_CONCURRENT_CONFLICT');
  return rows;
}
export async function assertPrivacyAccess(client, owner, { health = false } = {}) {
  const rows = await readPrivacyRequests(client, owner);
  if (rows.some(row => row.kind === 'DELETE_ACCOUNT')) privacyFail('ACCOUNT_DELETION_IN_PROGRESS', 403);
  if (health && rows.some(row => row.kind === 'WITHDRAW_HEALTH' && row.status !== 'COMPLETED')) privacyFail('HEALTH_DELETION_PENDING', 403);
}
