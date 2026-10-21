import Home from '@/pages/Home';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import You from '@/pages/You';
import { check } from './dataModelTests';
import { youFixture } from './youFixture';
const pause=()=>new Promise(resolve=>setTimeout(resolve,20));
async function until(fn){for(let i=0;i<100;i++){if(fn())return;await pause();}throw new Error('YOU_UI_TIMEOUT');}
const button=(host,text)=>[...host.querySelectorAll('button')].find(el=>el.textContent===text);
const setInput=(el,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};
async function probe(run){const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:320px';document.body.appendChild(host);const root=createRoot(host);try{await run(root,host);}finally{root.unmount();host.remove();}}
const places=async()=>{throw new Error('synthetic provider offline');};
/** @type {import('./testTypes').FoundationTest[]} */
export const YOU_UI_TESTS=[
 ['YU06','Cleared name in fresh Home response never falls back to an older hydrated name',async()=>probe(async(root,host)=>{
   const f=youFixture();f.tables.UserProfile[0].display_name=null;
   root.render(createElement(Home,{language:'en',profile:{display_name:'Stale name'},request:()=>f.today()}));
   await until(()=>host.querySelector('[data-daily-id]'));
   check(!host.querySelector('h1').textContent.includes('Stale name')&&f.tables.UserDailyMessage.length===1);
   check(f.state.calls.every(call=>call.method==='filter'));
 })],

 ['YU01','Real You form save/cancel, error retains draft, field focus, saved readback and no protected writes',async()=>probe(async(root,host)=>{
   const f=youFixture();root.render(createElement(You,{language:'en',request:f.request,placeRequest:places}));
   await until(()=>button(host,'Edit profile'));const before=JSON.stringify(f.tables.UserDailyMessage);
   button(host,'Edit profile').click();await until(()=>host.querySelector('#display_name'));await until(()=>document.activeElement===host.querySelector('#display_name'));
   setInput(host.querySelector('#display_name'),'Draft');setInput(host.querySelector('#birth_date'),'');await pause();host.querySelector('[data-you-profile-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await until(()=>host.querySelector('#birth_date-error'));await until(()=>document.activeElement===host.querySelector('#birth_date'));check(host.querySelector('#display_name').value==='Draft','draft after invalid DOB');
   setInput(host.querySelector('#birth_date'),'1990-01-01');await pause();host.querySelector('[data-you-profile-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await until(()=>host.textContent.includes('Your profile has been updated'));check(f.tables.UserProfile[0].display_name==='Draft'&&before===JSON.stringify(f.tables.UserDailyMessage));
   await until(()=>document.activeElement===button(host,'Edit profile'));button(host,'Edit profile').click();await until(()=>host.querySelector('#display_name'));setInput(host.querySelector('#display_name'),'Discard');button(host,'Cancel').click();await until(()=>!host.querySelector('[data-you-profile-form]'));check(f.tables.UserProfile[0].display_name==='Draft');
 })],
 ['YU02','Saved place survives provider outage and explicit clear remains coherent through actual form',async()=>probe(async(root,host)=>{
   const f=youFixture();Object.assign(f.tables.UserProfile[0],f.place);root.render(createElement(You,{language:'en',request:f.request,placeRequest:places}));
   await until(()=>button(host,'Edit profile'));button(host,'Edit profile').click();await until(()=>host.querySelector('[data-place-summary]'));
   check(host.querySelector('[data-place-summary]').textContent.includes('Synthetic Settlement'));setInput(host.querySelector('#display_name'),'Preserved');await pause();host.querySelector('[data-you-profile-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await until(()=>host.textContent.includes('Your profile has been updated'));check(f.tables.UserProfile[0].birthplace_geonames_id===123&&f.resolves===0);
   button(host,'Edit profile').click();await until(()=>host.querySelector('[data-place-clear]'));host.querySelector('[data-place-clear]').click();await pause();host.querySelector('[data-you-profile-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await until(()=>f.tables.UserProfile[0].birthplace_geonames_id===null);
 })],
 ['YU03','Unconfirmed save locks draft, readonly result check confirms; logout invalidates a late response',async()=>probe(async(root,host)=>{
   const f=youFixture();let logout=0;root.render(createElement(You,{language:'en',request:f.request,placeRequest:places,onLogout:()=>{logout++;window.dispatchEvent(new Event('shinka-session-ended'));}}));
   await until(()=>button(host,'Edit profile'));button(host,'Edit profile').click();await until(()=>host.querySelector('#display_name'));setInput(host.querySelector('#display_name'),'Lost response');await pause();
   f.once('after',c=>c.name==='UserProfile'&&c.method==='updateMany');host.querySelector('[data-you-profile-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await until(()=>button(host,'Check saved result'));check(host.querySelector('#display_name').disabled&&!host.textContent.includes('Your profile has been updated'));
   button(host,'Check saved result').click();await until(()=>host.textContent.includes('Your profile has been updated'));button(host,'Sign Out').click();await until(()=>!host.querySelector('[data-you-consent]'));check(logout===1&&!host.textContent.includes('Lost response'));
 })],
 ['YU04','TR/EN 320px 200% real form labels, min touch, no fake legal/withdrawal/notification actions',async()=>probe(async(root,host)=>{
   for(const language of ['tr','en']) {
     const f=youFixture();root.render(createElement(You,{key:language,language,request:f.request,placeRequest:places}));await until(()=>host.querySelector('[data-you-root]')?.lang===language&&button(host,language==='tr'?'Profili düzenle':'Edit profile'));
     button(host,language==='tr'?'Profili düzenle':'Edit profile').click();await until(()=>host.querySelector('[data-you-profile-form]'));
     check(host.textContent.includes('Terms of Service')&&!host.querySelector('a[href^="http"]'));
     check(host.querySelectorAll('input[type="checkbox"]').length===1&&host.querySelectorAll('input[type="time"]').length===1);
     check([...host.querySelectorAll('input,select')].every(el=>el.closest('label')||host.querySelector(`label[for="${el.id}"]`)));
     for(const scale of [1,2]) {
       if(scale===2){const sizes=[...host.querySelectorAll('h1,h2,p,dt,dd,button,a,span,label,input,select,legend')].map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));for(const {el,size} of sizes)el.style.fontSize=`${size*2}px`;}
       check(host.scrollWidth<=321,'you horizontal overflow');
       check([...host.querySelectorAll('button,a,select,input:not([type="checkbox"])')].every(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44;}),'you touch geometry');
     }
   }
 })],
 ['YU05','Admin link only current verified prop; unsaved preferences never switch locale and reopen persisted state',async()=>probe(async(root,host)=>{
   const f=youFixture();let saved=0;const render=isAdmin=>root.render(createElement(You,{language:'en',request:f.request,placeRequest:places,isAdmin,onSaved:()=>{saved++;}}));
   render(false);await until(()=>host.querySelector('#you-language'));check(!host.querySelector('a[href="/internal"]'));
   const select=host.querySelector('#you-language');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));await pause();check(saved===0&&host.querySelector('[data-you-root]').lang==='en');
   host.querySelector('[data-you-preferences-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await until(()=>saved===1);check(f.tables.UserPreferences[0].language_code==='en');
   render(true);await until(()=>host.querySelector('a[href="/internal"]'));render(false);await until(()=>!host.querySelector('a[href="/internal"]'));
 })],
];
