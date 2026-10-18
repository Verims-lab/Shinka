// INTERNAL TOOLING storage boundary for Health run history (InternalHealthRun, admin-only RLS).
import { base44 } from "@/api/base44Client";
import { redact } from "@/foundation/health/report";

export async function saveHealthRun(report) {
  const s = report.summary;
  return base44.entities.InternalHealthRun.create({
    run_id: report.runId, build_marker: report.buildMarker, health_catalog_version: report.healthCatalogVersion,
    environment: report.environment, scope: report.scope, started_at: report.startedAt, completed_at: report.completedAt,
    status: report.gate.status, planned: s.planned, attempted: s.attempted, executed: s.executed, passed: s.passed,
    failed: s.failed, warnings: s.warnings, blocked: s.blocked, not_run: s.notRun, not_applicable: s.notApplicable,
    report_json: JSON.stringify(redact(report)),
  });
}

export async function listHealthRuns(limit = 20) {
  return base44.entities.InternalHealthRun.list("-created_date", limit);
}