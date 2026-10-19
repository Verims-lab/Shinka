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
  Object.assign(frame.style,{position:'fixed',left:'-10000px',width:`${width}px`,height:'640px',border:'0'});
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
async function geoNamesUiFixture(fetcher){
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
const searchButton=doc=>doc.querySelector(`button[aria-label="${ONBOARDING_COPY.en.birthplace}"]`);
const clearButton=doc=>doc.querySelector(`button[aria-label="${ONBOARDING_COPY.en.skip}"]`);
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
 ['U04','DOB errors focus field; typed birthplace blocked; clearing allows NULL save',async()=>{await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
  check(doc.querySelector('#birth_time').value==='');button(doc,'Continue').click();await pause();check(doc.activeElement.id==='birth_date'&&doc.querySelector('#birth_date-error'),`DOB focus ${doc.activeElement.id} error ${doc.querySelector('[role=alert]')?.textContent}`);input(doc,'birth_date','1990-01-01');input(doc,'birthplace','unselected');await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('#birthplace-error'),`place error ${doc.querySelector('[role=alert]')?.textContent}`);input(doc,'birthplace','');await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP',`profile save ${doc.querySelector('[role=alert]')?.textContent}`);
 });}],
 ['U05','Cycle placeholders stay blank; consent unchecked; skip reaches finite dependency',async()=>{await probe('AUTHENTICATED_CYCLE_STEP',430,async doc=>{
  check(doc.querySelector('#period_duration_days').value===''&&doc.querySelector('#period_duration_days').placeholder==='5');check(doc.querySelector('#initial_cycle_length_days').value===''&&doc.querySelector('#initial_cycle_length_days').placeholder==='28');check(!doc.querySelector('#health_consent').checked);button(doc,'Skip for now').click();await pause();check(doc.querySelector('[data-dependency]')?.textContent==='FIRST_SHINKA_ENGINE_REQUIRED'&&!doc.querySelector('.animate-spin'));
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
    check(doc.querySelector('#birthplace').value==='Fixture City'&&doc.querySelector('#birth_time').value==='');button(doc,'Continue').click();await pause();
    check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    check(f.rows.user_profile.length===1&&saved.sun_sign_code==='CAPRICORN'&&saved.birthplace_geonames_id===123&&saved.display_name==='Ada');
  },{profileOverride:saved,requestOverride});
 }],
 ['U09','Valid search invokes onboarding; short query blocked; selected result saves structured fields',async()=>{
  let release;const requests=[];
  const {f,calls,requestOverride}=await geoNamesUiFixture(async url=>{requests.push(url);return url.pathname==='/searchJSON'?new Promise(resolve=>{release=()=>resolve(Response.json({geonames:[fixturePlace]}));}):Response.json(fixturePlace);});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    for(const query of ['', 'a']){input(doc,'birthplace',query);await pause();check(searchButton(doc).disabled);searchButton(doc).click();await pause();check(calls.length===0);}
    input(doc,'birthplace','  Fixture   City  ');await pause();check(!searchButton(doc).disabled&&calls.length===0,'typing waits for explicit search');
    searchButton(doc).click();await pause();check(calls.length===1&&calls[0].action==='searchPlaces'&&searchButton(doc).disabled&&searchButton(doc).getAttribute('aria-busy')==='true');
    check(!JSON.stringify(calls).includes('username')&&requests[0].searchParams.get('q')==='Fixture City');
    release();await pause();check(searchButton(doc).getAttribute('aria-busy')==='false'&&button(doc,'Fixture City, TR'));
    input(doc,'birth_date','1990-01-01');await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('#birthplace-error')&&f.rows.user_profile.length===0,'unselected text cannot persist');
    button(doc,'Fixture City, TR').click();await pause();check(doc.querySelector('#birthplace').value==='Fixture City'&&!doc.querySelector('ul'));
    button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    const saved=f.rows.user_profile[0],expected=normalizeGeoNamesPlace(fixturePlace);check(BIRTHPLACE_FIELDS.every(key=>saved[key]===expected[key]));
    const payload=calls.find(call=>call.action==='saveProfile');check(payload.birthplace_geonames_id===123&&!('query' in payload)&&!('birthplace_name' in payload));
    check(!JSON.stringify(saved).includes('synthetic-ui-credential'));
  },{requestOverride});
 }],
 ['U10','Empty/error search shows approved status; clear permits optional empty persistence',async()=>{
  for(const failed of [false,true]){
    const {f,requestOverride}=await geoNamesUiFixture(async()=>failed?Response.json({status:{value:10,message:'private provider text'}}):Response.json({geonames:[]}));
    await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
      input(doc,'birthplace','Fixture');await pause();searchButton(doc).click();await pause();
      check(doc.querySelector('[role=status]').textContent===ONBOARDING_COPY.en[failed?'GEONAMES_UNAVAILABLE':'GEONAMES_EMPTY']);
      check(!doc.querySelector('ul')&&!searchButton(doc).disabled&&!doc.body.textContent.includes('private provider text'));
      clearButton(doc).click();input(doc,'birth_date','1990-01-01');await pause();button(doc,'Continue').click();await pause();
      check(BIRTHPLACE_FIELDS.every(key=>f.rows.user_profile[0][key]===null));
      check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    },{requestOverride});
  }
 }],
 ['U11','Clear removes saved selection and ignores late results before clearing all persisted fields',async()=>{
  let release;
  const {f,requestOverride}=await geoNamesUiFixture(async()=>new Promise(resolve=>{release=()=>resolve(Response.json({geonames:[fixturePlace]}));}));
  const saved={id:'partial-place-fixture',user_id:'ownerA',account_status:'ACTIVE',birth_date:'1990-01-01',birth_time:null,sun_sign_code:null,...normalizeGeoNamesPlace(fixturePlace)};f.rows.user_profile.push(saved);
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    searchButton(doc).click();await pause();clearButton(doc).click();await pause();release();await pause();
    check(doc.querySelector('#birthplace').value===''&&!doc.querySelector('ul')&&searchButton(doc).disabled);
    button(doc,'Continue').click();await pause();check(BIRTHPLACE_FIELDS.every(key=>saved[key]===null));
    check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
  },{requestOverride,profileOverride:saved});
 }],
];
