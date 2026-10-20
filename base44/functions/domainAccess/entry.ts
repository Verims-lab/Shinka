import { withUserLifecycle } from '../../shared/userLifecycle.js';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handleDomainRequest } from '../../shared/domainAccess.js';
// No generic service-role CRUD endpoint and no request-supplied system authority.
Deno.serve((req) => handleDomainRequest(req, request => withUserLifecycle(createClientFromRequest(request))));
