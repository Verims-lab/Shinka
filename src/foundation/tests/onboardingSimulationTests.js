import { createOnboardingSimulation } from '@/features/adminTestTools/onboardingSimulation';
import { check, rejects } from './dataModelTests';

/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_SIMULATION_TESTS = [
  ['SIM01', 'Simulation has explicit isolated adapters and refuses unknown actions', async () => {
    const simulation = createOnboardingSimulation();
    try {
      const policy = await simulation.policy();
      for (const provider of ['apple', 'google']) {
        check(!(await simulation.authenticate(provider, '/', false, null, {})).ok);
        check(!(await simulation.authenticate(provider, '/', true, null, { termsConfirmed: true, version: 'real-version' })).ok);
        check((await simulation.authenticate(provider, '/', true, null, { termsConfirmed: true, version: policy.version })).ok);
      }
      await rejects(() => simulation.request('hydrate'));
      await rejects(() => simulation.request('reset'));
      await rejects(() => simulation.request('saveProfile', { birth_date: '' }), 'DOB_REQUIRED');
      const payload = { birth_date: '2000-01-01', display_name: null };
      const profile = await simulation.request('saveProfile', payload);
      check(profile.profile.display_name === null && profile.profile.birth_date === payload.birth_date);
      await rejects(() => simulation.request('saveCycle', { period_start_date: '2026-11-01', health_consent: false }), 'CONSENT_REQUIRED');
      check((await simulation.request('skipCycle')).persisted === false);
      check((await simulation.dailyRequest()).daily.id === 'simulation-first-shinka');
    } finally { simulation.dispose(); }
  }],
  ['SIM02', 'Exit destroys simulation capabilities and a new run has no saved profile', async () => {
    const previous = createOnboardingSimulation();
    await previous.request('saveProfile', { birth_date: '2000-01-01', display_name: 'Fictional' });
    previous.dispose(); previous.dispose();
    for (const operation of [() => previous.request('searchPlaces'), () => previous.policy(),
      () => previous.authenticate('apple', '/', true), () => previous.dailyRequest()]) await rejects(operation);
    const next = createOnboardingSimulation();
    try { await rejects(() => next.request('skipCycle')); }
    finally { next.dispose(); }
  }],
];
