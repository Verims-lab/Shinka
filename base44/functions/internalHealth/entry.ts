import { healthUploadSigner } from '../../shared/healthPersistence.js';
import { createNativeClient } from '../../shared/nativeClient.ts';
import { secrets } from 'base44:runtime';
import { handleInternalRequest } from "../../shared/internalAuthorization.js";
import { internalHealthOperation } from "../../shared/internalHealthOperations.js";
import { createGeoNamesRuntimeProbe } from '../../shared/geonamesRuntimeProbe.js';
const runGeoNamesProbe=createGeoNamesRuntimeProbe();
// The existing guard runs before operation dispatch, secret access and any fetch.
/** @param {Request} req */
export default (req) => handleInternalRequest(req, createNativeClient,(client,body)=>internalHealthOperation(client,body,{
  uploadSigner:body.action==='save'?healthUploadSigner(secrets.get('ADMIN_TEST_TOOLS_PREVIEW_KEY')):null,
  geoNamesTransportProbe:()=>runGeoNamesProbe({username:secrets.get('GEONAMES_USERNAME'),signal:req.signal}),
}));
