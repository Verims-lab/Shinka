import { base44 } from '@/api/base44Client';
import { isCalendarDate } from '../../base44/shared/onboardingValidation.js';
const SAFE_CODES = new Set([
  'OWNER_REQUIRED', 'ONBOARDING_RESTART_REQUIRED', 'ACCOUNT_DELETION_IN_PROGRESS', 'TEST_LIFECYCLE_CONFLICT', 'TEST_OPERATION_BUSY',
  'CALENDAR_PENDING_REVIEW', 'CALENDAR_ACTION_CONFLICT', 'CALENDAR_WRITE_UNCONFIRMED', 'MAINTENANCE_WRITE_PAUSED', 'CONSENT_WRITE_UNCONFIRMED',
  'AUTH_REQUIRED', 'ACTIVE_ACCOUNT_REQUIRED', 'HEALTH_CONSENT_REQUIRED', 'HEALTH_DELETION_PENDING', 'HEALTH_DELETION_UNCONFIRMED',
  'CONSENT_STATE_CHANGED', 'CONSENT_TIMESTAMP_INVALID', 'CONSENT_EVENT_UNCONFIRMED', 'CONSENT_VERSION_CONFLICT',
  'CALENDAR_ATOMIC_CAPABILITY_REQUIRED', 'CALENDAR_STATE_CHANGED', 'CALENDAR_DATA_CONFLICT', 'CALENDAR_READ_FAILED',
  'CALENDAR_HISTORY_LIMIT', 'CALENDAR_READBACK_CONFLICT', 'CALENDAR_OPERATION_FAILED', 'CALENDAR_MONTH_INVALID',
  'PERIOD_DATE_REQUIRED', 'PERIOD_DATE_INVALID', 'PERIOD_START_FUTURE', 'PERIOD_DUPLICATE', 'PERIOD_CONFLICT',
  'PERIOD_NOT_FOUND', 'CYCLE_RANGE_DECISION_REQUIRED', 'WRITE_CONFLICT', 'ACTION_CONFLICT', 'DUPLICATE_OWNER_STATE',
]);
export const isCalendarPrivacyError = code => /^(AUTH_|ACTIVE_|HEALTH_|CONSENT_|OWNER_|ACCOUNT_|ONBOARDING_|TEST_LIFECYCLE|TEST_OPERATION_|DUPLICATE_OWNER)/.test(code || '');
// A successful transport alone never confirms the requested visible observation.
export function assertCalendarMutation(action, payload, value) {
  if (action === 'read') return;
  const fail = () => { throw Object.assign(new Error(), { code: 'CALENDAR_READBACK_CONFLICT' }); };
  if (value?.mutationConfirmed !== true || value.state === 'RECOVERY_REQUIRED') fail();
  if (action === 'delete' && value.starts?.some(row => row.id === payload.period_id)) fail();
  if (['add', 'edit'].includes(action) && payload.date?.slice(0, 7) === value.month &&
    value.starts?.filter(row => row.date === payload.date && (action !== 'edit' || row.id === payload.period_id)).length !== 1) fail();
}
/** @param {string} action @param {object} payload @param {any} client @param {{set:Function,clear:Function}} timers */
export async function calendarRequest(action, payload = {}, client = base44, timers = { set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) }) {
  let timer, timezone = null;
  try {
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* backend fallback */ }
    const response = await Promise.race([
      client.functions.invoke('calendar', { ...payload, action, timezone }),
      new Promise((_, reject) => { timer = timers.set(() => reject(Object.assign(new Error(), { code: 'TIMEOUT' })), 20000); }),
    ]);
    const value = response?.data;
    if (value?.error_code) throw { response: { data: value } };
    if (!['READY', 'CONSENT_REQUIRED', 'RECOVERY_REQUIRED'].includes(value?.state) || !isCalendarDate(value.today) || !isCalendarDate(`${value.month}-01`) ||
      typeof value.revision !== 'string' || !/^[a-f0-9]{64}$/.test(value.revision) || typeof value.writable !== 'boolean' ||
      !Array.isArray(value.starts) || value.starts.some(row => typeof row.id !== 'string' || !isCalendarDate(row.date)) ||
      !Array.isArray(value.recordedDays) || !Array.isArray(value.predictedDays) ||
      (value.calculationNotice != null && value.calculationNotice !== 'CYCLE_ESTIMATE_UNAVAILABLE') ||
      (value.calculationNotice && (value.predictedDays.length || value.state !== 'READY')) ||
      [...value.recordedDays, ...value.predictedDays].some(day => !isCalendarDate(day)) ||
      (value.recovery != null && (typeof value.recovery.action_id !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(value.recovery.action_id) || !/^[a-f0-9]{64}$/.test(value.recovery.revision) || !isCalendarDate(value.recovery.date) || !['add','edit','delete'].includes(value.recovery.operation) || (value.recovery.operation !== 'add' && (typeof value.recovery.period_id !== 'string' || !value.recovery.period_id)))) ||
      (value.state === 'RECOVERY_REQUIRED' && (!value.recovery || value.writable || value.starts.length || value.recordedDays.length || value.predictedDays.length)) ||
      (value.pendingReview === true && value.predictedDays.length > 0) ||
      (payload.month && value.month !== payload.month) ||
      (value.state === 'CONSENT_REQUIRED' && (value.starts.length || value.recordedDays.length || value.predictedDays.length)) ||
      (action !== 'read' && value.mutationConfirmed !== true)) throw Object.assign(new Error(), { code: 'CALENDAR_READBACK_CONFLICT' });
    assertCalendarMutation(action, payload, value);
    return value;
  } catch (error) {
    const raw = error?.response?.data?.error_code ?? error?.code;
    const code = SAFE_CODES.has(raw) ? raw : raw === 'TIMEOUT' ? raw : !error?.response ? 'NETWORK' : 'CALENDAR_OPERATION_FAILED';
    throw Object.assign(new Error(code), { code });
  } finally { timers.clear(timer); }
}
