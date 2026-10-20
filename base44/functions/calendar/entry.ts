import { withUserLifecycle } from '../../shared/userLifecycle.js';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handleCalendarRequest } from '../../shared/calendarOperation.js';

export default async function (req) {
  // No production transaction adapter: reads work; mutations fail closed.
  return handleCalendarRequest(req, request => withUserLifecycle(createClientFromRequest(request)));
}
