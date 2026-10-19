import { hierarchyFetch } from './geonamesHierarchyFixture';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import OnboardingFixture from './OnboardingTestScreen';
import { check, NOW } from './dataModelTests';
import { ONBOARDING_COPY } from '../i18n/onboardingCopy';
import { normalizeGeoNamesPlace, BIRTHPLACE_FIELDS } from '../../../base44/shared/onboardingValidation.js';
import { fixturePlace } from './onboardingFixture';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { onboardingOperation, handleOnboardingRequest } from '../../../base44/shared/onboardingOperations.js';
import { findUnlabeledControls } from '../probes/domProbes';
import { onboardingRequest } from '@/services/onboardingService';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
const pause=()=>new Promise(resolve=>setTimeout(resolve,50));
async function probe(step,width,run,props={}){
  const frame=document.createElement('iframe');frame.title='Onboarding synthetic UI probe';
  Object.assign(frame.style,{position:'fixed',left:'-10000px',width:`${width}px`,height:`${props.probeHeight || 640}px`,border:'0'});
  document.body.appendChild(frame);
  const doc=frame.contentDocument;
  doc.open();doc.write('<!doctype html><html><head></head><body></body></html>');doc.close();
  for(const style of Array.from(document.querySelectorAll('style,link[rel=stylesheet]')))doc.head.appendChild(style.cloneNode(true));
  const host=doc.createElement('div');doc.body.appendChild(host);const root=createRoot(host);
  root.render(createElement(OnboardingFixture,{step,...props}));
  try{
    const deadline=Date.now()+15000;
    while(!frame.contentDocument?.querySelector('[data-onboarding-state]')){if(Date.now()>deadline)throw new Error('ONBOARDING_PROBE_TIMEOUT');await pause();}
    while(Array.from(doc.querySelectorAll('link[rel=stylesheet]')).some(link=>!('sheet' in link)||!link.sheet)){if(Date.now()>deadline)throw new Error('ONBOARDING_STYLE_TIMEOUT');await pause();}
    await run(frame.contentDocument,frame.contentWindow);
  }finally{root.unmount();frame.remove();}
}
function input(doc,id,value){const el=doc.getElementById(id);Object.getOwnPropertyDescriptor(doc.defaultView.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));}
const button=(doc,text)=>Array.from(doc.querySelectorAll('button')).find(b=>b.textContent===text);
// Real UI -> service -> HTTP handler -> provider adapter -> production persistence;
// only the SDK transport and outbound provider HTTP response are synthetic.
async function geoNamesUiFixture(fetcher=hierarchyFetch){
  const f=sdkOnboardingFixture(),calls=[];
  await onboardingOperation(f.client,{action:'initialize',language_code:'en',timezone:'Europe/Istanbul'});
  const dependencies={now:()=>new Date(NOW),geoNames:createGeoNamesAdapter({username:'synthetic-ui-credential',fetcher})};
  const client={functions:{invoke:async(name,body)=>{
    check(name==='onboarding','frontend invocation target');calls.push(body);
    const response=await handleOnboardingRequest(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify(body)}),()=>f.client,dependencies);
    const data=await response.json();if(!response.ok)throw {response:{data}};return {data};
  }}};
  return {f,calls,requestOverride:(action,payload={})=>onboardingRequest(action,payload,client)};
}
function select(doc,id,value){const el=doc.getElementById(id);el.value=String(value);el.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));}
const clearButton=doc=>doc.querySelector('[data-place-clear]');
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_UI_TESTS=[
 ['U01','EN/TR six screens fit 360/430px with named controls and 17px inputs',async()=>{
  for(const language of ['en','tr'])for(const width of [360,430])for(const step of ['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_NAME','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP','FIRST_SHINKA_DEPENDENCY'])await probe(step,width,async(doc,win)=>{
    check(doc.documentElement.scrollWidth<=width+1,`${step} overflow ${width}`);check(findUnlabeledControls(doc.querySelector('main')).length===0,`${step} labels`);
    for(const el of doc.querySelectorAll('button'))check(el.getBoundingClientRect().height>=44,'touch target');
    for(const el of doc.querySelectorAll('input:not([type=checkbox])')){check(parseFloat(win.getComputedStyle(el).fontSize)>=16,`${step} ${el.id} input font ${win.getComputedStyle(el).fontSize}`);el.focus();el.scrollIntoView({block:'center'});check(doc.activeElement===el,'focus');}
  },{language});}],
 ['U02','Introduction → name → sign-in; invalid name stays inline; skip clears it',async()=>{await probe('UNAUTHENTICATED_INTRO',360,async doc=>{
  button(doc,'Begin').click();await pause();input(doc,'display_name','x'.repeat(51));await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('#display_name-error')?.textContent==='Please enter a shorter name');button(doc,'Prefer not to say').click();await pause();check(doc.querySelectorAll('[data-provider]').length===2&&!doc.querySelector('#age-declaration').checked);
 });}],
 ['U03','18+ error is associated; only Apple/Google exposed and failure safe',async()=>{await probe('UNAUTHENTICATED_SIGN_IN',360,async doc=>{
  check([...doc.querySelectorAll('[data-provider]')].map(e=>e.getAttribute('data-provider')).join()==='apple,google');doc.querySelector('[data-provider=apple]').click();await pause();check(doc.querySelector('#age-error')?.textContent==='Please confirm that you are 18 or older');doc.querySelector('#age-declaration').click();await pause();doc.querySelector('[data-provider=google]').click();await pause();check(doc.querySelector('[data-error-code]')?.textContent==='We couldn’t sign you in. Please try again');check(!doc.querySelector('input[type=password]'));
 });}],
 ['U04','DOB errors focus field; incomplete country selection blocked; clearing allows NULL save',async()=>{await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
  check(doc.querySelector('#birth_time').value==='');button(doc,'Continue').click();await pause();check(doc.activeElement.id==='birth_date'&&doc.querySelector('#birth_date-error'),`DOB focus ${doc.activeElement.id} error ${doc.querySelector('[role=alert]')?.textContent}`);input(doc,'birth_date','1990-01-01');select(doc,'place-countries',100);await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('#birthplace-error'),`place error ${doc.querySelector('[role=alert]')?.textContent}`);clearButton(doc).click();await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP',`profile save ${doc.querySelector('[role=alert]')?.textContent}`);
 });}],
 ['U05','Cycle placeholders stay blank; consent unchecked; skip reaches finite dependency',async()=>{await probe('AUTHENTICATED_CYCLE_STEP',430,async doc=>{
  check(doc.querySelector('#period_duration_days').value===''&&doc.querySelector('#period_duration_days').placeholder==='5');check(doc.querySelector('#initial_cycle_length_days').value===''&&doc.querySelector('#initial_cycle_length_days').placeholder==='28');check(!doc.querySelector('#health_consent').checked);button(doc,'Skip for now').click();await pause();check(doc.querySelector('[data-dependency="FIRST_SHINKA_ENGINE_REQUIRED"]')&&doc.querySelector('[data-daily-state="notReady"]')&&!doc.querySelector('.animate-spin'));
 });}],
 ['U06','Real adapter storage failure keeps UI/form pending; verified retry advances once',async()=>{
  const f=sdkOnboardingFixture();await onboardingOperation(f.client,{action:'initialize',action_id:'ui-production-fixture',language_code:'en',timezone:'Europe/Istanbul'});f.fail('user_profile',true);
  let pendingName='Ada';const pendingOverride={read:()=>pendingName,save:value=>{pendingName=value;return true;},clear:()=>{pendingName=null;}};
  const requestOverride=(action,payload={})=>onboardingOperation(f.client,{...payload,action},{now:()=>new Date(NOW)});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    input(doc,'birth_date','1990-01-01');await pause();button(doc,'Continue').click();await pause();
    check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_PROFILE_REQUIRED');check(doc.querySelector('[data-onboarding-error]').textContent==='ONBOARDING_WRITE_UNCONFIRMED'&&pendingName==='Ada');
    f.fail(null);button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');check(pendingName===null&&f.rows.user_profile.length===1&&!doc.body.textContent.includes('SUN_SIGN_RULE_REQUIRED'));
  },{requestOverride,pendingOverride});
 }],
 ['U07','Approved TR consent is explicit, unchecked and separate from age',async()=>{
  await probe('UNAUTHENTICATED_SIGN_IN',360,async doc=>{check(doc.querySelector('label[for=age-declaration]').textContent===ONBOARDING_COPY.tr.age&&!doc.querySelector('#age-declaration').checked);},{language:'tr'});
  await probe('AUTHENTICATED_CYCLE_STEP',360,async doc=>{
    check(doc.querySelector('label[for=health_consent]').textContent===ONBOARDING_COPY.tr.health_consent&&!doc.querySelector('#health_consent').checked);
    input(doc,'period_start_date','2026-10-01');await pause();button(doc,'Devam et').click();await pause();check(doc.querySelector('#health_consent-error').textContent===ONBOARDING_COPY.tr.CONSENT_REQUIRED);
    doc.querySelector('#health_consent').click();await pause();button(doc,'Devam et').click();await pause();check(doc.querySelector('[data-dependency]'));
  },{language:'tr'});
 }],
 ['U08','Reloaded partial profile preserves structured birthplace through Sun completion',async()=>{
  const f=sdkOnboardingFixture();await onboardingOperation(f.client,{action:'initialize',language_code:'en',timezone:'Europe/Istanbul'});
  const saved={id:'partial-fixture',user_id:'ownerA',account_status:'ACTIVE',display_name:'Ada',birth_date:'1990-01-01',birth_time:null,sun_sign_code:null,...normalizeGeoNamesPlace(fixturePlace)};f.rows.user_profile.push(saved);
  const requestOverride=(action,payload={})=>onboardingOperation(f.client,{...payload,action},{now:()=>new Date(NOW),geoNames:{resolve:async()=>normalizeGeoNamesPlace(fixturePlace)}});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    check(doc.querySelector('[data-place-summary]')?.textContent.includes('Fixture City')&&doc.querySelector('#birth_time').value==='');button(doc,'Continue').click();await pause();
    check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    check(f.rows.user_profile.length===1&&saved.sun_sign_code==='CAPRICORN'&&saved.birthplace_geonames_id===123&&saved.display_name==='Ada');
  },{profileOverride:saved,requestOverride});
 }],
 ['U09','Selection-only country → region → district → settlement saves server-resolved structured fields',async()=>{
  const requests=[];
  const {f,calls,requestOverride}=await geoNamesUiFixture(async url=>{requests.push(url);return hierarchyFetch(url);});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    await pause();check(doc.querySelector('#place-countries').value===''&&doc.querySelector('#place-places').disabled);
    check(!doc.querySelector('input#birthplace')&&!doc.querySelector('input[type=search]'));
    select(doc,'place-countries',100);await pause();check(doc.querySelector('#place-0').value==='');
    select(doc,'place-0',1001);await pause();select(doc,'place-1',1002);await pause();
    input(doc,'birth_date','1990-01-01');await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('#birthplace-error')&&f.rows.user_profile.length===0);
    select(doc,'place-places',123);await pause();check(doc.querySelector('[data-place-summary]').textContent.includes('Fixture City'));
    button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    const saved=f.rows.user_profile[0],expected=normalizeGeoNamesPlace(fixturePlace);check(BIRTHPLACE_FIELDS.every(key=>saved[key]===expected[key]));
    const payload=calls.find(call=>call.action==='saveProfile');check(payload.birthplace_geonames_id===123&&!('query' in payload)&&!('birthplace_name' in payload)&&!('country' in payload));
    check(!calls.some(call=>call.action==='searchPlaces')&&!JSON.stringify(calls).includes('username')&&requests.some(url=>url.pathname==='/getJSON'&&url.searchParams.get('geonameId')==='123'));
    check(!JSON.stringify(saved).includes('synthetic-ui-credential'));
  },{requestOverride});
 }],
 ['U10','Empty/error lists differ, retry is explicit, and leaving the field empty permits persistence',async()=>{
  for(const failed of [false,true]){
    let countryCalls=0;
    const {f,requestOverride}=await geoNamesUiFixture(async url=>{
      if(url.pathname==='/countryInfoJSON')countryCalls++;
      if(failed)return Response.json({status:{value:10,message:'private provider text'}});
      return url.pathname==='/searchJSON'?Response.json({geonames:[],totalResultsCount:0}):hierarchyFetch(url);
    });
    await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
      await pause();
      if(failed){check(doc.body.textContent.includes(ONBOARDING_COPY.en['GEONAMES_UNAVAILABLE']));const before=countryCalls;await pause();check(countryCalls===before);button(doc,ONBOARDING_COPY.en.retry).click();await pause();check(countryCalls===before+1);}
      else {select(doc,'place-countries',100);await pause();check(doc.body.textContent.includes(ONBOARDING_COPY.en.placeEmpty)&&doc.body.textContent.includes(ONBOARDING_COPY.en.placeNoRegions));}
      check(!doc.body.textContent.includes('private provider text'));clearButton(doc).click();input(doc,'birth_date','1990-01-01');await pause();button(doc,'Continue').click();await pause();
      check(BIRTHPLACE_FIELDS.every(key=>f.rows.user_profile[0][key]===null));
      check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    },{requestOverride});
  }
 }],
 ['U11','Saved summary survives unavailable hierarchy; explicit clear ignores late lists and persists all NULLs',async()=>{
  let release,calls=0;
  const {f,requestOverride}=await geoNamesUiFixture(async url=>{
    calls++;if(calls===1)return new Promise(resolve=>{release=()=>hierarchyFetch(url).then(resolve);});return hierarchyFetch(url);
  });
  const saved={id:'partial-place-fixture',user_id:'ownerA',account_status:'ACTIVE',birth_date:'1990-01-01',birth_time:null,sun_sign_code:null,...normalizeGeoNamesPlace(fixturePlace)};f.rows.user_profile.push(saved);
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    check(doc.querySelector('[data-place-summary]')&&calls===0);
    button(doc,ONBOARDING_COPY.en.placeChange).click();await pause();check(doc.querySelector('[data-place-summary]'));
    clearButton(doc).click();await pause();release();await pause();
    check(!doc.querySelector('[data-place-summary]')&&doc.querySelector('#place-countries').value===''&&doc.querySelector('#place-places').disabled);
    button(doc,'Continue').click();await pause();check(BIRTHPLACE_FIELDS.every(key=>saved[key]===null));
    check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
  },{requestOverride,profileOverride:saved});
 }],
 ['U12','TR/EN cascading selects fit mobile/desktop, have visible labels, focus and no automatic selections',async()=>{
  for(const language of ['tr','en'])for(const width of [360,1280])await probe('AUTHENTICATED_PROFILE_REQUIRED',width,async(doc,win)=>{
    await pause();select(doc,'place-countries',100);await pause();select(doc,'place-0',1001);await pause();
    check(doc.querySelector('#place-1').value===''&&doc.querySelector('#place-places').value==='');
    check(doc.documentElement.scrollWidth<=width+1&&findUnlabeledControls(doc.querySelector('main')).length===0);
    for(const el of doc.querySelectorAll('select')){check(doc.querySelector(`label[for="${el.id}"]`)&&el.getBoundingClientRect().height>=44&&parseFloat(win.getComputedStyle(el).fontSize)>=16);if(!el.disabled){el.focus();check(doc.activeElement===el);}}
    button(doc,language==='tr'?'EN':'TR').click();await pause();check(doc.querySelector('#place-countries').value==='100'&&doc.querySelector('#place-0').value==='1001');
  },{language});
 }],
 ['U13','Small portrait, landscape, reduced viewport and enlarged text keep fields and submit reachable',async()=>{
  for(const [width,height] of [[320,568],[844,390],[390,320]])for(const language of ['tr','en'])await probe('AUTHENTICATED_PROFILE_REQUIRED',width,async(doc,win)=>{
    await pause();
    for(const el of doc.querySelectorAll('label,p,button'))el.style.fontSize=`${parseFloat(win.getComputedStyle(el).fontSize)*2}px`;
    check(doc.documentElement.scrollWidth<=width+1,`enlarged text overflow ${width}`);
    input(doc,'birth_date','1990-01-01');input(doc,'birth_time','08:30');await pause();
    for(const el of [...doc.querySelectorAll('input:not([type=checkbox]),button[type=submit]')]){
      el.focus();el.scrollIntoView({block:'center'});await pause();
      const rect=el.getBoundingClientRect();check(doc.activeElement===el&&rect.bottom>0&&rect.top<height,`unreachable ${el.id}`);
    }
    check(doc.querySelector('#birth_date').value==='1990-01-01'&&doc.querySelector('#birth_time').value==='08:30');
  },{language,probeHeight:height});
 }],
 ['U14','Long Turkish homonyms keep identity context, ID disambiguation, labels and bounded DOM',async()=>{
  const long='İğdır Şişli Çeşme Ömerli Uzun Yer Adı '.repeat(5);
  const requestOverride=async()=>({options:Array.from({length:300},(_,i)=>({id:i+1,country:'TR',name:long,context:'Türkiye'})),total:300,offset:0,next_offset:null,previous_offset:null});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',320,async doc=>{
    await pause();check(doc.documentElement.scrollWidth<=321);
    const options=[...doc.querySelectorAll('#place-countries option')];
    check(options.length===301&&options[1].textContent.endsWith('#1')&&options[300].textContent.endsWith('#300'));
    check(doc.querySelectorAll('*').length<450&&findUnlabeledControls(doc.querySelector('main')).length===0);
  },{language:'tr',requestOverride});
 }],
];
