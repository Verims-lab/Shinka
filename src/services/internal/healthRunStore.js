// INTERNAL TOOLING storage boundary for Health run history (InternalHealthRun, admin-only RLS).
import { base44 } from "@/api/base44Client";
import { redact } from "@/foundation/health/report";
import { buildHistoryRecord } from "@/foundation/health/historyRecord";
import { ShinkaError, ERROR_CODES } from "@/foundation/errors";

export async function saveHealthRun(report) {
  try {
    const blob = new Blob([JSON.stringify(redact(report))], { type: "application/json" });
    const file = new File([blob], `health-${report.runId}.json`, { type: "application/json" });
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    return await base44.entities.InternalHealthRun.create(buildHistoryRecord(report, file_uri));
  } catch (e) {
    throw new ShinkaError(ERROR_CODES.HEALTH_HISTORY_PERSIST_FAILED, e?.response?.data?.message || e?.message || "unknown");
  }
}

export async function listHealthRuns(limit = 20) {
  return base44.entities.InternalHealthRun.list("-created_date", limit);
}

export async function fullReportUrl(run) {
  if (!run.report_file_uri) return null;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: run.report_file_uri });
  return signed_url;
}