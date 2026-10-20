import { createNativeClient } from '../../shared/nativeClient.ts';
import { handleCalendarRequest } from '../../shared/calendarOperation.js';

export default async function (req) {
  // Actual dates are authoritative; projections are computed at read time.
  return handleCalendarRequest(req, createNativeClient, { native: true });
}
