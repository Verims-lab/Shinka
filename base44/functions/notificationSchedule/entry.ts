import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { handleNotificationSchedule } from '../../shared/notificationScheduler.js';
import { base44PushProvider } from '../../shared/base44PushProvider.js';
import { inspectContentLibrary } from '../../shared/base44ContentLibrary.js';
import { FIRST_CONTENT_SOURCE } from '../../shared/firstContentSource.js';
import { CONTENT_CATEGORY_DECISION } from '../../shared/contentCategoryDecision.js';

// No automation block: this app uses Workflows. Never deploy an active schedule
// by default. A service-role client is NOT proof that a caller is a scheduler.
// Manual callers must pass the shared current-native-admin guard. Workflow
// identity remains unverified; an absent user is never a trusted system caller.
// Provider response/recipient semantics and safe scheduled invocation stay open.
export default (req) => handleNotificationSchedule(req, {
  createClient: createClientFromRequest,
  enabled: false,
  createProvider: base44PushProvider,
  library: client => inspectContentLibrary(client, FIRST_CONTENT_SOURCE, CONTENT_CATEGORY_DECISION),
});
