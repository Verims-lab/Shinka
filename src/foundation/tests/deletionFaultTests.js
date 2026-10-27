import { deletionFixture, finishDeletion } from './deletionFixture';
import { DELETED_ENTITIES, RETAINED_ENTITIES, SHARED_ENTITIES } from '../../../base44/shared/adminTestPolicy.js';
import { physicalName } from '../../../base44/shared/domainSchemas.js';
import { check, rejects } from './dataModelTests';

function populate(f) {
  for(const entity of DELETED_ENTITIES) {
    const name=physicalName(entity);
    if(!f.tables[name].some(r=>r.user_id==='ownerA'))f.tables[name].push({id:`target-${name}`,user_id:'ownerA',reference_period_id:'target-UserPeriodRecord'});
    f.tables[name].push({id:`actor-${name}`,user_id:'adminA',reference_period_id:'actor-UserPeriodRecord'});
  }
  f.tables.UserDailyMessage.push({id:'daily-target',user_id:'ownerA'},{id:'daily-actor',user_id:'adminA'});
  f.tables.NotificationDelivery.push({id:'pending-target',user_id:'ownerA',daily_message_id:'daily-target',delivery_status:'PENDING'});
  f.tables.UserCalendarAction.push({id:'action-target',user_id:'ownerA'});
}
const kept=f=>JSON.stringify(Object.fromEntries(Object.entries(f.tables).filter(([name])=>name!=='AdminAuditLog'&&name!=='AdminTestOperation').map(([name,rows])=>[name,rows.filter(row=>name==='User'?row.id!=='ownerA':row.user_id!=='ownerA')])));
const history=f=>JSON.stringify(RETAINED_ENTITIES.filter(e=>!['notification_delivery','admin_audit_log'].includes(e)).map(e=>f.tables[physicalName(e)]));

/** @type {import('./testTypes').FoundationTest[]} */
export const DELETION_FAULT_TESTS = [
 ['DX04','Native multi-page shrinking cleanup preserves all actor business data, shared content and retained target history',async()=>{
   const f=deletionFixture({periods:205});populate(f);
   f.tables.UserCyclePhaseDay.find(r=>r.user_id==='ownerA').reference_period_id='period-0000';
   f.tables.UserCyclePrediction.find(r=>r.user_id==='ownerA').reference_period_id='period-0000';
   const preserved=kept(f),retained=history(f),shared=JSON.stringify(SHARED_ENTITIES.map(e=>f.tables[physicalName(e)]));
   const view=await f.preview();check(view.counts.user_period_record===205,'inventory truncated');
   await finishDeletion(f,await f.execute(view));
   check(kept(f)===preserved&&history(f)===retained&&JSON.stringify(SHARED_ENTITIES.map(e=>f.tables[physicalName(e)]))===shared,'protected records changed');
   check(f.tables.NotificationDelivery[0].delivery_status==='SKIPPED'&&!f.tables.UserCalendarAction.length,'pending work not stopped');
   check(f.measure.calls.filter(c=>['resume','execute'].includes(c.action)).every(c=>c.progress.writeAttempts<=100&&c.progress.madeProgress),'pass failed to advance or exceeded work limit');
   check((await f.client('adminA').auth.me()).id==='adminA','actor session lost');
 }],
 ['DX05','Every destructive SDK stage survives before-write failure and lost write acknowledgement using the same receipt',async()=>{
   for(const name of ['NotificationDelivery',...DELETED_ENTITIES.map(physicalName),'UserCalendarAction','User'])for(const when of ['before','after']) {
     const f=deletionFixture();populate(f);const retained=history(f),actor=kept(f),start=await f.execute(await f.preview());let hit=false;
     f.measure[when]=async c=>{if(!hit&&c.name===name&&c.method===(name==='NotificationDelivery'?'update':'delete')){hit=true;throw {status:503};}};
     await rejects(()=>finishDeletion(f,start));check(hit,`fault not reached ${name}/${when}`);
     f.measure[when]=null;
     const result=await f.status(start.job.operation_id);check(result.result_state==='PARTIAL','failed stage reported success');
     await finishDeletion(f,result);check(f.tables.AdminTestOperation.length===1&&history(f)===retained&&kept(f)===actor,`unsafe resume ${name}/${when}`);
   }
 }],
 ['DX06','Lost journal/start audit/checkpoint/final audit/terminal acknowledgements recover from persisted state without duplicate audits',async()=>{
   for(const point of ['create','start-audit','checkpoint','end-audit','terminal'])for(const when of ['before','after']) {
     const f=deletionFixture(),view=await f.preview(),id=crypto.randomUUID();let hit=false;
     const matches=c=>point==='create'?c.name==='AdminTestOperation'&&c.method==='create':point.includes('audit')?c.name==='AdminAuditLog'&&c.method==='create'&&c.args[0].error_code===(point==='start-audit'?'TEST_OPERATION_STARTED':'TEST_OPERATION_COMPLETED'):c.name==='AdminTestOperation'&&c.method==='update'&&(point==='terminal'?c.args[1].status==='COMPLETED':Array.isArray(c.args[1].checkpoints));
     f.measure[when]=async c=>{if(!hit&&matches(c)){hit=true;throw {status:500};}};
     try {await finishDeletion(f,await f.execute(view,id));}catch{ /* Failure or verified lost-terminal acknowledgement are both allowed. */ }
     check(hit,`fault not reached ${point}/${when}`);f.measure[when]=null;
     const result=f.tables.AdminTestOperation.length?await f.status(id):await f.execute(view,id);
     await finishDeletion(f,result);check(f.tables.AdminTestOperation.length===1,'new receipt on retry');
     for(const code of ['TEST_OPERATION_STARTED','TEST_OPERATION_COMPLETED'])check(f.tables.AdminAuditLog.filter(r=>r.error_code===code).length===1,'duplicate exact audit');
   }
 }],
 ['DX07','Two native clients resume one acknowledged receipt; completed status is reverified and competing receipts block without bulk clearing',async()=>{
   const f=deletionFixture({periods:4}),start=await f.execute(await f.preview()),id=start.job.operation_id;
   await Promise.allSettled([f.resume(id),f.resume(id),f.status(id)]);
   await finishDeletion(f,await f.status(id));check(f.tables.AdminTestOperation.length===1,'concurrent resume created receipt');
   const done=f.tables.AdminTestOperation[0];f.tables.AdminTestOperation.push({...done,id:'conflict',operation_id:crypto.randomUUID(),request_id:'invalid-binding'});
   const count=f.state.calls.length;await rejects(()=>f.resume(id),'TEST_OPERATION_STATE_INVALID');await rejects(()=>f.status(id),'TEST_OPERATION_STATE_INVALID');check(f.state.calls.slice(count).every(c=>c.method==='filter')&&f.tables.AdminTestOperation.length===2,'conflicting receipts changed');
 }],
 ['DX08','Missing target User still enforces privacy/health jobs and lifecycle fences; wrong target and revoked admin cause zero further writes',async()=>{
   const f=deletionFixture(),start=await f.execute(await f.preview()),id=start.job.operation_id;
   await rejects(()=>f.client('adminA').asServiceRole.entities.UserProfile.create({user_id:'ownerA'}),'ACCOUNT_DELETION_IN_PROGRESS');
   f.tables.User=f.tables.User.filter(r=>r.id!=='ownerA');
   f.tables.HealthDataDeletionJob.push({id:'health-job',user_id:'ownerA',job_status:'PENDING'});
   let count=f.state.calls.length;await rejects(()=>f.resume(id),'HEALTH_DELETION_PENDING');check(f.state.calls.slice(count).every(c=>c.method==='filter'),'missing User skipped health guard');
   f.tables.HealthDataDeletionJob=[];
   f.tables.UserPrivacyRequest.push({id:'privacy-job',user_id:'ownerA',kind:'DELETE_ACCOUNT',status:'IN_PROGRESS',request_key:'privacy-key',requested_at:'2026-10-27T12:00:00Z'});
   count=f.state.calls.length;await rejects(()=>f.resume(id),'PRIVACY_OTHER_OPERATION_PENDING');check(f.state.calls.slice(count).every(c=>c.method==='filter'),'missing User skipped privacy guard');f.tables.UserPrivacyRequest=[];
   count=f.state.calls.length;await rejects(()=>f.request('resume',{target_id:'ownerB',operation_id:id}),'TEST_OPERATION_NOT_FOUND');check(f.state.calls.slice(count).every(c=>c.method==='filter'),'wrong owner wrote');
   f.tables.User.find(r=>r.id==='adminA').role='user';count=f.state.calls.length;await rejects(()=>f.resume(id),'FORBIDDEN_INTERNAL_TOOLING');check(f.state.calls.slice(count).every(c=>c.method==='filter'),'revoked actor wrote');
 }],
 ['DX09','VERIFY read failure and late earlier-stage residual cannot produce completion; retry rewinds only necessary checkpoints',async()=>{
   const f=deletionFixture(),start=await f.execute(await f.preview()),id=start.job.operation_id;
   let result=await f.resume(id);check(result.job.checkpoints.includes('VERIFY')&&result.result_state==='PARTIAL','verification not separately acknowledged');
   for(const status of [429,503]){
     f.measure.before=async c=>{if(c.name==='UserCycleSettings'&&c.method==='filter')throw {status};};
     await rejects(()=>f.resume(id));check(f.tables.AdminTestOperation[0].status!=='COMPLETED','failed verification persisted success');
   }
   f.measure.before=null;f.tables.UserCycleSettings.push({id:'late-settings',user_id:'ownerA'});
   result=await f.resume(id);check(result.result_state==='PARTIAL'&&result.progress.reason==='RESIDUAL_RECHECK_REQUIRED'&&!result.job.checkpoints.includes('user_cycle_settings'),'residual not exposed');
   await finishDeletion(f,result);check(!f.tables.UserCycleSettings.length,'residual remains');
 }],
 ['DX10','Concurrent admission never hides duplicate native receipts or deletes through an ambiguous operation',async()=>{
   const f=deletionFixture(),view=await f.preview(),id=crypto.randomUUID();
   const replies=await Promise.allSettled([f.execute(view,id),f.execute(view,id)]);
   check(f.tables.User.some(r=>r.id==='ownerA')&&!f.state.calls.some(c=>c.method==='delete'),'admission destroyed target');
   if(f.tables.AdminTestOperation.length>1){
     check(replies.every(r=>r.status==='rejected'),'ambiguous admission acknowledged');
     const count=f.state.calls.length;await rejects(()=>f.status(id),'TEST_OPERATION_STATE_INVALID');await rejects(()=>f.resume(id),'TEST_OPERATION_STATE_INVALID');
     check(f.state.calls.slice(count).every(c=>c.method==='filter'),'conflict auto-cleaned');
   }else{
     check(f.tables.AdminTestOperation.length===1,'missing receipt');await finishDeletion(f,await f.status(id));
   }
 }],
];
