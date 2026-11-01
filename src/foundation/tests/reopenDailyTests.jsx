import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import Home from '@/pages/Home';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { dailyMessageRequest } from '@/services/dailyMessageService';
import { useDailyMessage } from '@/features/daily/useDailyMessage';
import { waitForFixture } from './domWait';
import { testEventTurn, createTestClock } from './testClock';
import { check } from './dataModelTests';
const daily={persisted:true,state:'ACTIVE_EXISTING_USER',profile:{display_name:'Synthetic'},daily:{id:'reopen-fixture',shinka_date:'2026-10-20',message_tr_snapshot:'TR',suggestion_tr_snapshot:'TR',message_en_snapshot:'EN',suggestion_en_snapshot:'EN'}};
const diagnostic={code:'SERVICE_UNAVAILABLE',httpStatus:503,stage:'LIFECYCLE_OPERATION_READ',durationMs:23,requestId:'12345678-1234-1234-1234-123456789012'};
async function fixture(context,run){
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.appendChild(host);
  const root=createRoot(host);let closed=false;const dispose=()=>{if(!closed){closed=true;root.unmount();host.remove();}};context.cleanup?.(dispose);
  try{await run(root,host,predicate=>waitForFixture(predicate,host,context));}finally{dispose();}
}
/** @type {import('./testTypes').FoundationTest[]} */
export const REOPEN_DAILY_TESTS=[
 ['DU07','Home transient lifecycle failures retain only confirmed data, one localized Retry and safe stage; successful retry clears it',async context=>{
  for(const language of ['tr','en'])for(const retained of [false,true])await fixture(context,async(root,host,wait)=>{
    let calls=0;const request=()=>dailyMessageRequest({functions:{invoke:async()=>{calls++;if(calls===1)throw {response:{status:503,data:{error_code:'TEST_LIFECYCLE_UNAVAILABLE',diagnostic}}};return {data:daily};}}});
    root.render(h(Home,{language,initialDaily:retained?daily:null,request,active:!retained}));
    if(retained){await wait(()=>host.querySelector('[data-daily-id]'));root.render(h(Home,{language,initialDaily:daily,request,active:true}));}
    await wait(()=>host.querySelector('[data-daily-state="failure"]'));
    check(!!host.querySelector('[data-daily-id]')===retained,'transient removed/created personal view');
    const status=host.querySelector('[data-daily-state]');
    check(status.textContent.includes(dailyCopy(retained?'refreshFailure':'failure',language))&&!host.textContent.includes('TEST_LIFECYCLE_UNAVAILABLE'),'incorrect initial/retained/raw copy');
    check(host.querySelectorAll('[role="alert"]').length===1&&status.querySelectorAll('button').length===1,'duplicate error/retry');
    check(status.dataset.errorStage==='LIFECYCLE_OPERATION_READ'&&status.dataset.httpStatus==='503'&&status.dataset.requestId===diagnostic.requestId,'safe evidence lost');
    status.querySelector('button').click();await wait(()=>host.querySelector('[data-daily-id]')&&!host.querySelector('[role="alert"]'));
    check(calls===2,'daily operation auto-retried or duplicate recovery');
  });
 }],
 ['DU08','Expired daily pending slot is retired on foreground; Retry-After, hidden tabs and burst events bound requests',async context=>fixture(context,async(root,host,wait)=>{
   /** @type {ReturnType<typeof useDailyMessage>} */ let current;
   let now=0,calls=0,oldSignal=new AbortController().signal;
   /** @type {(value:unknown)=>void} */ let release=(_value)=>{throw new Error('GATE_NOT_STARTED');};
   const request=options=>{calls++;if(calls===1){oldSignal=options.signal;return new Promise(resolve=>{release=resolve;});}return Promise.resolve(daily);};
   const readContext=()=> 'same-day',clock=()=>now;
   function Probe({active}){current=useDailyMessage(request,null,readContext,active,clock);return h('div',{'data-day':current.value?.daily.id||'','data-loading':String(current.loading)});}
   root.render(h(Probe,{active:true}));await wait(()=>calls===1);
   now=20001;window.dispatchEvent(new Event('offline'));window.dispatchEvent(new Event('focus'));await testEventTurn(context.signal);check(calls===1,'offline foreground created new request');
   window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));
   await wait(()=>current.value);check(calls===2&&oldSignal?.aborted,'expired local wait not retired/coalesced');
   release({...daily,daily:{...daily.daily,id:'obsolete'}});await testEventTurn(context.signal);check(current.value.daily.id===daily.daily.id,'obsolete response won');
   root.render(h(Probe,{active:false}));await testEventTurn(context.signal);now=40002;
   window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));document.dispatchEvent(new Event('visibilitychange'));await testEventTurn(context.signal);check(calls===2,'hidden tab read');
 })],
 ['DU09','Daily timeout/cancellation releases timer; Retry-After blocks early retry and forbidden responses cannot masquerade as lifecycle transients',async context=>{
   const clock=createTestClock(context);let calls=0;
   try{const pending=dailyMessageRequest({functions:{invoke:()=>{calls++;return new Promise(()=>{});}}},clock.timers,{now:clock.now});
     const caught=pending.catch(e=>e);await testEventTurn(context.signal);await clock.advance(20000);
     check((await caught).code==='TIMEOUT'&&calls===1&&clock.pending()===0,'daily deadline/retry cleanup');
   }finally{clock.dispose();}
   await fixture(context,async(root,host,wait)=>{
     /** @type {ReturnType<typeof useDailyMessage>} */ let current;let now=0,calls=0;const time=()=>now,day=()=> 'same-day';
     const request=()=>dailyMessageRequest({functions:{invoke:async()=>{calls++;throw {response:{status:calls<2?503:403,data:{error_code:'TEST_LIFECYCLE_UNAVAILABLE',retry_after_ms:3000,diagnostic}}};}}});
     function Probe(){current=useDailyMessage(request,daily,day,true,time);return h('div',{'data-error':current.error||''});}
     root.render(h(Probe));await wait(()=>current);await current.reload();await wait(()=>current.error);
     check(current.value&&calls===1,'transient lost view or retried');
     await current.reload();window.dispatchEvent(new Event('online'));await testEventTurn(context.signal);check(calls===1,'Retry-After ignored');
     now=3000;await current.reload();await wait(()=>!current.value);check(calls===2&&current.error==='ACCESS_DENIED','403 retained view');
   });
 }],
];
