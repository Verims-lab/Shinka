import { executeTest, testDelay } from '../testExecution';
import { syntheticProbe } from '../health/cases/domainProbe';
import { adminTestRequest, testToolsError } from '@/services/internal/adminTestTools';
import { nativeFixture } from './nativeFixture';
import { persistCompletedRun } from '../health/completion';
import { executeTestJob } from '../../../base44/shared/adminTestExecution.js';
import { DELETE_STEPS, projectOperation } from '../../../base44/shared/adminTestPolicy.js';
const check=(value,message='contract')=>{if(!value)throw new Error(message);};
const rejects=async(fn,code)=>{try{await fn();}catch(error){check(error.code===code,`${error.code} != ${code}`);return error;}throw new Error('Expected rejection');};
/** @type {import('./testTypes').FoundationTest[]} */
export const CLOSURE018_TESTS=[
 ['E01','In-app scope keeps transferred IDs without executing or relabeling them',async()=>{
   const {HEALTH_CASES,IN_APP_HEALTH_CASES}=await import('../health/catalog');
   for(const id of ['H03-007','H07-013','H12-025','H13-012','H13-015','H13-016'])check(HEALTH_CASES.some(c=>c.id===id)&&!IN_APP_HEALTH_CASES.some(c=>c.id===id));
   const old=sessionStorage.getItem('shinka.browser-evidence.v1');sessionStorage.removeItem('shinka.browser-evidence.v1');
   try{const result=await IN_APP_HEALTH_CASES.find(c=>c.id==='H13-004').run({});check(result.status==='PASS'&&result.evidence.actual.width===document.documentElement.clientWidth);}
   finally{if(old)sessionStorage.setItem('shinka.browser-evidence.v1',old);}
 }],
 ['E02','Synthetic helpers share results once and abort their active delay before the next suite',async()=>{
   let runs=0,cleaned=0;
   /** @type {import('./testTypes').FoundationTest} */
   const test=['fixture-safe','delay',async({signal,stage})=>{runs++;stage('DELAY');try{await testDelay(20,signal);}finally{cleaned++;}}];
   const context={testResults:new Map()};await syntheticProbe([test])(context);await syntheticProbe([test])(context);check(runs===1&&cleaned===1);
   const controller=new AbortController(),stages=[];
   const work=executeTest(['cancelled-safe','cancel',async({signal,stage})=>{stage('ACTIVE_WAIT');try{await testDelay(10000,signal);}finally{cleaned++;}}],{signal:controller.signal,onStage:value=>stages.push(value)});
   await Promise.resolve();controller.abort();await rejects(()=>work,'TEST_CANCELLED');await Promise.resolve();check(cleaned===2&&stages[0].id==='cancelled-safe');
   check((await syntheticProbe([['next','next',()=>true]])({})).status==='PASS');
 }],
 ['E03','Blocked iframe CSS and active fixture abort leave no frame; next fixture succeeds',async()=>{
   const {onboardingProbe}=await import('./onboardingUiTests');
   const errorCss=await rejects(()=>executeTest(['css-safe','css',ctx=>onboardingProbe('UNAUTHENTICATED_INTRO',360,()=>{}, {},ctx)],{timeoutMs:400,onStage:({stage})=>{
     if(stage==='CSS_WAIT') {
       const doc=(/** @type {HTMLIFrameElement} */(document.querySelector('iframe[data-onboarding-fixture]'))).contentDocument;
       let link=/** @type {HTMLLinkElement} */(doc.querySelector('link[rel=stylesheet]'));
       if(!link){link=doc.createElement('link');link.rel='stylesheet';doc.head.appendChild(link);}
       Object.defineProperty(link,'sheet',{get:()=>null,configurable:true});
     }
   }}),'TEST_TIMEOUT');
   check(errorCss.testStage==='CSS_WAIT'&&!document.querySelector('[data-onboarding-fixture]'));
   const error=await rejects(()=>executeTest(['interaction-safe','interaction',ctx=>onboardingProbe('UNAUTHENTICATED_INTRO',360,()=>testDelay(10000,ctx.signal),{},ctx)],{timeoutMs:500}),'TEST_TIMEOUT');
   check(error.testStage==='INTERACTION'&&!document.querySelector('[data-onboarding-fixture]'));
   await executeTest(['next-safe','next',ctx=>onboardingProbe('UNAUTHENTICATED_INTRO',360,doc=>check(!!doc.querySelector('main')),{},ctx)]);
   check(!document.querySelector('[data-onboarding-fixture]'));
 }],
 ['E04','Client timeout and safe backend stage/request survive without leaking exceptions',async()=>{
   await rejects(()=>adminTestRequest('lookup',{target_id:'fixture'},{functions:{invoke:()=>new Promise(()=>{})}},5),'TEST_TOOLS_TIMEOUT');
   const error=testToolsError({response:{data:{error_code:'TEST_OPERATION_STATE_INVALID',stage:'OPERATION',request_id:'safe-request',private:'secret'}}});
   check(error.code==='TEST_OPERATION_STATE_INVALID'&&error.stage==='OPERATION'&&error.requestId==='safe-request'&&!JSON.stringify(error).includes('secret'));
 }],
 ['E05','Deleted User lookup verifies the saved job; late residuals are partial and preserved until resume',async()=>{
   const f=nativeFixture();const done=await f.execute(await f.preview('DELETE_USER'));
   const before=f.state.calls.length,read=await f.tools({action:'lookup',target_id:'ownerA'});
   check(!read.target&&read.result_state==='COMPLETED'&&read.job.operation_id===done.job.operation_id);
   check(f.state.calls.slice(before).every(c=>c.method==='filter'));
   f.tables.UserPeriodRecord.push({id:'late',user_id:'ownerA'});
   const status=await f.tools({action:'status',target_id:'ownerA',operation_id:done.job.operation_id});check(status.result_state==='PARTIAL'&&f.tables.UserPeriodRecord.length===1);
   const resumed=await f.tools({action:'resume',target_id:'ownerA',operation_id:done.job.operation_id});check(resumed.result_state==='COMPLETED');
 }],
 ['E06','Missing user is distinct from failed reads; incomplete deletion cannot report success',async()=>{
   const f=nativeFixture();await rejects(()=>f.tools({action:'lookup',target_id:'absent'}),'TEST_USER_NOT_FOUND');
   const done=await f.execute(await f.preview('DELETE_USER'));f.tables.AdminTestOperation[0].status='RUNNING';
   check((await f.tools({action:'lookup',target_id:'ownerA'})).result_state==='PARTIAL');
   f.state.before=async c=>{if(c.name==='AdminTestOperation')throw new Error('synthetic unavailable');};
   const failure=await rejects(()=>f.tools({action:'status',target_id:'ownerA',operation_id:done.job.operation_id}),'TEST_LIFECYCLE_UNAVAILABLE');check(failure.code!=='TEST_USER_NOT_FOUND');
 }],
 ['E07','Save confirmation remains saved if list fails; uncertain write has a separate state',async()=>{
   const report={runId:'same'};
   check((await persistCompletedRun(report,async()=>({id:'saved'}),async()=>{throw new Error();})).saveState==='SAVED');
   check((await persistCompletedRun(report,async()=>({id:'saved'}),()=>new Promise(()=>{}))).saveState==='SAVED');
   const unknown=await persistCompletedRun(report,async()=>{throw {code:'HEALTH_SAVE_RESPONSE_UNKNOWN'};},async()=>{});check(unknown.saveState==='UNKNOWN'&&unknown.report===report);
   check((await persistCompletedRun(report,async()=>{throw {code:'INVALID_HEALTH_REPORT'};},async()=>{})).saveState==='FAILED');
 }],
 ['E08','Slow rechecks cannot starve deletion retries; every pass advances the same journal',async()=>{
   let time=0,userPresent=true;
   const seen=[];
   const row={id:'job',operation_id:'operation-fixture',request_id:'operation-fixture',actor_id:'admin',target_id:'target',operation:'DELETE_USER',status:'RUNNING',stage:'START',preview_hash:'a'.repeat(64),started_at:'2026-10-20T12:00:00Z',progressed_at:'2026-10-20T12:00:00Z',completed_at:null,error_code:null,checkpoints:[]};
   const journal={begin:async()=>structuredClone(row),checkpoint:async(_job,stage)=>{row.checkpoints=[...new Set([...row.checkpoints,stage])];row.stage=stage;},finish:async(_job,patch)=>Object.assign(row,patch),failed:async()=>{throw new Error('unexpected failure');}};
   const repository={operation:async()=>projectOperation(structuredClone(row)),stopNotifications:async()=>{time+=9000;seen.push('NOTIFICATIONS');},cleanup:async stage=>{time+=9000;seen.push(stage);},user:async()=>userPresent?{id:'target'}:null,deleteUser:async()=>{userPresent=false;},calendarActions:async()=>[],owned:async()=>[]};
   for(let pass=0;pass<DELETE_STEPS.length;pass++) {
     const previous=row.checkpoints.length;
     const result=await executeTestJob({journal,repository,actor:{id:'admin'},target:{id:'target'},operation:'DELETE_USER',requestId:row.operation_id,previewHash:row.preview_hash,now:()=>new Date(row.started_at),clock:()=>time});
     check(result.operation_id===row.operation_id&&row.checkpoints.length>previous,'retry must advance');
   }
   check(row.status==='COMPLETED'&&!userPresent&&seen.filter(stage=>stage==='NOTIFICATIONS').length===DELETE_STEPS.length);
 }],
];
