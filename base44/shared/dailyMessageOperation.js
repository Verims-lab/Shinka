import { healthReadDiagnostic } from './healthReadDiagnostics.js';
import { readUserLifecycle, resetOnboardingStep } from './userLifecycle.js';
import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { readBoundedJson } from './boundedJson.js';
import { assertActiveAccount, assertHealthConsent, resolveAuthenticatedOwner, SYSTEM_AUTHORITIES } from './domainSecurity.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { normalizeDomainRead, validateDomainRecord } from './domainValidation.js';
import { resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { isOnboardingProfileReady } from './onboardingRoute.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from './onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
import { createOnce } from './domainAtomic.js';
import { resolveSunSign } from './sunSign.js';
import { resolveDailyCycle } from './dailyCycle.js';
import { repeatWindowStart, selectDailyPair, dailyAssignment } from './dailySelection.js';
import { resolveMoonPhase } from './moonIntervals.js';
import { dailyResponseRecord, readMessageTextMap } from './dailyContent.js';
import { nativeDailyPersistence } from './nativeDailyPersistence.js';
import { assertPrivacyAccess } from './privacyPolicy.js';

const fail = (code, status = 409) => { throw new InternalError(code, status); };
const domainFields = entity => Object.keys(DOMAIN_SCHEMAS[entity].properties);
// Deployed native mode reconciles immutable candidates. atomic is retained only
// for historical executable protocol tests; keyed upsert is never used here.
// entryPrincipal: minted by this same request's entry immediately before; it is
// consumed by the first admission only. Every later phase re-verifies auth.me().
async function normalDailyMessageOperation(client, body, { now = () => new Date(), atomic = null, native = false, library = null, random = Math.random, resetFlow = false, trace = (_stage) => {} } = {}, entryPrincipal = null) {
  const principal = entryPrincipal || await requireAuthenticatedUser(client);
  const owner = resolveAuthenticatedOwner(principal, body);
  let pending = principal;
  const admit = async () => {
    const first = pending !== null;
    const current = pending || await requireAuthenticatedUser(client); pending = null;
    if (current.id !== owner) fail('AUTH_REQUIRED',401);
    // A reset can begin during content/SDK IO after the entry lifecycle read.
    // Only the explicitly coordinated reset flow may continue through it.
    if (!first && !resetFlow && await readUserLifecycle(client,owner)) fail('ONBOARDING_RESTART_REQUIRED',409);
  };
  return produceDailyForOwner(client, owner, body, { now, atomic, native, library, random, resetFlow, syncTimezone: native, trace }, admit);
}
// Shared domain engine. Caller must supply fresh owner admission; HTTP users and
// the scheduler have separate entry authorization. Never accepts a request role.
export async function produceDailyForOwner(client, owner, body, { now = () => new Date(), atomic = null, native = false, library = null, random = Math.random, resetFlow = false, syncTimezone = false, trace = (_stage) => {} } = {}, admit) {
  const admitted = await admit();
  if (body.action !== 'today' || Object.keys(body).some(key => !['action', 'timezone'].includes(key))) fail('INVALID_REQUEST', 400);
  const store = client.asServiceRole.entities;
  const read = async (entity, limit, filter = {}, sort = '-created_date', fields = domainFields(entity)) => {
    const rows = await store[physicalName(entity)].filter({ user_id: owner, ...filter }, sort, limit, 0, ['id', 'user_id', ...fields]);
    if (!Array.isArray(rows)) fail('DAILY_READ_FAILED', 503);
    rows.forEach(row => { if (row.user_id !== owner) fail('FORGED_OWNER', 403); });
    return rows;
  };
  const singleton = async (entity, admittedRecord = undefined) => {
    // A trusted backend admission callback may return the records it just read.
    // This is same-phase reuse, never an auth flag or a later-phase cache.
    const rows = admittedRecord === undefined ? await read(entity, 2) : [admittedRecord];
    if (rows.some(row => row?.user_id !== owner)) fail('FORGED_OWNER', 403);
    if (rows.length > 1) fail('DUPLICATE_OWNER_STATE');
    return rows[0] ? normalizeDomainRead(entity, rows[0]) : null;
  };
  trace('DAILY_PROFILE');
  const profile = await singleton('user_profile', admitted?.profile);
  assertActiveAccount(owner, profile);
  let preferences = await singleton('user_preferences', admitted?.preferences);
  const timezone = resolveTimezone(body.timezone, preferences?.timezone);
  if (syncTimezone && preferences && preferences.timezone !== timezone) {
    await admit();
    await store.UserPreferences.updateMany({ id:preferences.id,user_id:owner,timezone:preferences.timezone }, { $set:{ timezone } });
    preferences = await singleton('user_preferences');
    if (preferences?.timezone !== timezone) fail('DAILY_TIMEZONE_UNCONFIRMED');
    await admit();
  }
  const instant = now(), day = serverLocalDate(instant, timezone);
  const persistence = native ? nativeDailyPersistence(client, owner) : null;
  if (resetFlow && !isOnboardingProfileReady(profile, preferences, day)) fail('PROFILE_COMPLETION_REQUIRED');
  trace('DAILY_EXISTING');
  const reconciled = persistence ? await persistence.existing(day) : null;
  const existing = persistence ? (reconciled.record ? [reconciled.record] : []) : await read('user_daily_message', 2, { shinka_date: day });
  if (existing.length > 1) fail('DUPLICATE_DAILY_MESSAGE');
  if (existing.length) {
    trace('DAILY_CONTENT_REFERENCE');
    const daily = await dailyResponseRecord(client, existing[0], owner, day);
    trace('DAILY_READBACK');
    const current = await admit();
    assertActiveAccount(owner, await singleton('user_profile', current?.profile));
    return { state: 'ACTIVE_EXISTING_USER', persisted: true, created: false, notice: reconciled?.notice || null, daily, profile: { display_name: profile.display_name }, timezone };
  }
  if (!isOnboardingProfileReady(profile, preferences, day)) fail('PROFILE_COMPLETION_REQUIRED');
  if (!atomic && !persistence) fail('DAILY_ATOMIC_CAPABILITY_REQUIRED', 503);
  if (typeof library !== 'function') fail('CONTENT_NOT_READY', 503);
  trace('DAILY_SELECTION');
  const content = await library(client);
  if (!content.plan.ready) fail('CONTENT_NOT_READY', 503);
  const moonRows = await store.MoonPhaseLookup.filter({}, 'start_at_utc', 1201, 0, ['phase_code', 'start_at_utc', 'end_at_utc']);
  const moon = resolveMoonPhase(moonRows, instant);
  const consent = await singleton('user_health_consent');
  if (consent) validateDomainRecord('user_health_consent', Object.fromEntries(domainFields('user_health_consent').map(key => [key, consent[key]])));
  let cycle = 'UNKNOWN';
  let healthGuard = null;
  if (consent?.consent_status === 'GRANTED') {
    if (native) await assertPrivacyAccess(client, owner, { health: true });
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
  const history = persistence ? await persistence.history(repeatWindowStart(day), day) : await read('user_daily_message', 41, { shinka_date: { $gte: repeatWindowStart(day), $lte: day } }, '-shinka_date', ['shinka_date', 'message_pair_id']);
  if (!persistence && (history.length > 40 || new Set(history.map(row => row.shinka_date)).size !== history.length)) fail('DUPLICATE_DAILY_MESSAGE');
  const { pair } = selectDailyPair({ pairs: content.actual.message_pair, history, categoryId: mappings[0].category_id, day, random });
  trace('DAILY_CONTENT_REFERENCE');
  const currentTexts = await readMessageTextMap(client, [pair.id]);
  const record = dailyAssignment({ owner, day, timezone, pair, now: instant });
  const guard = async () => {
    const current = await admit();
  assertActiveAccount(owner, await singleton('user_profile', current?.profile));
  if (healthGuard) {
    const latest = await singleton('user_health_consent');
    validatedOnboardingGrant(latest, HEALTH_CONSENT_VERSION);
    if (latest.id !== healthGuard.consentId || latest.granted_at !== healthGuard.grantedAt || latest.consent_version !== healthGuard.version) fail('CONSENT_STATE_CHANGED');
    assertHealthConsent(owner, latest, await read('health_data_deletion_job', 1, { job_status: { $ne: 'COMPLETED' } }));
  }
  };
  trace('DAILY_PERSISTENCE');
  const outcome = persistence ? await persistence.save(record, guard) : await createOnce('user_daily_message', record, SYSTEM_AUTHORITIES.DAILY_MESSAGE, {
    read: (entity, id) => atomic.read(entity, id),
    createIfAbsent: request => atomic.createIfAbsent({ ...request, requirements: { ...request.requirements, healthInput: healthGuard } }),
  });
  trace('DAILY_READBACK');
  const daily = await dailyResponseRecord(client, outcome.record, owner, day, currentTexts);
  await guard();
  return { state: 'ACTIVE_EXISTING_USER', persisted: true, created: outcome.created, notice: outcome.notice || null, daily, profile: { display_name: profile.display_name }, timezone };
}
export async function dailyMessageOperation(client, body, dependencies = {}) {
  const principal = await requireAuthenticatedUser(client);
  const reset = await readUserLifecycle(client, principal.id);
  if (!reset || reset.operation !== 'RESET_ONBOARDING') return normalDailyMessageOperation(client, body, dependencies, principal);
  if (reset.status !== 'RESET_ACTIVE') fail('TEST_TARGET_BUSY', 409);
  return resetOnboardingStep({ client, reset, owner: principal.id, body, coordinator: dependencies.lifecycleCoordinator,
    perform: context => normalDailyMessageOperation(client, body, { ...dependencies, ...context, resetFlow: true }),
  });
}
export async function handleDailyMessageRequest(req, createClient, dependencies = {}) {
  const requestId = crypto.randomUUID(), started = Date.now();
  let stage = 'SESSION_AUTH_LIFECYCLE';
  const trace = value => { stage = value; };
  try {
    if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED', 405);
    const body = await readBoundedJson(req, 2000, fail);
    const result = await dailyMessageOperation(createClient(req), body, { ...dependencies, trace });
    return Response.json({ ...result, diagnostic: { requestId, stage: 'DAILY_READBACK', durationMs: Date.now() - started } });
  } catch (error) {
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'DAILY_OPERATION_FAILED', diagnostic: { ...healthReadDiagnostic(error, { stage, durationMs: Date.now() - started }), stage, requestId } }, { status: error instanceof InternalError ? error.status : 500 });
  }
}