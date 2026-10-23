import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { handleNotificationSchedule } from '../../shared/notificationScheduler.js';
import { base44PushProvider } from '../../shared/base44PushProvider.js';
import { inspectContentLibrary } from '../../shared/base44ContentLibrary.js';
import { FIRST_CONTENT_SOURCE } from '../../shared/firstContentSource.js';
import { CONTENT_CATEGORY_DECISION } from '../../shared/contentCategoryDecision.js';

// No automation block: this app uses Workflows. Never deploy an active schedule
// by default. A service-role client is NOT proof that a caller is a scheduler.
// Manual callers pass the shared current-native-admin guard. The prepared 033
// machine verifier is deliberately NOT bound: secret registration and secure
// workflow transport are unverified. No secrets.get/header syntax is invented.
// An absent user still fails here; real sending remains disabled.
export default (req) => handleNotificationSchedule(req, {
  createClient: createClientFromRequest,
  enabled: false,
  createProvider: base44PushProvider,
  library: client => inspectContentLibrary(client, FIRST_CONTENT_SOURCE, CONTENT_CATEGORY_DECISION),
});
