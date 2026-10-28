import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import You from '@/pages/You';
import Home from '@/pages/Home';
import { notificationFixture } from './notificationFixture';
import { notificationCopy } from '../i18n/notificationCopy';
import { youRequest } from '@/services/youService';
import { youCopy } from '../i18n/youCopy';
import { waitForFixture } from './domWait';
import { testEventTurn } from './testClock';
import { youFixture } from './youFixture';
import { check } from './dataModelTests';
const pause=()=>testEventTurn();
const button=(host,text)=>[...host.querySelectorAll('button')].find(el=>el.textContent===text);
const submit=host=>host.querySelector('[data-you-preferences-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
const saved=host=>host.querySelector('[data-notification-preference]');
const status=host=>host.querySelector('[data-notification-save-state]')?.getAttribute('data-notification-save-state');
const protectedRows=f=>JSON.stringify(Object.fromEntries(Object.entries(f.tables).filter(([name])=>name!=='UserPreferences')));
const gate=()=>{let resolve=()=>{};const promise=new Promise(r=>{resolve=()=>r(undefined);});return {promise,resolve};};
async function probe(run,context={}) {
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:320px';document.body.appendChild(host);
 const root=createRoot(host);let closed=false;
 const dispose=()=>{if(!closed){closed=true;root.unmount();host.remove();}};
 context.cleanup?.(dispose);
 try{await run(root,host,fn=>waitForFixture(fn,host,context));}finally{dispose();}
}
/** @type {import('./testTypes').FoundationTest[]} */
export const NOTIFICATION_UI_TESTS=[
 ['NU03','Old notification Home URL cannot choose old content; session ending removes the snapshot',async(context={})=>probe(async(root,host,until)=>{
  const old=location.href,f=notificationFixture();let requests=0;
  try{
   history.replaceState(history.state,'','/?date=2020-01-01&daily_message_id=old');
   const request=async(...args)=>{check(args.length===0);requests++;return f.today();};
   root.render(createElement(Home,{language:'en',request}));await until(()=>host.querySelector('[data-daily-id]'));
   check(requests===1&&f.tables.UserDailyMessage.length===1&&f.tables.UserDailyMessage[0].shinka_date==='2026-10-20');
   window.dispatchEvent(new Event('shinka-session-ended'));await until(()=>!host.querySelector('[data-daily-id]'));
  }finally{history.replaceState(history.state,'',old);}
 },context)],
 ['NU01','TR/EN actual You preference error retains opt-in draft and stored off; unknown native permission stays separate',async(context={})=>probe(async(root,host,until)=>{
  for(const language of ['tr','en']){
   const f=youFixture();root.render(createElement(You,{key:language,language,request:f.request}));await until(()=>f.state.calls.length>0&&host.querySelector('[data-notification-status]'));
   check(host.querySelector('[data-notification-permission]').textContent.includes(notificationCopy('permissionUNKNOWN',language)));
   const input=host.querySelector('input[type="checkbox"]');input.click();await pause();
   f.once('before',c=>c.name==='UserPreferences'&&c.method==='updateMany');host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await until(()=>host.querySelector('[data-you-error]'));check(input.checked&&!f.tables.UserPreferences[0].notifications_enabled);
   check(host.querySelector('[data-notification-preference]').textContent.endsWith(notificationCopy('off',language)));
   check(!host.querySelector('input[type="time"]')&&!host.querySelector('a[href^="app-settings:"]'));
   window.dispatchEvent(new Event('shinka-session-ended'));await until(()=>!host.querySelector('[data-notification-status]'));
  }
 },context)],
 ['NU02','TR/EN phone denial/unknown leaves real You usable; opt-in never fabricates permission or settings actions',async(context={})=>probe(async(root,host,until)=>{
  for(const language of ['tr','en'])for(const [support,permission] of [['SUPPORTED','DENIED'],['SUPPORTED','GRANTED'],['UNSUPPORTED','GRANTED'],['UNKNOWN','GRANTED'],['UNKNOWN','UNKNOWN']]){
   const f=youFixture();f.tables.UserPreferences[0].notifications_enabled=true;
   root.render(createElement(You,{key:`${language}-${support}-${permission}`,language,request:f.request,notificationDevice:{support,permission}}));
   const expected=notificationCopy(`permission${support==='SUPPORTED'?permission:'UNKNOWN'}`,language);
   await until(()=>f.state.calls.length>0&&host.querySelector('[data-notification-permission]')?.textContent.includes(expected));
   const section=host.querySelector('[data-notification-status]');
   check(section.querySelectorAll('button,a').length===0&&!section.textContent.includes('Native push'));
   check(host.querySelector('#you-notifications').checked&&!host.querySelector('#you-notifications').disabled);
   check(host.querySelectorAll('nav a').length===3&&!button(host,youCopy('edit',language)).disabled);
   check(section.textContent.includes(notificationCopy(permission==='DENIED'?'denied':'guidance',language)));
   check(section.textContent.includes(notificationCopy('setupPending',language)));
   check(f.state.calls.every(c=>c.method==='filter'));
  }
 },context)],
 ['NU04','TR/EN notification on/off save and reopen use verified values; draft/busy never claim success or alter other data',async(context={})=>probe(async(root,host,until)=>{
  for(const language of ['tr','en']){
   const f=youFixture(),hold=gate(),started=gate();let savedCalls=0,loaded=0;context.cleanup?.(hold.resolve);
   f.tables.UserPreferences[0].language_code=language;const before=protectedRows(f);
   const request=async(action,payload)=>{if(action==='savePreferences'&&savedCalls===0){started.resolve();await hold.promise;}return f.request(action,payload);};
   const props={language,request,onSaved:()=>{savedCalls++;},onLoaded:()=>{loaded++;}};
   root.render(createElement(You,{...props,key:language}));await until(()=>loaded===1&&host.querySelector('#you-notifications')&&status(host)==='saved');
   check(!host.querySelector('#you-notifications').checked);
   host.querySelector('#you-notifications').click();await until(()=>status(host)==='unsaved');
   check(saved(host).textContent.endsWith(notificationCopy('off',language))&&!host.textContent.includes(youCopy('preferencesSaved',language)));
   submit(host);await started.promise;await until(()=>status(host)==='saving');
   check(!f.tables.UserPreferences[0].notifications_enabled&&savedCalls===0&&host.querySelector('#you-notifications').disabled);
   hold.resolve();await until(()=>savedCalls===1&&status(host)==='saved');
   check(saved(host).textContent.endsWith(notificationCopy('on',language))&&host.textContent.includes(youCopy('preferencesSaved',language)));
   root.render(createElement(You,{...props,key:language+'reopen'}));await until(()=>loaded===2&&host.querySelector('#you-notifications')?.checked);
   check(!host.textContent.includes(youCopy('preferencesSaved',language)));
   host.querySelector('#you-notifications').click();await until(()=>status(host)==='unsaved');submit(host);await until(()=>savedCalls===2&&status(host)==='saved');
   root.render(createElement(You,{...props,key:language+'off'}));await until(()=>loaded===3&&host.querySelector('#you-notifications')&&!host.querySelector('#you-notifications').checked);
   check(saved(host).textContent.endsWith(notificationCopy('off',language))&&protectedRows(f)===before);
   check(f.tables.UserPreferences[0].language_code===language&&f.tables.UserPreferences[0].notification_time==='06:00');
   check(f.state.calls.filter(c=>c.method!=='filter').every(c=>c.name==='UserPreferences'&&c.method==='updateMany'));
  }
 },context)],
 ['NU05','Notification failed/lost save, failed status check and same-intent retry keep draft until verified, without duplicate writes',async(context={})=>probe(async(root,host,until)=>{
  for(const language of ['tr','en'])for(const mode of ['before','after-check','after-retry']){
   const f=youFixture(),saves=[],checks=[];let verifyFailure=true,accepted=0;
   const request=async(action,payload)=>{
    if(action==='savePreferences')saves.push(structuredClone(payload));
    if(action==='verifyPreferences'){checks.push(structuredClone(payload));if(verifyFailure){verifyFailure=false;throw {code:'YOU_READ_FAILED'};}}
    return f.request(action,payload);
   };
   root.render(createElement(You,{key:language+mode,language,request,onSaved:()=>{accepted++;}}));await until(()=>f.state.calls.length>0&&host.querySelector('#you-notifications'));
   host.querySelector('#you-notifications').click();await until(()=>status(host)==='unsaved');
   f.once(mode==='before'?'before':'after',c=>c.name==='UserPreferences'&&c.method==='updateMany');submit(host);
   await until(()=>status(host)==='unconfirmed');
   check(host.querySelector('#you-notifications').checked&&host.querySelector('#you-notifications').disabled&&accepted===0);
   check(saved(host).textContent.endsWith(notificationCopy('off',language))&&host.querySelector('[data-you-preferences-form] [data-you-error]'));
   button(host,youCopy('check',language)).click();await pause();await until(()=>checks.length===1&&status(host)==='unconfirmed'&&button(host,youCopy('check',language))?.disabled===false);
   check(accepted===0&&checks.length===1&&saves.length===1);
   if(mode!=='after-retry'){
    button(host,youCopy('check',language)).click();await pause();
    await until(()=>mode==='after-check'?accepted===1&&status(host)==='saved':checks.length===2&&status(host)==='unconfirmed'&&button(host,youCopy('check',language))?.disabled===false);
   }
   if(mode!=='after-check'){button(host,youCopy('retry',language)).click();await until(()=>accepted===1&&status(host)==='saved');check(saves.length===2&&JSON.stringify(saves[0])===JSON.stringify(saves[1]));}
   check(status(host)==='saved'&&f.tables.UserPreferences[0].notifications_enabled&&checks.every(p=>JSON.stringify(p)===JSON.stringify(saves[0])));
   check(f.state.calls.filter(c=>c.name==='UserPreferences'&&c.method==='updateMany').length===(mode==='before'?2:1));
  }
 },context)],
 ['NU06','Logout/account boundary removes notification draft and ignores an already-written late response for the next account',async(context={})=>probe(async(root,host,until)=>{
  for(const event of ['shinka-session-ended','shinka-health-access-changed']){
   const a=youFixture(),b=youFixture(),hold=gate(),started=gate();let accepted=0;context.cleanup?.(hold.resolve);
   for(const rows of Object.values(b.tables))for(const row of rows)if(row.user_id==='ownerA'){row.user_id='ownerB';row.id='B-'+row.id;}
   const nextRequest=(action,payload={})=>youRequest(action,payload,{functions:{invoke:async(_name,body)=>({data:await(await b.http(body,'ownerB')).json()})}});
   const request=async(action,payload)=>{const result=await a.request(action,payload);if(action==='savePreferences'){started.resolve();await hold.promise;}return result;};
   root.render(createElement(You,{key:event,language:'en',request,onSaved:()=>{accepted++;}}));await until(()=>a.state.calls.length>0&&host.querySelector('#you-notifications'));
   host.querySelector('#you-notifications').click();await until(()=>status(host)==='unsaved');submit(host);await started.promise;
   window.dispatchEvent(new Event(event));await until(()=>!host.querySelector('[data-notification-status]'));
   root.render(createElement(You,{key:event+'next',language:'tr',request:nextRequest,onSaved:()=>{accepted++;}}));await until(()=>b.state.calls.length>0&&host.querySelector('#you-notifications'));
   hold.resolve();await pause();check(accepted===0&&!host.querySelector('#you-notifications').checked&&status(host)==='saved');
   check(a.tables.UserPreferences[0].notifications_enabled&&!b.tables.UserPreferences[0].notifications_enabled);
   check(host.querySelector('[data-you-root]').lang==='tr'&&!host.textContent.includes(youCopy('preferencesSaved','tr')));
  }
 },context)],
];
