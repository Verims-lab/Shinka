import { productTransport, productReadError, productPrivacyError } from './productReadTransport';
import { base44 } from '@/api/base44Client';
import { validateDomainRecord } from '../../base44/shared/domainValidation.js';
import { validTimezone, serverLocalDate } from '../../base44/shared/onboardingValidation.js';
import { CONTENT_CATEGORY_DECISION } from '../../base44/shared/contentCategoryDecision.js';
export const isPatternPrivacyError = productPrivacyError;
const SAFE_CODES = new Set([
  'PATTERN_CATEGORY_CONFLICT','PATTERN_DATA_CHANGED','PATTERN_DATA_INVALID','PATTERN_READ_FAILED','PATTERN_RESPONSE_INVALID',
  'MOON_LOOKUP_CONFLICT','MOON_LOOKUP_COVERAGE_REQUIRED','MOON_LOOKUP_NOT_READY','MOON_LOOKUP_SIZE_CONFLICT',
  'AUTH_REQUIRED','ACTIVE_ACCOUNT_REQUIRED','OWNER_REQUIRED','FORGED_OWNER','ACCOUNT_DELETION_IN_PROGRESS','ONBOARDING_RESTART_REQUIRED',
  'TEST_LIFECYCLE_UNAVAILABLE','TEST_LIFECYCLE_CONFLICT','TEST_OPERATION_BUSY','TEST_TARGET_REQUIRED','DUPLICATE_OWNER_STATE',
  'HEALTH_CONSENT_REQUIRED','HEALTH_DELETION_PENDING','HEALTH_DELETION_UNCONFIRMED','CONSENT_STATE_CHANGED',
  'CONSENT_TIMESTAMP_INVALID','CONSENT_EVENT_UNCONFIRMED','CONSENT_VERSION_CONFLICT','SESSION_UNAVAILABLE','PRIVACY_STATE_UNCONFIRMED',
]);
const accepts = code => SAFE_CODES.has(code);
export function validatePatternResponse(value, section) {
  const invalid = () => { throw Object.assign(new Error('PATTERN_RESPONSE_INVALID'), { code: 'PATTERN_RESPONSE_INVALID' }); };
  if (value?.section !== section) invalid();
  if (section === 'themes') {
    if (!['READY', 'EMPTY'].includes(value.state) || !Array.isArray(value.themes) || value.themes.length > 2) invalid();
    try { validateDomainRecord('user_pattern_summary', value.summary); } catch { invalid(); }
    const expected = ['primary', 'secondary'].filter(p => value.summary[`${p}_category_id`]);
    if (expected.length !== value.themes.length || (value.state === 'EMPTY') !== (expected.length === 0)) invalid();
    value.themes.forEach((row, index) => {
      const approved = CONTENT_CATEGORY_DECISION.rows.find(c => c.category_code === row.category_code);
      if (!approved || row.id !== value.summary[`${expected[index]}_category_id`] || row.count !== value.summary[`${expected[index]}_count`] || row.display_name_tr !== approved.display_name_tr || row.display_name_en !== approved.display_name_en) invalid();
    });
  } else {
    const lunar = value.lunar;
    const stamp = value => typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
    if (!['READY','PARTIAL'].includes(value.state) || !lunar || !validTimezone(lunar.timezone) || !stamp(lunar.observed_at)) invalid();
    const now = Date.parse(lunar.observed_at);
    for (const row of [lunar.current, lunar.next_full]) {
      if (row === null) continue;
      try { validateDomainRecord('moon_phase_lookup', { phase_code: row.phase_code, start_at_utc: row.start_at_utc, end_at_utc: row.end_at_utc }); } catch { invalid(); }
    }
    if (lunar.current && !(Date.parse(lunar.current.start_at_utc) <= now && now < Date.parse(lunar.current.end_at_utc))) invalid();
    if (lunar.next_full && (!lunar.current || lunar.next_full.phase_code !== 'FULL' || Date.parse(lunar.next_full.start_at_utc) <= now ||
      lunar.next_full.date !== serverLocalDate(new Date(lunar.next_full.start_at_utc), lunar.timezone))) invalid();
    if ((value.state === 'READY') !== Boolean(lunar.current && lunar.next_full)) invalid();
  }
  return value;
}
/** @param {string} section @param {any} client @param {number} timeoutMs @param {any} timers @param {any} options */
export async function patternRequest(section, client = base44, timeoutMs = 20000, timers = undefined, options = {}) {
  let timezone = null;
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* saved backend timezone */ }
  const response = await productTransport(() => client.functions.invoke('pattern', { action: section, timezone }),
    { ...options, readOnly: true, accepts, fallback: 'PATTERN_READ_FAILED', stage: 'PATTERN_READ', timeoutMs, timers });
  try { return validatePatternResponse(response?.data, section); }
  catch (error) { throw productReadError(error, accepts, 'PATTERN_RESPONSE_INVALID', 'PATTERN_READ', null); }
}
export const patternRead = (section, options) => patternRequest(section, base44, 20000, undefined, options);
