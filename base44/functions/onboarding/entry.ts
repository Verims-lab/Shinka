import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handleOnboardingRequest } from '../../shared/onboardingOperations.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
// Server-only credential. The operation binds a request-scoped Base44 persistence adapter.
// Native transactions are not assumed; source-gated health writes remain disabled.
const geoNames=createGeoNamesAdapter({username:Deno.env.get('GEONAMES_USERNAME')});
Deno.serve(req=>handleOnboardingRequest(req,createClientFromRequest,{geoNames}));
