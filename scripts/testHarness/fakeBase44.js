// CLI-only substitution; no application build imports this module or its URL controls.
const params = new URLSearchParams(location.search);
let session = params.get('sdkSession') || 'anonymous';
let delayed = null;
const calls = [];
let releaseHydration;
let dailyAttempts = 0;
const hydration = params.has('holdHydration') ? new Promise(resolve => { releaseHydration = resolve; }) : Promise.resolve();
export const authFixture = {
  calls,
  hydrationReturned: false,
  releaseHydration() { releaseHydration?.(); },
  setSession(value) { session = value; },
  hold() { delayed = {}; delayed.promise = new Promise(resolve => { delayed.resolve = resolve; }); },
  release() { const pending = delayed; delayed = null; pending?.resolve(); },
};
export const base44 = {
  app: { getPublicSettings: async () => ({}) },
  auth: {
    me: async () => {
      if (delayed) await delayed.promise;
      if (session === 'admin' || session === 'user') return { id: `synthetic-${session}`, role: session };
      throw new Error('SYNTHETIC_ANONYMOUS');
    },
    logout: () => { session = 'anonymous'; },
    loginWithProvider: async () => { throw new Error('SYNTHETIC_AUTH_NO_REDIRECT'); },
  },
  functions: { invoke: async (name, body) => {
    calls.push({ name, action: body.action }); // Action names only; no user payload.
    if (name === 'onboarding' && body.action === 'hydrate' && session !== 'anonymous') {
      await hydration; authFixture.hydrationReturned = true;
      return { data: {
      state: ['AUTHENTICATED_CYCLE_STEP', 'FIRST_SHINKA_DEPENDENCY', 'ACTIVE_EXISTING_USER'].includes(params.get('onboardingState')) ? params.get('onboardingState') : 'AUTHENTICATED_PROFILE_REQUIRED',
      preferences: params.has('uninitialized') ? null : { language_code: params.get('language') === 'tr' ? 'tr' : 'en', timezone: 'UTC' }, today: '2026-10-20',
    } };
    }
    if (name === 'dailyMessage') {
      dailyAttempts++;
      if (params.get('dailyScenario') === 'notReady' || params.get('dailyScenario') === 'retry' && dailyAttempts === 1) return { data: { error_code: 'DAILY_ATOMIC_CAPABILITY_REQUIRED' } };
      const fixture = globalThis.__dailyFixture;
      if (fixture) return { data: structuredClone(fixture) };
      return { data: { error_code: 'DAILY_ATOMIC_CAPABILITY_REQUIRED' } };
    }
    if (body.action === 'list') return { data: { runs: [] } };
    throw new Error('LIVE_OPERATION_UNAVAILABLE_IN_CLI');
  } },
};
