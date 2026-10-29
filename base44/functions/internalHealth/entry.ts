import { healthUploadSigner } from '../../shared/healthPersistence.js';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { withUserLifecycle } from '../../shared/userLifecycle.js';
import { secrets } from 'base44:runtime';
import { handleInternalRequest } from "../../shared/internalAuthorization.js";
import { internalHealthOperation } from "../../shared/internalHealthOperations.js";
import { createGeoNamesRuntimeProbe } from '../../shared/geonamesRuntimeProbe.js';
const runGeoNamesProbe=createGeoNamesRuntimeProbe();
// The existing guard runs before operation dispatch, secret access and any fetch.
/** @param {Request} req */
// Internal metadata maintenance has its own closed admin/app/ACTIVE/target
// admission. Product writers keep createNativeClient's tombstone denial.
// This entry exposes no arbitrary entity or mutation operation.
export default (req) => handleInternalRequest(req, request=>withUserLifecycle(createClientFromRequest(request)),(client,body)=>internalHealthOperation(client,body,{
  uploadSigner:body.action==='save'?healthUploadSigner(secrets.get('ADMIN_TEST_TOOLS_PREVIEW_KEY')):null,
  geoNamesTransportProbe:()=>runGeoNamesProbe({username:secrets.get('GEONAMES_USERNAME'),signal:req.signal}),
}));
