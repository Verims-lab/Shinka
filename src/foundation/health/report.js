import { HEALTH_SCOPE_TRANSFERS } from '../../../base44/shared/healthExecutionScope.js';
import { BUILD_MARKER } from "@/foundation/buildMarker";
import { APP_NAME, resolveEnvironment } from "@/foundation/environment";
import { SOURCE_SET_VERSION } from "@/foundation/sourceInventory";
import { OPEN_DECISIONS } from "@/foundation/openDecisions";
import { HEALTH_CATALOG_VERSION, REPORT_SCHEMA_VERSION, APPLICABILITY } from "./constants";
import { SUITES } from "./suites";
import { summarize } from "./aggregate";

const CASE_FIELDS = ["id", "suiteId", "title", "description", "severity", "blocker", "runnerType", "applicability",
  "status", "attempted", "executed", "durationMs", "evidence"];
export const toCaseRecord = (c) => Object.fromEntries(CASE_FIELDS.map((k) => [k, c[k]]));

export function buildReport({ scope, suiteId = null, started, completed, results, summary, gate }) {
  const inScope = SUITES.filter((s) => !suiteId || s.id === suiteId);
  return {
    assessmentScope: 'IN_APP_HEALTH', localRegressionRequirements: HEALTH_SCOPE_TRANSFERS,
    schemaVersion: REPORT_SCHEMA_VERSION, runId: crypto.randomUUID(), appName: APP_NAME,
    buildMarker: BUILD_MARKER, healthCatalogVersion: HEALTH_CATALOG_VERSION, sourceSetVersion: SOURCE_SET_VERSION,
    environment: resolveEnvironment().id, scope, startedAt: started.toISOString(), completedAt: completed.toISOString(),
    durationMs: completed - started,
    suites: inScope.map((s) => ({ ...s, counts: summarize(results.filter((r) => r.suiteId === s.id)) })),
    cases: results.map(toCaseRecord), summary, gate,
    externalRequirements: results.filter((r) => r.applicability === APPLICABILITY.EXTERNAL).map((r) => ({ id: r.id, title: r.title })),
    futureRequirements: SUITES.filter((s) => !s.active).map((s) => s.id),
    openDecisions: OPEN_DECISIONS.filter((d) => d.status === "OPEN").map((d) => d.id),
  };
}

export { redact } from "../../../base44/shared/reportPrivacy.js";
