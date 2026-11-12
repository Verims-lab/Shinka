import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { withUserLifecycle } from '../../shared/userLifecycle.js';
import { handleTermsRequest } from '../../shared/termsAcceptance.js';

export default async function(req) {
  return handleTermsRequest(req, request => withUserLifecycle(createClientFromRequest(request)), {
    readVersion: () => secrets.get('SHINKA_TERMS_VERSION'),
  });
}
