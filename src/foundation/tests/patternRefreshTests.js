import { check } from './dataModelTests';
import { withTestClock, testEventTurn } from './testClock';
import { createPatternController } from '@/features/pattern/patternController';
import { bindPatternLifecycle } from '@/features/pattern/patternLifecycle';
import { patternFixture, patternRow } from './patternFixture';
/** @type {import('./testTypes').FoundationTest[]} */
export const PATTERN_REFRESH_TESTS = [
 ['PF01','Controlled 120s idle, 300s refresh and return-event burst retain confirmed sections with bounded calls',withTestClock(async clock=>{
   const f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));
   const values={themes:await f.request('themes'),lunar:await f.request('lunar')};
   let calls=0,hold=false;const releases=[];
   const c=createPatternController(section=>{calls++;return hold?new Promise(resolve=>releases.push(()=>resolve(values[section]))):Promise.resolve(values[section]);},clock.now);
   const target=new EventTarget(),doc=Object.assign(new EventTarget(),{visibilityState:'visible'});
   const stop=bindPatternLifecycle(c,{...clock.timers,now:clock.now},target,doc);
   try {
     await clock.advance(0);check(calls===2&&c.getSnapshot().themes.value===values.themes);
     await clock.advance(120000);check(calls===2&&c.getSnapshot().lunar.value===values.lunar,'idle poll/blank');
     hold=true;await clock.advance(180000);check(calls===4&&c.getSnapshot().themes.loading&&c.getSnapshot().themes.value===values.themes&&c.getSnapshot().lunar.value===values.lunar,'background erased cards');
     target.dispatchEvent(new Event('focus'));target.dispatchEvent(new Event('online'));doc.dispatchEvent(new Event('visibilitychange'));
     check(calls===4,'event burst duplicated active request');
     releases.splice(0).forEach(fn=>fn());await testEventTurn();
     target.dispatchEvent(new Event('focus'));check(calls===4,'completed event burst duplicated read');
     await clock.advance(1001);target.dispatchEvent(new Event('focus'));target.dispatchEvent(new Event('online'));doc.dispatchEvent(new Event('visibilitychange'));check(calls===6);
     target.dispatchEvent(new Event('shinka-session-ended'));check(!c.getSnapshot().themes.value&&!c.getSnapshot().lunar.value);
     releases.splice(0).forEach(fn=>fn());await clock.advance(300000);check(calls===6&&!c.getSnapshot().lunar.value,'session revived');
   } finally {stop();}
   check(clock.pending()===0);target.dispatchEvent(new Event('online'));check(calls===6,'listener not removed');
 })],
 ['PF02','Refresh failure and section retry retain values/order; privacy/account generation drops both old requests',async()=>{
   const f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));
   const values={themes:await f.request('themes'),lunar:await f.request('lunar')};let mode='ok',calls=0;const releases=[];
   const c=createPatternController(section=>{calls++;if(mode==='hold')return new Promise(resolve=>releases.push(()=>resolve(values[section])));if(mode==='fail'&&section==='lunar')return Promise.reject({code:'PATTERN_READ_FAILED'});return Promise.resolve(values[section]);});
   try {
     await c.refresh();mode='fail';await c.refresh();check(c.getSnapshot().themes.value===values.themes&&c.getSnapshot().lunar.value===values.lunar&&c.getSnapshot().lunar.error);
     mode='ok';await Promise.all([c.load('lunar'),c.load('lunar')]);check(calls===5&&!c.getSnapshot().lunar.error);
     mode='hold';const old=c.refresh();c.invalidate();check(!c.getSnapshot().themes.value&&!c.getSnapshot().lunar.value);
     mode='ok';await c.refresh();const current=c.getSnapshot();releases.forEach(fn=>fn());await old;check(c.getSnapshot()===current,'old generation changed new account snapshot');
   }finally{c.dispose();}
 }],
];
