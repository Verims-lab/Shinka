import { base44 } from '@/api/base44Client';
import { validateDomainRecord } from '../../base44/shared/domainValidation.js';
import { validTimezone } from '../../base44/shared/onboardingValidation.js';
import { formatPatternInstant } from '../../base44/shared/patternCalculation.js';
import { CONTENT_CATEGORY_DECISION } from '../../base44/shared/contentCategoryDecision.js';
export const isPatternPrivacyError = code => /^(AUTH_|ACTIVE_|OWNER_|FORGED_|ACCOUNT_|ONBOARDING_|TEST_LIFECYCLE|TEST_OPERATION_|TEST_TARGET_)/.test(code || '');
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
    const t = value.timeline;
    if (value.state !== 'READY' || !t || !validTimezone(t.timezone) || !Array.isArray(t.nodes) || t.nodes.length !== 5 || !Number.isFinite(Date.parse(t.observed_at)) || !Number.isInteger(t.active_index) || t.active_index < 0 || t.active_index > 3 || !(t.today_position >= 0 && t.today_position < 1)) invalid();
    const start = Date.parse(t.nodes[0].instant), end = Date.parse(t.nodes[4].instant), now = Date.parse(t.observed_at);
    t.nodes.forEach((node, index) => {
      const time = Date.parse(node.instant), previous = t.nodes[index - 1];
      if (node.phase_code !== ['NEW', 'WAXING', 'FULL', 'WANING', 'NEW'][index] || !Number.isFinite(time) || previous && time <= Date.parse(previous.instant) || node.position !== (time - start) / (end - start) || node.label !== formatPatternInstant(node.instant, t.timezone)) invalid();
    });
    if (t.today_position !== (now - start) / (end - start) || now < Date.parse(t.nodes[t.active_index].instant) || now >= Date.parse(t.nodes[t.active_index + 1].instant)) invalid();
  }
  return value;
}
/** @param {string} section @param {any} client @param {number} timeoutMs */
export async function patternRequest(section, client = base44, timeoutMs = 20000) {
  let timer, timezone = null;
  try {
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* saved backend timezone */ }
    const response = await Promise.race([client.functions.invoke('pattern', { action: section, timezone }), new Promise((_, reject) => { timer = setTimeout(() => reject({ code: 'TIMEOUT' }), timeoutMs); })]);
    if (response?.data?.error_code) throw { response: { data: response.data } };
    return validatePatternResponse(response?.data, section);
  } catch (error) {
    const raw = error?.response?.data?.error_code || error?.code;
    const code = /^(PATTERN_|MOON_LOOKUP_|AUTH_|ACTIVE_|ACCOUNT_|OWNER_|ONBOARDING_|TEST_LIFECYCLE|TEST_OPERATION_|TEST_TARGET_)/.test(raw || '') ? raw : raw === 'TIMEOUT' ? raw : 'PATTERN_READ_FAILED';
    throw Object.assign(new Error(code), { code });
  } finally { clearTimeout(timer); }
}
