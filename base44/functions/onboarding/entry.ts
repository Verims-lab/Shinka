import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handleOnboardingRequest } from '../../shared/onboardingOperations.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
// Server-only credential. No write fallback until a durable atomic adapter is verified.
const geoNames=createGeoNamesAdapter({username:Deno.env.get('GEONAMES_USERNAME')});
Deno.serve(req=>handleOnboardingRequest(req,createClientFromRequest,{geoNames}));
