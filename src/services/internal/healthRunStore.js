import { base44 } from "@/api/base44Client";
import { ShinkaError, ERROR_CODES } from "@/foundation/errors";

export async function saveHealthRun(report) {
  try { return (await base44.functions.invoke("internalHealth", { action:"save", report })).data; }
  catch { throw new ShinkaError(ERROR_CODES.HEALTH_HISTORY_PERSIST_FAILED, "internalHealth.save"); }
}
export async function listHealthRuns(_limit = 20) {
  return (await base44.functions.invoke("internalHealth", { action:"list" })).data.runs;
}
export async function fullReportUrl(run) {
  return (await base44.functions.invoke("internalHealth", { action:"report", runId:run.id })).data.signed_url;
}
