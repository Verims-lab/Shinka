import { SOURCE_SET_VERSION } from '../sourceInventory';
import { EXECUTION_CONTRACT } from '../../../base44/shared/healthExecutionEvidence.js';
import { HEALTH_SERVER_PLAN } from '../../../base44/shared/healthPlan.js';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';
import { BUILD_MARKER } from '../buildMarker';
import { HEALTH_CATALOG_VERSION } from '../health/constants';
import { nativeFixture } from './nativeFixture';
import { createTestRepository } from '../../../base44/shared/adminTestRepository.js';
import { saveHealthReport, healthUploadSigner } from '../../../base44/shared/healthPersistence.js';
import { handleInternalRequest, InternalError } from '../../../base44/shared/internalAuthorization.js';
import { summarize, computeGate } from '../health/aggregate';
import { browserMeasurement, acceptBrowserEvidence, probeIdentity, isMeasuredBrowserRow } from '../probes/browserEvidence';
const assert=(ok,message='contract')=>{if(!ok)throw new Error(message);};
const rejected=async(fn,code)=>{try{await fn();}catch(e){assert(e.code===code,`${e.code} !== ${code}`);return e;}throw new Error('expected '+code);};
const report=()=>{
 const cases=HEALTH_SERVER_PLAN.H01.map(id=>({id,suiteId:'H01',status:'FAIL',attempted:true,executed:true,blocker:true,applicability:'CURRENT_PACKAGE',evidence:{classification:'SYNTHETIC_RUNTIME',source:'fixture',actual:false,expected:true,reason:'failure retained',timestamp:new Date().toISOString()}}));
 return {sourceSetVersion:SOURCE_SET_VERSION,executionContract:EXECUTION_CONTRACT,plannedCaseIds:HEALTH_SERVER_PLAN.H01,runId:crypto.randomUUID(),buildMarker:BUILD_MARKER,healthCatalogVersion:HEALTH_CATALOG_VERSION,scope:'SUITE:H01',startedAt:'2026-10-20T18:00:00Z',completedAt:'2026-10-20T18:00:01Z',cases,summary:summarize(cases),gate:computeGate(cases,{fullScope:false})};
};
const healthFixture=()=>{
 const rows=[],state={uploads:0,creates:0,createFailure:false,lostAck:false,readFailure:false,uploadFailure:false,failReadAfterCreate:false};
 const client={asServiceRole:{entities:{InternalHealthRun:{filter:async()=>{if(state.readFailure)throw new Error('private');return structuredClone(rows);},create:async row=>{state.creates++;if(state.createFailure)throw new Error('private');rows.push({id:'run',...row});if(state.failReadAfterCreate)state.readFailure=true;if(state.lostAck)throw new Error('lost');return rows[0];}}},integrations:{Core:{UploadPrivateFile:async()=>{state.uploads++;if(state.uploadFailure)throw new Error('private upload');return {file_uri:'private://fixture'};}}}}};
 const signer=healthUploadSigner('synthetic-health-secret-at-least-32-characters');
 return {rows,state,save:body=>saveHealthReport(client,body,signer),check:report=>internalHealthOperation(client,{action:'saveStatus',report})};
};
/** @type {import('./testTypes').FoundationTest[]} */
export const CLOSURE017_TESTS=[
 ['CL01','FAIL report upload survives create failure; same run retry reuses private artifact',async()=>{
  const f=healthFixture(),r=report();f.state.createFailure=true;
  const e=await rejected(()=>f.save({report:r}),'HEALTH_HISTORY_CREATE_FAILED');assert(e.stage==='HISTORY_CREATE'&&e.uploadReceipt);
  f.state.createFailure=false;await f.save({report:r,uploadReceipt:e.uploadReceipt});await f.save({report:r});
  assert(f.state.uploads===1&&f.rows.length===1&&f.rows[0].failed===r.cases.length);
  const creates=f.state.creates;assert((await f.check(r)).state==='SAVED'&&f.state.creates===creates&&f.state.uploads===1);
 }],
 ['CL02','Lost row acknowledgement returns verified existing history, no second upload or row',async()=>{
  const f=healthFixture(),r=report();f.state.lostAck=true;await f.save({report:r});await f.save({report:r});assert(f.state.uploads===1&&f.state.creates===1);
 }],
 ['CL03','Conflict or unavailable history prevents new artifact; old report remains immutable',async()=>{
  const f=healthFixture(),r=report();await f.save({report:r});await rejected(()=>f.save({report:{...r,environment:'PUBLISHED'}}),'HEALTH_HISTORY_CONFLICT');
  f.state.readFailure=true;await rejected(()=>f.save({report:r}),'HEALTH_HISTORY_LOOKUP_FAILED');assert(f.state.uploads===1&&f.state.creates===1);
 }],
 ['CL04','Upload capability cannot be moved to another report or modified',async()=>{
  const f=healthFixture(),r=report();f.state.createFailure=true;const e=await rejected(()=>f.save({report:r}),'HEALTH_HISTORY_CREATE_FAILED');f.state.createFailure=false;
  await rejected(()=>f.save({report:report(),uploadReceipt:e.uploadReceipt}),'HEALTH_UPLOAD_RECEIPT_INVALID');assert(!f.rows.length&&f.state.uploads===1);
 }],
 ['CL05','Session/lifecycle errors retain safe stage and request ID without raw error',async()=>{
  const response=await handleInternalRequest(new Request('https://fixture.invalid',{method:'POST',body:'{}'}),()=>({auth:{me:async()=>{throw new InternalError('TEST_LIFECYCLE_UNAVAILABLE',503);}}}),()=>{throw new Error('must not run');});
  const body=await response.json();assert(response.status===503&&body.stage==='SESSION_AUTH_LIFECYCLE'&&body.request_id&&body.error_code==='TEST_LIFECYCLE_UNAVAILABLE');
 }],
 ['CL06','Target-bound service-role writes and unscoped writes cannot bypass a deletion tombstone',async()=>{
  const f=nativeFixture();await f.execute(await f.preview('DELETE_USER'));const entities=f.client('adminA').asServiceRole.entities;
  for(const run of [()=>entities.UserCalendarAction.create({user_id:'ownerA'}),()=>entities.UserProfile.upsert([{user_id:'ownerA'}],{key:'user_id'}),()=>entities.UserPeriodRecord.updateMany({user_id:'ownerA'},{$set:{period_start_date:'2026-10-01'}})])await rejected(run,'ACCOUNT_DELETION_IN_PROGRESS');
  await rejected(()=>entities.UserPeriodRecord.deleteMany({}),'WRITE_TARGET_REQUIRED');
  await entities.UserPreferences.create({user_id:'ownerB',language_code:'en'});assert(f.tables.UserPreferences.some(r=>r.user_id==='ownerB'));
 }],
 ['CL07','Completed deletion rechecks late rows on explicit resume without clearing tombstone',async()=>{
  const f=nativeFixture(),done=await f.execute(await f.preview('DELETE_USER'));
  f.tables.UserPeriodRecord.push({id:'late',user_id:'ownerA',period_start_date:'2026-10-01'});
  const resumed=await f.tools({action:'resume',target_id:'ownerA',operation_id:done.job.operation_id});assert(resumed.job.status==='COMPLETED'&&!f.tables.UserPeriodRecord.length&&f.tables.AdminTestOperation.length===1);
 }],
 ['CL08','Cleanup is bounded; reconstructed request resumes and verifies remaining rows',async()=>{
  const f=nativeFixture();f.tables.UserPatternSummary=Array.from({length:102},(_,i)=>({id:'pattern-'+i,user_id:'ownerA'}));
  const partial=await f.execute(await f.preview('DELETE_USER'));assert(partial.result_state==='PARTIAL' && partial.job.error_code==='TEST_CLEANUP_MORE_REQUIRED');assert(f.tables.User.some(r=>r.id==='ownerA'));
  const result=await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id});assert(result.job.status==='COMPLETED'&&!f.tables.UserPatternSummary.length);
  let time=0;const rows=[{id:'slow-a',user_id:'ownerA'},{id:'slow-b',user_id:'ownerA'}];
  const repo=createTestRepository({asServiceRole:{entities:{UserPatternSummary:{filter:async query=>structuredClone(rows.filter(row=>Object.entries(query).every(([key,value])=>row[key]===value))),delete:async id=>{rows.splice(rows.findIndex(r=>r.id===id),1);time+=9000;}}}}},{clock:()=>time});
  time=30000; // Preparation already took 30s: allow progress, then enforce the write budget.
  await rejected(()=>repo.cleanup('user_pattern_summary','ownerA'),'TEST_CLEANUP_MORE_REQUIRED');assert(rows.length===1&&rows[0].id==='slow-b');
 }],
 ['CL09','Unmeasured viewport stays blocked and wrong build evidence cannot be imported',async()=>{
  assert((await browserMeasurement('layout','/missing',360)).state==='BLOCKED');
  let rejected=false;try{await acceptBrowserEvidence({...await probeIdentity(),buildMarker:'invalid-marker'});}catch{rejected=true;}assert(rejected);
 }],
 ['CL11','Upload and post-create readback failures have distinct safe stages; retry reuses stored run',async()=>{
  const f=healthFixture(),r=report();f.state.uploadFailure=true;
  const upload=await rejected(()=>f.save({report:r}),'HEALTH_PRIVATE_UPLOAD_UNCONFIRMED');assert(upload.stage==='PRIVATE_UPLOAD'&&!f.rows.length);
  f.state.uploadFailure=false;f.state.failReadAfterCreate=true;
  const read=await rejected(()=>f.save({report:r}),'HEALTH_HISTORY_LOOKUP_FAILED');assert(read.stage==='READBACK'&&f.rows.length===1);
  f.state.readFailure=false;await f.save({report:r,uploadReceipt:read.uploadReceipt});assert(f.state.uploads===2&&f.state.creates===1);
 }],
 ['CL12','Ambiguous target operations stop service-role writes and destructive resume',async()=>{
  const f=nativeFixture();f.once('before',c=>c.name==='UserProfile'&&c.method==='delete');await rejected(()=>f.preview('DELETE_USER').then(f.execute),'TEST_STORAGE_UNAVAILABLE');
  const job=f.tables.AdminTestOperation[0];f.tables.AdminTestOperation.push({...job,id:'conflict',operation_id:'conflicting-operation',request_id:'conflicting-operation'});
  await rejected(()=>f.tools({action:'resume',target_id:'ownerA',operation_id:job.operation_id}),'TEST_OPERATION_STATE_INVALID');
  await rejected(()=>f.client('adminA').asServiceRole.entities.UserPreferences.create({user_id:'ownerA'}),'TEST_OPERATION_STATE_INVALID');assert(f.tables.User.some(r=>r.id==='ownerA'));
 }],
 ['CL13','A MEASURED label without numeric geometry cannot produce PASS',()=>{
  assert(!isMeasuredBrowserRow({state:'MEASURED'},'layout','/incomplete',360));
  assert(!isMeasuredBrowserRow({state:'READY',route:'/auth-shell-probe',screen:'UNAUTHENTICATED_SIGN_IN',geometry:{}},'auth','/auth-shell-probe',360));
 }],
];
