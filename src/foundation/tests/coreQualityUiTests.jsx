import Home from '@/pages/Home';
import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useDailyMessage } from '@/features/daily/useDailyMessage';
import { dailyMessageRequest } from '@/services/dailyMessageService';
import You from '@/pages/You';
import { youFixture } from './youFixture';
import { check } from './dataModelTests';
import { waitForFixture } from './domWait';

async function renderProbe(context, run) {
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.appendChild(host);
  const root=createRoot(host);let disposed=false;const dispose=()=>{if(!disposed){disposed=true;root.unmount();host.remove();}};
  context.cleanup?.(dispose);try{await run(root,host);}finally{dispose();}
}
const daily={persisted:true,state:'ACTIVE_EXISTING_USER',daily:{id:'synthetic-daily',shinka_date:'2026-10-20',message_tr_snapshot:'Fixture',message_en_snapshot:'Fixture',suggestion_tr_snapshot:'Fixture',suggestion_en_snapshot:'Fixture'}};
const button=(host,text)=>[...host.querySelectorAll('button')].find(el=>el.textContent===text);
/** @type {import('./testTypes').FoundationTest[]} */
export const CORE_QUALITY_UI_TESTS=[
 ['CQ10','Real Home renders strings as text and hides hydrated name through access denial and pending retry',async context=>renderProbe(context,async(root,host)=>{
   const payload='<img src=x onerror="window.syntheticExecuted=true">';
   const initial={...daily,daily:{...daily.daily,message_en_snapshot:payload,suggestion_en_snapshot:payload}};
   let calls=0;
   /** @type {(value: unknown)=>void} */
   let releaseRetry=(_value)=>{};
   root.render(createElement(Home,{language:'en',profile:{display_name:payload},request:async()=>{const call=calls++;if(call===0)return initial;if(call>1)return new Promise(resolve=>{releaseRetry=resolve;});throw Object.assign(new Error(),{code:'AUTH_REQUIRED'});}}));
   await waitForFixture(()=>host.querySelector('[data-daily-id]'),host,context);
   check(host.textContent.includes(payload)&&!host.querySelector('img,script'),'untrusted text interpreted as HTML');
   window.dispatchEvent(new Event('shinka-health-access-changed'));
   await waitForFixture(()=>host.querySelector('[data-daily-state="failure"]'),host,context);
   check(!host.querySelector('[data-daily-id]')&&!host.textContent.includes(payload),'hydrated name survives access denial');
   try {
     flushSync(()=>button(host,'Retry').click());
     check(calls===3&&!host.textContent.includes(payload),'hydrated name reappears while retry is unresolved');
   } finally { releaseRetry(initial); }
   await waitForFixture(()=>host.querySelector('[data-daily-id]'),host,context);
   check(host.textContent.includes(payload),'verified retry did not restore the name');
 })],

 ['CQ06','Home discards retained daily after lifecycle/owner/profile denial through actual service and hook',async context=>{
   for(const code of ['PROFILE_COMPLETION_REQUIRED','TEST_TARGET_BUSY','ACCOUNT_DELETION_IN_PROGRESS','ONBOARDING_RESTART_REQUIRED','OWNER_REQUIRED','ACCESS_DENIED','PRIVACY_STATE_UNCONFIRMED','CONSENT_VERSION_CONFLICT'])await renderProbe(context,async(root,host)=>{
     let failed=false;
     /** @type {ReturnType<typeof useDailyMessage>} */
     let current;const request=()=>dailyMessageRequest({functions:{invoke:async()=>({data:failed?{error_code:code}:daily})}});
     function Probe(){current=useDailyMessage(request);return createElement('div',{'data-day':current.value?.daily.id||'','data-error':current.error||''});}
     root.render(createElement(Probe));await waitForFixture(()=>host.querySelector('[data-day="synthetic-daily"]'),host,context);
     failed=true;await current.reload();await waitForFixture(()=>host.querySelector('[data-error]')?.getAttribute('data-error'),host,context);
     check(!host.querySelector('[data-day="synthetic-daily"]'),`stale daily after ${code}`);
   });
 }],
 ['CQ07','Session-ended daily hook rejects late results and remains stopped across day/focus/manual reload',async context=>renderProbe(context,async(root,host)=>{
   let calls=0,day='a';
   /** @type {ReturnType<typeof useDailyMessage>} */
   let current;
   /** @type {(value: unknown)=>void} */
   let release=(_value)=>{throw new Error('DAILY_NOT_PENDING');};const readContext=()=>day;
   const request=()=>{calls++;return new Promise(resolve=>{release=resolve;});};
   function Probe(){current=useDailyMessage(request,null,readContext);return createElement('div',{'data-day':current.value?.daily.id||'','data-loading':String(current.loading)});}
   root.render(createElement(Probe));await waitForFixture(()=>calls===1,host,context);
   window.dispatchEvent(new Event('shinka-session-ended'));release(daily);await Promise.resolve();await Promise.resolve();
   day='b';window.dispatchEvent(new Event('focus'));void current.reload();
   check(calls===1,'ended session restarted transport');
   await waitForFixture(()=>host.querySelector('[data-loading="false"]'),host,context);
   check(calls===1&&!host.querySelector('[data-day="synthetic-daily"]'),'ended session restarted transport');
 })],
 ['CQ08','Real You screen locks edit after preferences response loss and failed check; verified check unlocks',async context=>renderProbe(context,async(root,host)=>{
   const f=youFixture();let failCheck=true;
   const request=(action,payload)=>action==='verifyPreferences'&&failCheck?Promise.reject({code:'YOU_READ_FAILED',unknown:false}):f.request(action,payload);
   root.render(createElement(You,{language:'en',request}));await waitForFixture(()=>host.querySelector('[data-you-preferences-form]'),host,context);
   flushSync(()=>host.querySelector('input[type=checkbox]').click());
   f.once('after',c=>c.name==='UserPreferences'&&c.method==='updateMany');host.querySelector('[data-you-preferences-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await waitForFixture(()=>button(host,'Check saved result'),host,context);
   check(button(host,'Edit profile').disabled,'profile edit remains enabled');button(host,'Edit profile').click();
   flushSync(()=>button(host,'Check saved result').click());await waitForFixture(()=>button(host,'Check saved result')&&!button(host,'Check saved result').disabled,host,context);
   check(host.querySelector('#you-language').disabled&&!host.querySelector('[data-you-profile-form]'),'failed check unlocked form');
   failCheck=false;flushSync(()=>button(host,'Check saved result').click());await waitForFixture(()=>host.textContent.includes('Your preferences have been updated'),host,context);
   check(!button(host,'Edit profile').disabled&&f.state.calls.filter(c=>c.name==='UserPreferences'&&c.method==='updateMany').length===1);
 })],
];
