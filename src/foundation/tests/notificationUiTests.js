import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import You from '@/pages/You';
import Home from '@/pages/Home';
import { notificationFixture } from './notificationFixture';
import NotificationStatus from '@/features/you/NotificationStatus';
import { notificationCopy } from '../i18n/notificationCopy';
import { youFixture } from './youFixture';
import { check } from './dataModelTests';
const pause=()=>new Promise(resolve=>setTimeout(resolve,20));
async function until(fn){for(let i=0;i<100;i++){if(fn())return;await pause();}throw new Error('NOTIFICATION_UI_TIMEOUT');}
async function probe(run){const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);try{await run(root,host);}finally{root.unmount();host.remove();}}
/** @type {import('./testTypes').FoundationTest[]} */
export const NOTIFICATION_UI_TESTS=[
 ['NU03','Old notification Home URL cannot choose old content; session ending removes the snapshot',async()=>probe(async(root,host)=>{
  const old=location.href,f=notificationFixture();let requests=0;
  try{
   history.replaceState(history.state,'','/?date=2020-01-01&daily_message_id=old');
   const request=async(...args)=>{check(args.length===0);requests++;return f.today();};
   root.render(createElement(Home,{language:'en',request}));await until(()=>host.querySelector('[data-daily-id]'));
   check(requests===1&&f.tables.UserDailyMessage.length===1&&f.tables.UserDailyMessage[0].shinka_date==='2026-10-20');
   window.dispatchEvent(new Event('shinka-session-ended'));await until(()=>!host.querySelector('[data-daily-id]'));
  }finally{history.replaceState(history.state,'',old);}
 })],
 ['NU01','TR/EN actual You preference error retains opt-in draft and stored off; unknown native permission stays separate',async()=>probe(async(root,host)=>{
  for(const language of ['tr','en']){
   const f=youFixture();root.render(createElement(You,{key:language,language,request:f.request}));await until(()=>host.querySelector('[data-notification-status]'));
   check(host.querySelector('[data-notification-permission]').textContent.includes(notificationCopy('permissionUNKNOWN',language)));
   const input=host.querySelector('input[type="checkbox"]');input.click();await pause();
   f.once('before',c=>c.name==='UserPreferences'&&c.method==='updateMany');host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await until(()=>host.querySelector('[data-you-error]'));check(input.checked&&!f.tables.UserPreferences[0].notifications_enabled);
   check(host.querySelector('[data-notification-preference]').textContent.endsWith(notificationCopy('off',language)));
   check(!host.querySelector('input[type="time"]')&&!host.querySelector('a[href^="app-settings:"]'));
   window.dispatchEvent(new Event('shinka-session-ended'));await until(()=>!host.querySelector('[data-notification-status]'));
  }
 })],
 ['NU02','Denied, unsupported, granted and unknown presentation has no fake permission/settings bridge',async()=>probe(async(root,host)=>{
  for(const language of ['tr','en'])for(const [support,permission] of [['SUPPORTED','DENIED'],['SUPPORTED','GRANTED'],['UNSUPPORTED','GRANTED'],['UNKNOWN','GRANTED']]){
   root.render(createElement(NotificationStatus,{key:`${language}-${support}-${permission}`,language,enabled:true,device:{support,permission}}));
   await until(()=>host.querySelector('[data-notification-support]')?.textContent.includes(notificationCopy(`support${support}`,language))&&host.querySelector('[data-notification-permission]')?.textContent.includes(notificationCopy(`permission${support==='SUPPORTED'?permission:'UNKNOWN'}`,language)));
   check(host.querySelectorAll('button,a').length===0);
   if(permission==='DENIED')check(host.textContent.includes(notificationCopy('denied',language)));
  }
 })],
];
