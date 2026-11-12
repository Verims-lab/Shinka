import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { withUserLifecycle } from './userLifecycle.js';
import { withNativeWriteChecks } from './nativeWriteChecks.js';
import { secrets } from 'base44:runtime';
import { withTermsAdmission } from './termsAcceptance.js';

// No global write-pause flag: the 017 decision removed mandatory deletion
// maintenance. Per-owner identity, lifecycle/tombstone, consent and privacy
// checks remain in withNativeWriteChecks on every product mutation.
export function createNativeClient(req, { terms = true } = {}) {
  const client = withUserLifecycle(createClientFromRequest(req));
  return withNativeWriteChecks(terms ? withTermsAdmission(client, () => secrets.get('SHINKA_TERMS_VERSION')) : client);
}
