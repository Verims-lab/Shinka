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
 ['NA02','Immutable daily record reused after locale/profile/catalog changes',async()=>{
  const f=nativeFixture(), first=await f.today(); f.tables.UserProfile[0].birth_date='1991-02-01'; f.tables.MessagePair[0].message_tr='changed catalog';
  const second=await f.today(); check(JSON.stringify(first.daily)===JSON.stringify(second.daily)&&f.tables.UserDailyMessage.length===1);
 }],
 ['NA03','Independent ordinary clients can create duplicates; deterministic winner retains both',async()=>{
  const f=nativeFixture(), wait=barrier(2); f.state.before=async c=>{if(c.name==='UserDailyMessage'&&c.method==='create')await wait();};
  const outcomes=await Promise.all([f.today(),f.today()]); check(f.tables.UserDailyMessage.length===2); check(outcomes[0].daily.id===outcomes[1].daily.id); check(!f.state.calls.some(c=>c.method==='upsert'));
 }],
 ['NA04','Conflicting daily candidates and late visibility preserve all snapshots',async()=>{
  const f=nativeFixture(), a=(await f.today()).daily, b={...a,id:'earlier',generated_at:'2026-10-20T10:00:00Z',message_tr_snapshot:'Other captured content'};
  f.tables.UserDailyMessage.push(b); const value=await f.today(); check(value.daily.id==='earlier'&&value.notice==='DAILY_DUPLICATE_RECONCILED'); check(f.tables.UserDailyMessage[0].message_tr_snapshot===a.message_tr_snapshot);
  check(reconcileDailyRows([b,a],'ownerA',a.shinka_date).record.id===reconcileDailyRows([a,b],'ownerA',a.shinka_date).record.id);
 }],
 ['NA05','Lost daily create response recovered by reconstructed client with no extra write',async()=>{
  const f=nativeFixture(); f.once('after',c=>c.name==='UserDailyMessage'&&c.method==='create'); await rejects(f.today); const value=await f.today(); check(value.persisted&&!value.created&&f.tables.UserDailyMessage.length===1);
 }],
 ['NA06','Every daily candidate counts toward the 40-day repeat exclusion',async()=>{
  const f=nativeFixture(), a=await f.today(); f.state.time='2026-10-21T12:00:00Z'; const b=await f.today(); check(a.daily.message_pair_id!==b.daily.message_pair_id);
 }],
 ['NA07','Daily active/owner/withdrawal and write pause gates remain enforced',async()=>{
  const f=nativeFixture(); f.tables.UserProfile[0].account_status='INACTIVE'; await rejects(f.today,'ACTIVE_ACCOUNT_REQUIRED'); f.tables.UserProfile[0].account_status='ACTIVE'; f.state.paused=true; await rejects(f.today,'MAINTENANCE_WRITE_PAUSED'); check(!f.tables.UserDailyMessage.length);
 }],
 ['NA08','Calendar actual add/edit/delete; same ID; no derived writes or duration defaults',async()=>{
  const f=nativeFixture(); await add(f); const id=f.tables.UserPeriodRecord[0].id; await f.change('edit',{period_id:id,date:'2026-10-02'}); check(f.tables.UserPeriodRecord[0].id===id); await f.change('delete',{period_id:id}); check(!f.tables.UserPeriodRecord.length&&!f.tables.UserCyclePrediction.length&&!f.tables.UserCyclePhaseDay.length&&!f.tables.UserCycleSettings.length);
 }],
 ['NA09','Calendar stale revision and changed action fingerprint do not silently overwrite',async()=>{
  const f=nativeFixture(), body=await request(f,'add',{date:'2026-10-01'}); await f.cal(body); await rejects(()=>f.cal({...body,date:'2026-10-02'}),'ACTION_CONFLICT'); await rejects(()=>f.cal({...body,action_id:crypto.randomUUID(),date:'2026-09-01'}),'CALENDAR_STATE_CHANGED'); check(f.tables.UserPeriodRecord.length===1);
 }],
 ['NA10','Lost period create response resumes same intent after reload/new request ID',async()=>{
  const f=nativeFixture(), body=await request(f,'add',{date:'2026-10-01'}); f.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='create'); await rejects(()=>f.cal(body)); check((await f.cal()).pendingReview); await f.cal({...body,action_id:crypto.randomUUID()}); check(f.tables.UserPeriodRecord.length===1&&f.tables.UserCalendarAction.length===1&&f.tables.UserCalendarAction[0].status==='APPLIED');
 }],
 ['NA11','Lost edit/delete acknowledgements recover without repeating actual mutation',async()=>{
  for(const action of ['edit','delete']){const f=nativeFixture();await add(f);const body=await request(f,action,{period_id:f.tables.UserPeriodRecord[0].id,...(action==='edit'?{date:'2026-10-02'}:{})});f.once('after',c=>c.name==='UserPeriodRecord'&&c.method===(action==='edit'?'updateMany':'deleteMany'));await rejects(()=>f.cal(body));await f.cal(body);check(f.tables.UserPeriodRecord.length===(action==='edit'?1:0));}
 }],
 ['NA12','Two simultaneous distinct date intents conflict visibly and retain intent records',async()=>{
  const f=nativeFixture(), a=await request(f,'add',{date:'2026-10-01'}),wait=barrier(2);f.state.after=async c=>{if(c.name==='UserCalendarAction'&&c.method==='create')await wait();};
  const values=await Promise.allSettled([f.cal(a),f.cal({...a,action_id:crypto.randomUUID(),date:'2026-09-01'})]);check(values.every(r=>r.status==='rejected'));check(f.tables.UserCalendarAction.length===2&&!f.tables.UserPeriodRecord.length); f.state.after=null;const view=await f.cal();check(view.pendingReview&&view.predictedDays.length===0);await f.cal({action:'acknowledge',action_id:crypto.randomUUID(),revision:view.revision});check(!(await f.cal()).pendingReview);
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
 ['NA17','Reset preparation changes only durable onboarding progress, preserves identity/role/history',async()=>{
  const f=nativeFixture();await add(f);await f.today();const before=JSON.stringify({p:f.tables.UserProfile,c:f.tables.UserHealthConsent,e:f.tables.UserHealthConsentEvent,h:f.tables.UserPeriodRecord,d:f.tables.UserDailyMessage,u:f.tables.User});const result=await f.execute(await f.preview());check(result.job.status==='RESET_ACTIVE');check(before===JSON.stringify({p:f.tables.UserProfile,c:f.tables.UserHealthConsent,e:f.tables.UserHealthConsentEvent,h:f.tables.UserPeriodRecord,d:f.tables.UserDailyMessage,u:f.tables.User}));
 }],
 ['NA18','Reset normal profile write then progress failure can retry without changing intended input',async()=>{
  const f=nativeFixture();await f.execute(await f.preview());const body={action:'saveProfile',display_name:'Ada Updated',birth_date:'1990-01-01',birth_time:null,birthplace_geonames_id:null};
  f.once('before',c=>c.name==='AdminTestOperation'&&c.method==='update'&&c.args[1].stage==='CYCLE');await rejects(()=>onboardingOperation(f.client(),body));check(f.tables.UserProfile[0].display_name==='Ada Updated'&&f.tables.AdminTestOperation[0].stage==='PROFILE');await onboardingOperation(f.client(),body);check(f.tables.AdminTestOperation[0].stage==='CYCLE');
 }],
 ['NA19','Reset Skip creates no health data and final step reuses same-day snapshot',async()=>{
  const f=nativeFixture();const first=await f.today();await f.execute(await f.preview());f.tables.AdminTestOperation[0].stage='CYCLE';const count=f.tables.UserHealthConsentEvent.length;await onboardingOperation(f.client(),{action:'skipCycle'});const last=await f.today();check(last.daily.id===first.daily.id&&f.tables.AdminTestOperation[0].status==='COMPLETED'&&f.tables.UserHealthConsentEvent.length===count);
 }],
 ['NA20','Native target deletion needs no operator maintenance and leaves other users writable',async()=>{
  const f=nativeFixture();check((await f.preview('DELETE_USER')).enabled);check((await f.preview()).enabled);
  await f.execute(await f.preview('DELETE_USER'));
  check((await f.client('ownerB').auth.me()).id==='ownerB');
  await f.client('adminA').asServiceRole.entities.UserPreferences.create({user_id:'ownerB',language_code:'tr'});
  await rejects(()=>f.client('adminA').asServiceRole.entities.UserPreferences.create({user_id:'ownerA',language_code:'tr'}),'ACCOUNT_DELETION_IN_PROGRESS');
 }],
 ['NA21','Deletion staged failure resumes with fresh client and retains consent/audit evidence',async()=>{
  const f=nativeFixture();await add(f);const grant=JSON.stringify(f.tables.UserHealthConsent);f.state.paused=true;f.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='delete');await rejects(()=>f.preview('DELETE_USER').then(f.execute));check(f.tables.AdminTestOperation[0].status==='RETRY_REQUIRED');const result=await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id});check(result.job.status==='COMPLETED'&&!f.tables.User.some(r=>r.id==='ownerA')&&!f.tables.UserCalendarAction.length&&JSON.stringify(f.tables.UserHealthConsent)===grant);await rejects(()=>f.today(),'AUTH_REQUIRED');
 }],
 ['NA22','Write pause catches an already-started SDK write after return; no invented rollback',async()=>{
  const f=nativeFixture();f.state.after=async c=>{if(c.name==='UserDailyMessage'&&c.method==='create')f.state.paused=true;};await rejects(f.today,'MAINTENANCE_WRITE_PAUSED');check(f.tables.UserDailyMessage.length===1);
 }],
 ['NA23','Fresh admin role revocation stops destructive stages',async()=>{
  const f=nativeFixture();f.state.paused=true;const view=await f.preview('DELETE_USER');f.state.after=async c=>{if(c.name==='AdminTestOperation'&&c.method==='create')f.tables.User.find(row=>row.id==='adminA').role='user';};await rejects(()=>f.execute(view));check(f.tables.User.some(r=>r.id==='ownerA')&&f.tables.UserProfile.length===1);
 }],
 ['NA24','Native regrant never skips withdrawal cleanup proof',async()=>{
  const f=nativeFixture();Object.assign(f.tables.UserHealthConsent[0],{consent_status:'WITHDRAWN',withdrawn_at:'2026-10-20T11:00:00Z',granted_at:'2026-10-01T12:00:00Z',consent_version:HEALTH_CONSENT_VERSION});await rejects(()=>f.change('add',{date:'2026-10-01',health_consent:true}),'HEALTH_DELETION_UNCONFIRMED');check(!f.tables.UserPeriodRecord.length);
 }],
 ['NA25','Late residual write before final deletion verification cannot be success',async()=>{
  const f=nativeFixture();f.state.paused=true;const view=await f.preview('DELETE_USER');f.state.after=async c=>{if(c.name==='User'&&c.method==='delete'){f.state.after=null;f.tables.UserPeriodRecord.push({id:'late',user_id:'ownerA',period_start_date:'2026-10-01'});}};
  await rejects(()=>f.execute(view),'TEST_JOB_RETRY_REQUIRED');check(f.tables.AdminTestOperation[0].status==='RETRY_REQUIRED');check((await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id})).job.status==='COMPLETED');
 }],
 ['NA26','Final VERIFY reruns after audit failure even with a persisted checkpoint',async()=>{
  const f=nativeFixture();f.state.paused=true;f.once('before',c=>c.name==='AdminAuditLog'&&c.method==='create'&&c.args[0].action_status==='SUCCESS'&&c.args[0].error_code==='TEST_OPERATION_COMPLETED');await rejects(()=>f.preview('DELETE_USER').then(f.execute));check(f.tables.AdminTestOperation[0].checkpoints.includes('VERIFY'));
  f.tables.UserPeriodRecord.push({id:'residual',user_id:'ownerA',period_start_date:'2026-10-01'});check((await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id})).job.status==='COMPLETED');check(f.tables.AdminTestOperation[0].status==='COMPLETED'&&!f.tables.UserPeriodRecord.length);
 }],
 ['NA27','Reset pending step rejects changed input without replacing first saved input',async()=>{
  const f=nativeFixture();await f.execute(await f.preview());const body={action:'saveProfile',birth_date:'1990-01-01',display_name:'First',birth_time:null,birthplace_geonames_id:null};f.once('before',c=>c.name==='AdminTestOperation'&&c.method==='update'&&c.args[1].stage==='CYCLE');await rejects(()=>onboardingOperation(f.client(),body));await rejects(()=>onboardingOperation(f.client(),{...body,display_name:'Second'}),'TEST_RESET_STEP_CONFLICT');check(f.tables.UserProfile[0].display_name==='First');
 }],
 ['NA28','Calendar reconciliation cannot silently clear newly arriving pending intent',async()=>{
  const f=nativeFixture(), body=await request(f,'add',{date:'2026-10-01'});f.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');await rejects(()=>f.cal(body));const view=await f.cal();f.state.after=async c=>{if(c.name==='UserCalendarAction'&&c.method==='update'){f.state.after=null;f.tables.UserCalendarAction.push({...f.tables.UserCalendarAction[0],id:'late-intent',action_id:crypto.randomUUID(),status:'PENDING'});}};
  await rejects(()=>f.cal({action:'acknowledge',revision:view.revision,action_id:crypto.randomUUID()}),'CALENDAR_ACTION_CONFLICT');check(!f.tables.UserPeriodRecord.length);
 }],
 ['NA29','Calendar owner fields and unsupported affected-count results fail closed',async()=>{
  const f=nativeFixture();await rejects(()=>f.cal({action:'read',user_id:'ownerB'}),'FORGED_OWNER');await add(f);const body=await request(f,'edit',{period_id:f.tables.UserPeriodRecord[0].id,date:'2026-10-02'});f.state.before=async c=>{if(c.name==='UserPeriodRecord'&&c.method==='updateMany'){f.state.before=null;f.tables.UserPeriodRecord[0].period_start_date='2026-10-03';}};await rejects(()=>f.cal(body),'CALENDAR_WRITE_UNCONFIRMED');check(f.tables.UserPeriodRecord[0].period_start_date==='2026-10-03');
 }],
 ['NA30','Initial grant period failure resumes after process restart with no extra event',async()=>{
  const f=nativeFixture({granted:false}), body=await request(f,'add',{date:'2026-10-01',health_consent:true});f.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');await rejects(()=>f.cal(body));const time=f.tables.UserHealthConsent[0].granted_at;await f.cal(body);check(f.tables.UserHealthConsent.length===1&&f.tables.UserHealthConsentEvent.length===1&&f.tables.UserPeriodRecord.length===1&&f.tables.UserHealthConsent[0].granted_at===time);
 }],

];
