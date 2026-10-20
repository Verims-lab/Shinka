import { createNativeClient } from '../../shared/nativeClient.ts';
import { handleDomainRequest } from '../../shared/domainAccess.js';
// No generic service-role CRUD endpoint and no request-supplied system authority.
export default (req) => handleDomainRequest(req, createNativeClient);
