import { InternalError } from './internalAuthorization.js';
import { SYSTEM_AUTHORITIES as S } from './domainSecurity.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from './onboardingConsent.js';

const fail = (code) => { throw new InternalError(code, 409); };

// Owns only ON-05 reconciliation; SDK/owner/protected-record boundaries remain
// in the adapter. Every persisted intermediate state is recoverable by readback.
export function createOnboardingCyclePersistence({ owner, now, consentVersion, gate, read, record, verify, insert, upsert, identical, fields, healthAllowed }) {
  const saveCycle = (cycle) => {
    if (cycle.health_consent !== true) throw new InternalError('CONSENT_REQUIRED', 400);
    const settings = record('user_cycle_settings', {
      period_duration_days: cycle.period_duration_days, initial_cycle_length_days: cycle.initial_cycle_length_days,
    });
    const period = record('user_period_record', { period_start_date: cycle.period_start_date });
    const wantsSettings = cycle.period_duration_days != null || cycle.initial_cycle_length_days != null;
    return gate.run(owner, JSON.stringify([settings, period]), async () => {
      await healthAllowed();
      const previous = await read('user_health_consent');
      const grant = previous ? validatedOnboardingGrant(previous, consentVersion) : record('user_health_consent', {
        consent_status: 'GRANTED', consent_version: consentVersion, granted_at: now().toISOString(), withdrawn_at: null,
      });
      const event = onboardingGrantEvent(grant);
      // Onboarding has no withdrawal/regrant or editing workflow. Inspect all
      // owner events (bounded singleton read), not only a matching timestamp.
      const priorEvent = await read('user_health_consent_event');
      const priorSettings = await read('user_cycle_settings');
      const priorPeriod = await read('user_period_record');
      if (!previous && (priorEvent || priorSettings || priorPeriod)) fail('ONBOARDING_READBACK_CONFLICT');
      if (priorEvent && !identical('user_health_consent_event', priorEvent, event)) fail('IMMUTABLE_RECORD');
      if (priorSettings && !identical('user_cycle_settings', priorSettings, settings)) fail('ONBOARDING_ALREADY_SAVED');
      if (priorPeriod && !identical('user_period_record', priorPeriod, period)) fail('ONBOARDING_ALREADY_SAVED');

      // Insert-only: a racing grant must never overwrite another saved time or
      // withdrawal. Duplicate owner rows are detected; no native UNIQUE assumed.
      if (!previous) { await healthAllowed(); await insert('user_health_consent', grant, S.CONSENT); }
      const current = await verify('user_health_consent', grant);
      const allowed = async () => {
        await healthAllowed();
        const fresh = await read('user_health_consent');
        if (!fresh) fail('ONBOARDING_READBACK_CONFLICT');
        validatedOnboardingGrant(fresh, consentVersion);
        if (fresh.id !== current.id || !identical('user_health_consent', fresh, grant)) fail('ONBOARDING_READBACK_CONFLICT');
      };
      await allowed();
      if (!priorEvent) await upsert('user_health_consent_event', event, fields.user_health_consent_event, S.CONSENT);
      await verify('user_health_consent_event', event);
      if (wantsSettings && !priorSettings) {
        await allowed(); await insert('user_cycle_settings', settings, S.CYCLE);
      }
      if (wantsSettings || priorSettings) await verify('user_cycle_settings', settings);
      // Period is last; a partial consent/event/settings write cannot advance.
      if (!priorPeriod) {
        await allowed(); await upsert('user_period_record', period, ['user_id', 'period_start_date'], S.CYCLE);
      }
      await verify('user_period_record', period);
      await verify('user_health_consent_event', event);
      if (wantsSettings || priorSettings) await verify('user_cycle_settings', settings);
      else if (await read('user_cycle_settings')) fail('ONBOARDING_READBACK_CONFLICT');
      await allowed();
      return { consent: current };
    });
  };
  return saveCycle;
}
