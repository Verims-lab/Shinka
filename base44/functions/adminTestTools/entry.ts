import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { handleInternalRequest } from '../../shared/internalAuthorization.js';
import { nativeAdminTestOperation } from '../../shared/nativeAdminTestOperation.js';
import { createPreviewSigner } from '../../shared/adminTestPreview.js';
import { withUserLifecycle } from '../../shared/userLifecycle.js';

export default req => handleInternalRequest(req, request => withUserLifecycle(createClientFromRequest(request)), (client, body) => nativeAdminTestOperation(client, body, {
  policy: { appId: secrets.get('ADMIN_TEST_TOOLS_APP_ID'), label: secrets.get('ADMIN_TEST_TOOLS_ENVIRONMENT') },
  signer: createPreviewSigner(secrets.get('ADMIN_TEST_TOOLS_PREVIEW_KEY')),
}));
