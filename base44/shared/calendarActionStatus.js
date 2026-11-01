import { InternalError } from './internalAuthorization.js';
import { calendarRevision } from './calendarState.js';
import { calendarRecoveryIntent } from './nativeCalendarRecovery.js';

// Receipt evidence is owner-scoped and checked against the freshly admitted
// snapshot. This read never finishes a receipt or changes a period/consent.
export const calendarResultMatches = (state, intent) => intent.operation === 'delete'
  ? !state.periods.some(row => row.id === intent.period_id)
  : state.periods.filter(row => row.period_start_date === intent.desired_date &&
    (intent.operation === 'add' || row.id === intent.period_id)).length === 1;

export async function calendarActionStatus(client, owner, body, state) {
  if (!body.action_id) return null;
  const rows = await client.asServiceRole.entities.UserCalendarAction.filter({ user_id: owner, action_id: body.action_id }, 'id', 2);
  if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => row.user_id !== owner)) throw new InternalError('CALENDAR_ACTION_CONFLICT', 409);
  const receipt = rows[0];
  const result = { action_id: body.action_id, status: 'ABSENT' };
  if (!receipt) return result;
  if (receipt.base_revision !== body.revision || !['add','edit','delete'].includes(receipt.operation)) return { ...result, status: 'CONFLICT' };
  const intent = calendarRecoveryIntent(receipt);
  const revision = await calendarRevision(state), matches = calendarResultMatches(state, receipt);
  const confirmed = receipt.status === 'APPLIED' && receipt.result_revision === revision && matches;
  const partialGrant = receipt.initial_grant === true && state.consent?.granted_at === receipt.grant_at;
  const resumable = receipt.status === 'PENDING' && (receipt.base_revision === revision || matches || partialGrant);
  return { ...intent, status: confirmed ? 'APPLIED' : resumable ? 'PENDING' : 'CONFLICT' };
}
