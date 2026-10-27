import { check, rejects } from './dataModelTests';
import { notificationFixture } from './notificationFixture';
import { requireAdmin } from '../../../base44/shared/internalAuthorization.js';
import { handleNotificationSchedule } from '../../../base44/shared/notificationScheduler.js';
import { base44PushProvider } from '../../../base44/shared/base44PushProvider.js';

// NM IDs retained: 033 machine assumptions superseded by 042 written Support.
// These are native-admin fixtures, never proof of a real Workflow invocation.
const request = body => new Request('https://fixture.invalid/schedule',{method:'POST',body:JSON.stringify(body)});
const writes = f => f.state.calls.filter(c=>c.method!=='filter');
const call = (f, {enabled=true,body=/** @type {Record<string,unknown>} */({action:'tick'}),req=request(body),createClient=()=>f.raw('adminA'),createProvider=()=>f.provider}={}) => handleNotificationSchedule(req,{createClient,enabled,createProvider,library:f.library,now:f.now});
/** @type {import('./testTypes').FoundationTest[]} */
export const NOTIFICATION_WORKFLOW_TESTS = [
 ['NM01','Native anonymous or auth outage denies before body, work and provider',async()=>{
  for(const status of [401,503]){
   const f=notificationFixture();let providers=0,bodies=0;
   const req=request({action:'tick'});Object.defineProperty(req,'body',{get:()=>{bodies++;throw new Error('UNEXPECTED_BODY');}});
   const r=await call(f,{req,createClient:()=>({...f.raw(null),auth:{me:async()=>{throw {status};}}}),createProvider:()=>{providers++;return f.provider;}});
   check(r.status===status&&bodies===0&&providers===0&&f.state.calls.length===0);
  }
 }],
 ['NM02','Native admin still honors disabled entry and strict POST/tick body including empty workflow args',async()=>{
  for(const body of [{action:'tick'}, {}, {action:'tick',user_id:'other'}, {action:'tick',role:'admin'}, {action:'tick',workflow:true}, {action:'tick',date:'2020-01-01'}, {action:'tick',message:'forged'}]){
   const f=notificationFixture();let providers=0;
   const r=await call(f,{enabled:false,body,createProvider:()=>{providers++;return f.provider;}});
   check(r.status===(body.action==='tick'&&Object.keys(body).length===1?200:400));
   if(r.status===200)check((await r.json()).state==='DISABLED');
   check(writes(f).length===0&&providers===0&&!f.sent.length);
  }
  const f=notificationFixture();let clients=0;
  check((await call(f,{req:new Request('https://fixture.invalid/schedule'),createClient:()=>{clients++;return f.raw();}})).status===405&&clients===0);
 }],
 ['NM03','No application owner fallback for absent or demoted workflow creator',async()=>{
  for(const owner of [null,'ownerA']){
   const f=notificationFixture(),raw=f.raw(owner);
   check((await call(f,{enabled:false,createClient:()=>raw})).status===(owner?403:401));
   await rejects(()=>requireAdmin(raw),owner?'ADMIN_REQUIRED':'AUTH_REQUIRED');
   check(writes(f).length===0);
  }
 }],
 ['NM04','Platform-supplied alternative native admin is verified; unchanged daily and same delivery',async()=>{
  const f=notificationFixture();let auth=0;
  const options={createClient:()=>({...f.raw('adminB'),auth:{me:async()=>{auth++;return {id:'adminB',role:'admin'};}}})};
  check((await call(f,options)).status===200);f.advance();check((await call(f,options)).status===200);await call(f,options);
  check(auth>3&&f.sent.length===1&&f.tables.NotificationDelivery.length===1&&f.tables.UserDailyMessage.length===1);
 }],
 ['NM05','Native admin cannot bypass recipient lifecycle, preference or known device denial',async()=>{
  for(const mode of ['removed','inactive','deletion','preference','permission','support']){
   const f=notificationFixture();
   if(mode==='removed')f.tables.User=f.tables.User.filter(u=>u.id!=='ownerA');
   if(mode==='inactive')f.tables.UserProfile[0].account_status='INACTIVE';
   if(mode==='deletion')f.tables.AdminTestOperation.push({id:'synthetic-delete',target_id:'ownerA',operation:'DELETE_USER',status:'RUNNING'});
   if(mode==='preference')f.tables.UserPreferences[0].notifications_enabled=false;
   if(mode==='permission')f.device.permission='DENIED';
   if(mode==='support')f.device.support='UNKNOWN';
   await call(f);f.advance();await call(f);
   check(!f.sent.length&&!f.tables.NotificationDelivery.length&&f.tables.UserDailyMessage.length===1);
  }
 }],
 ['NM06','Native admin re-admission detects role loss during body IO and after IN_FLIGHT',async()=>{
  const f=notificationFixture();let consumed=false,providers=0;
  const revoke=()=>{f.tables.User.find(u=>u.id==='adminA').role='user';};
  const req=request({action:'tick'});Object.defineProperty(req,'body',{value:{getReader:()=>({read:async()=>{
   if(consumed)return {done:true};consumed=true;revoke();return {done:false,value:new TextEncoder().encode('{"action":"tick"}')};
  },releaseLock:()=>{}})}});
  check((await call(f,{req,createProvider:()=>{providers++;return f.provider;}})).status===403);
  check(providers===0&&writes(f).length===0);
  f.tables.User.find(u=>u.id==='adminA').role='admin';await call(f);f.advance();let boundary=0;
  f.state.after=async c=>{if(c.name==='NotificationDelivery'&&c.method==='update'&&c.args[1].dispatch_state==='IN_FLIGHT'){
   f.state.after=null;revoke();boundary=f.state.calls.length;
  }};
  check((await call(f)).status===403&&boundary>0&&!f.sent.length);
  check(f.state.calls.slice(boundary).every(c=>c.method==='filter')&&f.tables.NotificationDelivery[0].dispatch_state==='IN_FLIGHT');
 }],
 ['NM07','Native admin path preserves fresh consent before daily persistence',async()=>{
  const f=notificationFixture({current:false,granted:true});let revoked=false;
  f.state.after=async c=>{if(c.name==='UserPeriodRecord'&&c.method==='filter'){
   f.state.after=null;revoked=true;f.tables.UserHealthConsent[0].consent_status='WITHDRAWN';f.tables.UserHealthConsent[0].withdrawn_at=f.now().toISOString();
  }};
  await call(f);check(revoked&&f.tables.UserDailyMessage.length===1&&!f.tables.NotificationDelivery.length&&!f.sent.length);
  check(!writes(f).some(c=>c.name==='UserDailyMessage'));
 }],
 ['NM08','Written sent envelope accepts once; malformed/timeout stays UNKNOWN without resend',async()=>{
  for(const outcome of ['accepted','malformed','timeout']){
   const f=notificationFixture();let sends=0;
   const adapter=base44PushProvider({asServiceRole:{integrations:{Core:{SendPushNotification:async()=>{sends++;if(outcome==='timeout')throw new Error('private timeout');return outcome==='accepted'?{status:'sent',successful_channels:['opaque'],failed_channels:[]}:{status:200,success:true};}}}}});
   const createProvider=()=>adapter;
   await call(f,{createProvider});f.advance();await call(f,{createProvider});f.advance(15);await call(f,{createProvider});
   check(sends===1&&f.tables.NotificationDelivery[0].dispatch_state===(outcome==='accepted'?'ACCEPTED':'UNKNOWN')&&f.tables.NotificationDelivery[0].attempt_count===1);
   check(!JSON.stringify(f.tables.NotificationDelivery).includes('private'));
  }
 }],
];
