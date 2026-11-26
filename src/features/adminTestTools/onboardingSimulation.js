import {
  optionalName, optionalBirthTime, validateBirthDate, validateCycleInput,
} from '../../../base44/shared/onboardingValidation.js';

export const SIMULATION_STEPS = Object.freeze([
  'UNAUTHENTICATED_INTRO', 'UNAUTHENTICATED_SIGN_IN',
  'AUTHENTICATED_NAME_REQUIRED', 'AUTHENTICATED_PROFILE_REQUIRED',
  'AUTHENTICATED_CYCLE_STEP', 'FIRST_SHINKA_DEPENDENCY',
]);
const VERSION = 'simulation-only-terms';

// This adapter has no transport, identity, storage or backend dependency. Its
// readback-shaped envelopes exercise the real UI; they are never server proof.
export function createOnboardingSimulation() {
  let disposed = false;
  let profile = null;
  const today = '2026-11-26';
  const active = () => {
    if (disposed) throw new Error('SIMULATION_DISPOSED');
  };
  return {
    today,
    async policy(signal = undefined) {
      active();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return { state: 'READY', version: VERSION };
    },
    async authenticate(provider, _destination, age, _client = undefined, declarations = undefined) {
      active();
      // The new-user fixture has no earlier acceptance. An unchecked local
      // declaration cannot advance it; no real legal record is created.
      const code = age !== true ? 'AGE_DECLARATION_REQUIRED'
        : declarations?.termsConfirmed !== true ? 'TERMS_CONFIRMATION_REQUIRED'
        : declarations.version !== VERSION ? 'TERMS_VERSION_CHANGED'
        : !['apple', 'google'].includes(provider) ? 'AUTH_PROVIDER_FAILED' : null;
      return code ? { ok: false, code } : { ok: true };
    },
    async request(action, payload = {}) {
      active();
      if (action === 'searchPlaces') return {
        places: [{ birthplace_geonames_id: 999000001, birthplace_name: 'Test',
          birthplace_country_code: 'XX', place_kind: 'PLACE' }],
        next_page: null, limited: false,
      };
      if (action === 'saveProfile') {
        validateBirthDate(payload.birth_date, today);
        profile = { id: 'simulation-profile', display_name: optionalName(payload.display_name),
          birth_date: payload.birth_date, birth_time: optionalBirthTime(payload.birth_time),
          birthplace_geonames_id: payload.birthplace_geonames_id ?? null };
        return { state: 'AUTHENTICATED_CYCLE_STEP', persisted: true, profile: { ...profile } };
      }
      if (action === 'saveCycle' || action === 'skipCycle') {
        if (!profile) throw new Error('SIMULATION_PROFILE_REQUIRED');
        if (action === 'saveCycle') validateCycleInput(payload, today);
        return { state: 'FIRST_SHINKA_DEPENDENCY',
          persisted: action === 'saveCycle' && Boolean(payload.period_start_date) };
      }
      // New UI service actions must be explicitly simulated; never fall through
      // to a production adapter or return an invented successful response.
      throw new Error('SIMULATION_ACTION_UNSUPPORTED');
    },
    async dailyRequest() {
      active();
      return { state: 'ACTIVE_EXISTING_USER', persisted: true,
        daily: { id: 'simulation-first-shinka' } };
    },
    dispose() { disposed = true; profile = null; },
  };
}
