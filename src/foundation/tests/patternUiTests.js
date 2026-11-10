import { createTestClock } from './testClock';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Pattern from '@/pages/Pattern';
import { check } from './dataModelTests';
import { calculateLunarTimeline } from '../../../base44/shared/patternCalculation.js';
import LunarTimeline from '@/features/pattern/LunarTimeline';
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
 ['PU08','Returning to a kept Pattern tab refreshes stale sections while retaining confirmed cards',async()=>probe(async(root,host)=>{
   const clock=createTestClock(),runtime={...clock.timers,now:clock.now},f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));
   let hold=false,calls=0;const releases=[];
   const request=async section=>{calls++;if(hold)await new Promise(resolve=>releases.push(resolve));return f.request(section);};
   const render=active=>root.render(createElement(Pattern,{language:'en',request,runtime,active}));
   try {
     render(true);await until(()=>host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'));
     render(false);await pause();await clock.advance(300000);check(calls===2,'hidden tab polled');
     hold=true;render(true);await pause();check(calls===4,'kept tab did not refresh on return');
     check(host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'),'return blanked cards');
     hold=false;releases.splice(0).forEach(fn=>fn());await until(()=>[...host.querySelectorAll('[data-pattern-section]')].every(el=>el.getAttribute('aria-busy')==='false'));
     check(calls===4&&f.state.calls.every(c=>c.method==='filter'));
   }finally{releases.splice(0).forEach(fn=>fn());clock.dispose();}
 })],
 ['PU01','Real Pattern TR/EN preserves selected IDs without refetch or writes; active nav and five real lunar nodes without visible counts',async()=>probe(async(root,host)=>{
   const f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'),patternRow('2026-10-18'),patternRow('2026-10-17','category-1'));let calls=0;
   const counted=section=>{calls++;return f.request(section);};
   root.render(createElement(Pattern,{language:'en',request:counted}));
   await until(()=>host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'));
   check([...host.querySelectorAll('[data-theme-id]')].map(el=>el.dataset.themeId).join(',')==='category-0');
   const id=host.querySelector('[data-theme-id]').dataset.themeId;check(host.textContent.includes('Take a Breath'));check(!host.querySelector('[data-theme-id] span')&&!host.textContent.includes('1 day')&&!host.textContent.includes('2 days'));
   check(![...host.querySelectorAll('header button')].some(b=>['TR','EN'].includes(b.textContent.trim())),'no header language buttons');
   root.render(createElement(Pattern,{language:'tr',request:counted}));await until(()=>host.textContent.includes('Kendine Bir Nefes'));
   check(host.querySelector('[data-theme-id]').dataset.themeId===id&&calls===2&&host.querySelectorAll('[data-lunar-label]').length===5);
   check(host.querySelector('nav a[aria-current="page"]').getAttribute('href')==='/pattern?lang=tr');
   check(host.querySelector('[data-lunar-current]').textContent.includes('Dolunay')&&host.querySelectorAll('[data-lunar-label] time')[4].textContent==='01.11 03:00');
   check(!host.textContent.includes('1 gün')&&!host.textContent.includes('2 gün')&&host.querySelectorAll('[data-lunar-node]').length===5&&host.textContent.includes('Europe/Istanbul'));
   check(f.state.calls.every(c=>c.method==='filter'));
 })],
 ['PU02','Real component failure is not empty; section retry leaves successful lunar data visible',async()=>probe(async(root,host)=>{
   const f=patternFixture();let fail=true;
   root.render(createElement(Pattern,{language:'en',request:section=>section==='themes'&&fail?Promise.reject({code:'PATTERN_READ_FAILED'}):f.request(section)}));
   await until(()=>host.querySelector('[data-lunar-timeline]')&&host.querySelector('[role="alert"]'));
   check(!host.textContent.includes('Your themes will appear after your first Shinka'));
   fail=false;button(host,'Try again').click();await until(()=>host.textContent.includes('Your themes will appear after your first Shinka'));
   check(host.querySelector('[data-lunar-timeline]')&&!host.querySelector('[role="alert"]'));
 })],
 ['PU03','320px and 200% text keep labels readable within a keyboard-scrollable timeline, page contained and controls at least 44px',async()=>probe(async(root,host)=>{
   const f=patternFixture(),request=section=>f.request(section);root.render(createElement(Pattern,{language:'tr',request}));
   await until(()=>host.querySelector('[data-lunar-timeline]'));
   for(const scale of [1,2]) {
     const labels=[...host.querySelectorAll('[data-lunar-label]')];
     if(scale===2){const sizes=[...host.querySelectorAll('[data-lunar-layout],h1,h2,h3,p,li,time,button,a,span,dt,dd')].map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));for(const {el,size} of sizes)el.style.fontSize=`${size*2}px`;}
     const boxes=labels.map(el=>el.getBoundingClientRect()), box=host.querySelector('[data-lunar-layout]').getBoundingClientRect();
     check(boxes.every((r,i)=>r.left>=box.left-1&&r.right<=box.right+1&&boxes.every((other,j)=>j===i||r.right<=other.left+1||r.left>=other.right-1||r.bottom<=other.top+1||r.top>=other.bottom-1)),'labels overlap');
     check(host.scrollWidth<=320,'page horizontal overflow');
     const scroller=host.querySelector('.lunar-scroll');
     check(scroller.tabIndex===0&&getComputedStyle(scroller).overflowX==='auto','keyboard scroll access');
     check([...host.querySelectorAll('.lunar-phase,time')].every(el=>el.scrollWidth<=el.clientWidth+1),'text clipped: '+JSON.stringify([...host.querySelectorAll('.lunar-phase,time')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>({text:el.textContent,width:el.clientWidth,scroll:el.scrollWidth,font:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize}))));
     scroller.scrollLeft=scroller.scrollWidth;
     check(scroller.scrollLeft>0&&boxes[4].width>=52,'readable scrollable final node');
     scroller.scrollLeft=0;
     check([...host.querySelectorAll('button,a')].every(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44;}),'touch target');
   }
 })],
 ['PU05','Lunar error preserves themes; offline retains confirmed sections, access change clears both immediately',async()=>probe(async(root,host)=>{
   const f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));let fail=true;
   const request=section=>section==='lunar'&&fail?Promise.reject({code:'MOON_LOOKUP_COVERAGE_REQUIRED'}):f.request(section);
   root.render(createElement(Pattern,{language:'en',request}));
   await until(()=>host.querySelector('[data-theme-id]')&&host.textContent.includes('Moon phase information is temporarily unavailable'));
   fail=false;button(host,'Try again').click();await until(()=>host.querySelector('[data-lunar-timeline]'));
   window.dispatchEvent(new Event('offline'));await until(()=>host.querySelectorAll('[role="alert"]').length===2);
   check(host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'));
   window.dispatchEvent(new Event('online'));await until(()=>host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'));
   f.tables.UserProfile[0].account_status='INACTIVE';window.dispatchEvent(new Event('shinka-health-access-changed'));
   await until(()=>host.querySelectorAll('[role="alert"]').length===2);
   check(!host.querySelector('[data-theme-id]')&&!host.querySelector('[data-lunar-timeline]'));
 })],
 ['PU06','Real hook/component keeps both cards through 120s idle, 300s refresh and failed section retry',async()=>probe(async(root,host)=>{
   const clock=createTestClock(),f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));
   let hold=false,fail=false,calls=0;const releases=[];
   const request=async section=>{calls++;if(hold)await new Promise(resolve=>releases.push(resolve));if(fail&&section==='lunar')throw {code:'PATTERN_READ_FAILED'};return f.request(section);};
   try {
     root.render(createElement(Pattern,{language:'en',request,runtime:{...clock.timers,now:clock.now}}));
     await until(()=>host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]'));
     const name=host.querySelector('[data-theme-id]').textContent,moon=host.querySelector('[data-lunar-timeline]').textContent;
     await clock.advance(120000);check(calls===2&&host.querySelector('[data-theme-id]').textContent===name&&host.querySelector('[data-lunar-timeline]').textContent===moon);
     hold=true;await clock.advance(180000);check(calls===4);check(host.querySelector('[data-theme-id]')&&host.querySelector('[data-lunar-timeline]')&&!host.textContent.includes('Loading…'));
     fail=true;hold=false;releases.splice(0).forEach(fn=>fn());await until(()=>host.querySelector('[role="alert"]'));
     check(host.querySelector('[data-theme-id]').textContent===name&&host.querySelector('[data-lunar-timeline]').textContent===moon);
     fail=false;button(host,'Try again').click();await until(()=>!host.querySelector('[role="alert"]'));check(calls===5);
     root.render(createElement('div',null,'replacement'));await until(()=>host.textContent==='replacement');check(clock.pending()===0);
   }finally{clock.dispose();}
 })],
 ['PU07','Partial Moon coverage keeps known phase and no invented completed graph in either language',async()=>probe(async(root,host)=>{
   const f=patternFixture(),request=section=>f.request(section);f.tables.MoonPhaseLookup=f.tables.MoonPhaseLookup.slice(0,3);
   root.render(createElement(Pattern,{language:'en',request}));await until(()=>host.querySelector('[data-lunar-timeline]'));
   check(host.querySelector('[data-lunar-current]').textContent.includes('Full Moon')&&!host.querySelector('[data-lunar-timeline] time'));
   check(host.querySelector('[data-lunar-timeline] [role="status"]').textContent.includes('temporarily unavailable'));
   root.render(createElement(Pattern,{language:'tr',request}));await until(()=>host.querySelector('[data-lunar-current]').textContent.includes('Dolunay'));
   check(host.querySelector('[data-lunar-timeline] [role="status"]').textContent.includes('kullanılamıyor')&&!host.querySelector('[data-lunar-timeline] svg, [data-lunar-timeline] ol'));
 })],
 ['PU09','Lunar labels format real instants in the validated user timezone across month and DST boundaries',async()=>probe(async(root,host)=>{
   const f=patternFixture();
   for(const [zone,first,last] of [['America/Los_Angeles','30.09 17:00','31.10 17:00'],['Europe/Berlin','01.10 02:00','01.11 01:00']]) {
     const request=section=>f.request(section,{timezone:zone});
     root.render(createElement(Pattern,{key:zone,language:'en',request}));await until(()=>host.querySelectorAll('[data-lunar-label] time').length===5&&host.textContent.includes(zone));
     const labels=[...host.querySelectorAll('[data-lunar-label] time')];check(labels[0].textContent===first&&labels[4].textContent===last);
     check(labels[4].getAttribute('datetime')==='2026-11-01T00:00:00.000Z');
     check(host.querySelector('[data-lunar-track]').getAttribute('aria-hidden')==='true'&&host.querySelector('ol[aria-label="Lunar Timeline"]'));
     const result=await f.request('lunar',{timezone:zone});
     check(Number(host.querySelector('[data-today-marker]').dataset.position)===result.lunar.timeline.today_position);
   }
   const rows=f.tables.MoonPhaseLookup.map(r=>({...r,start_at_utc:r.start_at_utc.replace('2026-10','2025-12').replace('2026-11','2026-01').replace('2026-12','2026-02'),end_at_utc:r.end_at_utc.replace('2026-10','2025-12').replace('2026-11','2026-01').replace('2026-12','2026-02')}));
   for(const language of ['tr','en'])for(const instant of ['2025-12-01T00:00:00Z','2025-12-10T12:00:00Z','2025-12-20T06:00:00Z','2025-12-31T23:59:59Z','2026-01-01T00:00:00Z']) {
     const lunar=calculateLunarTimeline(rows,new Date(instant),'Europe/Istanbul'),snapshot=JSON.stringify(lunar);
     root.render(createElement('div',{className:'lunar-card'},createElement(LunarTimeline,{lunar,language})));
     await until(()=>host.querySelector('[data-lunar-label] time')?.getAttribute('datetime')===lunar.timeline.nodes[0].instant&&Number(host.querySelector('[data-today-marker]')?.dataset.position)===lunar.timeline.today_position);
     const nodes=[...host.querySelectorAll('[data-lunar-node]')],labels=[...host.querySelectorAll('[data-lunar-label]')];
     const center=el=>{const r=el.getBoundingClientRect();return r.left+r.width/2;},start=center(nodes[0]),length=center(nodes[4])-start;
     nodes.forEach((node,i)=>{
       check(Math.abs((center(node)-start)/length-lunar.timeline.nodes[i].position)<.001,'decorative layout changed time ratio');
       check(labels[i].querySelector('time').getAttribute('datetime')===lunar.timeline.nodes[i].instant,'instant changed');
       check(Boolean(node.querySelector('[data-lunar-halo]'))===(i===lunar.timeline.active_index),'halo on wrong phase');
       check((labels[i].getAttribute('aria-current')==='step')===(i===lunar.timeline.active_index));
     });
     check(Math.abs((center(host.querySelector('[data-today-marker]'))-start)/length-lunar.timeline.today_position)<.001,'Today is not time proportional');
     check(labels[4].textContent.includes(language==='tr'?'Sonraki Yeni Ay':'Next New Moon'),'next new confused with first');
     check(host.textContent.includes('Europe/Istanbul')&&JSON.stringify(lunar)===snapshot,'timezone or source mutated');
     check([...host.querySelectorAll('svg')].every(el=>el.getAttribute('aria-hidden')==='true'),'decoration exposed');
   }
 })],
 ['PU04' ,'Unmount discards pending response in real component',async()=>probe(async(root,host)=>{
   const f=patternFixture();
   /** @type {(value: any) => void} */
   let release;
   const pending=new Promise(resolve=>{release=resolve;});
   root.render(createElement(Pattern,{language:'en',request:()=>pending}));await until(()=>host.querySelector('[role="status"]'));
   root.render(createElement('div',null,'replacement'));await pause();release(await f.request('themes'));await pause();
   check(host.textContent==='replacement'&&!host.querySelector('[data-pattern-root]'));
 })],
];
