import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';
import { privacyFixture, privacyIntent } from './privacyFixture';
import { check, rejects } from './dataModelTests';
import { notificationFixture } from './notificationFixture';
import { barrier } from './nativeFixture';
import { notificationWindow, NOTIFICATION_COPY } from '../../../base44/shared/notificationPolicy.js';
import { notificationOwner } from '../../../base44/shared/notificationOwner.js';
import { notificationTick, handleNotificationSchedule } from '../../../base44/shared/notificationScheduler.js';
import { base44PushProvider } from '../../../base44/shared/base44PushProvider.js';
import { ACCOUNT_CLEANUP } from '../../../base44/shared/privacyPolicy.js';
const writes = f => f.state.calls.filter(call => call.method !== 'filter');
/** @type {import('./testTypes').FoundationTest[]} */
export const NOTIFICATION_TESTS = [
 ['NT01','Actual local 06:00 and noon boundary; fractional zones and UTC day rollover',()=>{
  for(const [zone,instant,target] of [
   ['Europe/Istanbul','2026-10-20T03:00:00Z','2026-10-20T03:00:00.000Z'],
   ['Asia/Kathmandu','2026-10-20T00:15:00Z','2026-10-20T00:15:00.000Z'],
   ['Pacific/Chatham','2026-10-19T16:15:00Z','2026-10-19T16:15:00.000Z'],
   ['Pacific/Kiritimati','2026-10-19T16:00:00Z','2026-10-19T16:00:00.000Z']]) {
   const result=notificationWindow(new Date(instant),zone);check(result.due&&result.day==='2026-10-20'&&result.scheduledAt===target);
   check(!notificationWindow(new Date(Date.parse(instant)-1),zone).due);
   check(!notificationWindow(new Date(Date.parse(instant)+6*3600000),zone).due);
  }
 }],
 ['NT02','DST spring/fall and 30-minute transition use actual local target offset',()=>{
  for(const [instant,zone,target] of [
   ['2026-03-08T10:00:00Z','America/New_York','2026-03-08T10:00:00.000Z'],
   ['2026-11-01T11:00:00Z','America/New_York','2026-11-01T11:00:00.000Z'],
   ['2026-10-03T19:00:00Z','Australia/Lord_Howe','2026-10-03T19:00:00.000Z']])check(notificationWindow(new Date(instant),zone).scheduledAt===target);
 }],
 ['NT03','Scheduler creates missing today even with preference off; Home reuses immutable snapshot',async()=>{
  const f=notificationFixture({current:false});f.tables.UserPreferences[0].notifications_enabled=false;
  const old=JSON.stringify(f.tables.UserDailyMessage[0]);const r=await f.tick();check(r.counts.INELIGIBLE===1&&f.sent.length===0);
  check(f.tables.UserDailyMessage.length===2&&JSON.stringify(f.tables.UserDailyMessage[0])===old);
  const snapshot=JSON.stringify(f.tables.UserDailyMessage[1]);await f.today();check(JSON.stringify(f.tables.UserDailyMessage[1])===snapshot&&f.tables.UserDailyMessage.length===2);
 }],
 ['NT04','Same operation queues then accepts once; repeated tick does not send or generate again',async()=>{
  const f=notificationFixture(),before=JSON.stringify(f.tables.UserDailyMessage);check((await f.tick()).counts.QUEUED===1);check(!f.sent.length);
  f.advance();check((await f.tick()).counts.ACCEPTED===1);const row=f.tables.NotificationDelivery[0];
  check(row.attempt_count===1&&row.delivery_status==='SENT'&&row.sent_at&&row.daily_message_id===f.daily.id);
  await f.tick();check(f.sent.length===1&&f.tables.NotificationDelivery.length===1&&before===JSON.stringify(f.tables.UserDailyMessage));
 }],
 ['NT05','Transient rejection backoff and max three attempts on same row',async()=>{
  const f=notificationFixture();f.outcomes.push(...Array.from({length:3},()=>({kind:'transient'})));await f.tick();f.advance();await f.tick();
  const id=f.tables.NotificationDelivery[0].id;check(f.tables.NotificationDelivery[0].dispatch_state==='RETRYABLE');
  await f.tick();check(f.sent.length===1);f.advance();await f.tick();check(f.sent.length===2);f.advance(14);await f.tick();check(f.sent.length===2);
  f.advance(1);await f.tick();await f.tick();check(f.sent.length===3&&f.tables.NotificationDelivery.length===1&&f.tables.NotificationDelivery[0].id===id&&f.tables.NotificationDelivery[0].dispatch_state==='PERMANENT');
 }],
 ['NT06','Permanent rejection, ambiguous timeout and malformed response never blindly retry',async()=>{
  for(const outcome of [{kind:'permanent'},new Error('private token/payload'),{}, {kind:'ineligible'}]){
   const f=notificationFixture();f.outcomes.push(outcome);await f.tick();f.advance();await f.tick();f.advance(20);await f.tick();
   check(f.sent.length===1&&f.tables.NotificationDelivery[0].attempt_count===1);
   check(!JSON.stringify(f.tables.NotificationDelivery).includes('private'));
   check(f.tables.NotificationDelivery[0].dispatch_state=== (!(outcome instanceof Error)&&outcome.kind==='permanent'?'PERMANENT':!(outcome instanceof Error)&&outcome.kind==='ineligible'?'INELIGIBLE':'UNKNOWN'));
  }
 }],
 ['NT07','Lost receipt after accepted call leaves IN_FLIGHT; new worker pass cannot resend',async()=>{
  const f=notificationFixture();await f.tick();f.advance();
  f.once('before',c=>c.name==='NotificationDelivery'&&c.method==='update'&&c.args[1].dispatch_state==='ACCEPTED');
  check((await f.tick()).counts.BLOCKED===1);check(f.tables.NotificationDelivery[0].dispatch_state==='IN_FLIGHT'&&f.sent.length===1);
  f.advance();await f.tick();check(f.sent.length===1&&f.tables.NotificationDelivery.length===1);
 }],
 ['NT08','Disabled, denied, unknown and unsupported devices never send; content remains available',async()=>{
  for(const state of ['OFF','DENIED','UNKNOWN','UNSUPPORTED']){
   const f=notificationFixture({current:false});if(state==='OFF')f.tables.UserPreferences[0].notifications_enabled=false;
   else if(state==='UNSUPPORTED')f.device.support=state;else f.device.permission=state;
   check((await f.tick()).counts.INELIGIBLE===1&&f.sent.length===0&&f.tables.UserDailyMessage.length===2&&f.tables.NotificationDelivery.length===0);
  }
 }],
 ['NT09','Late/enable/zone change stays same-day window and never mutates previous content',async()=>{
  const f=notificationFixture();f.tables.UserPreferences[0].notifications_enabled=false;await f.tick();
  f.advance(180);f.tables.UserPreferences[0].notifications_enabled=true;check((await f.tick()).counts.QUEUED===1);
  f.tables.UserPreferences[0].timezone='America/New_York';f.advance();check((await f.tick()).counts.OUTSIDE_WINDOW===1&&f.sent.length===0);
  f.tables.UserPreferences[0].timezone='Europe/Istanbul';f.advance(180);check((await f.tick()).counts.OUTSIDE_WINDOW===1&&f.sent.length===0);
  check(f.tables.UserDailyMessage.length===1&&f.tables.UserDailyMessage[0].shinka_date==='2026-10-20');
 }],
 ['NT10','Fresh disabled preference after persisted intent prevents provider call',async()=>{
  const f=notificationFixture();await f.tick();f.advance();
  f.state.after=async c=>{if(c.name==='NotificationDelivery'&&c.method==='update'&&c.args[1].dispatch_state==='IN_FLIGHT'){f.state.after=null;f.tables.UserPreferences[0].notifications_enabled=false;}};
  await f.tick();check(f.sent.length===0&&f.tables.NotificationDelivery[0].dispatch_state==='INELIGIBLE');
 }],
 ['NT11','Deletion or native account removal immediately before send denies dispatch and recreates no owner data',async()=>{
  for(const deleted of [true,false]){
   const f=notificationFixture();await f.tick();f.advance();
   f.state.after=async c=>{if(c.name==='NotificationDelivery'&&c.method==='update'&&c.args[1].dispatch_state==='IN_FLIGHT'){
    f.state.after=null;if(deleted)f.tables.User=f.tables.User.filter(u=>u.id!=='ownerA');else f.tables.UserProfile[0].account_status='INACTIVE';
   }};
   await f.tick();check(f.sent.length===0);
  }
  check(ACCOUNT_CLEANUP.includes('NotificationDelivery')&&!ACCOUNT_CLEANUP.includes('NotificationSchedule'));
 }],
 ['NT12','Scheduler/Home concurrent native candidates reconcile with no push-driven regeneration',async()=>{
  const f=notificationFixture({current:false}),wait=barrier(2);let arrivals=0;
  f.state.before=async c=>{if(c.name==='UserDailyMessage'&&c.method==='create'&&++arrivals<=2)await wait();};
  await Promise.all([f.tick(),f.today()]);f.state.before=null;
  const existing=await f.today(),before=JSON.stringify(f.tables.UserDailyMessage);f.advance();await f.tick();await f.tick();
  check((await f.today()).daily.id===existing.daily.id&&JSON.stringify(f.tables.UserDailyMessage)===before&&f.sent.length<=1);
  check(f.tables.NotificationDelivery.length===1);
 }],
 ['NT13','Worker coalescing and competing visible delivery candidates admit only canonical row',async()=>{
  const f=notificationFixture();await Promise.all([f.send(),f.send()]);check(f.tables.NotificationDelivery.length===1);
  f.tables.NotificationDelivery.push({...f.tables.NotificationDelivery[0],id:'zz-competing'});f.advance();await Promise.all([f.send(),f.send()]);
  check(f.sent.length===1&&f.tables.NotificationDelivery.find(r=>r.id==='zz-competing').attempt_count===0);
 }],
 ['NT14','Shared admin handler denies unauthenticated and body authority/target/copy manipulation before writes',async()=>{
  const f=notificationFixture(),call=(body,authorized=true,enabled=true)=>handleNotificationSchedule(new Request('https://fixture.invalid/schedule',{method:'POST',body:JSON.stringify(body)}),{createClient:()=>f.raw(authorized?'adminA':null),enabled,createProvider:()=>f.provider,...f.options});
  check((await call({action:'tick',system:true},false)).status===401&&writes(f).length===0);
  for(const field of ['system','admin','user_id','title','message','url','cursor'])check((await call({action:'tick',[field]:'forged'})).status===400);
  check(writes(f).length===0);const disabled=await(await call({action:'tick'},true,false)).json();check(disabled.state==='DISABLED'&&writes(f).length===0);
  check((await call({action:'tick'})).status===200&&f.tables.NotificationDelivery.length===1);
 }],
 ['NT15','Owner-scoped engine refuses forged writes and unfinished/reset/privacy accounts',async()=>{
  const f=notificationFixture(),owner=notificationOwner(f.raw(),'ownerA',f.now);
  await rejects(()=>owner.client.asServiceRole.entities.UserProfile.update('profile',{account_status:'ACTIVE'}),'NOTIFICATION_WRITE_FORBIDDEN');
  await rejects(()=>owner.client.asServiceRole.entities.NotificationDelivery.create({user_id:'ownerB'}),'FORGED_OWNER');
  check(writes(f).length===0);
  f.tables.AdminTestOperation.push({id:'reset',target_id:'ownerA',operation:'RESET_ONBOARDING',status:'RESET_ACTIVE'});
  check((await f.tick()).counts.INELIGIBLE===1&&f.sent.length===0);
 }],
 ['NT16','Bounded page checkpoints continue beyond first 25 without historical fanout',async()=>{
  const f=notificationFixture();f.tables.UserPreferences=Array.from({length:28},(_,i)=>({...f.tables.UserPreferences[0],id:`p-${String(i).padStart(3,'0')}`,user_id:`absent-${i}`}));
  const first=await f.tick();check(first.processed===25&&!first.cycleComplete&&f.tables.NotificationSchedule[0].cursor==='p-024',`first cursor=${f.tables.NotificationSchedule[0].cursor} processed=${first.processed}`);
  const second=await f.tick();check(second.processed===3&&second.cycleComplete&&f.tables.NotificationSchedule[0].cursor==='',`second cursor=${f.tables.NotificationSchedule[0].cursor} processed=${second.processed}`);
  check(f.sent.length===0&&!f.state.calls.some(c=>c.name==='UserDailyMessage'),'unexpected daily IO');
 }],
 ['NT17','Unknown eligibility and reported provider call never infer acceptance',async()=>{
  let calls=0;const provider=base44PushProvider({asServiceRole:{integrations:{Core:{SendPushNotification:async()=>{calls++;}}}}});
  check((await provider.eligibility('ownerA')).permission==='UNKNOWN');check((await provider.send({owner:'ownerA',language:'tr'})).kind==='unknown');check(calls===1);
  check(NOTIFICATION_COPY.tr.message==='Günlük Shinka içeriğin hazır'&&NOTIFICATION_COPY.en.message==='Your daily Shinka is ready');
 }],
 ['NT19','Owner erasure removes pending/in-flight/unknown notifications; global cursor cannot recreate identity',async()=>{
  const f=privacyFixture();
  for(const [i,state] of ['READY','IN_FLIGHT','UNKNOWN'].entries())f.tables.NotificationDelivery.push({id:`n-${i}`,user_id:'ownerA',dispatch_state:state,delivery_status:'FAILED'});
  f.tables.NotificationSchedule.push({id:'cursor',schedule_key:'DAILY_SHINKA',cursor:'preferences',last_tick_at:f.now().toISOString()});
  await f.request('begin',privacyIntent('DELETE_ACCOUNT'));
  check(!f.tables.NotificationDelivery.length&&f.tables.NotificationSchedule.length===1);
  await rejects(()=>notificationOwner(f.raw(),'ownerA',f.now).admit(),'AUTH_REQUIRED');
 }],
 ['NT20','Home saves current valid IANA automatically without changing the current daily snapshot',async()=>{
  const f=notificationFixture(),before=JSON.stringify(f.tables.UserDailyMessage);
  const result=await dailyMessageOperation(f.client(),{action:'today',timezone:'Asia/Kathmandu'},{native:true,now:f.now,library:f.library});
  check(result.daily.id===f.daily.id&&f.tables.UserPreferences[0].timezone==='Asia/Kathmandu'&&JSON.stringify(f.tables.UserDailyMessage)===before);
  await dailyMessageOperation(f.client(),{action:'today',timezone:'Bad/Zone'},{native:true,now:f.now,library:f.library});
  check(f.tables.UserPreferences[0].timezone==='Asia/Kathmandu');
 }],
 ['NT21','Corrupt checkpoint/delivery and elapsed page budget fail closed without provider calls',async()=>{
  const f=notificationFixture();await f.tick();f.advance();f.tables.NotificationDelivery[0].attempt_count=-1;
  check((await f.tick()).counts.BLOCKED===1&&f.sent.length===0);
  f.tables.NotificationSchedule.push({...f.tables.NotificationSchedule[0],id:'duplicate'});
  await rejects(()=>f.tick(),'NOTIFICATION_CHECKPOINT_CONFLICT');check(f.sent.length===0);
  const g=notificationFixture();let clock=0;
  const result=await notificationTick(g.raw(),{...g.options,elapsed:()=>clock++*20000});
  check(result.processed===0&&!result.cycleComplete&&g.tables.NotificationDelivery.length===0);
  check(!g.state.calls.some(c=>c.name==='UserDailyMessage'));
 }],
 ['NT22','Expired retry is not sent after noon; caller cannot select a historic day',async()=>{
  const f=notificationFixture();f.outcomes.push({kind:'transient'});await f.tick();f.advance();await f.tick();
  const before=JSON.stringify(f.tables.UserDailyMessage);f.advance(360);check((await f.tick()).counts.OUTSIDE_WINDOW===1&&f.sent.length===1);
  for(const key of ['shinka_date','date','daily_message_id'])await rejects(()=>dailyMessageOperation(f.client(),{action:'today',timezone:'Europe/Istanbul',[key]:'2020-01-01'},{native:true,now:f.now,library:f.library}),'INVALID_REQUEST');
  check(JSON.stringify(f.tables.UserDailyMessage)===before);
 }],
 ['NT23','Measure ordinary SDK request counts for existing/new daily, dispatch and Home reuse',async()=>{
  const measured={};
  for(const current of [true,false]){
   const f=notificationFixture({current});
   for(const step of ['queue','accept','settled','home']){
    const start=f.state.calls.length;if(step==='home')await f.today();else await f.tick();
    const calls=f.state.calls.slice(start);measured[`${current?'existing':'new'}-${step}`]={reads:calls.filter(c=>c.method==='filter').length,writes:calls.filter(c=>c.method!=='filter').length};f.advance();
   }
   check(f.sent.length===1&&f.tables.NotificationDelivery.length===1);
  }
  return {evidence:{scope:'SYNTHETIC_ORDINARY_SDK_COUNTS_NOT_LATENCY_OR_CREDITS',measured}};
 }],
 ['NT18' ,'Withdrawn health consent causes no health-data reads while scheduler produces content',async()=>{
  const f=notificationFixture({current:false});await f.tick();check(f.tables.UserDailyMessage.length===2);
  check(!f.state.calls.some(c=>['UserPeriodRecord','UserCycleSettings','UserCyclePhaseDay','UserCyclePrediction'].includes(c.name)));
 }],
];
