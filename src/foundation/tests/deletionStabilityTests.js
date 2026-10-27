import { deletionFixture, finishDeletion } from './deletionFixture';
import { check, rejects } from './dataModelTests';

/** @type {import('./testTypes').FoundationTest[]} */
export const DELETION_STABILITY_TESTS = [
 ['DX01','Delayed real handler/native deletion progresses inside the existing service window; stable operation and protected actor',async()=>{
   const f=deletionFixture({latency:300});const view=await f.preview();
   const before=JSON.stringify(f.tables.User.filter(row=>row.id!=='ownerA'));
   await finishDeletion(f,await f.execute(view));
   const passes=f.measure.calls.filter(c=>['execute','resume'].includes(c.action));
   check(passes.every(c=>c.durationMs<30000),`pass exceeded existing 30s service window: ${passes.map(c=>c.durationMs).join(',')}`);
   check(!f.tables.User.some(u=>u.id==='ownerA')&&JSON.stringify(f.tables.User)===before,'actor/other native users changed');
   check(f.tables.AdminTestOperation.length===1&&new Set(passes.map(c=>c.operationId)).size===1,'operation identity changed');
 }],
 ['DX02','A different admin can inspect but cannot adopt or automatically resume another actor’s receipt',async()=>{
   const f=deletionFixture();const view=await f.preview();let hit=false;
   f.measure.before=async call=>{if(!hit&&call.name==='UserProfile'&&call.method==='delete'){hit=true;throw {status:503};}};
   const started=await f.execute(view);const id=started.job.operation_id;
   await rejects(()=>f.resume(id));
   f.measure.before=null;f.measure.actor='adminB';const read=await f.status(id);
   check(read.resume_enabled===false&&read.mutation_blocker==='TEST_OPERATION_CONFLICT','foreign actor offered mutation recovery');
   const count=f.state.calls.length;await rejects(()=>f.resume(id),'TEST_OPERATION_CONFLICT');
   check(f.state.calls.slice(count).every(c=>c.method==='filter'),'wrong actor wrote data');
 }],
 ['DX03','Completed receipt is not absence evidence: restored User, residual records and read failures remain unconfirmed',async()=>{
   const f=deletionFixture();const done=await finishDeletion(f,await f.execute(await f.preview()));const id=done.job.operation_id;
   f.tables.User.push({id:'ownerA',role:'user'});f.tables.UserProfile.push({id:'restored-profile',user_id:'ownerA',account_status:'ACTIVE'});
   const start=f.state.calls.length;check((await f.status(id)).result_state==='PARTIAL','stale COMPLETED accepted');
   check(f.state.calls.slice(start).every(c=>c.method==='filter'),'status mutated residuals');
   for(const status of [429,500,404]){
     f.measure.before=async call=>{if(call.name==='User'&&call.args[0]?.id==='ownerA')throw {response:{status}};};
     await rejects(()=>f.status(id));
   }
   f.measure.before=null;await finishDeletion(f,await f.resume(id));
   check((await f.status(id)).result_state==='COMPLETED'&&!f.tables.UserProfile.length,'same operation failed to reconcile residuals');
 }],
];
