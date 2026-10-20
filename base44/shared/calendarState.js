import { InternalError } from './internalAuthorization.js';
import { assertActiveAccount, assertHealthConsent } from './domainSecurity.js';
import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { validateDomainRecord } from './domainValidation.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from './onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
import { calculateCalendar, orderedPeriods, validatePeriodChange } from './calendarCalculation.js';

const fail = (code, status = 409) => { throw new InternalError(code, status); };
export function validateCalendarAccess(state, owner) {
  assertActiveAccount(owner, state.profile);
  if ((state.consent && state.consent.user_id !== owner) || state.events.some(row => row.user_id !== owner)) fail('OWNER_REQUIRED', 403);
  if (state.jobs.length) fail('HEALTH_DELETION_PENDING', 403);
  if (!state.consent || state.consent.consent_status === 'WITHDRAWN') return false;
  assertHealthConsent(owner, state.consent, state.jobs);
  const grant = validatedOnboardingGrant(state.consent, HEALTH_CONSENT_VERSION);
  const expected = onboardingGrantEvent(grant);
  const matching = state.events.filter(row => Object.entries(expected).every(([key, value]) => row[key] === value));
  if (matching.length !== 1) fail('CONSENT_EVENT_UNCONFIRMED');
  if (state.events.some(row => row.occurred_at >= grant.granted_at && (row.event_type !== 'GRANTED' || row.occurred_at !== grant.granted_at || row.consent_version !== grant.consent_version))) fail('CONSENT_STATE_CHANGED');
  return true;
}
export function validateCalendarHealth(state, owner) {
  const validate = (entity, row) => {
    if (!row.id || row.user_id !== owner) fail('OWNER_REQUIRED', 403);
    validateDomainRecord(entity, Object.fromEntries(Object.keys(DOMAIN_SCHEMAS[entity].properties).map(key => [key, row[key]])));
  };
  state.periods.forEach(row => validate('user_period_record', row));
  if (state.settings) validate('user_cycle_settings', state.settings);
  orderedPeriods(state.periods);
}
export async function calendarRevision(state) {
  // Transport concurrency token only; never used as consent/security authority.
  const fields = (entity, row) => row ? Object.fromEntries(['id', ...Object.keys(DOMAIN_SCHEMAS[entity].properties)].map(key => [key, row[key] ?? null])) : null;
  const bytes = new TextEncoder().encode(JSON.stringify({
    profile: [state.profile?.id, state.profile?.account_status],
    consent: fields('user_health_consent', state.consent),
    events: state.consent?.consent_status === 'GRANTED' ? state.events.filter(row => row.occurred_at >= state.consent.granted_at).map(row => fields('user_health_consent_event', row)).sort((a, b) => a.id.localeCompare(b.id)) : [],
    jobs: state.jobs.map(row => fields('health_data_deletion_job', row)),
    settings: fields('user_cycle_settings', state.settings), periods: orderedPeriods(state.periods).map(row => fields('user_period_record', row)),
  }));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}

// Executed INSIDE the adapter's durable transaction, against its fresh snapshot.
// Only these health collections can change. Daily messages are not inputs/outputs.
export function planCalendarChange(state, owner, request, today, instant, newId) {
  const hasConsent = validateCalendarAccess(state, owner);
  const next = structuredClone(state);
  if (!hasConsent) {
    if (request.action !== 'add' || request.health_consent !== true) fail('HEALTH_CONSENT_REQUIRED', 403);
    // Regrant requires verified completed deletion and no residual health rows.
    if (state.periods.length || state.settings || state.predictions.length || state.phases.length) fail('HEALTH_DELETION_UNCONFIRMED');
    if (state.consent) {
      const domain = (entity, row) => Object.fromEntries(Object.keys(DOMAIN_SCHEMAS[entity].properties).map(key => [key, row?.[key]]));
      validateDomainRecord('user_health_consent', domain('user_health_consent', state.consent));
      const job = state.completedDeletion;
      if (!job?.id || job.user_id !== owner || job.job_status !== 'COMPLETED' ||
        job.requested_at < state.consent.withdrawn_at || job.completed_at < job.requested_at) fail('HEALTH_DELETION_UNCONFIRMED');
      validateDomainRecord('health_data_deletion_job', domain('health_data_deletion_job', job));
      const withdrawal = state.events.filter(row => row.user_id === owner && row.event_type === 'WITHDRAWN' && row.occurred_at === state.consent.withdrawn_at && row.consent_version === state.consent.consent_version);
      if (withdrawal.length !== 1) fail('CONSENT_EVENT_UNCONFIRMED');
    }
    if (!state.consent && state.events.length) fail('CONSENT_STATE_CHANGED');
    next.consent = { id: state.consent?.id || newId(), user_id: owner, consent_status: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, granted_at: instant, withdrawn_at: null };
    const grant = validatedOnboardingGrant(next.consent, HEALTH_CONSENT_VERSION);
    next.events.push({ id: newId(), ...onboardingGrantEvent(grant) });
  }
  validateCalendarHealth(next, owner);
  for (const row of [...state.predictions, ...state.phases]) if (row.user_id !== owner) fail('OWNER_REQUIRED', 403);
  validatePeriodChange(next.periods, request.action, request.period_id, request.date, today);
  if (request.action === 'add') next.periods.push({ id: newId(), user_id: owner, period_start_date: request.date });
  if (request.action === 'edit') next.periods = next.periods.map(row => row.id === request.period_id ? { ...row, period_start_date: request.date } : row);
  if (request.action === 'delete') next.periods = next.periods.filter(row => row.id !== request.period_id);
  const calculation = calculateCalendar({ periods: next.periods, settings: next.settings, today });
  // Preserve unchanged cached rows, including their original calculation time.
  const reuse = (old, rows, key, entity) => {
    const indexed = new Map(old.map(row => [row[key], row]));
    return rows.map(row => {
      const saved = indexed.get(row[key]);
      const existing = saved && Object.entries(row).every(([field, value]) => saved[field] === value) ? saved : null;
      const record = existing || { id: newId(), ...row, user_id: owner, calculated_at: instant };
      if (!record.id) fail('CALENDAR_DATA_CONFLICT');
      // Validate reused cache rows before publication too, not only on readback.
      validateDomainRecord(entity, Object.fromEntries(Object.keys(DOMAIN_SCHEMAS[entity].properties).map(field => [field, record[field]])));
      return record;
    });
  };
  next.predictions = reuse(state.predictions, calculation.predictions, 'predicted_start_date', 'user_cycle_prediction');
  next.phases = reuse(state.phases, calculation.phases, 'phase_date', 'user_cycle_phase_day');
  return next;
}

export function verifyCalendarCommit(state, owner, today) {
  if (!validateCalendarAccess(state, owner)) fail('CONSENT_STATE_CHANGED');
  validateCalendarHealth(state, owner);
  const expected = calculateCalendar({ periods: state.periods, settings: state.settings, today });
  for (const [key, entity, identity] of [['predictions', 'user_cycle_prediction', 'predicted_start_date'], ['phases', 'user_cycle_phase_day', 'phase_date']]) {
    const rows = state[key], byDate = new Map(rows.map(row => [row[identity], row]));
    if (rows.length !== expected[key].length || byDate.size !== rows.length) fail('CALENDAR_READBACK_CONFLICT');
    expected[key].forEach(row => {
      const saved = byDate.get(row[identity]);
      if (!saved?.id || saved.user_id !== owner || Object.entries(row).some(([field, value]) => saved[field] !== value)) fail('CALENDAR_READBACK_CONFLICT');
      validateDomainRecord(entity, Object.fromEntries(Object.keys(DOMAIN_SCHEMAS[entity].properties).map(field => [field, saved[field]])));
    });
  }
}
