import { createNativeClient } from '../../shared/nativeClient.ts';
import { secrets } from 'base44:runtime';
import { handleInternalRequest } from "../../shared/internalAuthorization.js";
import { internalHealthOperation } from "../../shared/internalHealthOperations.js";
import { createGeoNamesRuntimeProbe } from '../../shared/geonamesRuntimeProbe.js';
const runGeoNamesProbe=createGeoNamesRuntimeProbe();
// The existing guard runs before operation dispatch, secret access and any fetch.
/** @param {Request} req */
export default (req) => handleInternalRequest(req, createNativeClient,(client,body)=>internalHealthOperation(client,body,{
  geoNamesTransportProbe:()=>runGeoNamesProbe({username:secrets.get('GEONAMES_USERNAME'),signal:req.signal}),
}));
