// CLI-only substitution; no application build imports this module or its URL controls.
const params = new URLSearchParams(location.search);
let session = params.get('sdkSession') || 'anonymous';
let delayed = null;
const calls = [];
let releaseHydration;
let dailyAttempts = 0;
let calendarLab;
let testToolsLab;
async function loadCalendarLab() {
  if (!calendarLab) calendarLab = import('@/foundation/tests/calendarFixture').then(async ({ calendarFixture }) => {
    const f = calendarFixture({ granted: params.get('calendarScenario') !== 'consent' });
    if (params.get('calendarScenario') === 'unsupported') {
      await f.change('add', { date: '2026-01-01' });
      await f.change('add', { date: '2026-04-01' });
    } else if (params.get('calendarScenario') !== 'consent') await f.change('add', { date: '2026-10-01' });
    globalThis.__calendarLab = f;
    return f;
  });
  return calendarLab;
}
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
    if (name === 'applicationSession') return { data: { ...await base44.auth.me(), authority: 'BASE44_NATIVE_V1' } };
    if (name === 'adminTestTools') {
      if (!testToolsLab) testToolsLab = import('@/foundation/tests/adminTestFixture').then(({ adminTestFixture }) => adminTestFixture());
      const f = await testToolsLab;
      f.state.actor = session === 'admin' ? 'adminA' : session === 'user' ? 'ownerA' : null;
      try { return { data: await f.request(body, { ...f.dependencies, coordinator: null }) }; }
      catch (error) { return { data: { error_code: error.code || 'TEST_TOOLS_FAILED' } }; }
    }
    if (name === 'calendar') {
      const f = await loadCalendarLab();
      try {
        if (params.get('calendarScenario') === 'blocked') {
          if (body.action !== 'read') return { data: { error_code: 'CALENDAR_ATOMIC_CAPABILITY_REQUIRED' } };
          return { data: { ...await f.request('read', body), writable: false } };
        }
        return { data: await f.request(body.action, body) };
      } catch (error) { return { data: { error_code: error.code || 'CALENDAR_OPERATION_FAILED' } }; }
    }
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
