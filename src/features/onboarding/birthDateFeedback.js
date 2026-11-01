import { isCalendarDate, validateBirthDate } from '../../../base44/shared/onboardingValidation.js';

// Partial native date editing is silent. A complete value uses the same date-only
// rule and server-provided today as submit/backend; never infer today on the device.
export function birthDateFeedback(value, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || !isCalendarDate(today)) return null;
  try { validateBirthDate(value, today); return null; }
  catch (error) { return { code: error.code, field: error.field }; }
}
