import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { handleAdminTestRequest } from '../../shared/adminTestOperation.js';
import { createPreviewSigner } from '../../shared/adminTestPreview.js';
import { withUserLifecycle } from '../../shared/userLifecycle.js';

export default async function (req) {
  // No production coordinator exists. No secret or browser field enables it.
  return handleAdminTestRequest(req, request => withUserLifecycle(createClientFromRequest(request)), {
    policy: { appId: secrets.get('ADMIN_TEST_TOOLS_APP_ID'), label: secrets.get('ADMIN_TEST_TOOLS_ENVIRONMENT') },
    signer: createPreviewSigner(secrets.get('ADMIN_TEST_TOOLS_PREVIEW_KEY')),
  });
}
