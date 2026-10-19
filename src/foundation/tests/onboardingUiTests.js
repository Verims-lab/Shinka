import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import OnboardingFixture from './OnboardingTestScreen';
import { check } from './dataModelTests';
import { findUnlabeledControls } from '../probes/domProbes';
const pause=()=>new Promise(resolve=>setTimeout(resolve,50));
async function probe(step,width,run){
  const frame=document.createElement('iframe');frame.title='Onboarding synthetic UI probe';
  Object.assign(frame.style,{position:'fixed',left:'-10000px',width:`${width}px`,height:'640px',border:'0'});
  document.body.appendChild(frame);
  const doc=frame.contentDocument;
  doc.open();doc.write('<!doctype html><html><head></head><body></body></html>');doc.close();
  for(const style of Array.from(document.querySelectorAll('style,link[rel=stylesheet]')))doc.head.appendChild(style.cloneNode(true));
  const host=doc.createElement('div');doc.body.appendChild(host);const root=createRoot(host);
  root.render(createElement(OnboardingFixture,{step}));
  try{
    const deadline=Date.now()+15000;
    while(!frame.contentDocument?.querySelector('[data-onboarding-state]')){if(Date.now()>deadline)throw new Error('ONBOARDING_PROBE_TIMEOUT');await pause();}
    while(Array.from(doc.querySelectorAll('link[rel=stylesheet]')).some(link=>!('sheet' in link)||!link.sheet)){if(Date.now()>deadline)throw new Error('ONBOARDING_STYLE_TIMEOUT');await pause();}
    await run(frame.contentDocument,frame.contentWindow);
  }finally{root.unmount();frame.remove();}
}
function input(doc,id,value){const el=doc.getElementById(id);Object.getOwnPropertyDescriptor(doc.defaultView.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));}
const button=(doc,text)=>Array.from(doc.querySelectorAll('button')).find(b=>b.textContent===text);
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_UI_TESTS=[
 ['U01','Six onboarding screens fit 360/430px with named controls and 17px inputs',async()=>{
  for(const width of [360,430])for(const step of ['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_NAME','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP','FIRST_SHINKA_DEPENDENCY'])await probe(step,width,async(doc,win)=>{
    check(doc.documentElement.scrollWidth<=width+1,`${step} overflow ${width}`);check(findUnlabeledControls(doc.querySelector('main')).length===0,`${step} labels`);
    for(const el of doc.querySelectorAll('button'))check(el.getBoundingClientRect().height>=44,'touch target');
    for(const el of doc.querySelectorAll('input:not([type=checkbox])')){check(parseFloat(win.getComputedStyle(el).fontSize)>=16,`${step} ${el.id} input font ${win.getComputedStyle(el).fontSize}`);el.focus();el.scrollIntoView({block:'center'});check(doc.activeElement===el,'focus');}
  });}],
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
];
