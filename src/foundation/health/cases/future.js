// FUTURE_PACKAGE placeholders: stable IDs, NOT_APPLICABLE until their package becomes active.
import { futureCase as f } from "../caseFactory";

export const FUTURE_CASES = [
  f("H08", "H08-002", "≥15 days between period starts", "Conflicting starts rejected; state preserved."),
  f("H10", "H10-001", "Pattern uses actual category_id", "Top two themes, tie broken by most recent."),
  f("H11", "H11-001", "Consent withdrawal deletes health data (verified)", "Success shown only after verified deletion."),
  f("H11", "H11-002", "No re-consent during open deletion job", "GRANTED not activated until job COMPLETED."),
  f("H11", "H11-003", "Delete Account → INACTIVE without routine deletion", "Access, generation and push stop."),
  f("H14", "H14-001", "06:00 local generation is idempotent", "Scheduler and app-open use the same unique key."),
  f("H14", "H14-002", "One delivery record per message and type", "Retries update the same notification_delivery row."),
  f("H15", "H15-001", "Bounded external timeouts", "GeoNames/Moon failures never fabricate data."),
  f("H15", "H15-002", "Performance targets measured", "Targets measured on defined device/network."),
];
