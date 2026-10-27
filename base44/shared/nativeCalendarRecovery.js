import { isCalendarDate } from './onboardingValidation.js';
import { InternalError } from './internalAuthorization.js';
import { assertActiveAccount } from './domainSecurity.js';
import { validatedOnboardingGrant } from './onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
// Read-only recovery projection. One unambiguous durable intent may resume;
// competing intents stay visible as a conflict, never bulk-cancelled or erased.
export async function readCalendarPending(client, owner) {
  const rows = await client.asServiceRole.entities.UserCalendarAction.filter({ user_id: owner, status: 'PENDING' }, 'id', 3);
  if (!Array.isArray(rows) || rows.length > 3 || rows.some(row => row.user_id !== owner)) throw new InternalError('CALENDAR_ACTION_CONFLICT', 409);
  return rows;
}
export function calendarRecoveryIntent(row) {
  const date = row.desired_date ?? row.previous_date;
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(row.action_id || '') || !/^[a-f0-9]{64}$/.test(row.base_revision || '') ||
    !['add','edit','delete'].includes(row.operation) || !isCalendarDate(date) ||
    (row.operation !== 'add' && (typeof row.period_id !== 'string' || !row.period_id))) throw new InternalError('CALENDAR_ACTION_CONFLICT', 409);
  return { action_id: row.action_id, revision: row.base_revision, operation: row.operation, date,
    ...(row.period_id ? { period_id: row.period_id } : {}) };
}
export async function nativeCalendarRecovery(client, owner) {
  const e = client.asServiceRole.entities;
  const rows = await readCalendarPending(client, owner);
  if (rows.length !== 1 || !rows[0].initial_grant) throw new InternalError('CONSENT_EVENT_UNCONFIRMED', 409);
  const [profiles, consents, jobs] = await Promise.all([
    e.UserProfile.filter({ user_id: owner }, 'id', 2), e.UserHealthConsent.filter({ user_id: owner }, 'id', 2),
    e.HealthDataDeletionJob.filter({ user_id: owner, job_status: { $ne: 'COMPLETED' } }, 'id', 1),
  ]);
  if (profiles.length !== 1 || consents.length > 1 || jobs.length) throw new InternalError('CONSENT_STATE_CHANGED', 409);
  assertActiveAccount(owner, profiles[0]);
  if (consents.length) {
    validatedOnboardingGrant(consents[0], HEALTH_CONSENT_VERSION);
    if (consents[0].user_id !== owner || consents[0].granted_at !== rows[0].grant_at) throw new InternalError('CONSENT_STATE_CHANGED', 409);
  }
  return calendarRecoveryIntent(rows[0]);
}
