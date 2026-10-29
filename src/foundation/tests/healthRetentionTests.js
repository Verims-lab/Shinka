import { healthRetention, planHealthRetention } from '../../../base44/shared/healthRetention.js';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';
import { nativeFixture } from './nativeFixture';
import { check } from './dataModelTests';
import { buildEvidence } from '../buildMarkerRules';
const row=i=>({id:`report-${String(i).padStart(4,'0')}`,run_id:`run-${i}`,status:i%2?'BLOCKED':'READY',completed_at:new Date(Date.parse('2026-10-01T12:00:00Z')+i*60000).toISOString(),created_date:'2026-10-01T12:00:00Z',report_file_uri:`private://report-${i}`,report_digest:`digest-${i}`});
function fixture(count=10) {
  const f=nativeFixture();f.tables.InternalHealthRun=Array.from({length:count},(_,i)=>row(i));
  f.tables.UserProfile.push({...f.tables.UserProfile[0],id:'admin-profile',user_id:'adminA'});
  const client=f.raw('adminA');client.getConfig=()=>({appId:'6ad5190f4845d4e3af03b420',serverUrl:'https://fixture.invalid'});
  return {...f,admin:client,run:body=>healthRetention(client,{...(body.action==='applyBatch'?{writers_drained:true,protected_run_ids:[]}:{}),...body})};
}
async function rejects(fn,code) {try{await fn();}catch(error){check(error.code===code,`${code}: ${error.code}`);return;}throw new Error(`Expected ${code}`);}
/** @type {import('./testTypes').FoundationTest[]} */
export const HEALTH_RETENTION_TESTS=[
 ['HR07','Health list excludes large case indexes at 10 and 1000 rows; one bounded projected read',async()=>{
   for(const size of [10,1000]) {
     const f=fixture(size);f.tables.InternalHealthRun.forEach(r=>{r.report_json='x'.repeat(15000);});
     const result=await internalHealthOperation(f.admin,{action:'list'});
     check('runs' in result&&result.runs.length===Math.min(size,20)&&JSON.stringify(result).length<6000);
     check(!JSON.stringify(result).includes('report_json'));
     const calls=f.state.calls.filter(c=>c.name==='InternalHealthRun');check(calls.length===1&&calls[0].method==='filter'&&calls[0].args[2]===20&&calls[0].args[4].length===11);
   }
 }],
 ['HR01','Latest five completed reports retain failures too; explicit recovery and incomplete/invalid report times stay protected',()=>{
   const rows=Array.from({length:12},(_,i)=>row(i));
   Object.assign(rows[0],{completed_at:null,status:'RUNNING'});
   rows[2].completed_at='2026-10-01T12:00:00';rows[3].completed_at=null;rows[4].completed_at='invalid';
   rows[5].created_date='2026-10-01T12:00:00';rows[6].created_date=null;
   rows[7].completed_at='2026-10-01T15:07:00+03:00';
   rows.push({...row(12),status:'INCOMPLETE'});
   rows.push({...row(13),run_id:null});
   const plan=planHealthRetention(rows,['run-1']);
   check(plan.eligible.map(r=>r.id).join()===['report-0005','report-0006'].join());
   check(plan.retained.filter(r=>r.reason==='LATEST_FIVE').length===5);
   check(plan.retained.some(r=>r.id==='report-0001'&&r.reason==='ACTIVE_RECOVERY'));
   check(plan.retained.filter(r=>r.reason==='INCOMPLETE_OR_UNKNOWN').length===6);
   check(plan.retained.some(r=>r.id==='report-0012'&&r.reason==='INCOMPLETE_OR_UNKNOWN'),'INCOMPLETE remains protected even with completed_at');
   check(rows[5].created_date==='2026-10-01T12:00:00'&&rows[6].created_date===null,'native metadata is never timezone-repaired');
 }],
 ['HR02','Full keyset inventory, bounded deletion, lost ACK and process recreation resume the same IDs on shrinking pages',async()=>{
   const f=fixture(106),first=await f.run({action:'dryRun'});check(first.total===106&&first.eligible===101&&first.ids.length===25&&first.hasMore);
   await rejects(()=>healthRetention(f.admin,{action:'applyBatch',ids:first.ids,reviewed_digest:first.reviewed_digest}),'RETENTION_DRAIN_REQUIRED');
   const selected=first.ids.slice(0,3);let plan=await f.run({action:'dryRun',ids:selected});
   let deletes=0;f.state.before=call=>{if(call.name==='InternalHealthRun'&&call.method==='delete'&&++deletes===2)throw new Error('failure');};
   let result=await f.run({action:'applyBatch',ids:selected,reviewed_digest:plan.reviewed_digest});
   check(!result.complete&&result.pendingIds.join()===selected.slice(1).join());
   f.state.before=null;plan=await f.run({action:'dryRun',ids:selected});check(plan.targets[0].state==='ABSENT');
   f.once('after',c=>c.name==='InternalHealthRun'&&c.method==='delete');
   result=await healthRetention(f.admin,{action:'applyBatch',writers_drained:true,protected_run_ids:[],ids:selected,reviewed_digest:plan.reviewed_digest});
   check(result.complete&&f.tables.InternalHealthRun.length===103);
   const verified=await f.run({action:'verify'});check(verified.total===103&&verified.eligible===98);
   check(f.state.calls.filter(c=>c.name==='InternalHealthRun'&&c.method==='filter').every(c=>c.args[2]<=100&&c.args[3]===0&&c.args[4]&&!c.args[4].includes('report_json')));
 }],
 ['HR03','Shared retained artifact and product rows survive; changed/protected targets reject before deletion',async()=>{
   const f=fixture(),product=JSON.stringify(f.tables.UserDailyMessage);f.tables.InternalHealthRun[0].report_file_uri=f.tables.InternalHealthRun[9].report_file_uri;
   const plan=await f.run({action:'dryRun'});check(plan.files.referenced===9&&plan.files.referencedByRetained===5&&!JSON.stringify(plan).includes('private://'));
   f.tables.InternalHealthRun[0].report_digest='changed';await rejects(()=>f.run({action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest}),'RETENTION_REVIEW_EXPIRED');
   const fresh=await f.run({action:'dryRun'}),kept=JSON.stringify(f.tables.InternalHealthRun.slice(5));
   const result=await f.run({action:'applyBatch',ids:fresh.ids,reviewed_digest:fresh.reviewed_digest});check(result.complete&&result.filesDeleted===0&&f.tables.InternalHealthRun.length===5);
   check(JSON.stringify(f.tables.InternalHealthRun)===kept&&JSON.stringify(f.tables.UserDailyMessage)===product);
   const protectedPlan=await f.run({action:'dryRun',ids:[f.tables.InternalHealthRun[0].id]});
   await rejects(()=>f.run({action:'applyBatch',ids:protectedPlan.ids,reviewed_digest:protectedPlan.reviewed_digest}),'RETENTION_TARGET_PROTECTED');
 }],
 ['HR04','Anonymous, non-admin, inactive, wrong app and arbitrary payloads perform zero mutations',async()=>{
   for(const kind of ['anonymous','user','inactive','wrong-app','extra']) {
     const f=fixture();let client=f.admin;const body={action:'healthRetention',request:{action:'dryRun'}};
     if(kind==='anonymous'||kind==='user'){client=f.raw(kind==='user'?'ownerA':null);client.getConfig=f.admin.getConfig;}
     if(kind==='inactive')f.tables.UserProfile.find(r=>r.user_id==='adminA').account_status='INACTIVE';
     if(kind==='wrong-app')client.getConfig=()=>({appId:'wrong',serverUrl:'https://fixture.invalid'});
     if(kind==='extra')Object.assign(body.request,{table:'User'});
     let rejected=false;try{await internalHealthOperation(client,body);}catch{rejected=true;}
     check(rejected&&!f.state.calls.some(c=>['delete','update','create','deleteMany'].includes(c.method)),kind);
   }
 }],
 ['HR05','Duplicate identities and mid-batch role loss fail closed without fabricated success',async()=>{
   const f=fixture();f.tables.InternalHealthRun[0].run_id=f.tables.InternalHealthRun[1].run_id;
   const plan=await f.run({action:'dryRun'});check(plan.retained.filter(r=>r.reason==='RUN_ID_CONFLICT').length===2);
   f.state.after=c=>{if(c.method==='delete')f.tables.User.find(u=>u.id==='adminA').role='user';};
   const result=await f.run({action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest});
   check(!result.complete&&result.outcomes.filter(r=>r.status==='VERIFIED_ABSENT').length===1&&result.outcomes.at(-1).status==='FORBIDDEN_INTERNAL_TOOLING');
   const g=fixture();g.tables.InternalHealthRun.push({...g.tables.InternalHealthRun[0]});
   await rejects(()=>g.run({action:'dryRun'}),'RETENTION_INVENTORY_INVALID');
 }],
 ['HR06','Historic build evidence aliases preserve false and explicitly mark missing evidence',()=>{
   check(buildEvidence({tests_updated:true},'tests_changed','tests_updated')==='true');
   check(buildEvidence({tests_changed:false,tests_updated:true},'tests_changed','tests_updated')==='false');
   check(buildEvidence({},'source_changed','source_of_truth_updated')==='NOT_RECORDED');
 }],
];
