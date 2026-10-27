import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { auditScreen } from './onboardingAuditUiTests';
import { check } from './dataModelTests';
import { waitForFixture } from './domWait';
import { testEventTurn } from './testClock';
import { nativeFixture } from './nativeFixture';
import Calendar from '@/pages/Calendar';
const button=(host,text)=>[...host.querySelectorAll('button')].find(el=>el.textContent.trim()===text);
const type=(host,id,value)=>{const el=host.querySelector(`#${id}`);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};
/** @type {import('./testTypes').FoundationTest[]} */
export const ADDITIONAL_FIX_UI_TESTS=[
 ['FX01','ON-02 stale enabled handler cannot skip a just-entered name; blank skip and auth-return save remain safe',async(context={})=>{
  for(const language of ['en','tr']) {
   await auditScreen('UNAUTHENTICATED_NAME',async(f,host,wait,turn)=>{
    f.locale(language);await wait(()=>host.querySelector('main')?.lang===language);const skip=button(host,language==='tr'?'Belirtmek istemiyorum':'Prefer not to say');
    check(skip&&!skip.disabled,'empty skip');
    // Same event turn: the old enabled DOM/button handler must consult current input.
    type(host,'display_name','  Ada  ');skip.click();await turn();
    check(!f.transitions.length&&!f.clears&&host.querySelector('#display_name').value==='  Ada  '&&skip.disabled,'stale skip cleared draft');
    skip.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));skip.click();await turn();check(!f.transitions.length);
    button(host,language==='tr'?'Devam et':'Continue').click();await wait(()=>host.querySelector('#age-declaration'));check(f.name==='Ada');
   },context);
  }
  await auditScreen('UNAUTHENTICATED_NAME',async(f,host,wait,turn)=>{
   check(host.querySelector('#display_name').value==='Ada'&&button(host,'Prefer not to say').disabled,'reopen pending draft');
   type(host,'display_name','');await turn();check(!button(host,'Prefer not to say').disabled);button(host,'Prefer not to say').click();await wait(()=>host.querySelector('#age-declaration'));check(f.name===null&&f.clears===1);
  },context,{name:'Ada'});
  await auditScreen('AUTHENTICATED_PROFILE_REQUIRED',async(f,host,wait,turn)=>{
   type(host,'birth_date','1990-01-01');await turn();button(host,'Continue').click();await wait(()=>host.querySelector('#period_start_date'));
   check(f.backend.rows.user_profile[0].display_name==='Ada'&&f.clears===1,'auth return lost pending name');
   check(!host.querySelector('[data-profile-trigger],a[href="/account-privacy"]')&&!host.textContent.includes('Account & Privacy'),'ON-05 privacy header returned');
   check(host.querySelector('#health_consent')&&!host.querySelector('#health_consent').checked,'separate consent');
  },context,{name:'Ada'});
 }],
 ['FX02','Calendar future browsing/selection is distinct from recording, localized disabled form and legacy correction remain available',async(context={})=>{
  for(const language of ['en','tr']) {
   const f=nativeFixture(),host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.append(host);
   const root=createRoot(host);
   /** @param {string} selector @returns {HTMLButtonElement} */
   const control=selector=>host.querySelector(selector);
   /** @returns {HTMLInputElement} */
   const dateInput=()=>host.querySelector('input[type=date]');
   let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;root.unmount();host.remove();};context.cleanup?.(dispose);
   const wait=fn=>waitForFixture(fn,document.body,context);let writes=0;
   const request=(action,body)=>{if(action!=='read')writes++;return f.cal({action,...body});};
   try {
    await f.change('add',{date:'2026-10-01'});
    root.render(h(Calendar,{language,request}));await wait(()=>control('button[data-calendar-date="2026-10-29"]'));
    control('button[data-calendar-date="2026-10-29"]').click();await testEventTurn(context.signal);
    check(control('button[data-calendar-date="2026-10-29"]').dataset.predicted==='true','prediction browsing lost');
    check(control('button[type=submit]').disabled&&host.textContent.includes(language==='tr'?'gelecekte olamaz':'future'),'future UI explanation');
    host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await testEventTurn(context.signal);check(!writes,'form bypass wrote');
    // Month arrows have accessible labels rather than visible text.
    control(`button[aria-label="${language==='tr'?'Sonraki ay':'Next month'}"]`).click();await wait(()=>control('button[data-calendar-date="2026-11-01"]'));
    check(!writes,'future month wrote');
    f.tables.UserPeriodRecord.push({id:'legacy-future',user_id:'ownerA',period_start_date:'2026-11-01'});
    button(host,language==='tr'?'Yenile':'Refresh').click();await wait(()=>host.textContent.includes(language==='tr'?'Kayıtlı bir regl':'A recorded period'));
    control('button[data-calendar-date="2026-11-01"]').click();await testEventTurn(context.signal);
    check(button(host,language==='tr'?'Regl başlangıcını sil':'Delete period start')&&!dateInput().disabled,'future actual row cannot be repaired');
    type(host,'calendar-start-date','2026-10-20');await testEventTurn(context.signal);check(!control('button[type=submit]').disabled,'valid correction blocked');
    host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await wait(()=>host.textContent.includes(language==='tr'?'Regl başlangıcı kaydedildi':'Period start saved'));
    check(writes===1&&f.tables.UserPeriodRecord.find(r=>r.id==='legacy-future').period_start_date==='2026-10-20','wrong correction');
   } finally {dispose();}
  }
 }],
];
