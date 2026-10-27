import { base44 } from '@/api/base44Client';
import { validateDomainRecord } from '../../base44/shared/domainValidation.js';
import { validTimezone, serverLocalDate } from '../../base44/shared/onboardingValidation.js';
import { CONTENT_CATEGORY_DECISION } from '../../base44/shared/contentCategoryDecision.js';
export const isPatternPrivacyError = code => /^(AUTH_|ACTIVE_|HEALTH_|CONSENT_|OWNER_|FORGED_|ACCOUNT_|ONBOARDING_|TEST_LIFECYCLE|TEST_OPERATION_|TEST_TARGET_)/.test(code || '');
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
/** @param {string} section @param {any} client @param {number} timeoutMs */
export async function patternRequest(section, client = base44, timeoutMs = 20000, timers = { set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) }) {
  let timer, timezone = null;
  try {
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* saved backend timezone */ }
    const response = await Promise.race([client.functions.invoke('pattern', { action: section, timezone }), new Promise((_, reject) => { timer = timers.set(() => reject({ code: 'TIMEOUT' }), timeoutMs); })]);
    if (response?.data?.error_code) throw { response: { data: response.data } };
    return validatePatternResponse(response?.data, section);
  } catch (error) {
    const raw = error?.response?.data?.error_code || error?.code;
    const code = /^(PATTERN_|MOON_LOOKUP_|AUTH_|ACTIVE_|HEALTH_|CONSENT_|ACCOUNT_|OWNER_|ONBOARDING_|TEST_LIFECYCLE|TEST_OPERATION_|TEST_TARGET_)/.test(raw || '') ? raw : raw === 'TIMEOUT' ? raw : 'PATTERN_READ_FAILED';
    throw Object.assign(new Error(code), { code });
  } finally { timers.clear(timer); }
}
