// FUTURE_PACKAGE placeholders: stable IDs, NOT_APPLICABLE until their package becomes active.
import { futureCase as f } from "../caseFactory";
import { APPLICABILITY as A, CLASS as C } from "../constants";

export const FUTURE_CASES = [
  f("H06", "H06-001", "Apple/Google-only sign-in", "No Shinka password; provider identity maps to one account."),
  f("H06", "H06-002", "18+ declaration before authentication", "Auth does not start until 18+ box is checked."),
  f("H07", "H07-001", "Birth date required and 18+", "Onboarding blocks missing/future/under-18 dates."),
  f("H07", "H07-002", "Display name ≤ 50 characters", "Trimmed name over 50 chars is rejected."),
  f("H07", "H07-003", "birth_time stays NULL when not entered", "00:00 is used only for Sun-sign calculation."),
  f("H08", "H08-001", "Phase lookup 28/5 → 1–5, 6–12, 13–15, 16–28", "Standard cycle phase lookup correctness."),
  f("H08", "H08-002", "≥15 days between period starts", "Conflicting starts rejected; state preserved."),
  f("H08", "H08-003", "Outlier rule 26/27/45 → 27", "Single outlier excluded from prediction average."),
  f("H09", "H09-001", "One message per user per local day", "Retries and concurrency never create a second pair."),
  f("H09", "H09-002", "40-day repeat window", "Same Pair ID eligible again from day 41."),
  f("H09", "H09-003", "Fallback chain and immutable TR/EN snapshot", "Category → other categories → least-recently shown."),
  f("H10", "H10-001", "Pattern uses actual category_id", "Top two themes, tie broken by most recent."),
  f("H10", "H10-002", "Moon lookup [start, end) continuous", "No gaps or overlaps; boundary selects new phase."),
  f("H10", "H10-003", "GeoNames structured selection only", "Free text never saved as birthplace."),
  f("H11", "H11-001", "Consent withdrawal deletes health data (verified)", "Success shown only after verified deletion."),
  f("H11", "H11-002", "No re-consent during open deletion job", "GRANTED not activated until job COMPLETED."),
  f("H11", "H11-003", "Delete Account → INACTIVE without routine deletion", "Access, generation and push stop."),
  f("H12", "H12-001", "User row isolation", "A user cannot read another user's records.", A.FUTURE, C.LIVE_ENFORCEMENT),
  f("H12", "H12-002", "Admin cannot modify immutable records", "Snapshots, consent/protection events and audit log are protected.", A.FUTURE, C.LIVE_ENFORCEMENT),
  f("H12", "H12-003", "Internal tooling denied to non-admins", "InternalHealthRun and internal routes reject role 'user'.", A.FUTURE, C.LIVE_ENFORCEMENT),
  f("H14", "H14-001", "06:00 local generation is idempotent", "Scheduler and app-open use the same unique key."),
  f("H14", "H14-002", "One delivery record per message and type", "Retries update the same notification_delivery row."),
  f("H15", "H15-001", "Bounded external timeouts", "GeoNames/Moon failures never fabricate data."),
  f("H15", "H15-002", "Performance targets measured", "Targets measured on defined device/network."),
];