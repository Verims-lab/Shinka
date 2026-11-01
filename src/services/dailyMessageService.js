import { healthReadDiagnostic } from '../../base44/shared/healthReadDiagnostics.js';
import { productTransport, PRODUCT_TIMERS } from './productReadTransport';
import { retryAfterMs } from '../../base44/shared/healthReadRetry.js';
import { base44 } from '@/api/base44Client';
const SAFE_CODES = new Set(['TEST_LIFECYCLE_UNAVAILABLE', 'DAILY_CONTENT_REFERENCE_INVALID', 'DAILY_CONTENT_REFERENCE_MISSING', 'TEST_TARGET_BUSY', 'DAILY_READ_FAILED', 'DAILY_TIMEZONE_UNCONFIRMED', 'CONTENT_MAPPING_CONFLICT', 'MAINTENANCE_WRITE_PAUSED', 'DAILY_HISTORY_LIMIT', 'TEST_RESET_STEP_CONFLICT', 'TEST_JOB_STATUS_UNCONFIRMED', 'HEALTH_DELETION_PENDING', 'CONSENT_STATE_CHANGED', 'CONSENT_EVENT_UNCONFIRMED', 'DAILY_ATOMIC_CAPABILITY_REQUIRED', 'CONTENT_NOT_READY', 'CONTENT_CATEGORY_DECISION_REQUIRED', 'MOON_LOOKUP_NOT_READY', 'MOON_LOOKUP_COVERAGE_REQUIRED', 'PROFILE_COMPLETION_REQUIRED', 'ACTIVE_ACCOUNT_REQUIRED', 'AUTH_REQUIRED', 'DAILY_READBACK_CONFLICT', 'DUPLICATE_DAILY_MESSAGE', 'DAILY_OPERATION_FAILED', 'HEALTH_CONSENT_REQUIRED', 'TIMEZONE_INITIALIZATION_REQUIRED']);
const ACCESS_CODES = new Set(['ACCESS_DENIED', 'AUTH_REQUIRED', 'ACTIVE_ACCOUNT_REQUIRED', 'HEALTH_CONSENT_REQUIRED', 'HEALTH_DELETION_PENDING', 'CONSENT_STATE_CHANGED', 'CONSENT_EVENT_UNCONFIRMED', 'PROFILE_COMPLETION_REQUIRED', 'OWNER_REQUIRED', 'FORGED_OWNER', 'ACCOUNT_DELETION_IN_PROGRESS', 'ACCOUNT_DELETION_PENDING', 'ONBOARDING_RESTART_REQUIRED', 'TEST_TARGET_BUSY', 'TEST_RESET_STEP_CONFLICT', 'TEST_JOB_STATUS_UNCONFIRMED', 'TEST_LIFECYCLE_UNAVAILABLE', 'TEST_RESET_STEP_UNCONFIRMED', 'PRIVACY_STATE_UNCONFIRMED', 'PRIVACY_CONCURRENT_CONFLICT', 'CONSENT_VERSION_CONFLICT', 'CONSENT_TIMESTAMP_INVALID', 'CONSENT_REGRANT_WORKFLOW_REQUIRED']);
export const isDailyPrivacyError = code => code !== 'TEST_LIFECYCLE_UNAVAILABLE' && ACCESS_CODES.has(code);
export const safeDailyErrorCode = code => SAFE_CODES.has(code) || isDailyPrivacyError(code) || ['TIMEOUT', 'NETWORK', 'RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'DAILY_CONTEXT_CHANGED'].includes(code) ? code : 'DAILY_OPERATION_FAILED';
/** @param {{functions:{invoke:(name:string,payload:object)=>Promise<{data:any}>}}} client
 * @param {{set: Function, clear: Function}} timers */
export async function dailyMessageRequest(client = base44, timers = PRODUCT_TIMERS, options = {}) {
  let timezone = null;
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Backend uses last valid stored zone. */ }
  try {
    // today can create an immutable assignment: it must never inherit the
    // read-only auto-retry policy. Share only its deadline/cancellation boundary.
    const response = await productTransport(async () => {
      try { return await client.functions.invoke('dailyMessage', { action: 'today', timezone }); }
      catch (error) {
        const raw = error?.response?.data?.error_code ?? error?.code;
        const code = SAFE_CODES.has(raw) || isDailyPrivacyError(raw) ? raw : raw === 'TIMEOUT' ? 'TIMEOUT' : !error?.response ? 'NETWORK' : 'DAILY_OPERATION_FAILED';
        throw Object.assign(new Error(code), { code, diagnostic: healthReadDiagnostic(error), retryAfterMs: error?.response?.data?.retry_after_ms ?? retryAfterMs(error) });
      }
    }, { readOnly:false, accepts:code=>SAFE_CODES.has(code)||isDailyPrivacyError(code)||['TIMEOUT','NETWORK'].includes(code), fallback:'DAILY_OPERATION_FAILED', stage:'DAILY_REQUEST', timers, ...options });
    const result = response.data, row = result?.daily;
    if (!result?.persisted || result.state !== 'ACTIVE_EXISTING_USER' || !row?.id || !row.shinka_date || ['message_tr_snapshot', 'suggestion_tr_snapshot', 'message_en_snapshot', 'suggestion_en_snapshot'].some(key => typeof row[key] !== 'string' || !row[key].trim())) throw Object.assign(new Error(), { code: 'DAILY_READBACK_CONFLICT' });
    return result;
  } catch (error) {
    if(error?.code==='READ_CANCELLED')throw error;
    const raw = error?.response?.data?.error_code ?? error?.code;
    const code = safeDailyErrorCode(raw);
    throw Object.assign(new Error(code), { code, diagnostic: healthReadDiagnostic(error,{stage:'DAILY_REQUEST'}), retryAfterMs:error?.retryAfterMs ?? null });
  }
}
export const dailyMessageInvoke = options => dailyMessageRequest(base44, undefined, options);

export function dailyErrorState(code) {
  if (code === 'NETWORK') return navigator.onLine === false ? 'offline' : 'failure';
  return ['DAILY_ATOMIC_CAPABILITY_REQUIRED', 'CONTENT_NOT_READY', 'CONTENT_CATEGORY_DECISION_REQUIRED', 'MOON_LOOKUP_NOT_READY', 'MOON_LOOKUP_COVERAGE_REQUIRED'].includes(code) ? 'notReady' : 'failure';
}
