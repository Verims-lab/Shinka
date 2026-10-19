import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handleContentLibraryRequest } from '../../shared/contentLibraryOperation.js';
import * as astronomy from 'npm:astronomy-engine@2.1.19';
import { FIRST_CONTENT_SOURCE as source } from '../../shared/firstContentSource.js';
import { CONTENT_CATEGORY_DECISION as decision } from '../../shared/contentCategoryDecision.js';
export default (req) => handleContentLibraryRequest(req, createClientFromRequest, { astronomy, source, decision });
