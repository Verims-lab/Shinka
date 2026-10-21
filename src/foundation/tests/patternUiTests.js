import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Pattern from '@/pages/Pattern';
import { check } from './dataModelTests';
import { patternFixture, patternRow } from './patternFixture';
const pause=()=>new Promise(resolve=>setTimeout(resolve,20));
async function until(predicate) { for(let i=0;i<100;i++){if(predicate())return;await pause();}throw new Error('PATTERN_UI_TIMEOUT'); }
const button=(host,text)=>[...host.querySelectorAll('button')].find(row=>row.textContent===text);
async function probe(run) {
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:320px';document.body.appendChild(host);
  const root=createRoot(host);try{await run(root,host);}finally{root.unmount();host.remove();}
}
/** @type {import('./testTypes').FoundationTest[]} */
export const PATTERN_UI_TESTS=[
 ['PU01','Real Pattern TR/EN preserves selected IDs without refetch or writes; active nav and accessible phases',async()=>probe(async(root,host)=>{
   const f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));let calls=0;
   root.render(createElement(Pattern,{language:'en',request:section=>{calls++;return f.request(section);}}));
   await until(()=>host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'));
   const id=host.querySelector('[data-theme-id]').dataset.themeId;check(host.textContent.includes('Take a Breath'));check(host.querySelector('[data-theme-id] span').textContent==='1 day');
   button(host,'TR').click();await until(()=>host.textContent.includes('Kendine Bir Nefes'));
   check(host.querySelector('[data-theme-id]').dataset.themeId===id&&calls===2&&host.querySelectorAll('[data-lunar-label]').length===5);
   check(host.querySelector('nav a[aria-current="page"]').getAttribute('href')==='/pattern?lang=tr');
   check(host.querySelector('[data-lunar-label][aria-current="step"]').textContent.includes('Dolunay'));
   check(f.state.calls.every(c=>c.method==='filter'));
 })],
 ['PU02','Real component failure is not empty; section retry leaves successful timeline visible',async()=>probe(async(root,host)=>{
   const f=patternFixture();let fail=true;
   root.render(createElement(Pattern,{language:'en',request:section=>section==='themes'&&fail?Promise.reject({code:'PATTERN_READ_FAILED'}):f.request(section)}));
   await until(()=>host.querySelector('[data-lunar-timeline]')&&host.querySelector('[role="alert"]'));
   check(!host.textContent.includes('Your themes will appear after your first Shinka'));
   fail=false;button(host,'Try again').click();await until(()=>host.textContent.includes('Your themes will appear after your first Shinka'));
   check(host.querySelector('[data-lunar-timeline]')&&!host.querySelector('[role="alert"]'));
 })],
 ['PU03','320px and 200% text keep five labels separate, within card and all controls at least 44px',async()=>probe(async(root,host)=>{
   const f=patternFixture();root.render(createElement(Pattern,{language:'tr',request:f.request}));
   await until(()=>host.querySelector('[data-lunar-timeline]'));
   for(const scale of [1,2]) {
     const labels=[...host.querySelectorAll('[data-lunar-label]')];
     if(scale===2){const sizes=[...host.querySelectorAll('h1,h2,p,li,time,button,a,span')].map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));for(const {el,size} of sizes)el.style.fontSize=`${size*2}px`;}
     const boxes=labels.map(el=>el.getBoundingClientRect()), box=host.getBoundingClientRect();
     check(boxes.every((r,i)=>r.left>=box.left&&r.right<=box.right+1&&(!i||r.top>=boxes[i-1].bottom)),'labels overlap');
     check(host.scrollWidth<=320,'horizontal overflow');
     check([...host.querySelectorAll('button,a')].every(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44;}),'touch target');
   }
 })],
 ['PU05','Lunar error preserves themes; offline and access change clear both before retry',async()=>probe(async(root,host)=>{
   const f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));let fail=true;
   const request=section=>section==='lunar'&&fail?Promise.reject({code:'MOON_LOOKUP_COVERAGE_REQUIRED'}):f.request(section);
   root.render(createElement(Pattern,{language:'en',request}));
   await until(()=>host.querySelector('[data-theme-id]')&&host.textContent.includes('Moon phase information is temporarily unavailable'));
   fail=false;button(host,'Try again').click();await until(()=>host.querySelector('[data-lunar-timeline]'));
   window.dispatchEvent(new Event('offline'));await until(()=>host.querySelectorAll('[role="alert"]').length===2);
   check(!host.querySelector('[data-theme-id]')&&!host.querySelector('[data-lunar-timeline]'));
   window.dispatchEvent(new Event('online'));await until(()=>host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'));
   f.tables.UserProfile[0].account_status='INACTIVE';window.dispatchEvent(new Event('shinka-health-access-changed'));
   await until(()=>host.querySelectorAll('[role="alert"]').length===2);
   check(!host.querySelector('[data-theme-id]')&&!host.querySelector('[data-lunar-timeline]'));
 })],
 ['PU04','Unmount discards pending response in real component',async()=>probe(async(root,host)=>{
   const f=patternFixture();
   /** @type {(value: any) => void} */
   let release;
   const pending=new Promise(resolve=>{release=resolve;});
   root.render(createElement(Pattern,{language:'en',request:()=>pending}));await until(()=>host.querySelector('[role="status"]'));
   root.render(createElement('div',null,'replacement'));await pause();release(await f.request('themes'));await pause();
   check(host.textContent==='replacement'&&!host.querySelector('[data-pattern-root]'));
 })],
];
