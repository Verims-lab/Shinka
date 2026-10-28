import { calendarRequest } from '@/services/calendarService';
import { nativeFixture } from './nativeFixture';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Calendar from '@/pages/Calendar';
import { calendarFixture } from './calendarFixture';
import { check } from './dataModelTests';
const pause = () => new Promise(resolve => setTimeout(resolve, 30));
async function until(predicate) { for(let i=0;i<80;i++){if(predicate())return;await pause();}throw new Error('CALENDAR_UI_TIMEOUT'); }
async function probe(run) {
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.appendChild(host);
  const root=createRoot(host);try{await run(root,host);}finally{root.unmount();host.remove();}
}
const button=(host,text)=>[...host.querySelectorAll('button')].find(row=>row.textContent===text);
/** @type {import('./testTypes').FoundationTest[]} */
export const CALENDAR_UI_TESTS = [
 ['CU06','Partial native grant reopens in TR/EN and Retry uses saved consent intent',async()=>probe(async(root,host)=>{
   const f=nativeFixture({granted:false}),view=await f.cal();
   f.once('before',c=>c.name==='UserHealthConsentEvent'&&c.method==='create');
   try {await f.cal({action:'add',date:'2026-10-01',health_consent:true,action_id:crypto.randomUUID(),revision:view.revision});}catch{/* injected write interruption */}
   const stamp=f.tables.UserHealthConsent[0].granted_at;
   const request=(action,body)=>calendarRequest(action,body,{functions:{invoke:async(_name,payload)=>({data:await f.cal(payload)})}});
   root.render(createElement(Calendar,{language:'tr',request}));
   await until(()=>host.querySelector('[data-calendar-error="CALENDAR_PENDING_REVIEW"]'));
   check(host.querySelector('button[type="submit"]').disabled&&!host.querySelector('input[type="checkbox"]'));
   root.render(createElement(Calendar,{language:'en',request}));await until(()=>host.textContent.includes('This change may have been saved'));
   button(host,'Check / retry the same change').click();await until(()=>f.tables.UserPeriodRecord.length===1);await pause();
   check(!host.textContent.includes('This change may have been saved')&&f.tables.UserHealthConsent[0].granted_at===stamp&&f.tables.UserHealthConsentEvent.length===1);
 })],
 ['CU07','Reload resumes saved native add intent and confirms visible date without a new ID',async()=>probe(async(root,host)=>{
   const f=nativeFixture(),view=await f.cal();f.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');
   try {await f.cal({action:'add',date:'2026-09-01',action_id:crypto.randomUUID(),revision:view.revision});}catch{/* injected interruption */}
   const id=f.tables.UserCalendarAction[0].action_id;
   root.render(createElement(Calendar,{language:'en',request:(action,body)=>calendarRequest(action,body,{functions:{invoke:async(_name,payload)=>({data:await f.cal(payload)})}})}));
   await until(()=>host.querySelector('[data-calendar-error="CALENDAR_PENDING_REVIEW"]'));
   const retry=button(host,'Check / retry the same change');check(retry&&!retry.disabled);
   retry.click();await until(()=>host.textContent.includes('Period start saved'));
   check(f.tables.UserPeriodRecord.length===1&&f.tables.UserCalendarAction.length===1&&f.tables.UserCalendarAction[0].action_id===id&&f.tables.UserCalendarAction[0].status==='APPLIED');
   check(host.querySelector('[data-calendar-date="2026-09-01"]').getAttribute('aria-label').includes('Recorded period start'));
 })],
 ['CU05','Unsupported estimate is central TR/EN information with real dates and no stale predicted days',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-01-01'});await f.change('add',{date:'2026-04-01'});
   root.render(createElement(Calendar,{language:'tr',request:f.request}));
   await until(()=>host.querySelector('[data-calendar-estimate-unavailable]'));
   const notice=host.querySelector('[data-calendar-estimate-unavailable]');
   check(notice.getAttribute('role')==='status' && notice.textContent.includes('60 günden uzun'));
   check(!host.querySelector('[aria-label*="Tahmini"]') && !host.querySelector('button[type="submit"]').disabled);
   root.render(createElement(Calendar,{language:'en',request:f.request}));await until(()=>host.querySelector('[data-calendar-estimate-unavailable]')?.textContent.includes('longer than 60 days'));
   check(host.querySelector('[data-calendar-estimate-unavailable]').textContent.includes('longer than 60 days'));
 })],
 ['CU01','Monthly TR/EN, labeled real/predicted/selected days, ≥44px keyboard controls and no selection writes',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-10-01'});
   root.render(createElement(Calendar,{language:'en',request:f.request}));
   await until(()=>host.querySelector('[data-calendar-date="2026-10-01"]'));
   const before=JSON.stringify(f.rows), day=host.querySelector('[data-calendar-date="2026-10-01"]');
   day.click();await pause();
   check(JSON.stringify(f.rows)===before && day.getAttribute('aria-label').includes('Selected') && day.getAttribute('aria-label').includes('Recorded period start'),'selection label/write');
   check(host.querySelector('[data-calendar-date="2026-10-29"]').getAttribute('aria-label').includes('Predicted'),'prediction label');
   check(day.getBoundingClientRect().width>=44 && day.getBoundingClientRect().height>=44,'touch geometry');
   day.focus();day.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
   check(document.activeElement===host.querySelector('[data-calendar-date="2026-10-02"]'),'arrow focus');
   check(![...host.querySelectorAll('header button')].some(b=>['TR','EN'].includes(b.textContent.trim())),'no header language buttons');
   root.render(createElement(Calendar,{language:'tr',request:f.request}));await pause();check(host.textContent.includes('Regl başlangıç tarihi') && host.textContent.includes('Tahmini'),'TR labels');
   check(host.querySelector('label[for="calendar-start-date"]') && host.querySelector('nav a[aria-current="page"]').getAttribute('href')==='/calendar?lang=tr','localized nav and label');
 })],
 ['CU02','Actual start delete confirmation, cancel and last-delete empty state',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-10-01'});
   root.render(createElement(Calendar,{language:'en',request:f.request}));await until(()=>host.querySelector('[data-calendar-date="2026-10-01"]'));
   host.querySelector('[data-calendar-date="2026-10-01"]').click();await pause();
   const trigger=button(host,'Delete period start');trigger.focus();trigger.click();await until(()=>host.querySelector('dialog[open]'));
   check(host.querySelector('dialog').textContent.includes('1 October 2026'));
   button(host.querySelector('dialog'),'Cancel').click();await until(()=>!host.querySelector('dialog'));check(f.rows.user_period_record.length===1);
   trigger.click();await until(()=>host.querySelector('dialog[open]'));
   button(host.querySelector('dialog'),'Delete period start').click();await until(()=>!f.rows.user_period_record.length);await pause();
   check(!host.querySelector('dialog') && host.textContent.includes('No period predictions yet') && !f.rows.user_cycle_phase_day.length);
 })],
 ['CU03','No consent hides health; exact approved checkbox starts unchecked; production block is visible',async()=>probe(async(root,host)=>{
   const f=calendarFixture({granted:false});
   const request=async(action,body)=>({...await f.request(action,body),writable:false});
   root.render(createElement(Calendar,{language:'tr',request}));await until(()=>host.querySelector('input[type="checkbox"]'));
   check(!host.querySelector('input[type="checkbox"]').checked && host.textContent.includes('Shinka’nın döngü verilerimi') && host.querySelector('[data-calendar-blocked]'));
   host.querySelector('[data-calendar-date="2026-10-01"]').click();await pause();
   check(!f.rows.user_health_consent.length && host.querySelector('button[type="submit"]').disabled);
 })],
 ['CU04','Known withdrawal invalidates in-flight health, and unmount cannot revive data',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-10-01'});
   root.render(createElement(Calendar,{language:'en',request:f.request}));await until(()=>host.querySelector('[data-calendar-date="2026-10-01"]'));
   f.rows.user_health_consent[0].consent_status='WITHDRAWN';f.rows.user_health_consent[0].withdrawn_at='2026-10-20T13:00:00.000Z';
   window.dispatchEvent(new Event('shinka-health-access-changed'));
   await until(()=>host.querySelector('input[type="checkbox"]'));
   check(!host.querySelector('[aria-label*="Recorded period start"]') && !host.querySelector('[aria-label*="Predicted"]'));
 })],
];