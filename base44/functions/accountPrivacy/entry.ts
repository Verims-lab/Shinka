import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handlePrivacyRequest } from '../../shared/privacyOperation.js';

// Deliberately bypasses normal product lifecycle denial only here: every action
// has its own current-session/owner check; post-removal receipt permits reads only.
/** @param {Request} req */
export default async function accountPrivacy(req) {
  return handlePrivacyRequest(req, createClientFromRequest);
}
