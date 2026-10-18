// Pure mapping: completed Health report → InternalHealthRun record.
// Measured platform limit: a single text field rejects ~24KB ("exceeds the maximum allowed size"); 16KB is accepted.
// So the full redacted report is stored as a private file (report_file_uri) and report_json holds a compact case index.
import { redact } from "@/foundation/health/report";

export const HISTORY_FIELD_LIMIT = 15000;

export function compactCases(report) {
  return JSON.stringify({ v: 1, cases: (report.cases || []).map((c) => [c.id, c.status]) });
}

export function buildHistoryRecord(report, reportFileUri) {
  const s = report.summary;
  return redact({
    run_id: report.runId, build_marker: report.buildMarker, health_catalog_version: report.healthCatalogVersion,
    environment: report.environment, scope: report.scope, started_at: report.startedAt, completed_at: report.completedAt,
    status: report.gate.status, planned: s.planned, attempted: s.attempted, executed: s.executed, passed: s.passed,
    failed: s.failed, warnings: s.warnings, blocked: s.blocked, not_run: s.notRun, not_applicable: s.notApplicable,
    report_json: compactCases(report).slice(0, HISTORY_FIELD_LIMIT), report_file_uri: reportFileUri,
  });
}