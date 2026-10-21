// Tracked requirements only; never dispatched by the active Health runner.
import { futureCase as f } from "../caseFactory";

export const FUTURE_CASES = [
  f("H14", "H14-001", "06:00 local generation is idempotent", "Scheduler and app-open use the same unique key."),
  f("H14", "H14-002", "One delivery record per message and type", "Retries update the same notification_delivery row."),
];
