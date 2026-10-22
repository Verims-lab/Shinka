import { check, rejects } from './dataModelTests';
import { notificationFixture } from './notificationFixture';
import { measureNotificationCosts, measuredNotificationFixture } from './notificationCostFixture';
import { notificationOwner } from '../../../base44/shared/notificationOwner.js';
import { produceDailyForOwner } from '../../../base44/shared/dailyMessageOperation.js';
import { handleNotificationSchedule, notificationTick } from '../../../base44/shared/notificationScheduler.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { requireAdmin } from '../../../base44/shared/internalAuthorization.js';
const mutations = f => f.state.calls.filter(c=>c.method!=='filter');
/** @type {import('./testTypes').FoundationTest[]} */
export const NOTIFICATION_PERFORMANCE_TESTS = [
 ['NP01','Same product results within measured query budgets; SDK/auth/provider counters stay separate',async()=>{
  const measured=await measureNotificationCosts(),budgets=[75,110,50],writes=[4,4,2],auth=[13,16,10],sends=[0,1,0];
  measured.scenarios.forEach((s,i)=>{
   check(s.counts.entityReads<=budgets[i]&&s.counts.authMe<=auth[i]);
   check(s.counts.entityWrites===writes[i]&&s.counts.providerSend===sends[i]);
   check(s.product.dailyUnchanged&&s.product.dailyCount===1&&s.product.deliveryCount===1);
   check(s.product.dispatchState===(i===0?'READY':'ACCEPTED')&&s.product.attemptCount===(i===0?0:1));
  });
  check(measured.scenarios[2].counts.providerEligibility===0);
  const f=measuredNotificationFixture();await f.call();
  check(f.events.filter(e=>e.kind==='read'||e.kind==='write').length===f.state.calls.length);
  check(f.events.filter(e=>e.kind==='auth').length>0);
  return {evidence:{scope:measured.scope,scenarios:measured.scenarios.map(({trace,...s})=>s)}};
 }],
 ['NP02','Fresh admission after daily read observes admin/owner/account/preference changes in the same request',async()=>{
  for(const mode of ['admin','removed-owner','inactive','preference']){
   const f=measuredNotificationFixture();let changed=false;
   f.state.after=async c=>{if(c.name==='UserDailyMessage'&&c.method==='filter'&&c.args[0].shinka_date){
    f.state.after=null;changed=true;
    if(mode==='admin')f.tables.User.find(u=>u.id==='adminA').role='user';
    if(mode==='removed-owner')f.tables.User=f.tables.User.filter(u=>u.id!=='ownerA');
    if(mode==='inactive')f.tables.UserProfile[0].account_status='INACTIVE';
    if(mode==='preference')f.tables.UserPreferences[0].notifications_enabled=false;
   }};
   const response=await f.call();check(changed&&(mode!=='admin'||response.status===403));
   check(!f.sent.length&&!f.tables.NotificationDelivery.length&&f.tables.UserDailyMessage.length===1);
  }
 }],
 ['NP03','Owner and request boundaries do not reuse prior admission state',async()=>{
  const f=measuredNotificationFixture();
  f.tables.UserProfile.push({...f.tables.UserProfile[0],id:'profileB',user_id:'ownerB',account_status:'INACTIVE'});
  f.tables.UserPreferences.push({...f.tables.UserPreferences[0],id:'preferencesB',user_id:'ownerB'});
  f.tables.UserDailyMessage.push({...f.daily,id:'dailyB',user_id:'ownerB'});
  await f.call();check(f.tables.NotificationDelivery.length===1&&f.tables.NotificationDelivery[0].user_id==='ownerA');
  f.tables.UserProfile[0].account_status='INACTIVE';f.tables.UserProfile[1].account_status='ACTIVE';
  await f.call();check(f.tables.NotificationDelivery.length===2&&f.tables.NotificationDelivery[1].user_id==='ownerB');
  f.tables.User.find(u=>u.id==='adminA').role='user';const start=mutations(f).length;
  check((await f.call()).status===403&&mutations(f).length===start&&f.sent.length===0);
 }],
 ['NP04','Direct owner writer and shared daily calls still perform fresh guards after a previous admission',async()=>{
  const f=notificationFixture(),client=withUserLifecycle(f.raw('adminA'));
  const owner=notificationOwner(client,'ownerA',f.now,async()=>{await requireAdmin(client);});
  await owner.admit();f.tables.User.find(u=>u.id==='adminA').role='user';
  await rejects(()=>owner.client.asServiceRole.entities.NotificationDelivery.create({user_id:'ownerA'}),'ADMIN_REQUIRED');
  check(!mutations(f).length);
  f.tables.User.find(u=>u.id==='adminA').role='admin';await owner.admit();f.tables.UserProfile[0].account_status='INACTIVE';
  await rejects(()=>produceDailyForOwner(owner.client,'ownerA',{action:'today'},{native:true,now:f.now,library:f.library},owner.admit),'ACCOUNT_INACTIVE');
  check(!mutations(f).length&&!f.sent.length);
 }],
 ['NP05','Admin revoked during body IO stops before provider factory and job access',async()=>{
  const f=notificationFixture();let consumed=false,providers=0;
  const request=new Request('https://fixture.invalid/schedule',{method:'POST'});
  Object.defineProperty(request,'body',{value:{getReader:()=>({read:async()=>{
   if(consumed)return {done:true};consumed=true;f.tables.User.find(u=>u.id==='adminA').role='user';
   return {done:false,value:new TextEncoder().encode('{"action":"tick"}')};
  },releaseLock:()=>{}})}});
  const response=await handleNotificationSchedule(request,{createClient:()=>f.raw('adminA'),enabled:true,createProvider:()=>{providers++;return f.provider;},library:f.library,now:f.now});
  check(response.status===403&&consumed&&providers===0&&!mutations(f).length);
  check(f.state.calls.every(c=>['User','UserPrivacyRequest','AdminTestOperation'].includes(c.name)));
 }],
 ['NP06','Revoked health consent during generation is checked again before daily persistence',async()=>{
  const f=measuredNotificationFixture({current:false,granted:true});let revoked=false;
  f.state.after=async c=>{if(c.name==='UserPeriodRecord'&&c.method==='filter'){
   f.state.after=null;revoked=true;f.tables.UserHealthConsent[0].consent_status='WITHDRAWN';f.tables.UserHealthConsent[0].withdrawn_at=f.now().toISOString();
  }};
  await f.call();check(revoked&&f.tables.UserDailyMessage.length===1&&!f.tables.NotificationDelivery.length&&!f.sent.length);
  check(!mutations(f).some(c=>c.name==='UserDailyMessage'));
 }],
 ['NP07','Busy worker still checks current caller before returning without job work',async()=>{
  const f=measuredNotificationFixture();let entered;
  /** @type {() => void} */ let release;
  const ready=new Promise(resolve=>{entered=resolve;});
  /** @type {Promise<void>} */ const hold=new Promise(resolve=>{release=resolve;});
  f.state.before=async c=>{if(c.name==='NotificationSchedule'&&c.method==='filter'){f.state.before=null;entered();await hold;}};
  const active=f.call();await ready;
  try {
   const g=notificationFixture();g.tables.User.find(u=>u.id==='adminA').role='user';
   const client=withUserLifecycle(g.raw('adminA'));
   await rejects(()=>notificationTick(client,{...g.options,admitCaller:async()=>{await requireAdmin(client);}}),'ADMIN_REQUIRED');
   check(!mutations(g).length&&!g.sent.length&&g.state.calls.every(c=>['User','UserPrivacyRequest','AdminTestOperation'].includes(c.name)));
  } finally {release();await active;}
 }],
];
