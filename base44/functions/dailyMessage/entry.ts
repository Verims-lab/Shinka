import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handleDailyMessageRequest } from '../../shared/dailyMessageOperation.js';
import { inspectContentLibrary } from '../../shared/base44ContentLibrary.js';
import { FIRST_CONTENT_SOURCE } from '../../shared/firstContentSource.js';
import { CONTENT_CATEGORY_DECISION } from '../../shared/contentCategoryDecision.js';
// Fail closed for new writes until a durable cross-instance adapter is verified.
export default (req) => handleDailyMessageRequest(req, createClientFromRequest, { library: client => inspectContentLibrary(client, FIRST_CONTENT_SOURCE, CONTENT_CATEGORY_DECISION) });
