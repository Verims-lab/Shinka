import { productFailureResponse } from './productReadDiagnostics.js';
import { readUserLifecycle } from './userLifecycle.js';
import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { readBoundedJson } from './boundedJson.js';
import { resolveAuthenticatedOwner } from './domainSecurity.js';
import { resolveTimezone, serverLocalDate, isCalendarDate } from './onboardingValidation.js';
import { calculateCalendar, calendarMonthView, validatePeriodDate } from './calendarCalculation.js';
import { validateCalendarAccess, validateCalendarHealth, calendarRevision, planCalendarChange, verifyCalendarCommit } from './calendarState.js';
import { calendarReader } from './base44CalendarReader.js';
import { nativeCalendarRecovery, readCalendarPending, calendarRecoveryIntent } from './nativeCalendarRecovery.js';
import { nativeCalendarChange } from './nativeCalendarPersistence.js';
import { calendarActionStatus } from './calendarActionStatus.js';
import { commitCalendarAction } from './domainAtomic.js';

const fail = (code, status = 400) => { throw new InternalError(code, status); };
function validateRequest(body) {
  const allowed = { read: ['month', 'action_id', 'revision'], resume: [], add: ['date', 'health_consent'], edit: ['period_id', 'date'], delete: ['period_id'] };
  if (!Object.hasOwn(allowed, body.action)) fail('INVALID_REQUEST');
  const mutation = body.action !== 'read';
  const fields = ['action', 'timezone', ...allowed[body.action], ...(mutation ? ['action_id', 'revision', 'month'] : [])];
  if (Object.keys(body).some(key => !fields.includes(key))) fail('INVALID_REQUEST');
  if (body.month != null && !isCalendarDate(`${body.month}-01`)) fail('CALENDAR_MONTH_INVALID');
  if ((mutation || body.action_id !== undefined || body.revision !== undefined) && (typeof body.action_id !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(body.action_id) || typeof body.revision !== 'string' || !/^[a-f0-9]{64}$/.test(body.revision))) fail('CALENDAR_ACTION_INVALID');
  if (['edit', 'delete'].includes(body.action) && (typeof body.period_id !== 'string' || !body.period_id || body.period_id.length > 200)) fail('PERIOD_NOT_FOUND');
  if (body.health_consent !== undefined && typeof body.health_consent !== 'boolean') fail('INVALID_REQUEST');
}
export async function calendarOperation(client, body, { now = () => new Date(), atomic = null, native = false, stage = (_name) => {} } = {}) {
  stage('CALENDAR_ADMISSION');
  const principal = await requireAuthenticatedUser(client);
  const owner = resolveAuthenticatedOwner(principal, body);
  if (await readUserLifecycle(client, owner)) fail('ONBOARDING_RESTART_REQUIRED', 409);
  validateRequest(body);
  const reader = calendarReader(client, principal);
  let state;
  stage('CALENDAR_SNAPSHOT');
  try { state = native && body.action !== 'read' ? await nativeCalendarChange(client, principal, body, now, stage) : await reader.confirmedSnapshot(); }
  catch (error) {
    if (!native || body.action !== 'read' || error.code !== 'CONSENT_EVENT_UNCONFIRMED') throw error;
    const recovery = await nativeCalendarRecovery(client, owner);
    const timezone = resolveTimezone(body.timezone, (await reader.preferences())?.timezone), today = serverLocalDate(now(), timezone), month = body.month || today.slice(0, 7);
    if (body.action_id && (body.action_id !== recovery.action_id || body.revision !== recovery.revision)) fail('CALENDAR_ACTION_CONFLICT', 409);
    return { state: 'RECOVERY_REQUIRED', recovery, ...(body.action_id ? { checkedAction: { ...recovery, status: 'PENDING' } } : {}), today, month, timezone, revision: recovery.revision, writable: false, coverageEnd: null, calculationNotice: null, calculationError: null, mutationConfirmed: false, pendingReview: true, starts: [], recordedDays: [], predictedDays: [], hasPeriods: false };
  }
  let timezone = resolveTimezone(body.timezone, state.preferences?.timezone);
  let today = serverLocalDate(now(), timezone);
  const writable = native || typeof atomic?.transactCalendar === 'function';
  if (body.action !== 'read' && !native) {
    validatePeriodDate(body.action, body.date, today);
    const fingerprint = JSON.stringify([body.action, body.period_id ?? null, body.date ?? null, body.health_consent ?? false]);
    const outcome = await commitCalendarAction(principal, { actionId: body.action_id, fingerprint, revision: body.revision }, atomic,
      (snapshot, newId) => {
        timezone = resolveTimezone(body.timezone, snapshot.preferences?.timezone);
        const instant = now();
        today = serverLocalDate(instant, timezone);
        return { snapshot: planCalendarChange(snapshot, owner, body, today, instant.toISOString(), newId), calculationDay: today };
      });
    if (!isCalendarDate(outcome.calculationDay)) fail('ATOMIC_RESULT_INVALID', 409);
    verifyCalendarCommit(outcome.snapshot, owner, outcome.calculationDay);
    if (await calendarRevision(outcome.snapshot) !== outcome.revision) fail('CALENDAR_READBACK_CONFLICT', 409);
    // Compliant adapters publish to the authoritative reader, never a shadow
    // store. A failed confirmation is an error, not a claim that commit rolled back.
    state = await reader.confirmedSnapshot();
    if (await calendarRevision(state) !== outcome.revision) fail('CALENDAR_STATE_CHANGED', 409);
  }
  const consent = validateCalendarAccess(state, owner);
  const pending = native ? await readCalendarPending(client, owner) : [];
  const pendingReview = pending.length > 0;
  if (body.action !== 'read' && pendingReview) fail('CALENDAR_ACTION_CONFLICT', 409);
  const month = body.month || today.slice(0, 7);
  let calculation = { predictions: [], phases: [], observations: [], estimate: null, coverageEnd: null };
  let calculationError = null;
  if (consent) {
    validateCalendarHealth(state, owner);
    try { calculation = calculateCalendar({ periods: state.periods, settings: state.settings, today }); }
    catch (error) {
      if (!(error instanceof InternalError) || !['CALENDAR_HISTORY_LIMIT', 'CALENDAR_FUTURE_RECORD'].includes(error.code)) throw error;
      calculationError = error.code;
    }
  }
  stage('CALENDAR_READBACK');
  const checkedAction = native && body.action === 'read' && (consent || !state.consent)
    ? await calendarActionStatus(client, owner, body, state) : null;
  if (native) {
    await client.auth.me();
    const final = await reader.access();
    if (JSON.stringify(final.consent) !== JSON.stringify(state.consent) || JSON.stringify(final.jobs) !== JSON.stringify(state.jobs)) fail('CONSENT_STATE_CHANGED', 403);
  }
  return {
    state: consent ? 'READY' : 'CONSENT_REQUIRED', today, timezone,
    revision: await calendarRevision(state), writable: writable && !pendingReview, calculationError,
    calculationNotice: calculation.estimate?.length === null ? 'CYCLE_ESTIMATE_UNAVAILABLE' : null,
    mutationConfirmed: body.action !== 'read',
    ...(checkedAction ? { checkedAction } : {}),
    // Derived display is calculated from confirmed observations, not advertised
    // as an already persisted phase cache or a transactionally isolated read.
    ...calendarMonthView(consent ? state.periods : [], state.settings, calculation, month),
    pendingReview,
    ...(pending.length === 1 && (consent || (!state.consent && pending[0].initial_grant)) ? { recovery: calendarRecoveryIntent(pending[0]) } : {}),
    ...(pendingReview ? { predictedDays: [], calculationError: 'CALENDAR_PENDING_REVIEW' } : {}),
    hasPeriods: consent && state.periods.length > 0,
  };
}
export async function handleCalendarRequest(req, createClient, dependencies = {}) {
  const started = Date.now(); let stage = 'CALENDAR_READ', operationId = null;
  try {
    if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED', 405);
    const body = await readBoundedJson(req, 2000, fail);
    if (typeof body.action_id === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(body.action_id)) operationId = body.action_id;
    if (body.action !== 'read') stage = 'CALENDAR_WRITE';
    return Response.json(await calendarOperation(createClient(req), body, { ...dependencies, stage: name => { stage = name; } }));
  } catch (error) {
    const response = productFailureResponse(error, 'CALENDAR_OPERATION_FAILED', 500, stage, started);
    const safe = await response.clone().json();
    console.error('SHINKA_CALENDAR_FAILURE', { operationId, errorCode: safe.error_code, ...safe.diagnostic });
    return response;
  }
}
