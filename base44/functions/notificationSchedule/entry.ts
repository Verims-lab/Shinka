import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { handleNotificationSchedule } from '../../shared/notificationScheduler.js';
import { base44PushProvider } from '../../shared/base44PushProvider.js';
import { notificationFail } from '../../shared/notificationPolicy.js';
import { inspectContentLibrary } from '../../shared/base44ContentLibrary.js';
import { FIRST_CONTENT_SOURCE } from '../../shared/firstContentSource.js';
import { CONTENT_CATEGORY_DECISION } from '../../shared/contentCategoryDecision.js';

// No automation block: this app uses Workflows. Never deploy an active schedule
// by default. A service-role client is NOT proof that a caller is a scheduler.
// The reviewed platform authentication + push binding is still a release blocker.
export default (req) => handleNotificationSchedule(req, {
  authorize: async () => notificationFail('SCHEDULER_AUTH_CONTRACT_UNVERIFIED', 503),
  createClient: createClientFromRequest,
  enabled: false,
  provider: base44PushProvider(null),
  library: client => inspectContentLibrary(client, FIRST_CONTENT_SOURCE, CONTENT_CATEGORY_DECISION),
});
