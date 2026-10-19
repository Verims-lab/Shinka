import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { handleOnboardingRequest } from '../../shared/onboardingOperations.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
// Base44 secrets resolve per request, never at module load or in a browser module.
/** @param {Request} req */
export default function onboarding(req) {
  const geoNames=createGeoNamesAdapter({username:secrets.get('GEONAMES_USERNAME')});
  return handleOnboardingRequest(req,createClientFromRequest,{geoNames});
}
