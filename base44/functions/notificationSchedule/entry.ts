import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { handleNotificationSchedule } from '../../shared/notificationScheduler.js';
import { base44PushProvider } from '../../shared/base44PushProvider.js';
import { readDailySelectionLibrary } from '../../shared/dailySelectionLibrary.js';
import { FIRST_CONTENT_SOURCE } from '../../shared/firstContentSource.js';
import { CONTENT_CATEGORY_DECISION } from '../../shared/contentCategoryDecision.js';

// 042: user-relayed Support says Workflows use a current native admin identity
// (creator, or platform owner fallback). The same fresh-admin gate serves manual
// calls. No secret/header machine binding. Physical/workflow acceptance is open;
// this entry remains disabled and no workflow is provisioned here.
export default (req) => handleNotificationSchedule(req, {
  createClient: createClientFromRequest,
  enabled: false,
  createProvider: base44PushProvider,
  library: client => readDailySelectionLibrary(client, FIRST_CONTENT_SOURCE, CONTENT_CATEGORY_DECISION),
});
