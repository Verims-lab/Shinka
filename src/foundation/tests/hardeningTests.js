import { contentRows, mappingRows } from './contentArtifactFixture';
import { SOURCE_SET_VERSION } from '../sourceInventory';
import { EXECUTION_CONTRACT } from '../../../base44/shared/healthExecutionEvidence.js';
import { HEALTH_SERVER_PLAN } from '../../../base44/shared/healthPlan.js';
import { healthUploadSigner } from '../../../base44/shared/healthPersistence.js';
// All inputs are generated synthetic fixtures. No product workbook content is imported.
import { findLegacyImports, findPersonalEmails, checkAuthSurface, checkInternalUiPurity } from "@/foundation/inspection/sourceRules";
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
import { CATEGORY_COUNTS, validateContentRows, validateMappingRows, compareBaseAndExtended, contentIntegrity, mappingIntegrity } from "../../../base44/shared/contentArtifactValidator.ts";
import { normalizeStoredReport, buildHistoryRecord, compactCases, HISTORY_FIELD_LIMIT } from "../../../base44/shared/healthHistoryContract.js";
import { internalHealthOperation } from "../../../base44/shared/internalHealthOperations.js";
import { measureAuthShell, requireAuthProbeReady } from "@/foundation/probes/authProbeContract";
import { BUILD_MARKER } from "@/foundation/buildMarker";
import { HEALTH_CATALOG_VERSION } from "@/foundation/health/constants";

const assert = (ok, message) => { if (!ok) throw new Error(message); };
const rejects = (fn, code) => { try { fn(); } catch (e) { assert(e.code === code, `unexpected error ${e.code}`); return; } throw new Error(`expected ${code}`); };
const passCase = (extra = {}) => ({ id:"H01-001", suiteId:"H01", status:"PASS", applicability:A.CURRENT, blocker:true,
  attempted:true, executed:true, durationMs:0, evidence:ev("SYNTHETIC_RUNTIME","canonical test fixture",true,true,"Synthetic execution completed"), ...extra });
const artifacts = (content = contentRows(), base = mappingRows(false), extended = mappingRows(true)) => {
  const mapping192 = validateMappingRows(base,false), mapping240 = validateMappingRows(extended,true);
  return {content260:validateContentRows(content),mapping192,mapping240,relation:compareBaseAndExtended(mapping192,mapping240)};
};
const healthStatus = async (id, data) => (await H05_CASES.find((c)=>c.id===id).run({artifacts:async()=>data})).status;
const reportFixture = () => {
  const cases = HEALTH_SERVER_PLAN.H01.map(id=>({...passCase(),id,assertion:{evaluated:true,passed:true},execution:{contract:EXECUTION_CONTRACT,caseId:id,buildMarker:BUILD_MARKER,healthCatalogVersion:HEALTH_CATALOG_VERSION,sourceSetVersion:SOURCE_SET_VERSION}}));
  return {sourceSetVersion:SOURCE_SET_VERSION,executionContract:EXECUTION_CONTRACT,plannedCaseIds:HEALTH_SERVER_PLAN.H01,runId:"synthetic-run", buildMarker:BUILD_MARKER, healthCatalogVersion:HEALTH_CATALOG_VERSION, environment:"LOCAL",
    scope:"SUITE:H01",startedAt:"2026-01-01T00:00:00Z",completedAt:"2026-01-01T00:01:00Z",cases,summary:summarize(cases),gate:computeGate(cases,{fullScope:false})};
};
/** @type {import("./testTypes").FoundationTest[]} */
export const HARDENING_TESTS = [
  ["HB01","Internal Test Tools presentation modules pass the actual repository boundary scan",async()=>{
    const result=(await loadStaticEvidence()).internalUi;
    assert(result.files>=16&&result.violations.length===0,"internal presentation boundary failed");
  }],
  ["HB02","Internal feature UI cannot hide direct SDK calls or unreviewed imports",()=>{
    const page="/src/pages/internal/TestTools.jsx", hook="/src/features/adminTestTools/useTestTools.js";
    for(const spec of ["@/features/adminTestTools/unreviewed","@/features/calendar/useCalendar","@/api/base44Client","../../../base44/shared/nativeClient"]){
      assert(checkInternalUiPurity({[page]:`import x from '${spec}';`}).violations.length===1,"unreviewed import escaped");
    }
    for(const file of [page,hook,"/src/features/adminTestTools/ImpactPreview.jsx","/src/features/adminTestTools/catalog.js"]){
      for(const code of ["client.entities.User.list();","client.functions.invoke('onboarding');","const cycle_length=28;","import x from '@/api/base44Client';"]){
        assert(checkInternalUiPurity({[file]:code}).violations.length>0,"direct access escaped feature boundary");
      }
    }
    assert(checkInternalUiPurity({[hook]:"import {adminTestRequest} from '@/services/internal/adminTestTools';"}).violations.length===0,"guarded service rejected");
  }],
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
    for (const p of ["apple","google"]) assert((await beginProviderAuth(p,"/",true,auth)).code==="AUTH_PROVIDER_FAILED","unsafe provider failure");
    assert((await beginProviderAuth("password","/",true,auth)).code==="AUTH_UNSUPPORTED_METHOD" && calls.join() === "apple,google","unapproved SDK call");
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
    for(const id of ["bad-id","SHF-999"]){const rows=contentRows();rows[1][0]=id;const a=artifacts(rows);assert(!contentIntegrity(a.content260)&&await healthStatus("H05-007",a)==="FAIL","malformed or unexpected Pair ID accepted");}
  }],
  ["T68","Server request guard denies anonymous/user/forged roles",async()=>assert((await guardScenarios()).ok,"server guard failed")],
  ["T69","Completed result survives save failure with explicit safe code",async()=>{
    const report=reportFixture(); let refreshed=false;const out=await persistCompletedRun(report,async()=>{throw new Error("private");},async()=>{refreshed=true;});
    assert(out.report===report&&out.saveError==="HEALTH_HISTORY_PERSIST_FAILED"&&!refreshed,"result lost or unsafe failure");
  }],
  ["T70","Stored summary is verified; compact JSON bounded without truncation",()=>{
    const report=reportFixture(),safe=normalizeStoredReport(report),rec=buildHistoryRecord(safe,"private://fixture");
    assert(rec.passed===report.cases.length&&rec.status==="SCOPE_PASS"&&JSON.parse(rec.report_json).cases.length===report.cases.length&&rec.report_json.length<HISTORY_FIELD_LIMIT,"record mismatch");
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
    const client={asServiceRole:{entities:{InternalHealthRun:{filter:async()=>record.run_id?[{...record,id:"stored-id"}]:[],create:async(r)=>{record=r;return{id:"stored-id"};},list:async()=>[record],get:async()=>record}},integrations:{Core:{UploadPrivateFile:async({file})=>{upload=JSON.parse(await file.text());return{file_uri:"private://stored-report"};},CreateFileSignedUrl:async(args)=>{signing=args;return{signed_url:"https://example.test/private-report"};}}}}};
    await internalHealthOperation(client,{action:"save",report:reportFixture()},{uploadSigner:healthUploadSigner("synthetic-health-signing-key-at-least-32-characters")});
    assert(upload.runId===record.run_id&&(await internalHealthOperation(client,{action:"list"})).runs.length===1,"save/readback mismatch");
    await internalHealthOperation(client,{action:"report",runId:"stored-id",file_uri:"private://attacker-selected"});
    assert(signing.file_uri==="private://stored-report"&&signing.expires_in===300,"caller controlled artifact URI");
  }],
  ["T73","Static manifest carries scoped metadata and hashes, no raw sources",async()=>{
    const m=await loadStaticEvidence();assert(m.evidenceScope==="BUILD_TIME_REPOSITORY_INSPECTION"&&m.originalArtifactProvenance==="SOURCE_RECEIVED_AND_RECORDED"&&!m.originalArtifactsHashVerifiedInRepo,"provenance overstated");
    assert(Object.keys(m.hashes).length>0&&Object.values(m.hashes).every((h)=>/^[a-f0-9]{64}$/.test(h))&&!Object.hasOwn(m,"sources")&&!Object.hasOwn(m,"raw")&&!Object.hasOwn(m,"rawDocs"),"raw manifest or invalid hashes");
  }],
  ["T74","Rendered auth shell uses only Apple/Google, 52px controls and 20px padding",async()=>{
    const probes=[];
    for(const width of [360,1024]){const result=await measureAuthShell(width);requireAuthProbeReady(result);probes.push({width,...result});const r=result.geometry;assert(r.providers==="apple,google"&&r.heights.every(h=>h>=52)&&r.padding.every(p=>p==="20px")&&r.passwords===0,`auth geometry ${JSON.stringify(r)}`);}
    return {evidence:{probes}};
  }],
];
