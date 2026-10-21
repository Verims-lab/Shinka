import { InternalError } from './internalAuthorization.js';
import { assertOwner, assertActiveAccount } from './domainSecurity.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { normalizeDomainRead } from './domainValidation.js';
import { CALENDAR_HISTORY_LIMIT } from './calendarCalculation.js';
import { validateCalendarAccess, validateCalendarHealth, calendarRevision } from './calendarState.js';
import { assertPrivacyAccess } from './privacyPolicy.js';

const fail = code => { throw new InternalError(code, 409); };
// Read-only SDK boundary; two reads detect some races, not snapshot isolation.
export function calendarReader(client, principal) {
  const owner = principal.id;
  const read = async (entity, limit, offset = 0, filter = {}, sort = 'id') => {
    const fields = Object.keys(DOMAIN_SCHEMAS[entity].properties);
    const rows = await client.asServiceRole.entities[physicalName(entity)].filter({ ...filter, user_id: owner }, sort, limit, offset, ['id', ...fields]);
    if (!Array.isArray(rows) || rows.length > limit) fail('CALENDAR_READ_FAILED');
    return rows.map(row => {
      assertOwner(principal, row);
      const normalized = normalizeDomainRead(entity, row);
      return Object.fromEntries(['id', ...fields].map(key => [key, normalized[key] ?? null]));
    });
  };
  const one = async entity => {
    const rows = await read(entity, 2);
    if (rows.length > 1) fail('DUPLICATE_OWNER_STATE');
    return rows[0] || null;
  };
  const access = async () => {
    if (client.shinkaNative) await assertPrivacyAccess(client, owner, { health: true });
    const profile = await one('user_profile');
    assertActiveAccount(owner, profile);
    const consent = await one('user_health_consent');
    const jobs = await read('health_data_deletion_job', 1, 0, { job_status: { $ne: 'COMPLETED' } });
    // Read only history relevant to the current grant; past withdrawal history is
    // valid after reconsent and must not be mistaken for duplicate current grants.
    const events = consent?.consent_status === 'GRANTED' ? await read('user_health_consent_event', 3, 0, { occurred_at: { $gte: consent.granted_at } }) : [];
    const state = { profile, consent, jobs, events };
    validateCalendarAccess(state, owner);
    return state;
  };
  const periods = async () => {
    const rows = [];
    for (let offset = 0; offset <= CALENDAR_HISTORY_LIMIT; offset += 100) {
      const page = await read('user_period_record', 100, offset, {}, 'period_start_date');
      rows.push(...page);
      if (rows.length > CALENDAR_HISTORY_LIMIT) fail('CALENDAR_HISTORY_LIMIT');
      if (page.length < 100) return rows;
    }
    fail('CALENDAR_HISTORY_LIMIT');
  };
  const snapshot = async () => {
    const state = await access();
    const preferences = await one('user_preferences');
    if (!validateCalendarAccess(state, owner)) return { ...state, preferences, periods: [], settings: null, predictions: [], phases: [] };
    const all = await periods();
    const settings = await one('user_cycle_settings');
    const finalAccess = await access();
    if (JSON.stringify(state) !== JSON.stringify(finalAccess)) fail('CONSENT_STATE_CHANGED');
    const result = { ...state, preferences, periods: all, settings, predictions: [], phases: [] };
    validateCalendarHealth(result, owner);
    return result;
  };
  return {
    access,
    snapshot,
    // Best-effort detection of read races, NOT a native snapshot transaction.
    async confirmedSnapshot() {
      const first = await snapshot(), second = await snapshot();
      if (await calendarRevision(first) !== await calendarRevision(second)) fail('CALENDAR_STATE_CHANGED');
      return second;
    },
  };
}
