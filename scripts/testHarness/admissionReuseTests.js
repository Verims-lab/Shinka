import { seedLegacyReset } from '../../src/foundation/tests/historicalResetFixture';
// Node-only real operations with synthetic native SDK. No hosted requests.
import { nativeFixture } from '../../src/foundation/tests/nativeFixture';
import { withUserLifecycle } from '../../base44/shared/userLifecycle.js';
import { withNativeWriteChecks } from '../../base44/shared/nativeWriteChecks.js';
import { dailyMessageOperation } from '../../base44/shared/dailyMessageOperation.js';
import { youOperation } from '../../base44/shared/youOperation.js';
import { InternalError } from '../../base44/shared/internalAuthorization.js';
import { profileIntent, preferencesIntent } from '../../src/foundation/tests/youFixture';

const check = (ok, message) => { if (!ok) throw new Error(message); };
function counted(f, identities) {
  const raw = f.raw(); let calls = 0;
  raw.auth.me = async () => { const id = identities[Math.min(calls, identities.length - 1)]; calls++; return id ? { id, role: 'user' } : null; };
  return { client: withNativeWriteChecks(withUserLifecycle(raw)), calls: () => calls };
}
const home = (f, client) => dailyMessageOperation(client, { action:'today',timezone:'Europe/Istanbul' }, {native:true,now:f.now,library:f.library,random:()=>0});
const you = (f, client, body={action:'read'}) => youOperation(client,body,{now:f.now});
const writes = f => f.state.calls.filter(c=>c.method!=='filter');
async function rejected(run, code='AUTH_REQUIRED', status=401) {
  try { await run(); } catch (e) {
    check(e instanceof InternalError && e.code===code && e.status===status, `Expected ${code}/${status}; got ${e?.code}/${e?.status}: ${e?.message}`);
    return e;
  }
  throw new Error(`Expected ${code} rejection`);
}
const snapshot = f => JSON.stringify(f.tables);

export const ADMISSION_REUSE_TESTS = [
 ['AR01','Home reopen and You read each verify exactly two phases; no global write budget',async()=>{
  const f=nativeFixture();await f.today();const before=snapshot(f),n=writes(f).length;
  const a=counted(f,['ownerA']),daily=await home(f,a.client);
  const b=counted(f,['ownerA']),profile=await you(f,b.client);
  check(a.calls()===2&&b.calls()===2,`Expected two real checks home=${a.calls()} you=${b.calls()}`);
  check(daily.persisted&&daily.created===false&&profile.profile?.revision,'Expected product results');
  check(before===snapshot(f)&&writes(f).length===n,'Reads changed product state');
 }],
 ['AR02','Changed identity at later Home/You admission rejects without writes or state changes',async()=>{
  const f=nativeFixture();await f.today();
  for(const run of [home,you]){const before=snapshot(f),n=writes(f).length,a=counted(f,['ownerA','ownerB']);
   await rejected(()=>run(f,a.client));check(a.calls()===2&&writes(f).length===n&&before===snapshot(f),'Identity change side effect');}
 }],
 ['AR03','Logout is specifically AUTH_REQUIRED/401, with two checks and no writes',async()=>{
  const f=nativeFixture();await f.today();
  for(const run of [home,you]){const before=snapshot(f),n=writes(f).length,a=counted(f,['ownerA',null]);
   await rejected(()=>run(f,a.client));check(a.calls()===2&&writes(f).length===n&&before===snapshot(f),'Logout side effect');}
 }],
 ['AR04','First daily and profile/preference writes recheck identity before mutation and after write',async()=>{
  for(const mode of ['first','profile','preferences']) for(const lost of ['ownerB',null]){
   const f=nativeFixture();let body;
   if(mode!=='first'){await f.today();const view=await you(f,f.client());body=mode==='profile'?{action:'saveProfile',...profileIntent(view,{display_name:'Changed'})}:{action:'savePreferences',...preferencesIntent(view,{language_code:'en'})};}
   const before=snapshot(f),n=writes(f).length,a=counted(f,['ownerA',lost]);
   await rejected(()=>mode==='first'?home(f,a.client):you(f,a.client,body));
   check(a.calls()>=2&&writes(f).length===n&&snapshot(f)===before,`${mode}: mutation after identity loss`);
  }
  // Successful mutations require additional phases, not an artificial <=2 cap.
  for(const mode of ['first','profile','preferences']){
   const f=nativeFixture();let body;
   if(mode!=='first'){await f.today();const view=await you(f,f.client());body=mode==='profile'?{action:'saveProfile',...profileIntent(view,{display_name:'Changed'})}:{action:'savePreferences',...preferencesIntent(view,{language_code:'en'})};}
   const a=counted(f,['ownerA']);await(mode==='first'?home(f,a.client):you(f,a.client,body));
   check(a.calls()>2,`${mode}: later admission removed`);
  }
 }],
 ['AR05','Fresh account/consent gates survive first-daily principal reuse',async()=>{
  for(const mode of ['inactive','withdrawn','reset']){
   const f=nativeFixture();let changed=false;
   f.state.after=async c=>{if(c.name==='UserPeriodRecord'&&c.method==='filter'){
    f.state.after=null;changed=true;
    if(mode==='inactive')f.tables.UserProfile[0].account_status='INACTIVE';
    if(mode==='withdrawn')Object.assign(f.tables.UserHealthConsent[0],{consent_status:'WITHDRAWN',withdrawn_at:f.now().toISOString()});
    if(mode==='reset')seedLegacyReset(f);
   }};
   let error;try{await home(f,f.client());}catch(e){error=e;}
   check(changed&&error instanceof InternalError,`${mode}: missing domain rejection`);
   if(mode==='reset')check(error.code==='ONBOARDING_RESTART_REQUIRED'&&error.status===409,'Wrong reset boundary');
   check(!writes(f).some(c=>c.name==='UserDailyMessage'),`${mode}: daily persisted after gate changed`);
  }
 }],
 ['AR06','Reset first-daily path does not reuse the pre-reset principal across admission',async()=>{
  for(const lost of ['ownerB',null]){
   const f=nativeFixture();seedLegacyReset(f);
   const row=f.tables.AdminTestOperation[0];row.stage='FIRST_SHINKA';
   const before=snapshot(f),n=writes(f).length,a=counted(f,['ownerA',lost]);
   await rejected(()=>home(f,a.client),lost?'FORGED_OWNER':'AUTH_REQUIRED',lost?403:401);
   check(a.calls()>=2&&snapshot(f)===before&&writes(f).length===n,'Reset crossed identity or wrote after logout');
  }
 }],
 ['AR07','Identity loss after persisted first daily/profile/preference write never returns verified success or continues writes',async()=>{
  for(const mode of ['first','profile','preferences']) for(const lost of ['ownerB',null]){
   const f=nativeFixture();let body;
   if(mode!=='first'){await f.today();const view=await you(f,f.client());body=mode==='profile'?{action:'saveProfile',...profileIntent(view,{display_name:'Changed'})}:{action:'savePreferences',...preferencesIntent(view,{language_code:'en'})};}
   let owner='ownerA',boundary=0;
   const entity={first:'UserDailyMessage',profile:'UserProfile',preferences:'UserPreferences'}[mode];
   f.state.after=async c=>{if(c.name===entity&&c.method!=='filter'){f.state.after=null;owner=lost;boundary=f.state.calls.length;}};
   const raw=f.raw();raw.auth.me=async()=>owner?{id:owner,role:'user'}:null;
   const client=withNativeWriteChecks(withUserLifecycle(raw));
   await rejected(()=>mode==='first'?home(f,client):you(f,client,body),mode==='first'?(lost?'OWNER_REQUIRED':'AUTH_REQUIRED'):'YOU_WRITE_UNCONFIRMED',mode==='first'?(lost?403:401):503);
   check(boundary>0&&f.state.calls.slice(boundary).every(c=>c.method==='filter'),'post-loss writes');
   check(f.tables[entity].length===1&&f.tables[entity][0].user_id==='ownerA','persisted row lost/rebound');
  }
 }],
 ['AR08','Profile/preference mutations recheck ACTIVE, health deletion and reset immediately before write',async()=>{
  for(const mode of ['profile','preferences']) for(const revoked of ['inactive','health-job','reset']){
   const f=nativeFixture();await f.today();const view=await you(f,f.client()),n=writes(f).length;
   const body=mode==='profile'?{action:'saveProfile',...profileIntent(view,{display_name:'Changed'})}:{action:'savePreferences',...preferencesIntent(view,{language_code:'en'})};
   let changed=false;
   f.state.after=async c=>{if(c.name==='UserDailyMessage'&&c.method==='filter'){
    f.state.after=null;changed=true;
    if(revoked==='inactive')f.tables.UserProfile[0].account_status='INACTIVE';
    if(revoked==='health-job')f.tables.HealthDataDeletionJob.push({id:'synthetic-job',user_id:'ownerA',job_status:'PENDING'});
    if(revoked==='reset')seedLegacyReset(f);
   }};
   const code={'inactive':'ACTIVE_ACCOUNT_REQUIRED','health-job':'HEALTH_DELETION_PENDING','reset':'ONBOARDING_RESTART_REQUIRED'}[revoked];
   await rejected(()=>you(f,f.client(),body),code,revoked==='inactive'?403:409);
   check(changed&&!writes(f).slice(n).some(c=>['UserProfile','UserPreferences'].includes(c.name)),'mutation after domain gate loss');
  }
 }],
];
