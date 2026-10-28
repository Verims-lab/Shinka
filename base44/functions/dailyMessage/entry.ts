import { createNativeClient } from '../../shared/nativeClient.ts';
import { handleDailyMessageRequest } from '../../shared/dailyMessageOperation.js';
import { readDailySelectionLibrary } from '../../shared/dailySelectionLibrary.js';
import { FIRST_CONTENT_SOURCE } from '../../shared/firstContentSource.js';
import { CONTENT_CATEGORY_DECISION } from '../../shared/contentCategoryDecision.js';
// Sequential Entity persistence; duplicates are retained and reconciled explicitly.
export default (req) => handleDailyMessageRequest(req, createNativeClient, { native: true, library: client => readDailySelectionLibrary(client, FIRST_CONTENT_SOURCE, CONTENT_CATEGORY_DECISION) });
