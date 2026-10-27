import { waitForFixture } from "./domWait";
import { placeFetch, placeFetchFor, KAN_CANDIDATES } from './geonamesSearchFixture';
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
// Only the local browser regression runner executes these fixtures.
import { testDelay, cancelledTest } from '../testExecution';
export async function onboardingProbe(step, width, run, props = {}, context = {}) {
  const { signal, stage = () => {} } = context;
  const frame = document.createElement('iframe');
  frame.title = 'Onboarding synthetic UI probe';
  frame.dataset.onboardingFixture = 'true';
  Object.assign(frame.style, { position:'fixed', left:'-10000px', width:`${width}px`, height:`${props.probeHeight || 640}px`, border:'0' });
  let root, cleaned = false;
  const cleanup = () => { if (cleaned) return; cleaned = true; root?.unmount(); frame.remove(); };
  const wait = async predicate => {
    const deadline = performance.now() + 15000;
    while (!predicate()) {
      if (signal?.aborted) throw cancelledTest();
      if (performance.now() > deadline) throw new Error('ONBOARDING_PROBE_TIMEOUT');
      await testDelay(50, signal);
    }
    if (signal?.aborted) throw cancelledTest();
  };
  signal?.addEventListener('abort', cleanup, { once:true });
  try {
    if (signal?.aborted) throw cancelledTest();
    stage('FRAME_CREATE'); document.body.appendChild(frame);
    const doc = frame.contentDocument;
    doc.open(); doc.write('<!doctype html><html><head></head><body></body></html>'); doc.close();
    for (const style of Array.from(document.querySelectorAll('style,link[rel=stylesheet]'))) doc.head.appendChild(style.cloneNode(true));
    stage('CSS_WAIT');
    await wait(() => Array.from(doc.querySelectorAll('link[rel=stylesheet]')).every(link => 'sheet' in link && !!link.sheet));
    const host = doc.createElement('div'); doc.body.appendChild(host); root = createRoot(host);
    stage('FIXTURE_RENDER'); root.render(createElement(OnboardingFixture, {step, ...props}));
    await wait(() => !!doc.querySelector('[data-onboarding-state]'));
    stage('INTERACTION'); await run(doc, frame.contentWindow);
  } finally { cleanup(); signal?.removeEventListener('abort', cleanup); }
}
function input(doc,id,value){const el=doc.getElementById(id);Object.getOwnPropertyDescriptor(doc.defaultView.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));}
const button=(doc,text)=>Array.from(doc.querySelectorAll('button')).find(b=>b.textContent===text);
// Real UI -> service -> HTTP handler -> provider adapter -> production persistence;
// only the SDK transport and outbound provider HTTP response are synthetic.
async function geoNamesUiFixture(fetcher=placeFetch){
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
// Combobox helpers: typing waits out the real debounce; picking is an explicit click.
const typePlace=(doc,text)=>input(doc,'birthplace',text);
async function pickPlace(doc,id,context={}){
  await waitForFixture(()=>doc.querySelector(`[data-place-option="${id}"]`),doc.body,context);
  doc.querySelector(`[data-place-option="${id}"]`).click();
}
const clearButton=doc=>doc.querySelector('[data-place-clear]');
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_UI_TESTS=[
 ['U01','EN/TR six screens fit 360/430px with named controls and 17px inputs',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  for(const language of ['en','tr'])for(const width of [360,430])for(const step of ['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_NAME','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP','FIRST_SHINKA_DEPENDENCY'])await probe(step,width,async(doc,win)=>{
    check(doc.documentElement.scrollWidth<=width+1,`${step} overflow ${width}`);check(findUnlabeledControls(doc.querySelector('main')).length===0,`${step} labels`);
    for(const el of doc.querySelectorAll('button'))check(el.getBoundingClientRect().height>=44,'touch target');
    for(const el of doc.querySelectorAll('input:not([type=checkbox])')){check(parseFloat(win.getComputedStyle(el).fontSize)>=16,`${step} ${el.id} input font ${win.getComputedStyle(el).fontSize}`);el.focus();el.scrollIntoView({block:'center'});check(doc.activeElement===el,'focus');}
  },{language});}],
 ['U02','Introduction → name → sign-in; invalid name stays inline; skip clears it',async(context={})=>{const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);await probe('UNAUTHENTICATED_INTRO',360,async doc=>{
  button(doc,'Begin').click();await pause();input(doc,'display_name','x'.repeat(51));await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('#display_name-error')?.textContent==='Please enter a shorter name');button(doc,'Prefer not to say').click();await pause();check(doc.querySelectorAll('[data-provider]').length===2&&!doc.querySelector('#age-declaration').checked);
 });}],
 ['U03','18+ error is associated; only Apple/Google exposed and failure safe',async(context={})=>{const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);await probe('UNAUTHENTICATED_SIGN_IN',360,async doc=>{
  check([...doc.querySelectorAll('[data-provider]')].map(e=>e.getAttribute('data-provider')).join()==='apple,google');doc.querySelector('[data-provider=apple]').click();await pause();check(doc.querySelector('#age-error')?.textContent==='Please confirm that you are 18 or older');doc.querySelector('#age-declaration').click();await pause();doc.querySelector('[data-provider=google]').click();await pause();check(doc.querySelector('[data-error-code]')?.textContent==='We couldn’t sign you in. Please try again');check(!doc.querySelector('input[type=password]'));
 });}],
 ['U04','DOB errors focus field; typed-but-unselected birthplace blocked; clearing allows NULL save',async(context={})=>{const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
  check(doc.querySelector('#birth_time').value==='');button(doc,'Continue').click();await pause();check(doc.activeElement.id==='birth_date'&&doc.querySelector('#birth_date-error'),`DOB focus ${doc.activeElement.id} error ${doc.querySelector('[role=alert]')?.textContent}`);input(doc,'birth_date','1990-01-01');typePlace(doc,'Kansas');await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('#birthplace-error'),`place error ${doc.querySelector('[role=alert]')?.textContent}`);clearButton(doc).click();await pause();button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP',`profile save ${doc.querySelector('[role=alert]')?.textContent}`);
 });}],
 ['U05','Cycle placeholders stay blank; consent unchecked; skip reaches finite dependency',async(context={})=>{const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);await probe('AUTHENTICATED_CYCLE_STEP',430,async doc=>{
  check(doc.querySelector('#period_duration_days').value===''&&doc.querySelector('#period_duration_days').placeholder==='5');check(doc.querySelector('#initial_cycle_length_days').value===''&&doc.querySelector('#initial_cycle_length_days').placeholder==='28');check(!doc.querySelector('#health_consent').checked);button(doc,'Skip for now').click();await pause();check(doc.querySelector('[data-dependency="FIRST_SHINKA_ENGINE_REQUIRED"]')&&doc.querySelector('[data-daily-state="notReady"]')&&!doc.querySelector('.animate-spin'));
 });}],
 ['U06','Real adapter storage failure keeps UI/form pending; verified retry advances once',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  const f=sdkOnboardingFixture();await onboardingOperation(f.client,{action:'initialize',action_id:'ui-production-fixture',language_code:'en',timezone:'Europe/Istanbul'});f.fail('user_profile',true);
  let pendingName='Ada';const pendingOverride={read:()=>pendingName,save:value=>{pendingName=value;return true;},clear:()=>{pendingName=null;}};
  const requestOverride=(action,payload={})=>onboardingOperation(f.client,{...payload,action},{now:()=>new Date(NOW)});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    input(doc,'birth_date','1990-01-01');await pause();button(doc,'Continue').click();await pause();
    check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_PROFILE_REQUIRED');check(doc.querySelector('[data-onboarding-error]').textContent==='ONBOARDING_WRITE_UNCONFIRMED'&&pendingName==='Ada');
    f.fail(null);button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');check(pendingName===null&&f.rows.user_profile.length===1&&!doc.body.textContent.includes('SUN_SIGN_RULE_REQUIRED'));
  },{requestOverride,pendingOverride});
 }],
 ['U07','Approved TR consent is explicit, unchecked and separate from age',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  await probe('UNAUTHENTICATED_SIGN_IN',360,async doc=>{check(doc.querySelector('label[for=age-declaration]').textContent===ONBOARDING_COPY.tr.age&&!doc.querySelector('#age-declaration').checked);},{language:'tr'});
  await probe('AUTHENTICATED_CYCLE_STEP',360,async doc=>{
    check(doc.querySelector('label[for=health_consent]').textContent===ONBOARDING_COPY.tr.health_consent&&!doc.querySelector('#health_consent').checked);
    input(doc,'period_start_date','2026-10-01');await pause();button(doc,'Bitir').click();await pause();check(doc.querySelector('#health_consent-error').textContent===ONBOARDING_COPY.tr.CONSENT_REQUIRED);
    doc.querySelector('#health_consent').click();await pause();button(doc,'Bitir').click();await pause();check(doc.querySelector('[data-dependency]'));
  },{language:'tr'});
 }],
 ['U08','Reloaded partial profile preserves structured birthplace through Sun completion',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  const f=sdkOnboardingFixture();await onboardingOperation(f.client,{action:'initialize',language_code:'en',timezone:'Europe/Istanbul'});
  const saved={id:'partial-fixture',user_id:'ownerA',account_status:'ACTIVE',display_name:'Ada',birth_date:'1990-01-01',birth_time:null,sun_sign_code:null,...normalizeGeoNamesPlace(fixturePlace)};f.rows.user_profile.push(saved);
  const requestOverride=(action,payload={})=>onboardingOperation(f.client,{...payload,action},{now:()=>new Date(NOW),geoNames:{resolve:async()=>normalizeGeoNamesPlace(fixturePlace)}});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    check(doc.querySelector('#birthplace')?.value.includes('Fixture City')&&doc.querySelector('#birth_time').value==='');button(doc,'Continue').click();await pause();
    check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    check(f.rows.user_profile.length===1&&saved.sun_sign_code==='CAPRICORN'&&saved.birthplace_geonames_id===123&&saved.display_name==='Ada');
  },{profileOverride:saved,requestOverride});
 }],
 ['U09','Combobox: typed query, explicit pick of an A record saves server-resolved fields; editing text drops the old ID',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  const requests=[];
  const {f,calls,requestOverride}=await geoNamesUiFixture(async url=>{requests.push(url);return placeFetch(url);});
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    const box=doc.querySelector('#birthplace');
    check(box.getAttribute('role')==='combobox'&&!doc.querySelector('#place-countries')&&doc.querySelector('label[for=birthplace]'));
    input(doc,'birth_date','1990-01-01');typePlace(doc,'Kan');await pickPlace(doc,9001,context);await pause();
    check(box.value==='United States — Kansas'&&calls.filter(c=>c.action==='searchPlaces').length===1&&f.rows.user_profile.length===0,'pick does not save');
    typePlace(doc,'United States — Kansa');await pause();button(doc,'Continue').click();await pause();
    check(doc.querySelector('#birthplace-error')&&f.rows.user_profile.length===0,'edited text cannot keep old ID');
    typePlace(doc,'Kansas');await pickPlace(doc,9001,context);await pause();
    button(doc,'Continue').click();await pause();check(doc.querySelector('[data-onboarding-state]').getAttribute('data-onboarding-state')==='AUTHENTICATED_CYCLE_STEP');
    const saved=f.rows.user_profile[0];check(saved.birthplace_geonames_id===9001&&saved.birthplace_name==='Kansas'&&saved.birthplace_country_code==='US');
    const payload=calls.find(call=>call.action==='saveProfile');check(!('query' in payload)&&!('birthplace_name' in payload));
    check(requests.some(url=>url.pathname==='/getJSON'&&url.searchParams.get('geonameId')==='9001')&&!JSON.stringify(saved).includes('synthetic-ui-credential'));
  },{requestOverride});
 }],
 ['U10','Short, empty, error and rate-limit states differ; retry is explicit; empty field persists NULLs',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  for(const failed of [false,true]){
    let searches=0;
    const {f,requestOverride}=await geoNamesUiFixture(async url=>{
      if(url.pathname==='/searchJSON')searches++;
      if(failed)return Response.json({status:{value:10,message:'private provider text'}});
      return Response.json({geonames:[],totalResultsCount:0});
    });
    await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
      typePlace(doc,'Ka');await pause();check(doc.querySelector('[data-place-status=SHORT]')&&searches===0);
      typePlace(doc,'Kanx');await waitForFixture(()=>doc.querySelector('[data-place-status=READY],[data-place-status=ERROR]'),doc.body,context);
      if(failed){const before=searches;check(doc.body.textContent.includes(ONBOARDING_COPY.en.placeError));await pause();check(searches===before);doc.querySelector('[data-place-retry]').click();await pause();await pause();check(searches===before+1);}
      else check(doc.body.textContent.includes(ONBOARDING_COPY.en.placeEmpty));
      check(!doc.body.textContent.includes('private provider text'));clearButton(doc).click();input(doc,'birth_date','1990-01-01');await pause();button(doc,'Continue').click();await pause();
      check(BIRTHPLACE_FIELDS.every(key=>f.rows.user_profile[0][key]===null));
    },{requestOverride});
  }
 }],
 ['U11','Saved birthplace shown without provider calls; explicit clear ignores late results and persists all NULLs',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  let release,calls=0,started;
  const providerStarted=new Promise(resolve=>{started=resolve;});
  const {f,requestOverride}=await geoNamesUiFixture(async url=>{calls++;started();return new Promise(resolve=>{release=()=>placeFetch(url).then(resolve);});});
  const saved={id:'partial-place-fixture',user_id:'ownerA',account_status:'ACTIVE',birth_date:'1990-01-01',birth_time:null,sun_sign_code:null,...normalizeGeoNamesPlace(fixturePlace)};f.rows.user_profile.push(saved);
  await probe('AUTHENTICATED_PROFILE_REQUIRED',360,async doc=>{
    check(doc.querySelector('#birthplace').value.includes('Fixture City')&&calls===0);
    typePlace(doc,'Kansas');await providerStarted;check(calls===1,'one provider request');
    clearButton(doc).click();await pause();release();await pause();
    check(doc.querySelector('#birthplace').value===''&&!doc.querySelector('[data-place-option]'));
    button(doc,'Continue').click();await pause();check(BIRTHPLACE_FIELDS.every(key=>saved[key]===null));
  },{requestOverride,profileOverride:saved});
 }],
 ['U12','TR/EN combobox: ARIA relations, arrow/Enter/Escape keyboard, no automatic selection, fits mobile/desktop',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
  for(const language of ['tr','en'])for(const width of [360,1280]){
    const {requestOverride}=await geoNamesUiFixture();
    await probe('AUTHENTICATED_PROFILE_REQUIRED',width,async(doc,win)=>{
      const box=doc.querySelector('#birthplace');box.focus();typePlace(doc,'Kan');
      await waitForFixture(()=>doc.querySelectorAll('[role=option]').length>0,doc.body,context);
      check(box.getAttribute('aria-expanded')==='true'&&box.getAttribute('aria-controls')==='birthplace-listbox'&&doc.querySelector('#birthplace-listbox[role=listbox]'));
      check(!box.getAttribute('aria-activedescendant'),'no automatic first selection');
      const key=k=>box.dispatchEvent(new win.KeyboardEvent('keydown',{key:k,bubbles:true}));
      key('ArrowDown');await pause();const first=box.getAttribute('aria-activedescendant');check(first&&doc.getElementById(first).getAttribute('aria-selected')==='true');
      key('ArrowDown');key('ArrowUp');await pause();check(box.getAttribute('aria-activedescendant')===first&&box.value==='Kan','navigation never selects');
      key('Escape');await pause();check(box.getAttribute('aria-expanded')==='false');
      key('ArrowDown');await pause();key('ArrowDown');await pause();key('Enter');await pause();check(box.value!=='Kan'&&box.getAttribute('aria-expanded')==='false');
      check(doc.documentElement.scrollWidth<=width+1&&findUnlabeledControls(doc.querySelector('main')).length===0&&parseFloat(win.getComputedStyle(box).fontSize)>=16);
      check(doc.body.textContent.includes(ONBOARDING_COPY[language].birthplace));
    },{language,requestOverride});
  }
 }],
 ['U13','Small portrait, landscape, reduced viewport and enlarged text keep fields and submit reachable',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context), pause=()=>testDelay(50,context.signal);
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
 ['U14','Long Turkish same-name results stay distinct by ID with path context, labels and bounded DOM',async(context={})=>{
  const probe=(...args)=>onboardingProbe(args[0],args[1],args[2],args[3],context);
  const long='İğdır Şişli Çeşme Ömerli Uzun Kan Yer Adı '.repeat(4).trim();
  const rows=Array.from({length:50},(_,i)=>({...KAN_CANDIDATES[2],geonameId:40000+i,name:long,adminName1:`Bölge ${i}`}));
  const {requestOverride}=await geoNamesUiFixture(placeFetchFor(rows));
  for (const width of [320,1024]) await probe('AUTHENTICATED_PROFILE_REQUIRED',width,async doc=>{
    typePlace(doc,'Kan');await waitForFixture(()=>doc.querySelectorAll('[data-place-option]').length===50,doc.body,context);
    const options=[...doc.querySelectorAll('[data-place-option]')];
    check(new Set(options.map(o=>o.textContent)).size===50&&options[0].textContent.includes('Bölge 0'));
    check(doc.documentElement.scrollWidth<=width+1&&doc.querySelectorAll('*').length<450&&findUnlabeledControls(doc.querySelector('main')).length===0);
  },{language:'tr',requestOverride});
 }],
 ['U15','ON-04/ON-05 fixtures render the layered onboarding shell in EN/TR without overflow',async(context={})=>{
  for(const language of ['en','tr'])for(const step of ['AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP'])await onboardingProbe(step,360,async(doc,win)=>{
   const shell=doc.querySelector('.shinka-onboarding');check(shell,`${language} ${step} shell`);
   const img=win.getComputedStyle(shell).backgroundImage;
   check((img.match(/radial-gradient/g)||[]).length===5&&/linear-gradient/.test(img),`${language} ${step} layers`);
   check(doc.documentElement.scrollWidth<=361,`${language} ${step} overflow`);
  },{language},context);
 }],
 ['U16','ON-01 shows all three intro rows with descriptions together in EN/TR; Begin goes to ON-02 once; no overflow at 320/360',async(context={})=>{
  const expect={en:['Your cycle','The Moon','Your birth chart'],tr:['Döngün','Ay','Doğum haritan']};
  for(const language of ['en','tr'])for(const width of [320,360])await onboardingProbe('UNAUTHENTICATED_INTRO',width,async(doc,win)=>{
   const rows=[...doc.querySelectorAll('[data-intro-row]')];check(rows.length===3,`${language} rows ${rows.length}`);
   rows.forEach((row,i)=>{const spans=row.querySelectorAll('span.block');check(spans[0]?.textContent===expect[language][i]&&spans[1]?.textContent.trim().length>0,`${language} row ${i}`);});
   check(doc.querySelector('img.shinka-intro-art')?.getAttribute('aria-hidden')==='true','decorative art hidden');
   check(doc.documentElement.scrollWidth<=width+1,`${language} ${width} overflow`);
   const begin=[...doc.querySelectorAll('button')].find(b=>b.textContent.trim()===(language==='en'?'Begin':'Başla'));check(begin,'begin');
   begin.click();await new Promise(r=>win.setTimeout(r,50));check(doc.querySelector('#display_name'),`${language} ON-02 reached`);check(!doc.querySelector('[data-onboarding-intro]'),'intro left');
  },{language},context);
 }],
 ['U18','ON-01–ON-05 share header/art/subtitle, steps 1–5 in order, back on ON-02/ON-03/ON-05 (not ON-04), Finish on ON-05, no Account & Privacy',async(context={})=>{
  const states=['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_NAME','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP'];
  for(const language of ['en','tr'])for(const [i,state] of states.entries())await onboardingProbe(state,360,async doc=>{
   const c=ONBOARDING_COPY[language];
   check(doc.querySelector('[data-onboarding-step]')?.textContent===c.stepOf.replace('{n}',String(i+1)),`${language} ${state} step`);
   check(Boolean(doc.querySelector('[data-onboarding-back]'))===(i===1||i===2||i===4),`${state} back presence`);
   check(!doc.body.textContent.includes('Account & Privacy')&&!doc.body.textContent.includes('Hesap ve Gizlilik'),`${state} no privacy link`);
   check(doc.documentElement.scrollWidth<=361,`${state} overflow`);
   if(i===4)check(button(doc,c.finish),'Finish label');
  },{language},context);
  await onboardingProbe('FIRST_SHINKA_DEPENDENCY',360,async doc=>check(!doc.querySelector('[data-onboarding-step]'),'preparation unnumbered'),{language:'en'},context);
 }],
 ['U17','ON-04 shows new title/subtitle, 4 of 5, compact birthplace, no Account & Privacy; focus alone does not search; date/time fit 320/360',async(context={})=>{
  const pause=()=>testDelay(50,context.signal);
  for(const language of ['en','tr'])for(const width of [320,360])await onboardingProbe('AUTHENTICATED_PROFILE_REQUIRED',width,async doc=>{
   const c=ONBOARDING_COPY[language];
   check(doc.querySelector('h1').textContent===c.aboutTitle&&doc.body.textContent.includes(c.aboutSubtitle),`${language} title`);
   check(doc.querySelector('[data-onboarding-step]')?.textContent===c.stepOf.replace('{n}','4'),`${language} step`);
   check(!doc.body.textContent.includes('Account & Privacy')&&!doc.body.textContent.includes('Hesap ve Gizlilik'),'no privacy link on ON-04');
   check(doc.querySelector('#birthplace[role=combobox]')&&!doc.querySelector('#place-countries')&&!doc.querySelector('[role=listbox]'),'single combobox, popup closed');
   for(const id of ['birth_date','birth_time']){const el=doc.querySelector(`#${id}`),box=el.closest('.shinka-framed-field').getBoundingClientRect(),r=el.getBoundingClientRect();check(r.right<=box.right+0.5&&r.left>=box.left-0.5,`${id} inside frame ${width}`);check(doc.querySelector(`label[for=${id}]`),`${id} label`);}
   check(doc.documentElement.scrollWidth<=width+1,`${language} ${width} overflow`);
   doc.querySelector('#birthplace').focus();await pause();check(!doc.querySelector('[role=listbox]'),'focus alone makes no request or popup');
  },{language},context);
 }],
];