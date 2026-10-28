import { base44 } from '@/api/base44Client';
import { optionalName, optionalBirthTime, isCalendarDate, validTimezone } from '../../base44/shared/onboardingValidation.js';
import { SUN_SIGN_CODES } from '../../base44/shared/domainSchemas.js';
import { ONBOARDING_ERROR_KEYS } from '@/foundation/i18n/onboardingCopy';
const known = new Set([...ONBOARDING_ERROR_KEYS, 'YOU_EDIT_CONFLICT', 'YOU_WRITE_UNCONFIRMED', 'YOU_READ_FAILED', 'INVALID_REQUEST', 'DUPLICATE_OWNER_STATE', 'PROFILE_COMPLETION_REQUIRED', 'MAINTENANCE_WRITE_PAUSED', 'HEALTH_DELETION_PENDING', 'GEONAMES_UNAVAILABLE', 'TIMEZONE_INITIALIZATION_REQUIRED']);
export const isYouPrivacyError = code => /^(AUTH_|ACTIVE_|OWNER_|FORGED_|ACCOUNT_|ONBOARDING_|TEST_LIFECYCLE|TEST_OPERATION_|TEST_TARGET_|PROFILE_COMPLETION_REQUIRED)/.test(code || '');
const revisionValid = row => /^[a-f0-9]{64}$/.test(row?.revision || '');
export function validateYouResponse(value, action) {
  const invalid = () => { throw Object.assign(new Error('YOU_RESPONSE_INVALID'), { code: 'YOU_RESPONSE_INVALID' }); };
  if (!value || typeof value !== 'object') invalid();
  if (action.startsWith('verify') && value.state === 'UNCONFIRMED') return value;
  if (/^(save|verify)/.test(action) && value.state !== 'VERIFIED') invalid();
  if (action === 'read' || action.endsWith('Profile')) {
    const p = value.profile;
    if (!revisionValid(p) || !isCalendarDate(p.birth_date) || !SUN_SIGN_CODES.includes(p.sun_sign_code)) invalid();
    try { optionalName(p.display_name); optionalBirthTime(p.birth_time); } catch { invalid(); }
    const keys = ['birthplace_geonames_id','birthplace_name','birthplace_country_code','birthplace_latitude','birthplace_longitude'];
    if (![0,5].includes(keys.filter(k => p[k] != null).length)) invalid();
  }
  if (action === 'read' || action.endsWith('Preferences')) {
    const p = value.preferences;
    if (!revisionValid(p) || !['tr','en'].includes(p.language_code) || typeof p.notifications_enabled !== 'boolean' || p.notification_time !== '06:00' || !validTimezone(p.timezone) || ![null, undefined, 'light', 'dark'].includes(p.theme_code)) invalid();
  }
  if (action === 'read' && (!isCalendarDate(value.today) || !['GRANTED','WITHDRAWN','NOT_GIVEN'].includes(value.consent?.status))) invalid();
  return value;
}
export function deviceTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; }
}
/** @param {string} action @param {object} payload @param {{functions:{invoke:(name:string,body:object)=>Promise<{data:any}>}}} client @param {number} timeoutMs */
export async function youRequest(action, payload = {}, client = base44, timeoutMs = 20000) {
  let timer;
  try {
    const response = await Promise.race([client.functions.invoke('you', { action, ...payload }), new Promise((_, reject) => { timer = setTimeout(() => reject({ code: 'TIMEOUT' }), timeoutMs); })]);
    if (response?.data?.error_code) throw { response: { data: response.data } };
    return validateYouResponse(response?.data, action);
  } catch (error) {
    const raw = error?.response?.data?.error_code || error?.code;
    const code = known.has(raw) || isYouPrivacyError(raw) ? raw : 'YOU_READ_FAILED';
    const field = ['display_name','birth_date','birth_time','birthplace'].includes(error?.response?.data?.field) ? error.response.data.field : null;
    // An invocation/timeout/readback error cannot prove that a transmitted write
    // did not happen. Only explicit pre-write validation/conflict is definitive.
    const definite = field !== null || ['INVALID_REQUEST','YOU_EDIT_CONFLICT','DUPLICATE_OWNER_STATE','HEALTH_DELETION_PENDING','GEONAMES_UNAVAILABLE','GEONAMES_RATE_LIMITED','MAINTENANCE_WRITE_PAUSED'].includes(code) || isYouPrivacyError(code);
    throw Object.assign(new Error(code), { code, field, unknown: action.startsWith('save') && (!definite || error?.response?.data?.write_outcome === 'UNCONFIRMED') });
  } finally { clearTimeout(timer); }
}

/** @param {string} next @param {{functions:{invoke:(name:string,body:object)=>Promise<{data:any}>}}} client */
export async function persistProductLanguage(next, client = base44) {
  const { preferences } = await youRequest('readPreferences', {}, client);
  const payload = { language_code: next, notifications_enabled: preferences.notifications_enabled, timezone: deviceTimezone(), revision: preferences.revision };
  try { return await youRequest('savePreferences', payload, client); }
  catch (failure) {
    if (!failure.unknown) throw failure;
    try {
      const result = await youRequest('verifyPreferences', payload, client);
      if (result.state === 'VERIFIED') return result;
    } catch (checkFailure) {
      if (isYouPrivacyError(checkFailure.code)) throw Object.assign(checkFailure, { unknown: true });
    }
    // Failure of the read-only check cannot turn a lost write response into a
    // definitive failure. The user reviews preferences; no blind auto-resubmit.
    throw failure;
  }
}