import { seedLegacyReset } from './historicalResetFixture';
import { nativeFixture, barrier } from './nativeFixture';
import { check } from './dataModelTests';
import { reconcileDailyRows } from '../../../base44/shared/nativeDailyPersistence.js';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { HEALTH_CONSENT_VERSION } from '../../../base44/shared/onboardingDependencies.js';
const rejects = async (work, code) => { try { await work(); } catch (e) { check(!code || e.code === code, `expected ${code}, got ${e.code}`); return; } throw new Error(`expected ${code || 'failure'}`); };
const add = f => f.change('add', { date: '2026-10-01' });
const request = async (f, action, extra = {}) => ({ action, action_id: crypto.randomUUID(), revision: (await f.cal()).revision, ...extra });
/** @type {import('./testTypes').FoundationTest[]} */
export const NATIVE_TESTS = [
 ['NA01','Current native User role and tombstone override cached identity',async()=>{
  const f=nativeFixture(); check((await f.client('adminA').auth.me()).role==='admin'); f.tables.User.find(r=>r.id==='adminA').role='user'; check((await f.client('adminA').auth.me()).role==='user');
  await rejects(()=>f.preview(),'FORBIDDEN_INTERNAL_TOOLING'); await rejects(()=>f.client(null).auth.me(),'AUTH_REQUIRED'); f.tables.User=f.tables.User.filter(r=>r.id!=='ownerA'); await rejects(()=>f.today(),'AUTH_REQUIRED');
 }],
 ['NA02','Daily assignment reused; current catalog text resolves after profile changes',async()=>{
  const f=nativeFixture(), first=await f.today(); f.tables.UserProfile[0].birth_date='1991-02-01'; f.tables.MessagePair.find(p=>p.id===first.daily.message_pair_id).message_tr='changed catalog';
  const second=await f.today(); check(first.daily.id===second.daily.id&&first.daily.message_pair_id===second.daily.message_pair_id&&second.daily.message_tr_snapshot==='changed catalog'&&f.tables.UserDailyMessage.length===1);
 }],
 ['NA03','Independent ordinary clients can create duplicates; deterministic winner retains both',async()=>{
  const f=nativeFixture(), wait=barrier(2); f.state.before=async c=>{if(c.name==='UserDailyMessage'&&c.method==='create')await wait();};
  const outcomes=await Promise.all([f.today(),f.today()]); check(f.tables.UserDailyMessage.length===2); check(outcomes[0].daily.id===outcomes[1].daily.id); check(!f.state.calls.some(c=>c.method==='upsert'));
 }],
 ['NA04','Conflicting daily candidates and late visibility preserve all assignments',async()=>{
  const f=nativeFixture(), a=(await f.today()).daily, b={...a,id:'earlier',generated_at:'2026-10-20T10:00:00Z',message_pair_id:f.tables.MessagePair.find(p=>p.id!==a.message_pair_id).id};
  f.tables.UserDailyMessage.push(b); const value=await f.today(); check(value.daily.id==='earlier'&&value.notice==='DAILY_DUPLICATE_RECONCILED'); check(f.tables.UserDailyMessage[0].message_pair_id===a.message_pair_id);
  check(reconcileDailyRows([b,a],'ownerA',a.shinka_date).record.id===reconcileDailyRows([a,b],'ownerA',a.shinka_date).record.id);
 }],
 ['NA05','Lost daily create response recovered by reconstructed client with no extra write',async()=>{
  const f=nativeFixture(); f.once('after',c=>c.name==='UserDailyMessage'&&c.method==='create'); await rejects(f.today); const value=await f.today(); check(value.persisted&&!value.created&&f.tables.UserDailyMessage.length===1);
 }],
 ['NA06','Every daily candidate counts toward the 40-day repeat exclusion',async()=>{
  const f=nativeFixture(), a=await f.today(); f.state.time='2026-10-21T12:00:00Z'; const b=await f.today(); check(a.daily.message_pair_id!==b.daily.message_pair_id);
 }],
 ['NA07','Inactive daily account and signed-out identity are rejected without creating a daily row',async()=>{
  const f=nativeFixture(); f.tables.UserProfile[0].account_status='INACTIVE'; await rejects(f.today,'ACTIVE_ACCOUNT_REQUIRED'); f.tables.UserProfile[0].account_status='ACTIVE'; f.state.signedOut=true; await rejects(f.today); check(!f.tables.UserDailyMessage.length); f.state.signedOut=false;
 }],
 ['NA08','Calendar actual add/edit/delete; same ID; no derived writes or duration defaults',async()=>{
  const f=nativeFixture(); await add(f); const id=f.tables.UserPeriodRecord[0].id; await f.change('edit',{period_id:id,date:'2026-10-02'}); check(f.tables.UserPeriodRecord[0].id===id); await f.change('delete',{period_id:id}); check(!f.tables.UserPeriodRecord.length&&!f.tables.UserCyclePrediction.length&&!f.tables.UserCyclePhaseDay.length&&!f.tables.UserCycleSettings.length);
 }],
 ['NA09','Calendar stale revision and changed action fingerprint do not silently overwrite',async()=>{
  const f=nativeFixture(), body=await request(f,'add',{date:'2026-10-01'}); await f.cal(body); await rejects(()=>f.cal({...body,date:'2026-10-02'}),'ACTION_CONFLICT'); await rejects(()=>f.cal({...body,action_id:crypto.randomUUID(),date:'2026-09-01'}),'CALENDAR_STATE_CHANGED'); check(f.tables.UserPeriodRecord.length===1);
 }],
 ['NA10','Lost period create response resumes same intent after reload with saved action ID',async()=>{
  const f=nativeFixture(), body=await request(f,'add',{date:'2026-10-01'}); f.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='create'); await rejects(()=>f.cal(body)); const v=await f.cal();check(v.pendingReview&&v.recovery.action_id===body.action_id); await f.cal({action:'resume',action_id:v.recovery.action_id,revision:v.recovery.revision}); check(f.tables.UserPeriodRecord.length===1&&f.tables.UserCalendarAction.length===1&&f.tables.UserCalendarAction[0].status==='APPLIED');
 }],
 ['NA11','Lost edit/delete acknowledgements recover without repeating actual mutation',async()=>{
  for(const action of ['edit','delete']){const f=nativeFixture();await add(f);const body=await request(f,action,{period_id:f.tables.UserPeriodRecord[0].id,...(action==='edit'?{date:'2026-10-02'}:{})});f.once('after',c=>c.name==='UserPeriodRecord'&&c.method===(action==='edit'?'updateMany':'deleteMany'));await rejects(()=>f.cal(body));await f.cal(body);check(f.tables.UserPeriodRecord.length===(action==='edit'?1:0));}
 }],
 ['NA12','Two simultaneous distinct date intents conflict visibly and retain intent records',async()=>{
  const f=nativeFixture(), a=await request(f,'add',{date:'2026-10-01'}),wait=barrier(2);f.state.after=async c=>{if(c.name==='UserCalendarAction'&&c.method==='create')await wait();};
  const values=await Promise.allSettled([f.cal(a),f.cal({...a,action_id:crypto.randomUUID(),date:'2026-09-01'})]);check(values.every(r=>r.status==='rejected'));check(f.tables.UserCalendarAction.length===2&&!f.tables.UserPeriodRecord.length); f.state.after=null;const view=await f.cal();check(view.pendingReview&&view.predictedDays.length===0);const before=JSON.stringify(f.tables);await rejects(()=>f.cal({action:'acknowledge',action_id:crypto.randomUUID(),revision:view.revision}),'INVALID_REQUEST');check((await f.cal()).pendingReview&&JSON.stringify(f.tables)===before&&!view.recovery);
 }],
 ['NA13','Readback failure leaves intent pending; retry completes without false rollback',async()=>{
  const f=nativeFixture(),body=await request(f,'add',{date:'2026-10-01'});f.once('before',c=>c.name==='UserCalendarAction'&&c.method==='update');await rejects(()=>f.cal(body));check(f.tables.UserPeriodRecord.length===1&&f.tables.UserCalendarAction[0].status==='PENDING');await f.cal(body);check(f.tables.UserCalendarAction[0].status==='APPLIED');
 }],
 ['NA14','Initial grant event failure survives reload; resume preserves business timestamp',async()=>{
  const f=nativeFixture({granted:false}),body=await request(f,'add',{date:'2026-10-01',health_consent:true});f.once('before',c=>c.name==='UserHealthConsentEvent'&&c.method==='create');await rejects(()=>f.cal(body));const timestamp=f.tables.UserHealthConsent[0].granted_at;f.state.time='2026-10-21T12:00:00Z';const view=await f.cal();check(view.state==='RECOVERY_REQUIRED'&&view.recovery);await f.cal({action:'resume',action_id:view.recovery.action_id,revision:view.recovery.revision});
  check(f.tables.UserHealthConsent[0].granted_at===timestamp&&f.tables.UserHealthConsentEvent.length===1&&f.tables.UserPeriodRecord.length===1&&!f.tables.UserCycleSettings.length);
 }],
 ['NA15','Consent-free request, inactive account and open deletion job cannot write health',async()=>{
  const f=nativeFixture({granted:false});await rejects(()=>add(f),'HEALTH_CONSENT_REQUIRED');check(!f.tables.UserCalendarAction.length&&!f.tables.UserPeriodRecord.length);f.tables.UserProfile[0].account_status='INACTIVE';await rejects(()=>f.cal(),'ACTIVE_ACCOUNT_REQUIRED');
  const g=nativeFixture();g.tables.HealthDataDeletionJob.push({id:'open',user_id:'ownerA',job_status:'PENDING'});await rejects(()=>add(g),'HEALTH_DELETION_PENDING');check(!g.tables.UserPeriodRecord.length);
 }],
 ['NA16','Minimum interval and approved >60 actual dates remain unchanged',async()=>{
  const f=nativeFixture();await f.change('add',{date:'2026-07-01'});await rejects(()=>f.change('add',{date:'2026-07-14'}));await f.change('add',{date:'2026-10-01'});const view=await f.cal();check(f.tables.UserPeriodRecord[0].period_start_date==='2026-07-01'&&view.calculationNotice==='CYCLE_ESTIMATE_UNAVAILABLE');
 }],
 ['NA18','Existing legacy receipt: normal profile write then progress failure can retry without changing intended input',async()=>{
  const f=nativeFixture();seedLegacyReset(f);const body={action:'saveProfile',display_name:'Ada Updated',birth_date:'1990-01-01',birth_time:null,birthplace_geonames_id:null};
  f.once('before',c=>c.name==='AdminTestOperation'&&c.method==='update'&&c.args[1].stage==='CYCLE');await rejects(()=>onboardingOperation(f.client(),body));check(f.tables.UserProfile[0].display_name==='Ada Updated'&&f.tables.AdminTestOperation[0].stage==='PROFILE');await onboardingOperation(f.client(),body);check(f.tables.AdminTestOperation[0].stage==='CYCLE');
 }],
 ['NA19','Existing legacy receipt: Skip creates no health data and final step reuses same-day assignment',async()=>{
  const f=nativeFixture();const first=await f.today();seedLegacyReset(f);f.tables.AdminTestOperation[0].stage='CYCLE';const count=f.tables.UserHealthConsentEvent.length;await onboardingOperation(f.client(),{action:'skipCycle'});const last=await f.today();check(last.daily.id===first.daily.id&&f.tables.AdminTestOperation[0].status==='COMPLETED'&&f.tables.UserHealthConsentEvent.length===count);
 }],
 ['NA20','Native target deletion needs no operator maintenance and leaves other users writable',async()=>{
  const f=nativeFixture();check((await f.preview('DELETE_USER')).enabled);check((await f.preview()).enabled);
  await f.execute(await f.preview('DELETE_USER'));
  check((await f.client('ownerB').auth.me()).id==='ownerB');
  await f.client('adminA').asServiceRole.entities.UserPreferences.create({user_id:'ownerB',language_code:'tr'});
  await rejects(()=>f.client('adminA').asServiceRole.entities.UserPreferences.create({user_id:'ownerA',language_code:'tr'}),'ACCOUNT_DELETION_IN_PROGRESS');
 }],
 ['NA21','Deletion staged failure resumes with fresh client and retains consent/audit evidence',async()=>{
  const f=nativeFixture();await add(f);const grant=JSON.stringify(f.tables.UserHealthConsent);f.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='delete');await rejects(()=>f.preview('DELETE_USER').then(f.execute));check(f.tables.AdminTestOperation[0].status==='RETRY_REQUIRED');const result=await f.complete(await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id}));check(result.job.status==='COMPLETED'&&!f.tables.User.some(r=>r.id==='ownerA')&&!f.tables.UserCalendarAction.length&&JSON.stringify(f.tables.UserHealthConsent)===grant);await rejects(()=>f.today(),'AUTH_REQUIRED');
 }],
 ['NA22','Post-write identity re-check rejects sign-out after SDK create; the persisted daily row remains',async()=>{
  const f=nativeFixture();f.state.after=async c=>{if(c.name==='UserDailyMessage'&&c.method==='create')f.state.signedOut=true;};await rejects(f.today);check(f.tables.UserDailyMessage.length===1);
 }],
 ['NA23','Fresh admin role revocation stops destructive stages',async()=>{
  const f=nativeFixture();const view=await f.preview('DELETE_USER');f.state.after=async c=>{if(c.name==='AdminTestOperation'&&c.method==='create')f.tables.User.find(row=>row.id==='adminA').role='user';};await rejects(()=>f.execute(view));check(f.tables.User.some(r=>r.id==='ownerA')&&f.tables.UserProfile.length===1);
 }],
 ['NA24','Native regrant never skips withdrawal cleanup proof',async()=>{
  const f=nativeFixture();Object.assign(f.tables.UserHealthConsent[0],{consent_status:'WITHDRAWN',withdrawn_at:'2026-10-20T11:00:00Z',granted_at:'2026-10-01T12:00:00Z',consent_version:HEALTH_CONSENT_VERSION});await rejects(()=>f.change('add',{date:'2026-10-01',health_consent:true}),'HEALTH_DELETION_UNCONFIRMED');check(!f.tables.UserPeriodRecord.length);
 }],
 ['NA25','Late residual write before final deletion verification cannot be success',async()=>{
  const f=nativeFixture();const view=await f.preview('DELETE_USER');f.state.after=async c=>{if(c.name==='User'&&c.method==='delete'){f.state.after=null;f.tables.UserPeriodRecord.push({id:'late',user_id:'ownerA',period_start_date:'2026-10-01'});}};
  const start=await f.tools({action:'execute',target_id:'ownerA',operation:'DELETE_USER',confirmation:true,preview_token:view.preview_token,request_id:crypto.randomUUID()});
  const partial=await f.tools({action:'resume',target_id:'ownerA',operation_id:start.job.operation_id});check(partial.result_state==='PARTIAL'&&'progress' in partial&&partial.progress.reason==='RESIDUAL_RECHECK_REQUIRED'&&f.tables.UserPeriodRecord.length===1,'residual concealed');check((await f.complete(await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id}))).job.status==='COMPLETED');
 }],
 ['NA26','Final VERIFY reruns after audit failure even with a persisted checkpoint',async()=>{
  const f=nativeFixture();f.once('before',c=>c.name==='AdminAuditLog'&&c.method==='create'&&c.args[0].action_status==='SUCCESS'&&c.args[0].error_code==='TEST_OPERATION_COMPLETED');await rejects(()=>f.preview('DELETE_USER').then(f.execute));check(f.tables.AdminTestOperation[0].checkpoints.includes('VERIFY'));
  f.tables.UserPeriodRecord.push({id:'residual',user_id:'ownerA',period_start_date:'2026-10-01'});check((await f.complete(await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id}))).job.status==='COMPLETED');check(f.tables.AdminTestOperation[0].status==='COMPLETED'&&!f.tables.UserPeriodRecord.length);
 }],
 ['NA27','Reset pending step rejects changed input without replacing first saved input',async()=>{
  const f=nativeFixture();seedLegacyReset(f);const body={action:'saveProfile',birth_date:'1990-01-01',display_name:'First',birth_time:null,birthplace_geonames_id:null};f.once('before',c=>c.name==='AdminTestOperation'&&c.method==='update'&&c.args[1].stage==='CYCLE');await rejects(()=>onboardingOperation(f.client(),body));await rejects(()=>onboardingOperation(f.client(),{...body,display_name:'Second'}),'TEST_RESET_STEP_CONFLICT');check(f.tables.UserProfile[0].display_name==='First');
 }],
 ['NA28','New competing intent during resume is retained and blocks success without bulk clear',async()=>{
  const f=nativeFixture(),body=await request(f,'add',{date:'2026-10-01'});f.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');await rejects(()=>f.cal(body));
  const view=await f.cal(),saved=f.tables.UserCalendarAction[0];
  f.tables.UserCalendarAction.push({...saved,id:'late-intent',action_id:crypto.randomUUID(),fingerprint:'other-intent',desired_date:'2026-09-01'});
  await rejects(()=>f.cal({action:'resume',revision:view.recovery.revision,action_id:view.recovery.action_id}),'CALENDAR_ACTION_CONFLICT');
  check(!f.tables.UserPeriodRecord.length&&f.tables.UserCalendarAction.length===2&&f.tables.UserCalendarAction.every(r=>r.status==='PENDING'));
 }],
 ['NA29','Calendar owner fields and unsupported affected-count results fail closed',async()=>{
  const f=nativeFixture();await rejects(()=>f.cal({action:'read',user_id:'ownerB'}),'FORGED_OWNER');await add(f);const body=await request(f,'edit',{period_id:f.tables.UserPeriodRecord[0].id,date:'2026-10-02'});f.state.before=async c=>{if(c.name==='UserPeriodRecord'&&c.method==='updateMany'){f.state.before=null;f.tables.UserPeriodRecord[0].period_start_date='2026-10-03';}};await rejects(()=>f.cal(body),'CALENDAR_WRITE_UNCONFIRMED');check(f.tables.UserPeriodRecord[0].period_start_date==='2026-10-03');
 }],
 ['NA30','Initial grant period failure resumes after process restart with no extra event',async()=>{
  const f=nativeFixture({granted:false}), body=await request(f,'add',{date:'2026-10-01',health_consent:true});f.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');await rejects(()=>f.cal(body));const time=f.tables.UserHealthConsent[0].granted_at;await f.cal(body);check(f.tables.UserHealthConsent.length===1&&f.tables.UserHealthConsentEvent.length===1&&f.tables.UserPeriodRecord.length===1&&f.tables.UserHealthConsent[0].granted_at===time);
 }],
 ['NA34A','Stabilization 034: admin A deletes B; A record/role intact, B removed, no other user touched, result verified',async()=>{
  const f=nativeFixture();const others=JSON.stringify(f.tables.User.filter(u=>u.id!=='ownerA'));let result=await f.execute(await f.preview('DELETE_USER'));const id=result.job?.operation_id;
  for(let pass=0;result.result_state==='PARTIAL'&&pass<20;pass++)result=await f.tools({action:'resume',target_id:'ownerA',operation_id:id});
  check(result.result_state==='COMPLETED',`state ${result.result_state}`);check(!f.tables.User.some(u=>u.id==='ownerA'));check(JSON.stringify(f.tables.User)===others,'actor/other users unchanged');
  check(f.tables.AdminTestOperation.length===1&&f.tables.AdminTestOperation[0].operation_id===id,'single operation id');
 }],
 ['NA34B','Stabilization 034: admin role removed mid-deletion stops every later write; no COMPLETED shown',async()=>{
  const f=nativeFixture();const view=await f.preview('DELETE_USER');let writesAfter=0,demoted=false;
  f.state.after=async c=>{if(demoted&&['create','update','delete','deleteMany','updateMany'].includes(c.method)&&c.name!=='AdminAuditLog')writesAfter++;if(!demoted&&c.name==='UserProfile'&&['delete','deleteMany'].includes(c.method)){demoted=true;f.tables.User.find(u=>u.id==='adminA').role='user';}};
  let outcome=null;try{outcome=await f.execute(view);}catch(e){outcome={error:e.code};}
  check(demoted,'demotion triggered');check(outcome.result_state!=='COMPLETED','no success');check(writesAfter===0,`writes after demotion ${writesAfter}`);
  check(f.tables.User.some(u=>u.id==='adminA'&&u.role==='user')&&f.tables.User.some(u=>u.id==='ownerB'),'others intact');
 }],
 ['NA34C','Stabilization 034: late resume for another target/operation id cannot affect a different user',async()=>{
  const f=nativeFixture();const r=await f.execute(await f.preview('DELETE_USER'));const before=JSON.stringify(f.tables.User.filter(u=>u.id!=='ownerA'));
  let threw=false;try{await f.tools({action:'resume',target_id:'ownerB',operation_id:r.job?.operation_id});}catch{threw=true;}
  check(threw,'cross-target resume rejected');check(JSON.stringify(f.tables.User.filter(u=>u.id!=='ownerA'))===before,'other users untouched');
  const start=f.state.calls.length;
  await rejects(()=>f.tools({action:'resume',target_id:'ownerA',operation_id:crypto.randomUUID()}),'TEST_OPERATION_NOT_FOUND');
  check(f.state.calls.slice(start).every(c=>c.method==='filter'),'wrong operation wrote data');
 }],

];
