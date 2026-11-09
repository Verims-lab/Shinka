import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import FirstShinka from '@/features/daily/FirstShinka';
import { auditProfile } from './onboardingAuditTests';
import { check } from './dataModelTests';
import { auditScreen } from './onboardingAuditUiTests';
import { closureFixture } from './onboardingClosureFixture';
import { onboardingProbe } from './onboardingUiTests';
import { waitForFixture } from './domWait';
import { testEventTurn } from './testClock';
import { BIRTHPLACE_FIELDS } from '../../../base44/shared/onboardingValidation.js';
const input=(host,id,value)=>{const el=host.querySelector(`#${id}`),win=el.ownerDocument.defaultView;Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new win.Event('input',{bubbles:true}));};
const button=(host,text)=>[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
const state=host=>host.querySelector('[data-onboarding-state]')?.getAttribute('data-onboarding-state');
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_CLOSURE_UI_TESTS=[
 ['OV01','Onboarding has no language toggle; actual locale preference input rerenders without losing typed values',async(context={})=>{
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   check(!button(host,'TR')&&!button(host,'EN'),'manual language control');input(host,'birth_date','1980-02-01');input(host,'birth_time','07:30');await turn();
   f.locale('tr');await wait(()=>host.querySelector('main[lang=tr]'));
   check(host.querySelector('#birth_date').value==='1980-02-01'&&host.querySelector('#birth_time').value==='07:30');
   f.locale('en');await wait(()=>host.querySelector('main[lang=en]'));check(!button(host,'TR')&&!button(host,'EN'));
  },context);
 }],
 ['OV02','DOB-only real form/service/native backend -> Skip -> transient error -> Retry -> verified daily; no provider or consent',async(context={})=>{
  const backend=await closureFixture();backend.state.mode='network';
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   host.ownerDocument.querySelector('[data-time-open]').click();await wait(()=>host.ownerDocument.querySelector('[data-time-dialog]'));host.ownerDocument.querySelector('[data-time-cancel]').click();await wait(()=>!host.ownerDocument.querySelector('[data-time-dialog]'));
   host.querySelector('#birthplace').focus();host.querySelector('#birth_date').focus();input(host,'birth_date','1980-02-01');await turn();
   button(host,'Continue').click();await wait(()=>state(host)==='AUTHENTICATED_CYCLE_STEP');
   const profile=backend.rows.user_profile[0];check(profile.birth_time===null&&BIRTHPLACE_FIELDS.every(k=>profile[k]===null));
   button(host,'Skip for now').click();await wait(()=>host.querySelector('[data-daily-state=failure]'));
   check(backend.rows.user_daily_message.length===0&&!f.transitions.some(t=>t.next==='ACTIVE_EXISTING_USER'));
   backend.state.mode='normal';const retry=button(host,'Retry');retry.click();retry.click();await wait(()=>state(host)==='ACTIVE_EXISTING_USER');
   check(backend.state.dailyCalls===2&&backend.rows.user_daily_message.length===1&&backend.rows.user_health_consent.length===0&&backend.providerConstructions()===0);
   const id=backend.rows.user_daily_message[0].id;check((await backend.daily()).daily.id===id&&backend.rows.user_daily_message.length===1);
  },context,{request:backend.request,props:{dailyRequest:backend.daily}});
 }],
 ['OV03','Authenticated ON-04 Back/Continue preserves draft and session; preparation Back ignores late daily and resumes readback',async(context={})=>{
  const backend=await closureFixture();let resolve;const gate=new Promise(r=>{resolve=r;});let dailyCalls=0,auth=0,started=false;
  context.cleanup?.(()=>resolve());
  const dailyRequest=async()=>{dailyCalls++;const result=await backend.daily();if(dailyCalls===1){started=true;await gate;}return result;};
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   input(host,'birth_date','1990-01-01');input(host,'birth_time','23:59');await turn();
   host.querySelector('[data-onboarding-back]').click();await wait(()=>state(host)==='UNAUTHENTICATED_SIGN_IN');
   check(!host.querySelector('[data-provider]')&&f.calls.length===0,'back restarted OAuth or wrote');
   button(host,'Continue').click();await wait(()=>host.querySelector('#birth_date'));check(host.querySelector('#birth_time').value==='23:59');
   button(host,'Continue').click();await wait(()=>host.querySelector('#period_start_date'));button(host,'Skip for now').click();while(!started)await turn();
   host.querySelector('[data-onboarding-back]').click();await wait(()=>state(host)==='UNAUTHENTICATED_SIGN_IN');
   resolve();await turn();await turn();check(state(host)==='UNAUTHENTICATED_SIGN_IN','late response navigated back screen');
   button(host,'Continue').click();await wait(()=>state(host)==='ACTIVE_EXISTING_USER');
   check(auth===0&&dailyCalls===2&&backend.rows.user_daily_message.length===1,'resume did not reconcile same day');
  },context,{profile:{display_name:null},request:backend.request,props:{authenticate:async()=>{auth++;},dailyRequest}});
 }],
 ['OV04','Time keyboard and icon share HH:mm; invalid/incomplete values rejected, cancel preserves, Set and Clear are explicit',async(context={})=>{
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   input(host,'birth_date','1990-01-01');await turn();check(host.querySelector('#birth_time').type==='text','native-only input');
   for(const value of ['24:00','12:60','12:','1']){input(host,'birth_time',value);await turn();button(host,'Continue').click();await wait(()=>host.querySelector('#birth_time-error'));check(f.calls.length===0,'invalid time reached backend');}
   input(host,'birth_time','23:59');await turn();host.ownerDocument.querySelector('[data-time-open]').click();await wait(()=>host.ownerDocument.querySelector('[data-time-dialog]'));
   host.ownerDocument.querySelector('[name=hour]').value='00';host.ownerDocument.querySelector('[data-time-cancel]').click();await wait(()=>!host.ownerDocument.querySelector('[data-time-dialog]'));check(host.querySelector('#birth_time').value==='23:59','cancel overwrote');
   host.ownerDocument.querySelector('[data-time-open]').click();await wait(()=>host.ownerDocument.querySelector('[data-time-dialog]'));host.ownerDocument.querySelector('[name=hour]').value='00';host.ownerDocument.querySelector('[name=minute]').value='00';host.ownerDocument.querySelector('[data-time-set]').click();await wait(()=>!host.ownerDocument.querySelector('[data-time-dialog]'));check(host.querySelector('#birth_time').value==='00:00');
   host.ownerDocument.querySelector('[data-time-open]').click();await wait(()=>host.ownerDocument.querySelector('[data-time-dialog]'));host.ownerDocument.querySelector('[data-time-clear]').click();await wait(()=>!host.ownerDocument.querySelector('[data-time-dialog]'));check(host.querySelector('#birth_time').value==='');
   host.ownerDocument.querySelector('[data-time-open]').click();await wait(()=>host.ownerDocument.querySelector('[data-time-dialog]'));host.ownerDocument.querySelector('[data-time-set]').click();await wait(()=>host.ownerDocument.querySelector('#time-selection-error'));check(host.querySelector('#birth_time').value==='','empty Set invented midnight');
   host.ownerDocument.querySelector('[data-time-cancel]').click();await wait(()=>!host.ownerDocument.querySelector('[data-time-dialog]'));input(host,'birthplace','Ka');await turn();button(host,'Continue').click();await wait(()=>host.querySelector('#birthplace-error'));
   host.querySelector('[data-place-clear]').click();await turn();button(host,'Continue').click();await wait(()=>state(host)==='AUTHENTICATED_CYCLE_STEP');check(f.backend.rows.user_profile[0].birth_time===null);
  },context);
 }],
 ['OV05','App time picker fits 320px/200% text and reduced height, scroll exposes all actions, focus and Escape close only layer',async(context={})=>{
  for(const language of ['en','tr'])await onboardingProbe('AUTHENTICATED_PROFILE_REQUIRED',320,async(doc,win)=>{
   doc.documentElement.style.fontSize='32px';doc.querySelector('[data-time-open]').click();await waitForFixture(()=>doc.querySelector('dialog[open]'),doc.body,context);
   const dialog=doc.querySelector('dialog'),rect=dialog.getBoundingClientRect();check(rect.left>=0&&rect.right<=321&&dialog.scrollWidth<=dialog.clientWidth+1,'picker overflow');
   for(const key of ['set','cancel','clear']){const el=dialog.querySelector(`[data-time-${key}]`);el.scrollIntoView({block:'nearest'});const r=el.getBoundingClientRect();check(r.left>=rect.left&&r.right<=rect.right+1&&r.top>=rect.top&&r.bottom<=rect.bottom+1&&r.height>=44,`${key} clipped`);}
   dialog.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await waitForFixture(()=>!doc.querySelector('dialog'),doc.body,context);await testEventTurn(context.signal);
   check(doc.querySelector('#birth_time').value===''&&state(doc)==='AUTHENTICATED_PROFILE_REQUIRED','Escape changed form');
   check(doc.activeElement===doc.querySelector('[data-time-open]'),'Escape focus not restored');
  },{language,probeHeight:400},context);
 }],
 ['OV06','Account replacement during actual daily request ignores old response and delivers only the current owner readback',async(context={})=>{
  const a=await closureFixture('ownerA'),b=await closureFixture('ownerB');await a.request('saveProfile',auditProfile);await b.request('saveProfile',auditProfile);
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),seen=[];
  let release=(_value=undefined)=>{},started=false;const gate=new Promise(r=>{release=r;});
  const old=async()=>{const result=await a.daily();started=true;await gate;return result;};
  let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;root.unmount();host.remove();};context.cleanup?.(dispose);
  try{
   root.render(h(FirstShinka,{key:'ownerA',language:'en',request:old,onReady:result=>seen.push(result.daily.user_id)}));
   while(!started)await testEventTurn(context.signal);
   root.render(h(FirstShinka,{key:'ownerB',language:'en',request:b.daily,onReady:result=>seen.push(result.daily.user_id)}));
   await waitForFixture(()=>seen.length===1,host,context);release();await testEventTurn(context.signal);await testEventTurn(context.signal);
   check(seen.join()==='ownerB'&&a.rows.user_daily_message.length===1&&b.rows.user_daily_message.length===1,'old account navigated or backend write assumed cancelled');
  }finally{release();dispose();}
 }],
];
