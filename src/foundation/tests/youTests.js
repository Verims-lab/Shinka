import { check, rejects } from './dataModelTests';
import { youFixture, profileIntent, preferencesIntent } from './youFixture';
import { createYouController } from '@/features/you/youController';
import { youRequest, persistProductLanguage } from '@/services/youService';
import { BIRTHPLACE_FIELDS } from '../../../base44/shared/onboardingValidation.js';
const writes=f=>f.state.calls.filter(c=>c.method!=='filter');
const unchanged=f=>JSON.stringify(Object.fromEntries(Object.entries(f.tables).filter(([k])=>!['UserProfile','UserPreferences'].includes(k))));
/** @type {import('./testTypes').FoundationTest[]} */
export const YOU_TESTS = [
 ['YT13','Header language confirms lost response by readonly check; failed check retains unknown without auto retry',async()=>{
   const f=youFixture(), actions=[];
   const client={functions:{invoke:async(_name,body)=>{actions.push(body.action);return {data:await(await f.http(body)).json()};}}};
   f.once('after',c=>c.name==='UserPreferences'&&c.method==='updateMany');
   const saved=await persistProductLanguage('en',client);check(saved.state==='VERIFIED'&&saved.preferences.language_code==='en');
   check(actions.join(',')==='readPreferences,savePreferences,verifyPreferences'&&writes(f).length===1);
   let calls=0;
   const failed={functions:{invoke:async(_name,body)=>{calls++;if(body.action==='readPreferences')return {data:await(await f.http(body)).json()};throw new Error('private transport');}}};
   try{await persistProductLanguage('tr',failed);throw new Error('unexpected success');}catch(error){check(error.unknown===true&&calls===3&&!error.message.includes('private'));}
   check(f.tables.UserPreferences[0].language_code==='en'&&writes(f).length===1);
 }],

 ['YT01','Actual HTTP owner read, profile update, normalized optional values and backend Sun',async()=>{
   const f=youFixture(), before=unchanged(f), view=await f.request('read');
   check(view.consent.status==='GRANTED'&&view.profile.display_name==='Ada');
   const saved=await f.request('saveProfile',profileIntent(view,{display_name:'  New name  ',birth_date:'1990-07-21',birth_time:''}));
   check(saved.state==='VERIFIED'&&saved.profile.display_name==='New name'&&saved.profile.birth_time===null&&saved.profile.sun_sign_code==='CANCER');
   check((await f.request('read')).profile.display_name==='New name'&&unchanged(f)===before);
   check(writes(f).length===1&&writes(f)[0].name==='UserProfile'&&!('account_status' in writes(f)[0].args[1].$set));
 }],
 ['YT02','Forbidden owner, role/status/Sun/consent fields; anonymous, inactive, unfinished and reset',async()=>{
   const f=youFixture(), v=await f.request('read');
   for(const field of ['user_id','role','account_status','health_consent','sun_sign_code']) {
     const response=await f.http({action:'saveProfile',...profileIntent(v),[field]:field==='user_id'?'ownerB':'admin'});
     check(response.status>=400,'forgery accepted');
   }
   for(const action of ['__proto__','constructor',['read'],null]) check((await f.http({action})).status===400);
   check((await f.http({action:'read'},null)).status===401);
   f.tables.UserProfile[0].account_status='INACTIVE';check((await f.http({action:'read'})).status>=400);
   f.tables.UserProfile[0].account_status='ACTIVE';f.tables.UserDailyMessage=[];check((await f.http({action:'read'})).status===409);
   check(writes(f).length===0);
   const r=youFixture();await r.execute(await r.preview());check((await r.http({action:'read'})).status===409);
 }],
 ['YT03','Shared required DOB, leap/18+ dates, 50 Unicode name, genuine optional time',async()=>{
   const f=youFixture(),v=await f.request('read');
   for(const [patch,code] of [[{birth_date:''},'DOB_REQUIRED'],[{birth_date:'2026-02-30'},'DATE_INVALID'],[{birth_date:'2027-01-01'},'DOB_FUTURE'],[{birth_date:'2010-01-01'},'AGE_UNDER_18'],[{birth_time:'24:01'},'TIME_INVALID'],[{display_name:'a'.repeat(51)},'NAME_TOO_LONG']]) await rejects(()=>f.request('saveProfile',profileIntent(v,patch)),code);
   const s=await f.request('saveProfile',profileIntent(v,{display_name:'😀'.repeat(50),birth_date:'2008-10-20',birth_time:'00:00'}));
   check([...s.profile.display_name].length===50&&s.profile.birth_time==='00:00');
   check(writes(f).length===1);
 }],
 ['YT04','Changed place re-resolves; saved place preserved; explicit clear removes all five together',async()=>{
   const f=youFixture(),v=await f.request('read');
   const s=await f.request('saveProfile',profileIntent(v,{birthplace_geonames_id:123}));
   check(f.resolves===1&&BIRTHPLACE_FIELDS.every(k=>s.profile[k]===f.place[k]));
   const p=await f.request('saveProfile',profileIntent(s,{display_name:'Another'}));check(f.resolves===1&&p.profile.birthplace_name===f.place.birthplace_name);
   const cleared=await f.request('saveProfile',profileIntent(p,{birthplace_geonames_id:null}));
   check(BIRTHPLACE_FIELDS.every(k=>cleared.profile[k]===null)&&writes(f).length===3);
 }],
 ['YT05','Language/notification persistent readback, fixed 06:00, IANA fallback; protected history unchanged',async()=>{
   const f=youFixture(),v=await f.request('read'),before=unchanged(f),profile=JSON.stringify(f.tables.UserProfile);
   await f.request('savePreferences',preferencesIntent(v,{language_code:'en',notifications_enabled:true,timezone:'Not/AZone'}));
   const s=await f.request('read');check(s.preferences.language_code==='en'&&s.preferences.notifications_enabled&&s.preferences.notification_time==='06:00'&&s.preferences.timezone==='Europe/Istanbul');
   check(unchanged(f)===before&&JSON.stringify(f.tables.UserProfile)===profile);
   for(const patch of [{notification_time:'09:00'},{language_code:'fr'},{notifications_enabled:'true'}]) check((await f.http({action:'savePreferences',...preferencesIntent(s),...patch})).status===400);
 }],
 ['YT06','Response loss after write; verification and same payload retry never rewrite verified values',async()=>{
   const f=youFixture(),v=await f.request('read'),intent=profileIntent(v,{display_name:'Retried'});
   f.once('after',c=>c.name==='UserProfile'&&c.method==='updateMany');
   try{await f.request('saveProfile',intent);throw new Error('accepted loss');}catch(e){check(e.unknown===true);}
   check((await f.request('verifyProfile',intent)).state==='VERIFIED');
   check((await f.request('saveProfile',intent)).state==='VERIFIED'&&writes(f).length===1);
   check((await f.request('read')).profile.display_name==='Retried');
 }],
 ['YT07','Pre-write failure remains unknown, readonly check and explicit retry recover without false success',async()=>{
   const f=youFixture(),v=await f.request('read'),intent=preferencesIntent(v,{language_code:'en'});
   f.once('before',c=>c.name==='UserPreferences'&&c.method==='updateMany');
   await rejects(()=>f.request('savePreferences',intent),'YOU_WRITE_UNCONFIRMED');
   check((await f.request('verifyPreferences',intent)).state==='UNCONFIRMED');
   check((await f.request('savePreferences',intent)).state==='VERIFIED');
 }],
 ['YT08','Stale editor conflicts, observed competing updates and duplicate same request reconcile',async()=>{
   const f=youFixture(),v=await f.request('read'),a=profileIntent(v,{display_name:'A'}),b=profileIntent(v,{display_name:'B'});
   await f.request('saveProfile',a);await rejects(()=>f.request('saveProfile',b),'YOU_EDIT_CONFLICT');
   check((await f.request('read')).profile.display_name==='A'&&writes(f).length===1);
   const g=youFixture(),view=await g.request('read'),intent=profileIntent(view,{display_name:'Same'});
   const both=await Promise.allSettled([g.request('saveProfile',intent),g.request('saveProfile',intent)]);
   check(both.some(r=>r.status==='fulfilled')&&(await g.request('saveProfile',intent)).state==='VERIFIED');
   check(g.tables.UserProfile.length===1&&g.tables.UserProfile[0].display_name==='Same');
 }],
 ['YT09','Health deletion and post-read inactive boundary; read-only consent never grants or withdraws',async()=>{
   const f=youFixture(),v=await f.request('read');f.tables.HealthDataDeletionJob.push({id:'job',user_id:'ownerA',job_status:'PENDING'});
   await rejects(()=>f.request('saveProfile',profileIntent(v,{display_name:'Denied'})),'HEALTH_DELETION_PENDING');check(!writes(f).length);
   const g=youFixture();g.tables.UserHealthConsent=[];g.tables.UserHealthConsentEvent=[];
   check((await g.request('read')).consent.status==='NOT_GIVEN');
   g.state.after=async c=>{if(c.name==='UserHealthConsent'&&c.method==='filter'){g.state.after=null;g.tables.UserProfile[0].account_status='INACTIVE';}};
   check((await g.http({action:'read'})).status>=400&&writes(g).length===0);
 }],
 ['YT10','Controller double-click, lost response/check, partial section status and dispose prevent stale success',async()=>{
   const f=youFixture();let finish=()=>{},calls=0;
   const c=createYouController(async(action,payload)=>{if(action==='saveProfile'){calls++;await new Promise(resolve=>{finish=()=>resolve(undefined);});}return f.request(action,payload);});
   await c.load();c.edit();c.change('display_name','Draft');const a=c.saveProfile();await Promise.resolve();await c.saveProfile();check(calls===1&&c.getSnapshot().draft.display_name==='Draft');
   finish();await a;check(c.getSnapshot().result==='profile');
   c.preference('language_code','en');f.once('after',r=>r.name==='UserPreferences'&&r.method==='updateMany');await c.savePreferences();
   check(c.getSnapshot().error.unknown&&c.getSnapshot().value.preferences.language_code==='tr');await c.check();check(c.getSnapshot().value.preferences.language_code==='en');
   c.edit();c.change('display_name','Late');const late=c.saveProfile();await Promise.resolve();c.dispose();finish();await late;check(c.getSnapshot().value===null&&c.getSnapshot().draft===null);
 }],
 ['YT11','Transport validates actual success, malformed success, deadline uncertainty and safe errors',async()=>{
   const f=youFixture(),view=await f.request('read');check(view.profile&&view.preferences);
   for(const data of [{},{state:'VERIFIED',profile:{}},{error_code:'private provider payload'}]) {
     try{await youRequest('saveProfile',{}, {functions:{invoke:async()=>({data})}},5);throw new Error('invalid accepted');}catch(e){check(e.unknown===true&&!e.message.includes('private'));}
   }
   try{await youRequest('savePreferences',{}, {functions:{invoke:()=>new Promise(()=>{})}},5);throw new Error('timeout accepted');}catch(e){check(e.unknown===true);}
 }],
 ['YT12','Failure after one section never marks another section saved; stale identity invalidation clears drafts',async()=>{
   const f=youFixture(),c=createYouController(f.request);await c.load();c.edit();c.change('display_name','Keep');await c.saveProfile();
   c.preference('notifications_enabled',true);f.once('before',r=>r.name==='UserPreferences'&&r.method==='updateMany');await c.savePreferences();
   check(c.getSnapshot().value.profile.display_name==='Keep'&&c.getSnapshot().value.preferences.notifications_enabled===false&&!c.getSnapshot().result);
   c.invalidate();check(!c.getSnapshot().value&&!c.getSnapshot().preferences&&!c.getSnapshot().intent);c.dispose();
 }],
];
