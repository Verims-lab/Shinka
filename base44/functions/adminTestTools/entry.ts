import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { handleInternalRequest } from '../../shared/internalAuthorization.js';
import { nativeAdminTestOperation } from '../../shared/nativeAdminTestOperation.js';
import { createPreviewSigner } from '../../shared/adminTestPreview.js';
import { withUserLifecycle } from '../../shared/userLifecycle.js';
import { testOperationDiagnostics } from '../../shared/adminTestDiagnostics.js';
import { withTermsAdmission } from '../../shared/termsAcceptance.js';

export default req => {
  const diagnostics = testOperationDiagnostics({ emit: record => console.info(JSON.stringify(record)) });
  return handleInternalRequest(req, request => withTermsAdmission(withUserLifecycle(diagnostics.wrap(createClientFromRequest(request))),()=>secrets.get('SHINKA_TERMS_VERSION')), (client, body) => nativeAdminTestOperation(client, body, {
  policy: { appId: secrets.get('ADMIN_TEST_TOOLS_APP_ID'), label: secrets.get('ADMIN_TEST_TOOLS_ENVIRONMENT') },
  signer: createPreviewSigner(secrets.get('ADMIN_TEST_TOOLS_PREVIEW_KEY')),
  diagnostics,
}));
};
