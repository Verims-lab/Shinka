// All inputs are generated synthetic fixtures. No product workbook content is imported.
import { findLegacyImports, findPersonalEmails, checkAuthSurface } from "@/foundation/inspection/sourceRules";
import { loadStaticEvidence } from "@/foundation/inspection/sourceScanner";
import { checkAuthPolicy } from "@/foundation/authPolicy";
import { safeAuthError } from "@/foundation/authErrors";
import { beginProviderAuth } from "@/services/authService";
import { computeGate, summarize } from "@/foundation/health/aggregate";
import { ev } from "@/foundation/health/evidence";
import { APPLICABILITY as A } from "@/foundation/health/constants";
import { persistCompletedRun } from "@/foundation/health/completion";
import { H05_CASES } from "@/foundation/health/cases/h05";
import { guardScenarios } from "./securityScenarios";
import { CONTENT_COLUMNS, MAPPING_COLUMNS, CATEGORY_COUNTS, SIGNS, MOONS, PHASES, UNKNOWN_PHASE,
  validateContentRows, validateMappingRows, compareBaseAndExtended, contentIntegrity, mappingIntegrity } from "../../../base44/shared/contentArtifactValidator.ts";
import { normalizeStoredReport, buildHistoryRecord, compactCases, HISTORY_FIELD_LIMIT } from "../../../base44/shared/healthHistoryContract.js";
import { internalHealthOperation } from "../../../base44/shared/internalHealthOperations.js";
import { BUILD_MARKER } from "@/foundation/buildMarker";
import { HEALTH_CATALOG_VERSION } from "@/foundation/health/constants";

const assert = (ok, message) => { if (!ok) throw new Error(message); };
const rejects = (fn, code) => { try { fn(); } catch (e) { assert(e.code === code, `unexpected error ${e.code}`); return; } throw new Error(`expected ${code}`); };
const passCase = (extra = {}) => ({ id:"H01-001", suiteId:"H01", status:"PASS", applicability:A.CURRENT, blocker:true,
  attempted:true, executed:true, durationMs:0, evidence:ev("SYNTHETIC_RUNTIME","canonical test fixture",true,true,"Synthetic execution completed"), ...extra });
const contentRows = () => {
  let id = 0;
  return [CONTENT_COLUMNS, ...Object.entries(CATEGORY_COUNTS).flatMap(([category, count]) => Array.from({length:count}, () =>
    [`SHF-${String(++id).padStart(3,"0")}`,category,"fixture TR","fixture TR","fixture EN","fixture EN"]))];
};
const mappingRows = (extended) => {
  const categories = Object.keys(CATEGORY_COUNTS);
  let i = 0;
  const base = SIGNS.flatMap((s) => MOONS.flatMap((m) => PHASES.map((p) => [s,m,p,categories[i++ % 6]])));
  return [MAPPING_COLUMNS, ...base, ...(extended ? SIGNS.flatMap((s)=>MOONS.map((m)=>[s,m,UNKNOWN_PHASE,categories[i++ % 6]])) : [])];
};
const artifacts = (content = contentRows(), base = mappingRows(false), extended = mappingRows(true)) => {
  const mapping192 = validateMappingRows(base,false), mapping240 = validateMappingRows(extended,true);
  return {content260:validateContentRows(content),mapping192,mapping240,relation:compareBaseAndExtended(mapping192,mapping240)};
};
const healthStatus = async (id, data) => (await H05_CASES.find((c)=>c.id===id).run({artifacts:async()=>data})).status;
const reportFixture = () => {
  const cases = [passCase()];
  return {runId:"synthetic-run", buildMarker:BUILD_MARKER, healthCatalogVersion:HEALTH_CATALOG_VERSION, environment:"LOCAL",
    scope:"SUITE:H01",startedAt:"2026-01-01T00:00:00Z",completedAt:"2026-01-01T00:01:00Z",cases,summary:summarize(cases),gate:computeGate(cases,{fullScope:false})};
};
async function authGeometry(width) {
  const frame=document.createElement("iframe");frame.title="auth layout fixture";frame.setAttribute("aria-hidden","true");
  Object.assign(frame.style,{position:"fixed",left:"-10000px",width:`${width}px`,height:"720px",border:"0",visibility:"hidden"});
  frame.src="/login?probe=1";document.body.appendChild(frame);
  try {
    const deadline=Date.now()+15000;
    while(Date.now()<deadline){
      const doc=frame.contentDocument,shell=doc?.querySelector("[data-auth-shell]");
      if(shell){const buttons=Array.from(shell.querySelectorAll("[data-provider]")),container=doc.querySelector("[data-probe-root]").firstElementChild,style=frame.contentWindow.getComputedStyle(container);
        return {providers:buttons.map(b=>b.getAttribute("data-provider")).sort().join(),heights:buttons.map(b=>b.getBoundingClientRect().height),padding:[style.paddingLeft,style.paddingRight],passwords:doc.querySelectorAll('input[type="password"]').length};}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    throw new Error("AUTH_PROBE_ROOT_TIMEOUT");
  } finally {frame.remove();}
}

/** @type {import("./testTypes").FoundationTest[]} */
export const HARDENING_TESTS = [
  ["T52","Legacy dynamic imports detected; strings/comments/templates remain data",()=>{
    const fixtures = {
      "/src/tests/dynamic.js":"export const f = () => import('@/legacy/engine');",
      "/src/tests/template.js":"export const f = () => import(`@/legacy/engine`);",
      "/src/tests/static.js":"import x from '@/legacy/engine'; export default x;",
    };
    assert(findLegacyImports(fixtures).length===3,"test-directory import escaped firewall");
    const data = "// import x from '@/legacy/engine';\nconst a = \"import('@/legacy/engine')\"; const b = `import x from '@/legacy/engine'`;";
    assert(findLegacyImports({"/src/tests/data.js":data}).length===0,"data interpreted as executable import");
  }],
  ["T53","Personal email detector retains application/config/test coverage",async()=>{
    const email = ["synthetic-admin","personal-domain","org"].join(".").replace("admin.","admin@");
    for (const file of ["/src/App.jsx","/config.js","/src/foundation/tests/fixture.js"]) assert(findPersonalEmails({[file]:email}).length===1,"personal email not detected");
    assert(findPersonalEmails({"/fixture":"user@example.test user@example.invalid user@example.com"}).length===0,"reserved example rejected");
    assert((await loadStaticEvidence()).emailFiles.length===0,"repository email violation");
  }],
  ["T54","Auth syntax policy detects removed flows and unapproved providers",async()=>{
    for (const code of ["base44.auth.loginViaEmailPassword('x','y')","base44.auth.register({})","base44.auth.resetPasswordRequest('x')","base44.auth.resetPassword({})","base44.auth.loginWithProvider('facebook')","const x = <Route path='/register'/>;","const x = <input type='password'/>;"]) assert(!checkAuthSurface({"/injected.jsx":code}).ok,"auth violation missed");
    assert((await loadStaticEvidence()).authSurface.ok,"repository auth violation");
    assert(!checkAuthPolicy({methods:["google"]}).ok && !checkAuthPolicy({methods:["apple","google","microsoft"]}).ok,"provider policy too broad");
  }],
  ["T55","Provider errors sanitized; unsupported methods never call SDK",async()=>{
    const calls = [];
    const auth = {loginWithProvider:async(provider)=>{ calls.push(provider); throw {message:"private payload",stack:"private stack",token:"private token"}; }};
    for (const p of ["apple","google"]) assert((await beginProviderAuth(p,"/",auth)).code==="AUTH_PROVIDER_FAILED","unsafe provider failure");
    assert((await beginProviderAuth("password","/",auth)).code==="AUTH_UNSUPPORTED_METHOD" && calls.join() === "apple,google","unapproved SDK call");
    assert(safeAuthError({code:"access_denied"})==="AUTH_CANCELLED" && safeAuthError({message:"private"},"session")==="AUTH_SESSION_FAILED","safe error mapping");
  }],
  ["T56","PASS without execution cannot make gate READY",()=>assert(computeGate([passCase({executed:false})]).status==="NOT_READY","unexecuted PASS accepted")],
  ["T57","PASS without attempt cannot make gate READY",()=>assert(computeGate([passCase({attempted:false,executed:false})]).status==="NOT_READY","unattempted PASS accepted")],
  ["T58","Fully executed evidenced PASS is eligible for READY",()=>assert(computeGate([passCase()]).status==="READY","valid execution rejected")],
  ["T59","Future/external unexecuted requirements do not block Foundation",()=>{
    for (const applicability of [A.FUTURE,A.EXTERNAL]) assert(computeGate([passCase(),passCase({id:"H15-001",applicability,attempted:false,executed:false,status:"NOT_APPLICABLE",evidence:null})]).status==="READY","future/external blocked");
  }],
  ["T60","Incomplete or invalid evidence never makes PASS valid",()=>{
    for (const evidence of [null,{}, {...passCase().evidence,timestamp:"bad"}, {...passCase().evidence,classification:"INVALID_CLASS"}, {...passCase().evidence,actual:undefined}]) assert(computeGate([passCase({evidence})]).status==="NOT_READY","invalid evidence accepted");
  }],
  ["T61","Valid synthetic content and mappings pass canonical H05 decisions",async()=>{
    const a = artifacts();
    assert(contentIntegrity(a.content260) && mappingIntegrity(a.mapping192) && mappingIntegrity(a.mapping240),"valid artifacts rejected");
    for (const id of ["H05-003","H05-004","H05-005","H05-006","H05-007","H05-008"]) assert(await healthStatus(id,a)==="PASS",`${id} rejected valid fixture`);
  }],
  ["T62","260 rows with absent approved category fail content Health",async()=>{
    const rows=contentRows(); rows.slice(1).forEach((r)=>{if(r[1]===Object.keys(CATEGORY_COUNTS)[0]) r[1]=Object.keys(CATEGORY_COUNTS)[1];});
    const a=artifacts(rows); assert(!contentIntegrity(a.content260)&&await healthStatus("H05-003",a)==="FAIL","missing coverage accepted");
  }],
  ["T63","192 mapping missing category cell or coverage fails Health",async()=>{
    for(const empty of [true,false]){const rows=mappingRows(false);if(empty) rows[1][3]="";else rows.slice(1).forEach((r)=>{if(r[3]===Object.keys(CATEGORY_COUNTS)[0])r[3]=Object.keys(CATEGORY_COUNTS)[1];});
      const a=artifacts(undefined,rows); assert(!mappingIntegrity(a.mapping192),"invalid mapping accepted");
      for(const id of ["H05-003","H05-004","H05-006"]) assert(await healthStatus(id,a)==="FAIL",`${id} ignored missing category`);
    }
  }],
  ["T64","240 mapping missing category cell or coverage fails Health",async()=>{
    for(const empty of [true,false]){const rows=mappingRows(true);if(empty) rows[1][3]="";else rows.slice(1).forEach((r)=>{if(r[3]===Object.keys(CATEGORY_COUNTS)[0])r[3]=Object.keys(CATEGORY_COUNTS)[1];});
      const a=artifacts(undefined,undefined,rows); assert(!mappingIntegrity(a.mapping240),"invalid mapping accepted");
      for(const id of ["H05-003","H05-005","H05-006"]) assert(await healthStatus(id,a)==="FAIL",`${id} ignored missing category`);
    }
  }],
  ["T65","Unknown/empty content category and unknown mapping category fail",async()=>{
    for(const value of ["","unapproved"]){const rows=contentRows();rows[1][1]=value;const a=artifacts(rows);assert(!contentIntegrity(a.content260)&&await healthStatus("H05-003",a)==="FAIL","invalid content category accepted");}
    const rows=mappingRows(false);rows[1][3]="unapproved";const a=artifacts(undefined,rows);assert(await healthStatus("H05-004",a)==="FAIL","unknown mapping category accepted");
  }],
  ["T66","Duplicate mapping fails uniqueness and coverage Health",async()=>{
    const rows=mappingRows(false);rows[2]=[...rows[1]];const a=artifacts(undefined,rows);
    assert(!mappingIntegrity(a.mapping192)&&await healthStatus("H05-007",a)==="FAIL"&&await healthStatus("H05-004",a)==="FAIL","duplicate mapping accepted");
  }],
  ["T67","Missing EN/TR and malformed Pair ID fail appropriate Health",async()=>{
    for(const column of [2,3,4,5]){const rows=contentRows();rows[1][column]="";const a=artifacts(rows);assert(!contentIntegrity(a.content260)&&await healthStatus("H05-008",a)==="FAIL","missing language accepted");}
    const rows=contentRows();rows[1][0]="bad-id";const a=artifacts(rows);assert(!contentIntegrity(a.content260)&&await healthStatus("H05-007",a)==="FAIL","malformed Pair ID accepted");
  }],
  ["T68","Server request guard denies anonymous/user/forged roles",async()=>assert((await guardScenarios()).ok,"server guard failed")],
  ["T69","Completed result survives save failure with explicit safe code",async()=>{
    const report=reportFixture(); let refreshed=false;const out=await persistCompletedRun(report,async()=>{throw new Error("private");},async()=>{refreshed=true;});
    assert(out.report===report&&out.saveError==="HEALTH_HISTORY_PERSIST_FAILED"&&!refreshed,"result lost or unsafe failure");
  }],
  ["T70","Stored summary is verified; compact JSON bounded without truncation",()=>{
    const report=reportFixture(),safe=normalizeStoredReport(report),rec=buildHistoryRecord(safe,"private://fixture");
    assert(rec.passed===1&&rec.status==="SCOPE_PASS"&&JSON.parse(rec.report_json).cases.length===1&&rec.report_json.length<HISTORY_FIELD_LIMIT,"record mismatch");
    rejects(()=>normalizeStoredReport({...report,summary:{...report.summary,passed:99}}),"HEALTH_HISTORY_SUMMARY_MISMATCH");
    rejects(()=>normalizeStoredReport({...report,gate:{status:"READY"}}),"HEALTH_HISTORY_GATE_MISMATCH");
    rejects(()=>compactCases({cases:Array.from({length:2000},()=>passCase())}),"HEALTH_HISTORY_SUMMARY_TOO_LARGE");
  }],
  ["T71","Private report redacts sensitive values and rejects public artifacts",()=>{
    const report=reportFixture();report.cases[0].evidence.actual={token:"sensitive-token",email:"person@example.test",symptoms:["sensitive-health"],messageBody:"sensitive-content",note:"Bearer sensitive-bearer"};
    const out=JSON.stringify(normalizeStoredReport(report));assert(!out.includes("sensitive-")&&!out.includes("example.test"),"sensitive report persisted");
    rejects(()=>buildHistoryRecord(report,"https://example.test/report"),"HEALTH_HISTORY_PRIVATE_ARTIFACT_REQUIRED");
  }],
  ["T72","Private save/readback selects stored URI and limited signed lifetime",async()=>{
    let upload={runId:""},record={run_id:""},signing={file_uri:"",expires_in:0};
    const client={asServiceRole:{entities:{InternalHealthRun:{create:async(r)=>{record=r;return{id:"stored-id"};},list:async()=>[record],get:async()=>record}},integrations:{Core:{UploadPrivateFile:async({file})=>{upload=JSON.parse(await file.text());return{file_uri:"private://stored-report"};},CreateFileSignedUrl:async(args)=>{signing=args;return{signed_url:"https://example.test/private-report"};}}}}};
    await internalHealthOperation(client,{action:"save",report:reportFixture()});
    assert(upload.runId===record.run_id&&(await internalHealthOperation(client,{action:"list"})).runs.length===1,"save/readback mismatch");
    await internalHealthOperation(client,{action:"report",runId:"stored-id",file_uri:"private://attacker-selected"});
    assert(signing.file_uri==="private://stored-report"&&signing.expires_in===300,"caller controlled artifact URI");
  }],
  ["T73","Static manifest carries scoped metadata and hashes, no raw sources",async()=>{
    const m=await loadStaticEvidence();assert(m.evidenceScope==="BUILD_TIME_REPOSITORY_INSPECTION"&&m.originalArtifactProvenance==="SOURCE_RECEIVED_AND_RECORDED"&&!m.originalArtifactsHashVerifiedInRepo,"provenance overstated");
    assert(Object.keys(m.hashes).length>0&&Object.values(m.hashes).every((h)=>/^[a-f0-9]{64}$/.test(h))&&!Object.hasOwn(m,"sources")&&!Object.hasOwn(m,"raw")&&!Object.hasOwn(m,"rawDocs"),"raw manifest or invalid hashes");
  }],
  ["T74","Rendered auth shell uses only Apple/Google, 52px controls and 20px padding",async()=>{
    for(const width of [360,1024]){const r=await authGeometry(width);assert(r.providers==="apple,google"&&r.heights.every(h=>h>=52)&&r.padding.every(p=>p==="20px")&&r.passwords===0,`auth geometry ${JSON.stringify(r)}`);}
  }],
];
