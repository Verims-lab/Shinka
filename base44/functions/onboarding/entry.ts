import { createNativeClient } from '../../shared/nativeClient.ts';
import { secrets } from 'base44:runtime';
import { handleOnboardingRequest } from '../../shared/onboardingOperations.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
import { createGeoNamesGuard } from '../../shared/geonamesGuard.js';
import { createDailyQuota } from '../../shared/geonamesDailyQuota.js';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
// Worker-local burst guard plus the app-wide daily cap; holds no secret or profile data.
const guard = createGeoNamesGuard();
// The secret is read per request, only after auth, only when a provider call is needed.
/** @param {Request} req */
export default function onboarding(req) {
  const dailyQuota = createDailyQuota(createClientFromRequest(req).asServiceRole.entities.GeoNamesDailyQuota);
  const geoNamesFor = owner => guard.forOwner(owner, fetcher => createGeoNamesAdapter({ username: secrets.get('GEONAMES_USERNAME'), fetcher }), { dailyQuota });
  return handleOnboardingRequest(req, createNativeClient, { geoNamesFor });
}