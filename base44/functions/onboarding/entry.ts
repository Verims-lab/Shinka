import { createNativeClient } from '../../shared/nativeClient.ts';
import { secrets } from 'base44:runtime';
import { handleOnboardingRequest } from '../../shared/onboardingOperations.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
import { createGeoNamesGuard } from '../../shared/geonamesGuard.js';
// Worker-local burst guard only; holds no secret or profile data.
const guard = createGeoNamesGuard();
// The secret is read per request, only after auth, only when a provider call is needed.
/** @param {Request} req */
export default function onboarding(req) {
  const geoNamesFor = owner => guard.forOwner(owner, fetcher => createGeoNamesAdapter({ username: secrets.get('GEONAMES_USERNAME'), fetcher }));
  return handleOnboardingRequest(req, createNativeClient, { geoNamesFor });
}