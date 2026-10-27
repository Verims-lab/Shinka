import { dailyFixture } from './dailyFixture';
import { onboardingOperation, handleOnboardingRequest } from '../../../base44/shared/onboardingOperations.js';
import { handleDailyMessageRequest } from '../../../base44/shared/dailyMessageOperation.js';
import { onboardingRequest } from '@/services/onboardingService';
import { dailyMessageRequest } from '@/services/dailyMessageService';
import { createGeoNamesGuard } from '../../../base44/shared/geonamesGuard.js';

// Actual services -> HTTP entries -> shared native adapter -> isolated SDK IO.
export async function closureFixture(owner = 'ownerA') {
  const f = dailyFixture(); f.rows.user_profile.length = 0; f.rows.user_preferences.length = 0;
  f.client.asServiceRole.entities.UserPrivacyRequest = {filter:async()=>[]};
  f.client.auth.me = async () => ({id:owner, role:'user'});
  let providerConstructions = 0;
  const guard = createGeoNamesGuard();
  const dependencies = { now: f.dependencies.now, cycleGate: f.cycleGate, geoNamesFor: owner => guard.forOwner(owner, () => { providerConstructions++; throw new Error('PROVIDER_MUST_NOT_RUN'); }) };
  const state = { mode: 'normal', dailyCalls: 0, calls: [] };
  const client = { functions: { invoke: async (name, body) => {
    state.calls.push({name, body});
    if (name === 'dailyMessage') { state.dailyCalls++; if (state.mode === 'network') throw new Error('SYNTHETIC_NETWORK'); }
    const req = new Request('https://example.invalid', {method:'POST',body:JSON.stringify(body)});
    const response = name === 'onboarding'
      ? await handleOnboardingRequest(req, () => f.client, dependencies)
      : await handleDailyMessageRequest(req, () => f.client, {...f.dependencies, atomic:null, native:true});
    const data = await response.json();
    if (!response.ok) throw {response:{data}};
    if (name === 'dailyMessage' && state.mode === 'lost') throw new Error('SYNTHETIC_LOST_RESPONSE');
    return {data};
  } } };
  const request = (action, payload = {}) => onboardingRequest(action, payload, client);
  await request('initialize', {language_code:'en',timezone:'Europe/Istanbul'});
  return {...f, state, client, request, daily:()=>dailyMessageRequest(client), providerConstructions:()=>providerConstructions, backend:(body)=>onboardingOperation(f.client,body,dependencies)};
}
