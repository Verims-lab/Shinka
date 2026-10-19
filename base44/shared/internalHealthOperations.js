import { InternalError } from "./internalAuthorization.js";
import { normalizeStoredReport, buildHistoryRecord } from "./healthHistoryContract.js";
import { DOMAIN_ENTITIES } from "./domainContract.js";
import { CONTENT_ENTITY_NAMES } from "./contentStateContract.js";

// Called only inside handleInternalRequest, after server auth.me() succeeds.
export async function internalHealthOperation(client, body) {
  const service = client.asServiceRole;
  const store = service.entities.InternalHealthRun;
  if (body.action === "list") return { runs: await store.list("-created_date", 20) };
  if (body.action === "report") {
    if (typeof body.runId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.runId)) throw new InternalError("INVALID_REQUEST", 400);
    const run = await store.get(body.runId);
    if (!run?.report_file_uri || /^https?:/i.test(run.report_file_uri)) throw new InternalError("HEALTH_HISTORY_ARTIFACT_UNAVAILABLE", 404);
    const { signed_url } = await service.integrations.Core.CreateFileSignedUrl({ file_uri: run.report_file_uri, expires_in: 300 });
    return { signed_url }; // URI is selected from the server record, never accepted from the caller.
  }
  if (body.action === "probe") {
    const results = await Promise.all(DOMAIN_ENTITIES.map(async (d) => {
      try { await service.entities[d.plannedName].list("-created_date",1); return {name:d.name,plannedName:d.plannedName,state:"PRESENT"}; }
      catch (error) { return {name:d.name,plannedName:d.plannedName,state:(error?.status??error?.response?.status)===404?"ABSENT":"INCONCLUSIVE"}; }
    }));
    return { results }; // No product rows leave the server.
  }
  if (body.action === "contentCounts") {
    const results=await Promise.all(CONTENT_ENTITY_NAMES.map(async entity=>{
      try {
        const count=await service.entities[entity].count(); // Unfiltered, exact SDK aggregate; no pagination/row reads.
        if(!Number.isSafeInteger(count)||count<0)throw new Error('INVALID_COUNT');
        return {entity,state:'MEASURED',count};
      } catch {return {entity,state:'INCONCLUSIVE',count:null,code:'CONTENT_COUNT_UNAVAILABLE'};}
    }));
    return {source:'LIVE_BASE44_COUNT',measuredAt:new Date().toISOString(),results};
  }
  if (body.action === "save") {
    const report = normalizeStoredReport(body.report);
    try {
      const file = new File([JSON.stringify(report)], `health-${report.runId}.json`, { type:"application/json" });
      const { file_uri } = await service.integrations.Core.UploadPrivateFile({ file });
      const run = await store.create(buildHistoryRecord(report,file_uri));
      return { id:run.id, run_id:report.runId };
    } catch { throw new InternalError("HEALTH_HISTORY_PERSIST_FAILED"); }
  }
  throw new InternalError("INVALID_INTERNAL_ACTION",400);
}
