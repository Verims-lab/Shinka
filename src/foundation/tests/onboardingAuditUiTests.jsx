import { onboardingCopy } from '../i18n/onboardingCopy';
// 035 real component audit. Only SDK/provider IO is synthetic; form validation,
// requests, backend persistence/readback, router and auth decisions remain real.
import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import Onboarding from '@/pages/Onboarding';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beginProviderAuth } from '@/services/authService';
import { check } from './dataModelTests';
import { auditBackend, auditProfile } from './onboardingAuditTests';
import { waitForFixture } from './domWait';
import { testEventTurn } from './testClock';
import { KAN_CANDIDATES, placeFetchFor } from './geonamesSearchFixture';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';

const deferred=()=>{let resolve=value=>{check(false,`unused gate ${value}`);};const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const type=(host,id,value)=>{const el=host.querySelector(`#${id}`);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};
const button=(host,text)=>[...host.querySelectorAll('button')].find(el=>el.textContent.trim()===text);
const stateOf=host=>host.querySelector('[data-onboarding-state]')?.getAttribute('data-onboarding-state');
const key=(el,value)=>el.dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
export async function auditScreen(initial,run,context={},options={}) {
 const backend=await auditBackend(),host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.append(host);
 const f={backend,transitions:[],calls:[],name:null,profile:null,locale:(_language)=>{},...options};
 const request=async(action,payload={})=>{f.calls.push({action,payload});return (options.request||backend.request)(action,payload);};
 const root=createRoot(host);let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;root.unmount();host.remove();};context.cleanup?.(dispose);
 function Fixture(){const [state,setState]=useState(initial),[language,setLanguage]=useState('en');f.locale=setLanguage;return h(OnboardingScreen,{state,initialLanguage:language,authenticated:initial.startsWith('AUTHENTICATED'),profile:f.profile || (f.name ? {display_name:f.name} : null),today:'2026-10-19',request,...options.props,onState:(next,result)=>{f.transitions.push({next,result});setState(next);}});}
 root.render(h(Fixture));const wait=async fn=>{try{await waitForFixture(fn,host.ownerDocument.body,context);}catch{throw new Error(`${String(fn).slice(0,65)} ${stateOf(host)} busy=${!!host.querySelector('[aria-busy=\"true\"]')}`);}},turn=()=>testEventTurn(context.signal);
 try{await wait(()=>stateOf(host));await run(f,host,wait,turn,dispose);}finally{dispose();}
}
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_AUDIT_UI_TESTS=[
 ['OU01','Intro opens sign-in only; authenticated name Back preserves draft, blank skip does not write',async(context={})=>{
  await auditScreen('UNAUTHENTICATED_INTRO',async(f,host,wait,turn)=>{
   check(host.querySelectorAll('[data-intro-row]').length===3);
   const begin=button(host,'Begin');begin.click();begin.click();await wait(()=>host.querySelector('#age-declaration'));
   check(f.transitions.length===1&&!host.querySelector('#display_name')&&!host.querySelector('#age-declaration').checked);
   await wait(()=>!host.querySelector('[data-onboarding-back]').disabled);host.querySelector('[data-onboarding-back]').click();await wait(()=>stateOf(host)==='UNAUTHENTICATED_INTRO');check(f.calls.length===0);
  },context);
  await auditScreen('AUTHENTICATED_NAME_REQUIRED',async(f,host,wait,turn)=>{
   check(host.querySelector('#display_name').value==='');type(host,'display_name','  Ada  ');await turn();button(host,'Continue').click();await wait(()=>host.querySelector('#birth_date'));
   await wait(()=>!host.querySelector('[data-onboarding-back]').disabled);host.querySelector('[data-onboarding-back]').click();await wait(()=>host.querySelector('#display_name'));
   check(host.querySelector('#display_name').value==='Ada'&&button(host,'Prefer not to say').disabled);
   type(host,'display_name','   ');await turn();button(host,'Prefer not to say').click();await wait(()=>host.querySelector('#birth_date'));
   check(!host.querySelector('[data-provider]')&&f.calls.length===0,'no OAuth restart or personal write before profile confirmation');
   type(host,'birth_date','1990-01-01');await turn();button(host,'Continue').click();await wait(()=>host.querySelector('#period_start_date'));
   check(f.backend.rows.user_profile[0].display_name==null,'explicit skip persisted as NULL');
  },context);
 }],
 ['OU02','ON-05 back restores persisted profile; edit/save and locale preserve cycle drafts, age and health consent stay separate',async(context={})=>{
  const backend=await auditBackend();const saved=await backend.request('saveProfile',auditProfile);
  await auditScreen('AUTHENTICATED_CYCLE_STEP',async(f,host,wait,turn)=>{
   type(host,'period_start_date','2026-10-01');type(host,'period_duration_days','4');type(host,'initial_cycle_length_days','29');await turn();
   host.querySelector('#health_consent').click();await turn();
   const before=JSON.stringify(backend.rows);host.querySelector('button[data-onboarding-back]').click();await wait(()=>host.querySelector('input#birth_date'));
   check(JSON.stringify(backend.rows)===before&&f.calls.length===0,'back wrote data');
   check(host.querySelector('input#birth_date').value==='1990-01-01'&&host.querySelector('button[data-onboarding-back]:disabled'),'profile restore / unsafe auth back');
   type(host,'birth_date','1991-04-20');await turn();f.locale('tr');await turn();
   check(host.querySelector('input#birth_date').value==='1991-04-20','locale lost profile draft');
   host.querySelector('button[type=submit]').click();await wait(()=>host.querySelector('#period_start_date'));
   check(host.querySelector('#period_start_date').value==='2026-10-01'&&host.querySelector('#period_duration_days').value==='4'&&host.querySelector('#initial_cycle_length_days').value==='29'&&host.querySelector('#health_consent').checked,'back/forward lost cycle draft');
   check(backend.rows.user_profile[0].sun_sign_code==='TAURUS'&&!backend.rows.user_health_consent.length,'profile changed consent');
  },context,{profile:saved.profile,request:backend.request});
 }],
 ['OU03','Unconfirmed save response cannot advance or discard draft; verified retry keeps the action ID',async(context={})=>{
  const backend=await auditBackend();let unconfirmed=true;
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   type(host,'birth_date','1990-01-01');await turn();button(host,'Continue').click();await wait(()=>host.querySelector('[data-onboarding-error]'));
   check(stateOf(host)==='AUTHENTICATED_PROFILE_REQUIRED'&&host.querySelector('#birth_date').value==='1990-01-01','unconfirmed response advanced');
   check(host.querySelector('[data-onboarding-error]'),'missing unconfirmed error');
   unconfirmed=false;button(host,'Continue').click();await wait(()=>stateOf(host)==='AUTHENTICATED_CYCLE_STEP');
   const saves=f.calls.filter(c=>c.action==='saveProfile');check(saves.length===2&&saves[0].payload.action_id===saves[1].payload.action_id&&backend.rows.user_profile.length===1,'retry identity');
  },context,{name:'Ada',request:(action,payload)=>unconfirmed?Promise.resolve({state:'AUTHENTICATED_CYCLE_STEP',persisted:false}):backend.request(action,payload)});
 }],
 ['OU04','Unmount or session end makes late saves inert: no next screen, old profile',async(context={})=>{
  for(const end of ['unmount','session']){
   const gate=deferred(),backend=await auditBackend();
   await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn,dispose)=>{
    type(host,'birth_date','1990-01-01');await turn();const save=button(host,'Continue');save.click();save.click();await turn();check(f.calls.length===1,'double submit');
    if(end==='unmount')dispose();else window.dispatchEvent(new Event('shinka-session-ended'));
    gate.resolve(await backend.request('saveProfile',auditProfile));await turn();await turn();
    check(f.transitions.length===0&&!host.querySelector('#period_start_date'),`${end} late save changed UI`);
   },context,{name:'Ada',request:()=>gate.promise});
  }
 }],
 ['OU05','Combobox keyboard can select/escape; empty popup owns its listbox; next-page actions remain focused and actionable',async(context={})=>{
  const noise=Array.from({length:50},(_,i)=>({...KAN_CANDIDATES[6],geonameId:20000+i}));
  const geo=createGeoNamesAdapter({username:'fixture',fetcher:placeFetchFor([...noise,...KAN_CANDIDATES])});
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   type(host,'birthplace','Kan');await wait(()=>host.querySelector('[data-place-more]'));
   const box=host.querySelector('#birthplace');box.focus();
   check(box.getAttribute('aria-expanded')==='true'&&host.querySelector(`#${box.getAttribute('aria-controls')}`),'expanded combobox missing controlled listbox');
   const more=host.querySelector('[data-place-more]');more.focus();await turn();check(document.activeElement===more&&more.isConnected,'blur removed keyboard action');key(more,'Escape');await turn();check(box.getAttribute('aria-expanded')==='false'&&document.activeElement===box,'action Escape reopened popup');key(box,'ArrowDown');await turn();host.querySelector('[data-place-more]').click();
   await wait(()=>host.querySelectorAll('[data-place-option]').length>0);box.focus();key(box,'ArrowDown');await turn();
   const active=box.getAttribute('aria-activedescendant');check(active&&host.querySelector(`#${active}`)?.getAttribute('aria-selected')==='true','active descendant');
   key(box,'Enter');await turn();check(box.value==='United States — Kansas'&&box.getAttribute('aria-expanded')==='false','keyboard pick');
   type(host,'birthplace','Kanpur');await wait(()=>host.querySelector('[data-place-more]'));key(box,'Escape');await turn();check(box.getAttribute('aria-expanded')==='false','escape');
   check(f.calls.every(c=>c.action==='searchPlaces'),'navigation saved profile');
  },context,{request:(_action,payload)=>geo.search(payload.query,payload.language_code,payload.page)});
 }],
 ['OU06','Empty filtered page plus failed More shows explicit error and retries the failed page; locale retains open query',async(context={})=>{
  let calls=0;
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   type(host,'birthplace','Kan');await wait(()=>host.querySelector('[data-place-more]'));host.querySelector('[data-place-more]').click();await wait(()=>host.querySelector('[data-place-retry]'));
   check(host.textContent.includes(onboardingCopy('GEONAMES_RATE_LIMITED','en')),'empty page hides rate-limit error');
   host.querySelector('[data-place-retry]').click();await wait(()=>host.querySelectorAll('[data-place-option]').length===1);
   check(f.calls.map(c=>c.payload.page).join()==='0,1,1','UI retry page');
   f.locale('tr');await turn();check(host.querySelector('#birthplace').value==='Kan','locale lost query');await wait(()=>host.querySelector('[data-place-more]'));
   check(host.querySelector('#birthplace').getAttribute('aria-expanded')==='true','locale closed search');
  },context,{request:async(_action,payload)=>{calls++;if(payload.page===0)return {places:[],next_page:1};if(calls===2)throw {code:'GEONAMES_RATE_LIMITED'};return {places:[{birthplace_geonames_id:9001,birthplace_name:'Kansas',birthplace_country_code:'US'}],next_page:null};}});
 }],
 ['OU07','SignIn gates provider on age, coalesces double taps, handles cancel/failure and protects Back during pending OAuth',async(context={})=>{
  const gate=deferred();let calls=0,mode='pending';
  const authenticate=(provider,url,age)=>beginProviderAuth(provider,url,age,{loginWithProvider:async()=>{calls++;if(mode==='pending')return gate.promise;if(mode==='cancel')throw {code:'popup_closed_by_user'};throw new Error('private fixture error');}});
  await auditScreen('UNAUTHENTICATED_SIGN_IN',async(f,host,wait,turn)=>{
   host.querySelector('[data-provider=apple]').click();await wait(()=>host.querySelector('#age-error'));check(calls===0,'provider called without age');
   host.querySelector('#age-declaration').click();await turn();const google=host.querySelector('[data-provider=google]');google.click();google.click();
   await wait(()=>host.querySelector('button[data-onboarding-back]').disabled);check(calls===1&&host.querySelector('#age-declaration').disabled,'pending double auth/back');
   gate.resolve(undefined);await wait(()=>!google.disabled);mode='cancel';google.click();await turn();await wait(()=>!google.disabled);check(!host.querySelector('[data-error-code]'),'cancel became error');
   mode='error';google.click();await wait(()=>host.querySelector('[data-error-code=AUTH_PROVIDER_FAILED]'));check(!host.textContent.includes('private fixture'),'raw auth error');
  },context,{props:{authenticate}});
 }],
 ['OU08','Real AuthProvider/router/Onboarding: new account ignores old save, reload uses persistent profile, no logout or OAuth',async(context={})=>{
  const a=await auditBackend('ownerA'),b=await auditBackend('ownerB');await a.request('saveProfile',auditProfile);await b.request('saveProfile',{...auditProfile,birth_date:'1980-06-15',display_name:'B'});
  let owner='ownerA',delaying=true,logouts=0,started=false;const gate=deferred();
  const observed={auth:/** @type {ReturnType<typeof useAuth> | null} */ (null)};
  const request=async(action,payload={})=>{const current=owner==='ownerA'?a:b;const result=await current.request(action,payload);if(action==='saveProfile'&&delaying){started=true;await gate.promise;}return result;};
  const client={app:{getPublicSettings:async()=>({})},auth:{logout:async()=>{logouts++;}},functions:{invoke:async name=>{check(name==='applicationSession','unexpected platform call');return {data:{id:owner,role:'user',authority:'BASE44_NATIVE_V1'}};}}};
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.append(host);const root=createRoot(host);
  function Observer(){observed.auth=useAuth();return null;}
  const render=revision=>root.render(h(AuthProvider,{client},h(MemoryRouter,null,h(Observer),h(Onboarding,{key:revision,request}))));
  const wait=fn=>waitForFixture(fn,host,context),turn=()=>testEventTurn(context.signal);
  try{
   render(0);await wait(()=>stateOf(host)==='AUTHENTICATED_CYCLE_STEP');(/** @type {HTMLButtonElement} */ (host.querySelector('[data-onboarding-back]'))).click();await wait(()=>host.querySelector('input#birth_date'));
   type(host,'birth_date','1992-04-20');await turn();button(host,'Continue').click();await turn();check(started,'save not dispatched');
   owner='ownerB';await observed.auth.checkAppState();await wait(()=>stateOf(host)==='AUTHENTICATED_CYCLE_STEP');gate.resolve(undefined);await turn();await turn();
   (/** @type {HTMLButtonElement} */ (host.querySelector('[data-onboarding-back]'))).click();await wait(()=>host.querySelector('input#birth_date'));check((/** @type {HTMLInputElement} */ (host.querySelector('#birth_date'))).value==='1980-06-15','old save contaminated new owner');
   delaying=false;render(1);await wait(()=>stateOf(host)==='AUTHENTICATED_CYCLE_STEP');(/** @type {HTMLButtonElement} */ (host.querySelector('[data-onboarding-back]'))).click();await wait(()=>host.querySelector('input#birth_date'));
   check((/** @type {HTMLInputElement} */ (host.querySelector('#birth_date'))).value==='1980-06-15'&&logouts===0&&!host.querySelector('[data-auth-shell]'),'reload/session invented login or lost persisted step');
   check(b.rows.user_profile[0].birth_date==='1980-06-15'&&a.rows.user_profile[0].birth_date==='1992-04-20','owner write boundary');
  }finally{gate.resolve(undefined);root.unmount();host.remove();}
 }],
 ['OU09','Held/failed/malformed progress never flashes name; retry uses fresh server progress and account drafts are isolated',async(context={})=>{
  const a=await auditBackend('ownerA'),b=await auditBackend('ownerB');await b.request('saveProfile',{...auditProfile,display_name:null});
  let owner='ownerA',mode='hold';const gate=deferred(),host=document.createElement('div');document.body.append(host);const root=createRoot(host);let auth=/** @type {ReturnType<typeof useAuth>} */ (null);
  const client={app:{getPublicSettings:async()=>({})},auth:{logout:async()=>{}},functions:{invoke:async()=>({data:{id:owner,role:'user',authority:'BASE44_NATIVE_V1',full_name:'Provider name is not a Shinka choice'}})}};
  const request=async action=>{check(action==='hydrate','unexpected initialization/write');if(mode==='hold')return gate.promise;if(mode==='error')throw {code:'ONBOARDING_OPERATION_FAILED'};if(mode==='malformed')return {};return (owner==='ownerA'?a:b).request('hydrate');};
  function Observer(){auth=useAuth();return null;}
  const wait=fn=>waitForFixture(fn,host,context),turn=()=>testEventTurn(context.signal);
  try {
   root.render(h(AuthProvider,{client},h(MemoryRouter,null,h(Observer),h(Onboarding,{request}))));await wait(()=>auth?.isAuthenticated);await turn();
   check(!host.querySelector('#display_name,[data-provider]'));
   mode='error';gate.resolve({});await wait(()=>host.querySelector('[role=alert]'));check(!host.querySelector('#display_name'));
   button(host,'Retry').click();await wait(()=>host.textContent.includes('ONBOARDING_OPERATION_FAILED'));check(!host.querySelector('#display_name'));
   mode='malformed';button(host,'Retry').click();await wait(()=>host.textContent.includes('ONBOARDING_READBACK_CONFLICT'));
   mode='ok';button(host,'Retry').click();await wait(()=>host.querySelector('#display_name'));check((/** @type {HTMLInputElement} */ (host.querySelector('#display_name'))).value==='','provider name leaked');
   type(host,'display_name','Old draft');await turn();owner='ownerB';await auth.checkAppState();await wait(()=>stateOf(host)==='AUTHENTICATED_CYCLE_STEP');
   check(!host.querySelector('#display_name')&&b.rows.user_profile[0].display_name===null);
  }finally{gate.resolve({});root.unmount();host.remove();}
 }],
 ['OU10','Deletion session denial and open consent cleanup route to privacy without onboarding or mutation',async(context={})=>{
  for(const phase of ['session','hydrate']){
   const host=document.createElement('div');document.body.append(host);const root=createRoot(host);let reads=0;
   const client={app:{getPublicSettings:async()=>({})},auth:{logout:async()=>{throw new Error('unexpected logout');}},functions:{invoke:async()=>{if(phase==='session')throw {response:{status:403,data:{error_code:'ACCOUNT_DELETION_IN_PROGRESS'}}};return {data:{id:'ownerA',role:'user',authority:'BASE44_NATIVE_V1'}};}}};
   const request=async action=>{reads++;check(action==='hydrate');throw {code:'HEALTH_DELETION_PENDING'};};
   try{
    root.render(h(AuthProvider,{client},h(MemoryRouter,null,h(Routes,null,h(Route,{path:'/',element:h(ProtectedRoute,{unauthenticatedElement:h('p',{'data-login':true})},h(Onboarding,{request}))}),h(Route,{path:'/account-privacy',element:h('p',{'data-privacy':true},'Privacy')})))));
    await waitForFixture(()=>host.querySelector('[data-privacy]'),host,context);check(!host.querySelector('[data-login],#display_name,[data-provider]')&&reads===(phase==='session'?0:1));
   }finally{root.unmount();host.remove();}
  }
 }],

 ['OU11','Account switch during held hydrate suppresses the old account name result; each admission hydrates once',async(context={})=>{
  const a=await auditBackend('ownerA'),b=await auditBackend('ownerB');await b.request('saveProfile',{...auditProfile,display_name:'Saved B'});
  let owner='ownerA',auth=/** @type {ReturnType<typeof useAuth>} */ (null);const gate=deferred(),reads=[];
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const client={app:{getPublicSettings:async()=>({})},auth:{logout:async()=>{}},functions:{invoke:async()=>({data:{id:owner,role:'user',authority:'BASE44_NATIVE_V1'}})}};
  const request=async action=>{check(action==='hydrate');const actor=owner;reads.push(actor);if(actor==='ownerA')await gate.promise;return (actor==='ownerA'?a:b).request(action);};
  function Observer(){auth=useAuth();return null;}
  const wait=fn=>waitForFixture(fn,host,context);
  try{
   root.render(h(AuthProvider,{client},h(MemoryRouter,null,h(Observer),h(Onboarding,{request}))));await wait(()=>reads.length===1);check(!host.querySelector('#display_name'));
   owner='ownerB';await auth.checkAppState();await wait(()=>stateOf(host)==='AUTHENTICATED_CYCLE_STEP');
   gate.resolve(undefined);await testEventTurn(context.signal);await testEventTurn(context.signal);
   check(stateOf(host)==='AUTHENTICATED_CYCLE_STEP'&&!host.querySelector('#display_name')&&reads.join()==='ownerA,ownerB','old hydrate was applied or admission duplicated');
  }finally{gate.resolve(undefined);root.unmount();host.remove();}
 }],

];
