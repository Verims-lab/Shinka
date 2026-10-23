import { check, rejects } from './dataModelTests';
import { notificationFixture } from './notificationFixture';
import { InternalError, requireAdmin } from '../../../base44/shared/internalAuthorization.js';
import { handleNotificationSchedule } from '../../../base44/shared/notificationScheduler.js';
import { base44PushProvider } from '../../../base44/shared/base44PushProvider.js';

// Browser fixtures exercise orchestration with a substituted admission callback.
// The real node:crypto comparator is separately executed by verifyNotifications.
const deny = () => { throw new InternalError('NOTIFICATION_MACHINE_AUTH_REQUIRED',401); };
const request = body => new Request('https://fixture.invalid/schedule',{method:'POST',body:JSON.stringify(body)});
const writes = f => f.state.calls.filter(c=>c.method!=='filter');
const call = (f, {admitMachine=async()=>{},enabled=true,body={action:'tick'},req=request(body),createClient=()=>f.raw(null),createProvider=()=>f.provider}={}) => handleNotificationSchedule(req,{createClient,admitMachine,enabled,createProvider,library:f.library,now:f.now});
/** @type {import('./testTypes').FoundationTest[]} */
export const NOTIFICATION_MACHINE_TESTS = [
 ['NM01','Failed machine admission denies before client, body, work and provider; no admin fallback',async()=>{
  const f=notificationFixture();let clients=0,providers=0,bodies=0;
  const req=request({action:'tick'});Object.defineProperty(req,'body',{get:()=>{bodies++;throw new Error('UNEXPECTED_BODY');}});
  const r=await call(f,{req,admitMachine:deny,createClient:()=>{clients++;return f.raw('adminA');},createProvider:()=>{providers++;return f.provider;}});
  check(r.status===401&&clients===0&&bodies===0&&providers===0&&f.state.calls.length===0);
 }],
 ['NM02','Prepared machine admission still honors disabled entry and strict POST/tick body',async()=>{
  for(const body of [{action:'tick'}, {action:'tick',user_id:'other'}, {action:'tick',role:'admin'}, {action:'tick',workflow:true}, {action:'tick',date:'2020-01-01'}, {action:'tick',message:'forged'}]){
   const f=notificationFixture();let providers=0;
   const r=await call(f,{enabled:false,body,createProvider:()=>{providers++;return f.provider;}});
   check(r.status===(Object.keys(body).length===1?200:400));
   if(r.status===200)check((await r.json()).state==='DISABLED');
   check(f.state.calls.length===0&&providers===0&&!f.sent.length);
  }
  const f=notificationFixture();let admissions=0;
  check((await call(f,{req:new Request('https://fixture.invalid/schedule'),admitMachine:async()=>{admissions++;}})).status===405&&admissions===0);
 }],
 ['NM03','Machine path creates no authenticated admin principal or authority on other operations',async()=>{
  const f=notificationFixture(),raw=f.raw(null);
  check((await call(f,{enabled:false,createClient:()=>raw})).status===200);
  await rejects(()=>requireAdmin(raw),'AUTH_REQUIRED');
  check(f.state.calls.length===0);
 }],
 ['NM04','Userless prepared machine job retains daily reconciliation and never relies on auth.me',async()=>{
  const f=notificationFixture();let auth=0,admissions=0;
  const options={createClient:()=>({...f.raw(null),auth:{me:async()=>{auth++;throw new Error('UNEXPECTED_AUTH');}}}),admitMachine:async()=>{admissions++;}};
  check((await call(f,options)).status===200);f.advance();check((await call(f,options)).status===200);await call(f,options);
  check(admissions>3&&auth===0&&f.sent.length===1&&f.tables.NotificationDelivery.length===1&&f.tables.UserDailyMessage.length===1);
 }],
 ['NM05','Machine authority cannot bypass recipient existence, lifecycle, preference or device eligibility',async()=>{
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
 ['NM06','Machine re-admission denies rotation during body IO and after IN_FLIGHT without later writes',async()=>{
  const f=notificationFixture();let allowed=true,consumed=false,providers=0;
  const admitMachine=async()=>{if(!allowed)deny();};
  const req=request({action:'tick'});Object.defineProperty(req,'body',{value:{getReader:()=>({read:async()=>{
   if(consumed)return {done:true};consumed=true;allowed=false;return {done:false,value:new TextEncoder().encode('{"action":"tick"}')};
  },releaseLock:()=>{}})}});
  check((await call(f,{req,admitMachine,createProvider:()=>{providers++;return f.provider;}})).status===401);
  check(providers===0&&f.state.calls.length===0);
  allowed=true;await call(f,{admitMachine});f.advance();let boundary=0;
  f.state.after=async c=>{if(c.name==='NotificationDelivery'&&c.method==='update'&&c.args[1].dispatch_state==='IN_FLIGHT'){
   f.state.after=null;allowed=false;boundary=f.state.calls.length;
  }};
  check((await call(f,{admitMachine})).status===401&&boundary>0&&!f.sent.length);
  check(f.state.calls.slice(boundary).every(c=>c.method==='filter')&&f.tables.NotificationDelivery[0].dispatch_state==='IN_FLIGHT');
 }],
 ['NM07','Machine path preserves fresh consent before daily persistence',async()=>{
  const f=notificationFixture({current:false,granted:true});let revoked=false;
  f.state.after=async c=>{if(c.name==='UserPeriodRecord'&&c.method==='filter'){
   f.state.after=null;revoked=true;f.tables.UserHealthConsent[0].consent_status='WITHDRAWN';f.tables.UserHealthConsent[0].withdrawn_at=f.now().toISOString();
  }};
  await call(f);check(revoked&&f.tables.UserDailyMessage.length===1&&!f.tables.NotificationDelivery.length&&!f.sent.length);
  check(!writes(f).some(c=>c.name==='UserDailyMessage'));
 }],
 ['NM08','Machine path keeps fulfilled/timeout provider results UNKNOWN and never blindly retries',async()=>{
  for(const timeout of [false,true]){
   const f=notificationFixture();let sends=0;
   const adapter=base44PushProvider({asServiceRole:{integrations:{Core:{SendPushNotification:async()=>{sends++;if(timeout)throw new Error('private timeout');return {status:200,success:true};}}}}});
   const createProvider=()=>({...adapter,eligibility:async()=>({support:'SUPPORTED',permission:'GRANTED'})});
   await call(f,{createProvider});f.advance();await call(f,{createProvider});f.advance(15);await call(f,{createProvider});
   check(sends===1&&f.tables.NotificationDelivery[0].dispatch_state==='UNKNOWN'&&f.tables.NotificationDelivery[0].attempt_count===1);
   check(!JSON.stringify(f.tables.NotificationDelivery).includes('private'));
  }
 }],
];
