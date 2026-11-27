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
const day=(host,date)=>host.querySelector(`[data-calendar-date="${date}"]`);
const choose=async(host,date)=>{day(host,date).click();await pause();};
/** @type {import('./testTypes').FoundationTest[]} */
export const CALENDAR_UI_TESTS = [
 ['CU13','TR/EN Calendar omits redundant absence messages while retaining consent, date restrictions and confirmed saving feedback',async()=>probe(async(root,host)=>{
   for(const language of ['tr','en']){
     const f=nativeFixture();let writes=0;
     root.render(createElement(Calendar,{key:language,language,request:(action,body)=>{if(action!=='read')writes++;return f.cal({action,...body});}}));
     await until(()=>host.querySelector('[data-calendar-root]')?.getAttribute('lang')===language&&day(host,'2026-10-19'));
     check(host.querySelector('[data-calendar-selection-hint]').textContent===(language==='tr'?'Durumunu görmek için takvimden bir gün seç':'Select a day to see its details'),'empty calendar must use only the selection prompt');
     await choose(host,'2026-10-19');
     const details=host.querySelector('[data-calendar-selection]'),status=details.querySelector('[data-calendar-day-status]');
     check(status.hidden&&!status.textContent,'unrecorded date must not display an absence message');
     check(details.textContent===details.querySelector('h3').textContent+(language==='tr'?'Regl başlangıcı olarak kaydet':'Save as period start'),'eligible day must show only its heading and save action');
     check([...day(host,'2026-10-19').getAttribute('aria-describedby').split(' ')].every(id=>host.querySelector('#'+id)),'selected day has a dangling description');
     check(!host.querySelector('[data-calendar-add]').disabled&&writes===0);
     await choose(host,'2026-10-21');check(host.querySelector('[data-calendar-day-status]').textContent.includes(language==='tr'?'Gelecek':'Future')&&!host.querySelector('[data-calendar-add]')&&writes===0);
     await choose(host,'2026-10-19');host.querySelector('[data-calendar-add]').click();await until(()=>host.textContent.includes(language==='tr'?'Regl başlangıcı kaydedildi':'Period start saved'));
     check(writes===1&&host.querySelector('[data-calendar-day-status]').textContent===(language==='tr'?'Regl başlangıcı kaydedilmiş':'Period start recorded')&&host.querySelector('[data-calendar-move]')&&host.querySelector('[data-calendar-delete]'));
     await choose(host,'2026-10-20');check(host.querySelector('[data-calendar-day-status]').textContent.includes(language==='tr'?'aralığında':'interval')&&!host.querySelector('[data-calendar-add]'));
     const consent=nativeFixture({granted:false});
     root.render(createElement(Calendar,{key:language+'-consent',language,request:(action,body)=>consent.cal({action,...body})}));
     await until(()=>host.querySelector('[data-calendar-selection-hint]')&&day(host,'2026-10-19'));await choose(host,'2026-10-19');
     check(host.querySelector('input[type=checkbox]')&&!host.querySelector('input[type=checkbox]').checked&&host.querySelector('[data-calendar-add]').disabled&&host.querySelector('[data-calendar-day-status]').textContent.includes(language==='tr'?'rıza':'consent'),'consent information or guard was hidden');
     check(!consent.tables.UserPeriodRecord.length&&!consent.tables.UserCalendarAction.length);
   }
 })],
 ['CU12','November 11 recovery has one notice, truthful inspected-day status and usable read-only controls during status checks in TR/EN',async()=>probe(async(root,host)=>{
   for(const language of ['tr','en']){
     const f=nativeFixture();f.state.time='2026-11-27T12:00:00Z';f.once('before',x=>x.name==='UserPeriodRecord'&&x.method==='create');try{await f.change('add',{date:'2026-11-11'});}catch{/* intentional isolated pending receipt */}
     check(f.tables.UserCalendarAction[0].status==='PENDING'&&!f.tables.UserPeriodRecord.length);
     let hold=false,held=false,release=()=>{},writes=0;const request=async(action,body)=>{if(action!=='read')writes++;const value=await f.cal({action,...body});if(hold&&action==='read'){hold=false;await new Promise(resolve=>{release=()=>resolve(undefined);held=true;});}return value;};
     try{
       root.render(createElement(Calendar,{key:language,language,request}));await until(()=>host.querySelector('[data-calendar-root]')?.getAttribute('lang')===language&&day(host,'2026-11-11'));
       check(!day(host,'2026-11-11').disabled&&host.querySelectorAll('[data-calendar-recovery]').length===1&&!host.querySelector('[data-calendar-selection]'));
       await choose(host,'2026-11-11');check(day(host,'2026-11-11').dataset.start==='false'&&host.querySelector('[data-calendar-day-status]').hidden&&!host.querySelector('[data-calendar-day-status]').textContent);
       hold=true;host.querySelector('[data-calendar-check]').click();await until(()=>host.querySelector('[data-calendar-check]')?.disabled);
       await choose(host,'2026-11-15');check(host.querySelector('[data-calendar-selection]').dataset.selectedDate==='2026-11-15'&&host.querySelector('[data-calendar-recovery] time').dateTime==='2026-11-11'&&!host.querySelector('[data-calendar-add],[data-calendar-move],[data-calendar-delete]'));
       await until(()=>held);release();await until(()=>host.querySelector('[data-calendar-continue]')&&!host.querySelector('[data-calendar-check]').disabled);check(writes===0);
       root.render(createElement(Calendar,{key:language,language,request,active:false}));await pause();root.render(createElement(Calendar,{key:language,language,request,active:true}));await pause();
       check(host.querySelector('[data-calendar-selection]').dataset.selectedDate==='2026-11-15'&&host.querySelectorAll('[data-calendar-recovery]').length===1&&writes===0);
       host.querySelector('[data-calendar-continue]').click();await until(()=>!host.querySelector('[data-calendar-recovery]'));check(writes===1&&f.tables.UserPeriodRecord.length===1&&f.tables.UserPeriodRecord[0].period_start_date==='2026-11-11'&&host.querySelector('[data-calendar-selection]').dataset.selectedDate==='2026-11-15');
     }finally{release();}
   }
 })],
 ['CU11','Selected-day actions, accurate intervals, move/month draft and delete confirmation never confuse selection with a saved start',async()=>probe(async(root,host)=>{
   const f=nativeFixture();await f.change('add',{date:'2026-10-01'});let writes=0;
   root.render(createElement(Calendar,{language:'en',request:(action,body)=>{if(action!=='read')writes++;return f.cal({action,...body});}}));
   await until(()=>day(host,'2026-10-01'));check(!host.querySelector('[data-calendar-edit],input[type=date],form'));
   check(host.querySelectorAll('[data-calendar-legend] li').length===2);
   await choose(host,'2026-10-20');check(host.querySelector('[data-calendar-selection]').dataset.selectedDate==='2026-10-20'&&!host.querySelector('[data-calendar-add]').disabled&&!writes);
   check(day(host,'2026-10-20').dataset.start==='false'&&day(host,'2026-10-20').getAttribute('aria-current')==='date');
   await choose(host,'2026-10-20');check(!writes,'second selection wrote');
   await choose(host,'2026-10-03');check(host.querySelector('[data-calendar-day-status]').textContent.includes('interval')&&!host.querySelector('[data-calendar-add]'),'derived day presented as a start');
   await choose(host,'2026-10-08');check(host.querySelector('[data-calendar-save]').disabled&&host.querySelector('#calendar-draft-error').textContent.includes('15'));
   await choose(host,'2026-10-29');check(!day(host,'2026-10-29').disabled&&day(host,'2026-10-29').dataset.predicted==='true'&&day(host,'2026-10-29').dataset.start==='false');
   check(!host.querySelector('[data-calendar-add]')&&host.querySelector('[data-calendar-day-status]').textContent.includes('estimated'),'future prediction offered as a start');
   await choose(host,'2026-10-01');check(host.querySelector('[data-calendar-day-status]').textContent==='Period start recorded');
   const id=f.tables.UserPeriodRecord[0].id;
   host.querySelector('[data-calendar-move]').click();await pause();check(host.querySelector('[data-calendar-save]').disabled&&document.activeElement===day(host,'2026-10-01'));
   await choose(host,'2026-10-02');check(day(host,'2026-10-01').dataset.draft==='from'&&day(host,'2026-10-02').dataset.draft==='edit'&&!writes);
   for(const [label,months] of [['Previous month',['2026-09','2026-08','2026-07','2026-06','2026-05','2026-04','2026-03','2026-02','2026-01','2025-12']],['Next month',['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10']]])for(const month of months){host.querySelector(`button[aria-label="${label}"]`).click();await until(()=>day(host,`${month}-01`)&&!host.querySelector('[data-calendar-save]').disabled);check(host.querySelector('[data-calendar-selection]').dataset.selectedDate==='2026-10-02'&&!writes,'month/year lost or wrote move');}
   host.querySelector('[data-calendar-cancel]').click();await pause();check(!writes&&host.querySelector('[data-calendar-move]')&&!host.querySelector('[data-draft]'));
   host.querySelector('[data-calendar-move]').click();await pause();await choose(host,'2026-10-02');host.querySelector('[data-calendar-save]').click();host.querySelector('[data-calendar-save]')?.click();
   await until(()=>host.textContent.includes('Period start saved'));check(writes===1&&f.tables.UserPeriodRecord.length===1&&f.tables.UserPeriodRecord[0].id===id&&f.tables.UserPeriodRecord[0].period_start_date==='2026-10-02');
   await choose(host,'2026-10-20');host.querySelector('[data-calendar-add]').click();await until(()=>f.tables.UserPeriodRecord.length===2&&host.querySelector('[data-calendar-delete]'));check(writes===2);
   host.querySelector('[data-calendar-delete]').click();await until(()=>host.querySelector('dialog'));button(host.querySelector('dialog'),'Cancel').click();await until(()=>!host.querySelector('dialog'));check(writes===2);
   host.querySelector('[data-calendar-delete]').click();await until(()=>host.querySelector('dialog'));button(host.querySelector('dialog'),'Delete period start').click();await until(()=>host.textContent.includes('Period start deleted'));check(writes===3&&f.tables.UserPeriodRecord.length===1&&f.tables.UserPeriodRecord[0].id===id&&!host.querySelector('[data-calendar-error]'));
 })],
 ['CU10','Unknown delete retains one status action and confirms a removed record without a duplicate delete in TR/EN',async()=>probe(async(root,host)=>{
   for(const language of ['tr','en']){
     const f=nativeFixture();await f.change('add',{date:'2026-10-01'});let first=true,writes=0;
     const request=async(action,body)=>{if(action!=='read'){writes++;if(first){first=false;await f.cal({action,...body});throw {code:'NETWORK'};}}return f.cal({action,...body});};
     root.render(createElement(Calendar,{key:language,language,request}));await until(()=>host.querySelector('[data-calendar-root]')?.getAttribute('lang')===language&&day(host,'2026-10-01'));await choose(host,'2026-10-01');host.querySelector('[data-calendar-delete]').click();await until(()=>host.querySelector('dialog[open]'));
     const label=language==='tr'?'Regl başlangıcını sil':'Delete period start';button(host.querySelector('dialog'),label).click();button(host.querySelector('dialog'),label)?.click();await until(()=>host.querySelector('dialog [data-calendar-error]'));
     check(writes===1&&!f.tables.UserPeriodRecord.length&&host.querySelectorAll('[data-calendar-error]').length===1&&!button(host.querySelector('dialog'),label));
     button(host.querySelector('dialog'),language==='tr'?'Durumu kontrol et':'Check status').click();await until(()=>!host.querySelector('dialog'));check(writes===1&&host.textContent.includes(language==='tr'?'Regl başlangıcı silindi':'Period start deleted')&&!host.querySelector('[data-calendar-error]'));
   }
 })],
 ['CU09','Empty read failure has one Retry; verified retry restores the actual grid in TR/EN',async()=>probe(async(root,host)=>{
   for(const language of ['tr','en']){
     let fail=true,calls=0;const f=nativeFixture();const request=async(action,body)=>{calls++;check(action==='read');if(fail)throw {code:'SERVICE_UNAVAILABLE'};return f.cal({action,...body});};
     root.render(createElement(Calendar,{key:language,language,request}));await until(()=>host.querySelector('[data-calendar-error]'));check(!host.querySelector('[role=grid],[data-refresh-control]')&&host.querySelectorAll('main button').length===1&&!/last view|son görünüm/i.test(host.textContent));
     fail=false;host.querySelector('main button').click();await until(()=>host.querySelector('[role=grid]'));check(calls===2&&!host.querySelector('[data-calendar-error]'));
   }
 })],
 ['CU08','Selection, pending, uncertain and confirmed starts are distinct; matched receipt clears all recovery UI without a rewrite',async()=>probe(async(root,host)=>{
   for(const language of ['tr','en']){
     const f=nativeFixture(),calls=[];let release=()=>{},first=true;const gate=new Promise(resolve=>{release=()=>resolve(undefined);});
     const request=async(action,body={})=>{if(action==='read')return f.cal({action,...body});calls.push({action,...body});if(first){first=false;await gate;await f.cal({action,...body});throw {code:'NETWORK'};}return f.cal({action,...body});};
     try{
       root.render(createElement(Calendar,{key:language,language,request}));await until(()=>host.querySelector('[data-calendar-root]')?.getAttribute('lang')===language&&day(host,'2026-10-01'));check(!host.querySelector('[data-calendar-feedback]'));
       await choose(host,'2026-10-01');check(!f.tables.UserPeriodRecord.length&&day(host,'2026-10-01').dataset.start==='false');host.querySelector('[data-calendar-add]').click();await until(()=>calls.length===1);await pause();
       const pending=host.querySelector('[data-calendar-feedback=pending]');check(pending?.getAttribute('role')==='status'&&!pending.closest('[aria-busy=true]')&&host.querySelectorAll('[data-calendar-recovery]').length===1&&!host.querySelector('[data-calendar-add],[data-calendar-move],[data-calendar-delete]'));
       await choose(host,'2026-10-05');check(host.querySelector('[data-calendar-selection]').dataset.selectedDate==='2026-10-05'&&host.querySelector('[data-calendar-recovery] time').dateTime==='2026-10-01','in-flight add replaced inspection or intent');
       release();await until(()=>host.querySelector('[data-calendar-error=NETWORK]'));check(f.tables.UserPeriodRecord.length===1&&!day(host,'2026-10-01').disabled&&!host.querySelector('[data-calendar-add]')&&host.querySelector('[data-calendar-recovery] time').dateTime==='2026-10-01');
       button(host,language==='tr'?'Durumu kontrol et':'Check status').click();await until(()=>host.textContent.includes(language==='tr'?'Regl başlangıcı kaydedildi':'Period start saved'));
       check(calls.length===1&&f.tables.UserCalendarAction[0].action_id===calls[0].action_id&&day(host,'2026-10-01').dataset.start==='true'&&host.querySelector('[data-calendar-selection]').dataset.selectedDate==='2026-10-05'&&!host.querySelector('[data-calendar-error],[data-calendar-feedback]')&&!button(host,'Check status')&&!button(host,'Durumu kontrol et'));
     }finally{release();}
   }
 })],
 ['CU06','Partial consent grant reopens with no new checkbox; same saved grant intent resumes securely',async()=>probe(async(root,host)=>{
   const f=nativeFixture({granted:false}),view=await f.cal();f.once('before',c=>c.name==='UserHealthConsentEvent'&&c.method==='create');
   try{await f.cal({action:'add',date:'2026-10-01',health_consent:true,action_id:crypto.randomUUID(),revision:view.revision});}catch{/* isolated interruption */}
   const stamp=f.tables.UserHealthConsent[0].granted_at,request=(action,body)=>calendarRequest(action,body,{functions:{invoke:async(_name,payload)=>({data:await f.cal(payload)})}});
   root.render(createElement(Calendar,{language:'tr',request}));await until(()=>host.querySelector('[data-calendar-error=CALENDAR_PENDING_REVIEW]'));check(!host.querySelector('input[type=checkbox],[data-calendar-add]'));
   root.render(createElement(Calendar,{language:'en',request}));await until(()=>button(host,'Check status'));button(host,'Check status').click();await until(()=>button(host,'Continue the same change'));check(!f.tables.UserPeriodRecord.length);button(host,'Continue the same change').click();await until(()=>f.tables.UserPeriodRecord.length===1);await pause();check(!host.querySelector('[data-calendar-error]')&&f.tables.UserHealthConsent[0].granted_at===stamp&&f.tables.UserHealthConsentEvent.length===1);
 })],
 ['CU07','Reload resumes original native intent and confirms the actual date without a new action ID',async()=>probe(async(root,host)=>{
   const f=nativeFixture(),view=await f.cal();f.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');try{await f.cal({action:'add',date:'2026-09-01',action_id:crypto.randomUUID(),revision:view.revision});}catch{/* isolated interruption */}
   const id=f.tables.UserCalendarAction[0].action_id;root.render(createElement(Calendar,{language:'en',request:(action,body)=>calendarRequest(action,body,{functions:{invoke:async(_name,payload)=>({data:await f.cal(payload)})}})}));await until(()=>host.querySelector('[data-calendar-error=CALENDAR_PENDING_REVIEW]'));
   button(host,'Check status').click();await until(()=>button(host,'Continue the same change'));check(!f.tables.UserPeriodRecord.length);button(host,'Continue the same change').click();await until(()=>host.textContent.includes('Period start saved'));
   await until(()=>host.querySelector('button[aria-label="Previous month"]')?.disabled===false);host.querySelector('button[aria-label="Previous month"]').click();await until(()=>day(host,'2026-09-01'));
   check(f.tables.UserPeriodRecord.length===1&&f.tables.UserCalendarAction.length===1&&f.tables.UserCalendarAction[0].action_id===id&&f.tables.UserCalendarAction[0].status==='APPLIED'&&day(host,'2026-09-01').getAttribute('aria-label').includes('Recorded period start'));
 })],
 ['CU05','Unsupported estimates preserve real dates and central TR/EN information without stale predictions',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-01-01'});await f.change('add',{date:'2026-04-01'});root.render(createElement(Calendar,{language:'tr',request:f.request}));await until(()=>host.querySelector('[data-calendar-estimate-unavailable]'));
   check(host.querySelector('[data-calendar-estimate-unavailable]').getAttribute('role')==='status'&&host.textContent.includes('60 günden uzun')&&!host.querySelector('[data-predicted=true]'));
   root.render(createElement(Calendar,{language:'en',request:f.request}));await until(()=>host.textContent.includes('longer than 60 days'));await choose(host,'2026-10-01');check(!host.querySelector('[data-calendar-add]').disabled);
 })],
 ['CU01','Two-key legend, distinct saved/derived/predicted/today/selection labels, 44px keyboard targets and zero selection writes',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-10-01'});root.render(createElement(Calendar,{language:'en',request:f.request}));await until(()=>day(host,'2026-10-01'));const before=JSON.stringify(f.rows);await choose(host,'2026-10-01');const start=day(host,'2026-10-01');
   check(JSON.stringify(f.rows)===before&&start.getAttribute('aria-label').includes('Selected')&&start.getAttribute('aria-label').includes('Recorded period start')&&start.querySelector('[data-calendar-start-marker]'));
   check(day(host,'2026-10-02').dataset.start==='false'&&day(host,'2026-10-02').getAttribute('aria-label').includes('interval')&&day(host,'2026-10-29').getAttribute('aria-label').includes('estimated period interval'));
   check(start.getBoundingClientRect().width>=44&&start.getBoundingClientRect().height>=44&&host.querySelectorAll('[data-calendar-legend] li').length===2);
   start.focus();start.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));check(document.activeElement===day(host,'2026-10-02'));
   root.render(createElement(Calendar,{language:'tr',request:f.request}));await until(()=>host.querySelector('nav a[aria-current=page]')?.getAttribute('href')==='/calendar?lang=tr');check(host.textContent.includes('Regl başlangıcı kaydedilmiş')&&!host.querySelector('[data-calendar-edit],input[type=date]'));
   for(const kind of ['recorded','predicted']){
     const boundary=calendarFixture();await boundary.change('add',{date:kind==='recorded'?'2026-09-29':'2026-09-01'});
     root.render(createElement(Calendar,{key:kind,language:'en',request:boundary.request}));await until(()=>day(host,'2026-10-01')?.dataset[kind==='recorded'?'period':'predicted']==='true'&&day(host,'2026-10-01')?.dataset.start==='false');
     const before=JSON.stringify(boundary.rows);await choose(host,'2026-10-01');check(!day(host,'2026-10-01').querySelector('[data-calendar-start-marker]')&&host.querySelector('[data-calendar-day-status]').textContent.includes('interval'),'month boundary was labelled as a start');
     check(kind==='recorded'?!host.querySelector('[data-calendar-add]'):!host.querySelector('[data-calendar-add]').disabled,'wrong interval eligibility');check(JSON.stringify(boundary.rows)===before,'interval selection wrote');
   }
 })],
 ['CU02','Delete confirmation names the actual date, Cancel restores focus and last deletion removes predictions',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-10-01'});root.render(createElement(Calendar,{language:'en',request:f.request}));await until(()=>day(host,'2026-10-01'));await choose(host,'2026-10-01');const trigger=host.querySelector('[data-calendar-delete]');trigger.click();await until(()=>host.querySelector('dialog[open]'));check(host.querySelector('dialog').textContent.includes('1 October 2026'));
   button(host.querySelector('dialog'),'Cancel').click();await until(()=>!host.querySelector('dialog'));check(f.rows.user_period_record.length===1&&document.activeElement===trigger);trigger.click();await until(()=>host.querySelector('dialog[open]'));button(host.querySelector('dialog'),'Delete period start').click();await until(()=>!host.querySelector('dialog')&&host.textContent.includes('Period start deleted'));check(!f.rows.user_period_record.length&&!f.rows.user_cycle_phase_day.length);
 })],
 ['CU03','Consent is explicit, unchecked and temporary; unavailable writes never grant or save data',async()=>probe(async(root,host)=>{
   const f=calendarFixture({granted:false}),request=async(action,body)=>({...await f.request(action,body),writable:false});root.render(createElement(Calendar,{language:'tr',request}));await until(()=>host.querySelector('[data-calendar-blocked]'));await choose(host,'2026-10-01');check(host.querySelector('[data-calendar-add]').disabled&&host.querySelector('input[type=checkbox]').disabled&&!f.rows.user_health_consent.length);
   root.render(createElement(Calendar,{key:'consent',language:'tr',request:f.request}));await until(()=>day(host,'2026-10-01')&&!host.querySelector('[data-calendar-blocked]'));await choose(host,'2026-10-01');check(!host.querySelector('input[type=checkbox]').checked&&host.textContent.includes('Shinka’nın döngü verilerimi')&&host.querySelector('[data-calendar-add]').disabled);
   host.querySelector('input[type=checkbox]').click();await pause();check(!host.querySelector('[data-calendar-add]').disabled&&!f.rows.user_health_consent.length);host.querySelector('input[type=checkbox]').click();await pause();check(host.querySelector('[data-calendar-add]').disabled&&!f.rows.user_period_record.length);
   host.querySelector('input[type=checkbox]').click();await pause();host.querySelector('[data-calendar-add]').click();await until(()=>host.textContent.includes('Regl başlangıcı kaydedildi'));check(f.rows.user_period_record.length===1&&f.rows.user_health_consent.length===1);
 })],
 ['CU04','Known withdrawal hides health immediately and selecting a date cannot revive it or grant consent',async()=>probe(async(root,host)=>{
   const f=calendarFixture();await f.change('add',{date:'2026-10-01'});root.render(createElement(Calendar,{language:'en',request:f.request}));await until(()=>day(host,'2026-10-01'));f.rows.user_health_consent[0].consent_status='WITHDRAWN';f.rows.user_health_consent[0].withdrawn_at='2026-10-20T13:00:00.000Z';window.dispatchEvent(new Event('shinka-health-access-changed'));await until(()=>day(host,'2026-10-01')&&!host.querySelector('[data-start=true]'));await choose(host,'2026-10-01');check(!host.querySelector('[data-start=true],[data-predicted=true]')&&!host.querySelector('input[type=checkbox]').checked);
 })],
];
