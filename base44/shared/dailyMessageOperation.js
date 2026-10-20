import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { assertActiveAccount, assertOwner, assertHealthConsent, resolveAuthenticatedOwner, SYSTEM_AUTHORITIES } from './domainSecurity.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { normalizeDomainRead, validateDomainRecord } from './domainValidation.js';
import { resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { isOnboardingProfileReady } from './onboardingRoute.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from './onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
import { createOnce } from './domainAtomic.js';
import { resolveSunSign } from './sunSign.js';
import { resolveDailyCycle } from './dailyCycle.js';
import { repeatWindowStart, selectDailyPair, dailySnapshot } from './dailySelection.js';
import { resolveMoonPhase } from './moonIntervals.js';
import { verifiedDailyRecord } from './dailyRecord.js';

const fail = (code, status = 409) => { throw new InternalError(code, status); };
const domainFields = entity => Object.keys(DOMAIN_SCHEMAS[entity].properties);
// atomic is a server-owned implementation of domainAtomic's durable protocol.
// Production deliberately supplies none: SDK keyed upsert is not create-if-absent.
export async function dailyMessageOperation(client, body, { now = () => new Date(), atomic = null, library = null, random = Math.random } = {}) {
  const principal = await requireAuthenticatedUser(client);
  const owner = resolveAuthenticatedOwner(principal, body);
  if (body.action !== 'today' || Object.keys(body).some(key => !['action', 'timezone'].includes(key))) fail('INVALID_REQUEST', 400);
  const store = client.asServiceRole.entities;
  const read = async (entity, limit, filter = {}, sort = '-created_date', fields = domainFields(entity)) => {
    const rows = await store[physicalName(entity)].filter({ user_id: owner, ...filter }, sort, limit, 0, ['id', 'user_id', ...fields]);
    if (!Array.isArray(rows)) fail('DAILY_READ_FAILED', 503);
    rows.forEach(row => assertOwner(principal, row));
    return rows;
  };
  const singleton = async entity => {
    const rows = await read(entity, 2);
    if (rows.length > 1) fail('DUPLICATE_OWNER_STATE');
    return rows[0] ? normalizeDomainRead(entity, rows[0]) : null;
  };
  const profile = await singleton('user_profile');
  assertActiveAccount(owner, profile);
  const preferences = await singleton('user_preferences');
  const timezone = resolveTimezone(body.timezone, preferences?.timezone);
  const instant = now(), day = serverLocalDate(instant, timezone);
  const existing = await read('user_daily_message', 2, { shinka_date: day });
  if (existing.length > 1) fail('DUPLICATE_DAILY_MESSAGE');
  if (existing.length) return { state: 'ACTIVE_EXISTING_USER', persisted: true, created: false, daily: verifiedDailyRecord(existing[0], owner, day), profile: { display_name: profile.display_name }, timezone };
  if (!isOnboardingProfileReady(profile, preferences, day)) fail('PROFILE_COMPLETION_REQUIRED');
  if (!atomic) fail('DAILY_ATOMIC_CAPABILITY_REQUIRED', 503);
  if (typeof library !== 'function') fail('CONTENT_NOT_READY', 503);
  const content = await library(client);
  if (!content.plan.ready) fail('CONTENT_NOT_READY', 503);
  const moonRows = await store.MoonPhaseLookup.filter({}, 'start_at_utc', 1201, 0, ['phase_code', 'start_at_utc', 'end_at_utc']);
  const moon = resolveMoonPhase(moonRows, instant);
  const consent = await singleton('user_health_consent');
  if (consent) validateDomainRecord('user_health_consent', Object.fromEntries(domainFields('user_health_consent').map(key => [key, consent[key]])));
  let cycle = 'UNKNOWN';
  let healthGuard = null;
  if (consent?.consent_status === 'GRANTED') {
    const grant = validatedOnboardingGrant(consent, HEALTH_CONSENT_VERSION);
    const jobs = await read('health_data_deletion_job', 1, { job_status: { $ne: 'COMPLETED' } });
    assertHealthConsent(owner, consent, jobs);
    const events = await read('user_health_consent_event', 2, { occurred_at: { $gte: grant.granted_at } });
    const expectedEvent = onboardingGrantEvent(grant);
    if (events.length !== 1 || Object.entries(expectedEvent).some(([key, value]) => events[0][key] !== value)) fail('CONSENT_EVENT_UNCONFIRMED');
    const settings = await singleton('user_cycle_settings');
    if (settings) validateDomainRecord('user_cycle_settings', Object.fromEntries(domainFields('user_cycle_settings').map(key => [key, settings[key]])));
    const periods = await read('user_period_record', 4, { period_start_date: { $lte: day } }, '-period_start_date');
    cycle = resolveDailyCycle({ day, periods, settings });
    healthGuard = { consentId: consent.id, version: consent.consent_version, grantedAt: consent.granted_at };
  } else if (consent && consent.consent_status !== 'WITHDRAWN') fail('CONSENT_STATE_INVALID');
  const mappings = content.actual.message_category_mapping.filter(row => row.sun_sign_code === resolveSunSign(profile.birth_date) && row.moon_phase_code === moon && row.cycle_phase_code === cycle);
  if (mappings.length !== 1) fail('CONTENT_MAPPING_CONFLICT');
  const history = await read('user_daily_message', 41, { shinka_date: { $gte: repeatWindowStart(day), $lte: day } }, '-shinka_date', ['shinka_date', 'message_pair_id']);
  if (history.length > 40 || new Set(history.map(row => row.shinka_date)).size !== history.length) fail('DUPLICATE_DAILY_MESSAGE');
  const { pair } = selectDailyPair({ pairs: content.actual.message_pair, history, categoryId: mappings[0].category_id, day, random });
  const record = dailySnapshot({ owner, day, timezone, pair, now: instant });
  const guardedAtomic = {
    read: (entity, id) => atomic.read(entity, id),
    createIfAbsent: request => atomic.createIfAbsent({ ...request, requirements: { ...request.requirements, healthInput: healthGuard } }),
  };
  const outcome = await createOnce('user_daily_message', record, SYSTEM_AUTHORITIES.DAILY_MESSAGE, guardedAtomic);
  // Recheck privacy gates after readback as well. No HTTP result on revoked access.
  assertActiveAccount(owner, await singleton('user_profile'));
  if (healthGuard) {
    const latest = await singleton('user_health_consent');
    validatedOnboardingGrant(latest, HEALTH_CONSENT_VERSION);
    if (latest.id !== healthGuard.consentId || latest.granted_at !== healthGuard.grantedAt || latest.consent_version !== healthGuard.version) fail('CONSENT_STATE_CHANGED');
    assertHealthConsent(owner, latest, await read('health_data_deletion_job', 1, { job_status: { $ne: 'COMPLETED' } }));
  }
  return { state: 'ACTIVE_EXISTING_USER', persisted: true, created: outcome.created, daily: verifiedDailyRecord(outcome.record, owner, day), profile: { display_name: profile.display_name }, timezone };
}
export async function handleDailyMessageRequest(req, createClient, dependencies = {}) {
  try {
    if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED', 405);
    const text = await req.text();
    if (text.length > 2000) fail('REQUEST_TOO_LARGE', 413);
    let body; try { body = JSON.parse(text); } catch { fail('INVALID_REQUEST', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail('INVALID_REQUEST', 400);
    return Response.json(await dailyMessageOperation(createClient(req), body, dependencies));
  } catch (error) {
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'DAILY_OPERATION_FAILED' }, { status: error instanceof InternalError ? error.status : 500 });
  }
}
