import { nativeFixture, barrier } from './nativeFixture';
import { testOperationDiagnostics } from '../../../base44/shared/adminTestDiagnostics.js';
import { checkAuthSurface } from '../inspection/sourceRules';
import { checkExecutionResults, EXECUTION_CONTRACT } from '../../../base44/shared/healthExecutionEvidence.js';
import { checkCatalog, checkSummaryReconciles } from '../health/integrity';
import { expectedHealthIds } from '../../../base44/shared/healthPlan.js';
import { normalizeStoredReport } from '../../../base44/shared/healthHistoryContract.js';
import { summarize, computeGate } from '../health/aggregate';
import { ev, verdict } from '../health/evidence';
import { BUILD_MARKER } from '../buildMarker';
import { HEALTH_CATALOG_VERSION } from '../health/constants';
import { SOURCE_SET_VERSION } from '../sourceInventory';
import { syntheticProbe } from '../health/cases/domainProbe';

const check = (ok, message = 'contract') => { if (!ok) throw new Error(message); };
const rejects = async (work, code) => { try { await work(); } catch (error) { check(error.code === code, `${error.code} != ${code}`); return error; } throw new Error(`Expected ${code}`); };
const identity = { buildMarker: BUILD_MARKER, healthCatalogVersion: HEALTH_CATALOG_VERSION, sourceSetVersion: SOURCE_SET_VERSION };
const resume = f => ({ action: 'resume', target_id: 'ownerA', operation_id: f.tables.AdminTestOperation[0].operation_id });

/** @type {import('./testTypes').FoundationTest[]} */
export const AUDIT019_DELETION_TESTS = [
  ['AD01','SDK failure retains safe cause/stage and resumes the same durable partial deletion',async()=>{
    const f = nativeFixture(), logs = [];
    const diagnostics = testOperationDiagnostics({ emit: row => logs.push(row) });
    const view = await f.preview('DELETE_USER');
    f.state.before = async call => { if (call.name === 'UserProfile' && call.method === 'delete') {
      f.state.before = null; throw { response: { status: 403, data: { token: 'private-token', email: 'private-value' } } };
    } };
    await f.start(view);
    const error = await rejects(()=>f.tools(resume(f),'adminA',{diagnostics}),'TEST_STORAGE_ACCESS_DENIED');
    check(error.stage === 'USER_PROFILE');
    const job = f.tables.AdminTestOperation[0];
    check(job.stage === 'user_profile' && job.error_code === error.code && job.status === 'RETRY_REQUIRED');
    check(f.tables.User.some(row=>row.id==='ownerA'));
    check(logs.some(row=>row.event==='SDK_FAILURE' && row.sdk==='UserProfile.delete'));
    check(!JSON.stringify(logs).includes('private-') && !JSON.stringify(logs).includes('ownerA'));
    const failure=logs.find(row=>row.event==='SDK_FAILURE');
    f.state.calls.length = 0;logs.length=0;
    const done = await f.tools(resume(f),'adminA',{diagnostics:testOperationDiagnostics({emit:row=>logs.push(row)})});
    const reads = f.state.calls.filter(row=>row.method==='filter').length;
    check(done.result_state==='PARTIAL'&&done.job.checkpoints.includes('VERIFY'),'verification checkpoint not acknowledged');
    check((await f.complete(done)).result_state==='COMPLETED' && f.tables.AdminTestOperation.length===1);
    check(reads <= 160, `resumed SDK reads ${reads} exceed 160`);
    return { evidence: { resumedSdkReads: reads, failure, stages:logs.filter(row=>row.event==='STAGE_END'), baselineIntent:'late partial job with seven verified stages; no health payload' } };
  }],
  ['AD02','Bounded cleanup of shrinking pages resumes without skipped rows or lost retention',async()=>{
    const f=nativeFixture();
    f.tables.UserPatternSummary=Array.from({length:205},(_,i)=>({id:`pattern-${String(i).padStart(3,'0')}`,user_id:'ownerA'}));
    f.tables.UserDailyMessage.push({id:'retained-day',user_id:'ownerA'});
    f.tables.NotificationDelivery=Array.from({length:105},(_,i)=>({id:`notice-${i}`,user_id:'ownerA',daily_message_id:'retained-day',delivery_status:'PENDING'}));
    f.tables.UserCalendarAction=Array.from({length:105},(_,i)=>({id:`receipt-${i}`,user_id:'ownerA'}));
    const retained=JSON.stringify(f.tables.UserHealthConsentEvent);
    await f.start(await f.preview('DELETE_USER'));
    let result=await f.tools(resume(f)), passes=1;
    check(result.result_state==='PARTIAL' && result.job.error_code==='TEST_CLEANUP_MORE_REQUIRED');
    while(result.result_state==='PARTIAL' && passes++<8) result=await f.tools(resume(f));
    check(result.result_state==='COMPLETED' && !f.tables.UserPatternSummary.length && !f.tables.UserCalendarAction.length && f.tables.AdminTestOperation.length===1);
    check(JSON.stringify(f.tables.UserHealthConsentEvent)===retained);
    check(f.tables.NotificationDelivery.length===105 && f.tables.NotificationDelivery.every(row=>row.delivery_status==='SKIPPED'));
    check(f.tables.UserDailyMessage.some(row=>row.id==='retained-day'));
    return { evidence: { passes, deletedPatternRows:205,deletedCalendarReceipts:105,retainedNotifications:105,retainedHistory:true } };
  }],
  ['AD03','Concurrent missing-row delete is idempotent only after successful absence read',async()=>{
    const {createTestRepository}=await import('../../../base44/shared/adminTestRepository.js');
    for(const status of [404,403,503]) {
      let rows=[{id:'same',user_id:'ownerA'}], deletes=0;
      const repository=createTestRepository({asServiceRole:{entities:{UserPatternSummary:{
        filter:async()=>structuredClone(rows),delete:async()=>{deletes++;if(status===404)rows=[];throw {response:{status}};},
      }}}});
      if(status===404)await repository.cleanup('user_pattern_summary','ownerA');
      else {let failed=false;try{await repository.cleanup('user_pattern_summary','ownerA');}catch{failed=true;}check(failed && rows.length===1);}
      check(deletes===1);
      const userRepo=createTestRepository({asServiceRole:{entities:{User:{filter:async()=>[],delete:async()=>{throw {response:{status}};}}}}});
      if(status===404)await userRepo.deleteUser('ownerA');else {let failed=false;try{await userRepo.deleteUser('ownerA');}catch{failed=true;}check(failed);}
    }
  }],
  ['AD04','Residual and final-verification failure never become completed; wrong actor cannot resume',async()=>{
    const f=nativeFixture();
    f.state.after=async call=>{if(call.name==='User'&&call.method==='delete'){f.state.after=null;f.tables.UserPeriodRecord.push({id:'late',user_id:'ownerA'});}};
    await f.start(await f.preview('DELETE_USER'));
    const partial=await f.tools(resume(f));check(partial.result_state==='PARTIAL'&&'progress' in partial&&partial.progress.reason==='RESIDUAL_RECHECK_REQUIRED','residual not exposed');
    check((await f.tools({action:'lookup',target_id:'ownerA'})).result_state==='PARTIAL');
    await rejects(()=>f.tools(resume(f),'adminB'),'TEST_OPERATION_CONFLICT');
    check((await f.complete(await f.tools(resume(f)))).result_state==='COMPLETED');
    f.state.before=async call=>{if(call.name==='UserPeriodRecord')throw new Error('read unavailable');};
    let failed=false;try{await f.tools({action:'status',target_id:'ownerA',operation_id:resume(f).operation_id});}catch{failed=true;}check(failed);
  }],
  ['AD06','Competing resumes retain one target operation and never infer successful cleanup',async()=>{
    const f=nativeFixture();f.once('before',call=>call.name==='UserProfile'&&call.method==='delete');
    await rejects(()=>f.preview('DELETE_USER').then(f.execute),'TEST_STORAGE_UNAVAILABLE');
    const both=barrier(2);f.state.before=async call=>{if(call.name==='UserProfile'&&call.method==='delete')await both();};
    const replies=await Promise.allSettled([f.tools(resume(f)),f.tools(resume(f))]);f.state.before=null;
    check(f.tables.AdminTestOperation.length===1,'new operation created on resume');
    const status=await f.tools({action:'lookup',target_id:'ownerA'});
    if(status.result_state==='COMPLETED')check(!f.tables.User.some(row=>row.id==='ownerA')&&!f.tables.UserProfile.some(row=>row.user_id==='ownerA'));
    for(const result of replies)if(result.status==='fulfilled'&&result.value.result_state==='COMPLETED')check(status.result_state==='COMPLETED');
    else if(result.status==='rejected')check(['TEST_JOB_STATUS_UNCONFIRMED','TEST_AUDIT_UNCONFIRMED','TEST_STORAGE_UNAVAILABLE'].includes(result.reason.code),result.reason.code);
    return {evidence:{responses:replies.map(r=>r.status==='fulfilled'?r.value.result_state:r.reason.code),lookup:status.result_state,operationCount:f.tables.AdminTestOperation.length,scope:'ordinary CRUD race; no distributed exactly-once claim'}};
  }],
  ['AD05','Password regeneration is detected in every named slot without a filename exemption',()=>{
    for(const name of ['Register','ForgotPassword','ResetPassword']) {
      check(checkAuthSurface({[`/src/pages/${name}.jsx`]:"export { default } from './Onboarding';"}).ok);
      check(!checkAuthSurface({[`/src/pages/${name}.jsx`]:"base44.auth.resetPasswordRequest('fixture');"}).ok);
    }
    check(!checkAuthSurface({'/src/injected.jsx':'const x = <input type="password" />;'}).ok);
    check(!checkAuthSurface({'/src/injected.jsx':'const x = <Route path="/register" />;'}).ok);
  }],
];

/** @type {import('./testTypes').FoundationTest[]} */
export const AUDIT019_INTEGRITY_TESTS = [
  ['AI01','Missing runner, no-op result, unevaluated assertion and empty helper set cannot PASS',async()=>{
    const def={id:'H15-999',suiteId:'H15',executionLocation:'IN_APP',applicability:'CURRENT_PACKAGE',classification:'SYNTHETIC_RUNTIME',runnerType:'RUNTIME',severity:'HIGH',title:'fixture',description:'fixture'};
    check(!checkCatalog([{id:'H15'}],[def]).ok);
    const {executeCase}=await import('../health/runner');
    for(const run of [undefined,()=>undefined,()=>({status:'PASS',evidence:ev('STATIC','fixture',true,true,'No predicate evaluated')})]) {
      check((await executeCase({...def,run},{})).status==='FAIL');
    }
    check((await syntheticProbe([])({})).status==='FAIL');
  }],
  ['AI02','Missing result, null measurement, wrong build and contradictory assertion fail evidence checks',()=>{
    const row={id:'H15-999',attempted:true,executed:true,...verdict(true,ev('SYNTHETIC_RUNTIME','fixture',{calls:1},{calls:1},'Measured call count')),execution:{contract:EXECUTION_CONTRACT,caseId:'H15-999',...identity}};
    const valid=rows=>checkExecutionResults(rows,['H15-999'],identity).ok;
    check(valid([row]));check(!valid([]));check(!valid([row,row]));
    check(!valid([{...row,evidence:{...row.evidence,actual:null}}]));
    check(!valid([{...row,execution:{...row.execution,buildMarker:BUILD_MARKER.replace(/\d{3}$/,'001')}}]));
    check(!valid([{...row,assertion:{evaluated:false,passed:true}}]));
    check(!valid([{...row,assertion:{evaluated:true,passed:false}}]));
  }],
  ['AI04','Persisted current reports require the canonical plan; legacy failures remain readable',()=>{
    const plannedCaseIds=expectedHealthIds('SUITE:H01',HEALTH_CATALOG_VERSION);
    const cases=plannedCaseIds.map(id=>({id,suiteId:'H01',status:'FAIL',attempted:true,executed:true,blocker:true,applicability:'CURRENT_PACKAGE'}));
    const report={...identity,executionContract:EXECUTION_CONTRACT,plannedCaseIds,runId:'integrity-fixture',scope:'SUITE:H01',startedAt:'2026-10-20T12:00:00Z',completedAt:'2026-10-20T12:00:01Z',cases,summary:summarize(cases),gate:computeGate(cases,{fullScope:false})};
    check(normalizeStoredReport(report).cases.length===cases.length);
    const invalid=[{...report,executionContract:undefined},{...report,plannedCaseIds:plannedCaseIds.slice(1),cases:cases.slice(1)},{...report,cases:cases.slice(1)},{...report,sourceSetVersion:null}];
    for(const value of invalid){let failed=false;try{normalizeStoredReport(value);}catch{failed=true;}check(failed,'invalid persisted report accepted');}
    const legacy={...report,executionContract:undefined,buildMarker:BUILD_MARKER.replace(/\d{3}$/,'018'),healthCatalogVersion:HEALTH_CATALOG_VERSION.replace(/^HC-\d{3}/,'HC-018')};
    check(normalizeStoredReport(legacy).summary.failed===cases.length);
  }],
  ['AI03','Supplied totals are checked against results; tampering cannot reconcile',()=>{
    const rows=[{id:'H01-001',status:'FAIL',applicability:'CURRENT_PACKAGE',attempted:true,executed:true,blocker:true,durationMs:1}];
    const summary=summarize(rows);check(checkSummaryReconciles(rows,summary).ok);
    for(const key of ['passed','failed','totalCatalog','attempted','executed','durationMs'])check(!checkSummaryReconciles(rows,{...summary,[key]:summary[key]+1}).ok);
  }],
];
