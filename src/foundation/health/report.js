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

export function buildReport({ scope, suiteId, started, completed, results, summary, gate }) {
  const inScope = SUITES.filter((s) => !suiteId || s.id === suiteId);
  return {
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

const SENSITIVE_KEY = /token|password|secret|cookie|authorization|email|session|api[_-]?key/i;
const SENSITIVE_VALUES = [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g, /Bearer\s+\S+/gi, /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g];

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? "[REDACTED]" : redact(v)]));
  }
  if (typeof value === "string") return SENSITIVE_VALUES.reduce((s, re) => s.replace(re, "[REDACTED]"), value);
  return value;
}