import { normalizeStoredReport } from './healthHistoryContract.js';
import { nativeReadiness } from './nativeReadiness.js';
import { InternalError } from "./internalAuthorization.js";
import { saveHealthReport, findHealthRun } from './healthPersistence.js';
import { DOMAIN_ENTITIES } from "./domainContract.js";
import { CONTENT_ENTITY_NAMES } from "./contentStateContract.js";
import { healthReadDiagnostic, healthReadError } from './healthReadDiagnostics.js';
import { dailyReferenceMigration } from './dailyReferenceMigration.js';

// Called only inside handleInternalRequest, after server auth.me() succeeds.
export async function internalHealthOperation(client, body, {geoNamesTransportProbe=null, uploadSigner=null}={}) {
  if (body.action === 'dailyReferenceMigration') {
    if (Object.keys(body).some(key => !['action','request'].includes(key))) throw new InternalError('INVALID_REQUEST',400);
    if (client.getConfig?.().appId !== '6ad5190f4845d4e3af03b420') throw new InternalError('MIGRATION_APP_MISMATCH',409);
    // The module re-verifies current native admin + ACTIVE/lifecycle; only its
    // three closed operations and literal four-field unset are available.
    return dailyReferenceMigration(client, body.request);
  }
  if (body.action === 'nativeReadiness') {
    if (Object.keys(body).length !== 1) throw new InternalError('INVALID_REQUEST', 400);
    return nativeReadiness(client);
  }
  if(body.action==='geoNamesTransportProbe'){
    if(Object.keys(body).length!==1)throw new InternalError('INVALID_REQUEST',400);
    if(!geoNamesTransportProbe)throw new InternalError('GEONAMES_PROBE_UNAVAILABLE',503);
    return geoNamesTransportProbe();
  }
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
      const started = Date.now();
      try {
        if (typeof service.entities[entity]?.count !== 'function') throw healthReadError('SDK_METHOD_UNAVAILABLE');
        const count=await service.entities[entity].count(); // Unfiltered, exact SDK aggregate; no pagination/row reads.
        if(!Number.isSafeInteger(count)||count<0)throw healthReadError('INVALID_RESPONSE');
        return {entity,state:'MEASURED',count};
      } catch (error) {return {entity,state:'INCONCLUSIVE',count:null,code:'CONTENT_COUNT_UNAVAILABLE',diagnostic:healthReadDiagnostic(error,{stage:'CONTENT_COUNT',durationMs:Date.now()-started})};}
    }));
    return {source:'LIVE_BASE44_COUNT',measuredAt:new Date().toISOString(),results};
  }
  if (body.action === 'saveStatus') {
    const row=await findHealthRun(client,normalizeStoredReport(body.report));
    return {state:row?'SAVED':'ABSENT',run_id:body.report.runId};
  }
  if (body.action === "save") return saveHealthReport(client,body,uploadSigner);
  throw new InternalError("INVALID_INTERNAL_ACTION",400);
}
