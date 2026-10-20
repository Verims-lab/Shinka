import { HEALTH_SCOPE_TRANSFERS } from './healthExecutionScope.js';
import { summarize, computeGate } from "./healthAggregate.js";
import { redact } from "./reportPrivacy.js";
import { InternalError } from "./internalAuthorization.js";
import { expectedHealthIds } from './healthPlan.js';
import { EXECUTION_CONTRACT, checkExecutionResults } from './healthExecutionEvidence.js';

export const HISTORY_FIELD_LIMIT = 15000;
export function compactCases(report) {
  const compact = JSON.stringify({ v: 1, cases: report.cases.map((c) => [c.id, c.status]) });
  if (new TextEncoder().encode(compact).length > HISTORY_FIELD_LIMIT) throw new InternalError("HEALTH_HISTORY_SUMMARY_TOO_LARGE", 400);
  return compact; // Never truncate JSON.
}
export function normalizeStoredReport(report) {
  if (!report || !Array.isArray(report.cases) || report.cases.length > 200 ||
      typeof report.runId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(report.runId) ||
      !/^Buildmarker-\d{3}$/.test(report.buildMarker) || !/^HC-\d{3}\.\d+$/.test(report.healthCatalogVersion) ||
      !/^(FULL|SUITE:H\d{2})$/.test(report.scope) ||
      !Number.isFinite(Date.parse(report.startedAt)) || !Number.isFinite(Date.parse(report.completedAt))) throw new InternalError("INVALID_HEALTH_REPORT", 400);
  const plan=expectedHealthIds(report.scope,report.healthCatalogVersion);
  const current=Number(report.healthCatalogVersion.match(/^HC-(\d+)/)?.[1])>=19;
  if(current && (report.executionContract!==EXECUTION_CONTRACT || typeof report.sourceSetVersion!=='string' || !report.sourceSetVersion.trim() || !plan?.length || !Array.isArray(report.plannedCaseIds) ||
    plan.length!==report.plannedCaseIds.length || plan.some(id=>!report.plannedCaseIds.includes(id)))) throw new InternalError('HEALTH_EXECUTION_PLAN_INVALID',400);
  const seen = new Set();
  const cases = report.cases.map((c) => {
    if (!/^H\d{2}-\d{3}$/.test(c.id) || seen.has(c.id) || c.suiteId !== c.id.slice(0,3) ||
        (report.scope !== "FULL" && report.scope !== `SUITE:${c.suiteId}`) ||
        typeof c.attempted !== "boolean" || typeof c.executed !== "boolean" || typeof c.blocker !== "boolean" ||
        !["CURRENT_PACKAGE", "FUTURE_PACKAGE", "EXTERNAL_RELEASE"].includes(c.applicability) ||
        !["PASS", "FAIL", "WARNING", "BLOCKED", "NOT_RUN", "NOT_APPLICABLE"].includes(c.status)) throw new InternalError("INVALID_HEALTH_REPORT", 400);
    seen.add(c.id);
    return Object.fromEntries(["id","suiteId","title","description","severity","blocker","runnerType","applicability","status","attempted","executed","durationMs","evidence", ...(report.executionContract ? ['assertion','execution'] : [])].map((k)=>[k,c[k]]));
  });
  if (report.executionContract && (report.executionContract !== EXECUTION_CONTRACT || !Array.isArray(report.plannedCaseIds) ||
      report.plannedCaseIds.length !== new Set(report.plannedCaseIds).size ||
      !checkExecutionResults(cases, report.plannedCaseIds, report).ok)) throw new InternalError('HEALTH_EXECUTION_EVIDENCE_INVALID',400);
  const summary = summarize(cases);
  for (const key of Object.keys(summary)) if (report.summary?.[key] !== summary[key]) throw new InternalError("HEALTH_HISTORY_SUMMARY_MISMATCH", 400);
  const integrityOk = report.scope !== "FULL" || ["H16-001","H16-002","H16-003","H16-004"].every((id)=>cases.some((c)=>c.id===id&&c.status==="PASS"));
  const gate = computeGate(cases, { fullScope: report.scope === "FULL", integrityOk });
  if (report.gate?.status !== gate.status) throw new InternalError("HEALTH_HISTORY_GATE_MISMATCH", 400);
  const safe = redact({ ...(report.executionContract ? {executionContract:EXECUTION_CONTRACT,plannedCaseIds:report.plannedCaseIds} : {}), ...(report.assessmentScope==='IN_APP_HEALTH'?{assessmentScope:'IN_APP_HEALTH',localRegressionRequirements:HEALTH_SCOPE_TRANSFERS}:{}), schemaVersion: "shinka.health.report/1", runId: report.runId, buildMarker: report.buildMarker,
    healthCatalogVersion: report.healthCatalogVersion, sourceSetVersion: report.sourceSetVersion,
    environment: ["LOCAL","PREVIEW","PUBLISHED"].includes(report.environment) ? report.environment : "UNKNOWN",
    scope: report.scope, startedAt: report.startedAt, completedAt: report.completedAt,
    durationMs: Math.max(0,Date.parse(report.completedAt)-Date.parse(report.startedAt)), cases, summary, gate,
    evidenceBoundary: "Admin-submitted diagnostic evidence; not independent proof of live enforcement" });
  if (new TextEncoder().encode(JSON.stringify(safe)).length > 900000) throw new InternalError("HEALTH_HISTORY_REPORT_TOO_LARGE", 400);
  return safe;
}
export function buildHistoryRecord(report, reportFileUri) {
  if (typeof reportFileUri !== "string" || !reportFileUri || /^https?:/i.test(reportFileUri)) throw new InternalError("HEALTH_HISTORY_PRIVATE_ARTIFACT_REQUIRED", 400);
  const s = report.summary;
  return { run_id: report.runId, build_marker: report.buildMarker, health_catalog_version: report.healthCatalogVersion,
    environment: report.environment, scope: report.scope, started_at: report.startedAt, completed_at: report.completedAt,
    status: report.gate.status, planned:s.planned, attempted:s.attempted, executed:s.executed, passed:s.passed, failed:s.failed,
    warnings:s.warnings, blocked:s.blocked, not_run:s.notRun, not_applicable:s.notApplicable,
    report_json:compactCases(report), report_file_uri:reportFileUri };
}
