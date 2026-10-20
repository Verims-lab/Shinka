import { base44 } from '@/api/base44Client';
import { isCalendarDate } from '../../base44/shared/onboardingValidation.js';
const SAFE_CODES = new Set([
  'AUTH_REQUIRED', 'ACTIVE_ACCOUNT_REQUIRED', 'HEALTH_CONSENT_REQUIRED', 'HEALTH_DELETION_PENDING', 'HEALTH_DELETION_UNCONFIRMED',
  'CONSENT_STATE_CHANGED', 'CONSENT_TIMESTAMP_INVALID', 'CONSENT_EVENT_UNCONFIRMED', 'CONSENT_VERSION_CONFLICT',
  'CALENDAR_ATOMIC_CAPABILITY_REQUIRED', 'CALENDAR_STATE_CHANGED', 'CALENDAR_DATA_CONFLICT', 'CALENDAR_READ_FAILED',
  'CALENDAR_HISTORY_LIMIT', 'CALENDAR_READBACK_CONFLICT', 'CALENDAR_OPERATION_FAILED', 'CALENDAR_MONTH_INVALID',
  'PERIOD_DATE_REQUIRED', 'PERIOD_DATE_INVALID', 'PERIOD_START_FUTURE', 'PERIOD_DUPLICATE', 'PERIOD_CONFLICT',
  'PERIOD_NOT_FOUND', 'CYCLE_RANGE_DECISION_REQUIRED', 'WRITE_CONFLICT', 'ACTION_CONFLICT', 'DUPLICATE_OWNER_STATE',
]);
export const isCalendarPrivacyError = code => /^(AUTH_|ACTIVE_|HEALTH_|CONSENT_|DUPLICATE_OWNER)/.test(code || '');
/** @param {string} action @param {object} payload @param {any} client */
export async function calendarRequest(action, payload = {}, client = base44) {
  let timer, timezone = null;
  try {
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* backend fallback */ }
    const response = await Promise.race([
      client.functions.invoke('calendar', { ...payload, action, timezone }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error(), { code: 'TIMEOUT' })), 20000); }),
    ]);
    const value = response?.data;
    if (value?.error_code) throw { response: { data: value } };
    if (!['READY', 'CONSENT_REQUIRED'].includes(value?.state) || !isCalendarDate(value.today) || !isCalendarDate(`${value.month}-01`) ||
      typeof value.revision !== 'string' || !/^[a-f0-9]{64}$/.test(value.revision) || typeof value.writable !== 'boolean' ||
      !Array.isArray(value.starts) || value.starts.some(row => typeof row.id !== 'string' || !isCalendarDate(row.date)) ||
      !Array.isArray(value.recordedDays) || !Array.isArray(value.predictedDays) ||
      [...value.recordedDays, ...value.predictedDays].some(day => !isCalendarDate(day)) ||
      (payload.month && value.month !== payload.month) ||
      (value.state === 'CONSENT_REQUIRED' && (value.starts.length || value.recordedDays.length || value.predictedDays.length)) ||
      (action !== 'read' && value.mutationConfirmed !== true)) throw Object.assign(new Error(), { code: 'CALENDAR_READBACK_CONFLICT' });
    return value;
  } catch (error) {
    const raw = error?.response?.data?.error_code ?? error?.code;
    const code = SAFE_CODES.has(raw) ? raw : raw === 'TIMEOUT' ? raw : !error?.response ? 'NETWORK' : 'CALENDAR_OPERATION_FAILED';
    throw Object.assign(new Error(code), { code });
  } finally { clearTimeout(timer); }
}
