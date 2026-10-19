import { base44 } from '@/api/base44Client';
const SAFE_CODES = new Set(['DAILY_ATOMIC_CAPABILITY_REQUIRED', 'CONTENT_NOT_READY', 'CONTENT_CATEGORY_DECISION_REQUIRED', 'MOON_LOOKUP_NOT_READY', 'MOON_LOOKUP_COVERAGE_REQUIRED', 'PROFILE_COMPLETION_REQUIRED', 'ACTIVE_ACCOUNT_REQUIRED', 'AUTH_REQUIRED', 'DAILY_READBACK_CONFLICT', 'DUPLICATE_DAILY_MESSAGE', 'DAILY_OPERATION_FAILED', 'HEALTH_CONSENT_REQUIRED', 'TIMEZONE_INITIALIZATION_REQUIRED']);
export async function dailyMessageRequest(client = base44) {
  let timezone = null;
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Backend uses last valid stored zone. */ }
  let timer;
  try {
    const response = await Promise.race([client.functions.invoke('dailyMessage', { action: 'today', timezone }), new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error(), { code: 'TIMEOUT' })), 20000); })]);
    const result = response.data;
    if (result?.error_code) throw { response: { data: result } };
    const row = result?.daily;
    if (!result?.persisted || result.state !== 'ACTIVE_EXISTING_USER' || !row?.id || !row.shinka_date || ['message_tr_snapshot', 'suggestion_tr_snapshot', 'message_en_snapshot', 'suggestion_en_snapshot'].some(key => typeof row[key] !== 'string' || !row[key].trim())) throw Object.assign(new Error(), { code: 'DAILY_READBACK_CONFLICT' });
    return result;
  } catch (error) {
    const raw = error?.response?.data?.error_code ?? error?.code;
    const code = SAFE_CODES.has(raw) ? raw : raw === 'TIMEOUT' ? 'TIMEOUT' : !error?.response ? 'NETWORK' : 'DAILY_OPERATION_FAILED';
    throw Object.assign(new Error(code), { code });
  } finally { clearTimeout(timer); }
}
export function dailyErrorState(code) {
  if (code === 'NETWORK') return navigator.onLine === false ? 'offline' : 'failure';
  return ['DAILY_ATOMIC_CAPABILITY_REQUIRED', 'CONTENT_NOT_READY', 'CONTENT_CATEGORY_DECISION_REQUIRED', 'MOON_LOOKUP_NOT_READY', 'MOON_LOOKUP_COVERAGE_REQUIRED'].includes(code) ? 'notReady' : 'failure';
}
