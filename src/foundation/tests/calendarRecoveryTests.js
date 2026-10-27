import { check, rejects } from './dataModelTests';
import { nativeFixture } from './nativeFixture';
import { createCalendarController } from '@/features/calendar/calendarController';
import { calendarRequest } from '@/services/calendarService';
import { withTestClock, testEventTurn } from './testClock';
const controller=f=>createCalendarController((action,body)=>f.cal({action,...body}));
/** @type {import('./testTypes').FoundationTest[]} */
export const CALENDAR_RECOVERY_TESTS = [
 ['RC01','Past/today native save readback/reopen and duplicate/near-date rejection preserve exact counts',async()=>{
   const f=nativeFixture(),c=controller(f);
   try {
     await c.load();c.select('2026-10-01');await c.submit('add');check(c.getSnapshot().success==='saved'&&c.getSnapshot().value.starts.some(r=>r.date==='2026-10-01'));
     c.select('2026-10-20');await c.submit('add');check(f.tables.UserPeriodRecord.length===2&&f.tables.UserCalendarAction.length===2);
     const before=JSON.stringify(f.tables);
     for(const [date,code] of [['2026-10-01','PERIOD_DUPLICATE'],['2026-10-08','PERIOD_CONFLICT']]) await rejects(()=>f.change('add',{date}),code);
     check(JSON.stringify(f.tables)===before,'validation wrote data');
     const reopened=controller(f);try{await reopened.load();check(reopened.getSnapshot().value.starts.length===2&&!reopened.getSnapshot().value.pendingReview);}finally{reopened.dispose();}
     const g=nativeFixture(),past=controller(g);
     try{await past.load();past.select('2026-09-01');await past.submit('add');check(past.getSnapshot().value.month==='2026-09'&&past.getSnapshot().value.starts[0].date==='2026-09-01');await past.load('2026-09');check(past.getSnapshot().value.starts.length===1&&g.tables.UserPeriodRecord.length===1);}finally{past.dispose();}
   }finally{c.dispose();}
 }],
 ['RC02','No-write and lost entire response retry same ID; partial add/edit/delete resumes saved receipt after reload',async()=>{
   for(const fault of ['no-write','lost-response']) {
     const f=nativeFixture();let first=true;const ids=[];
     const c=createCalendarController(async(action,body)=>{if(action==='read')return f.cal({action,...body});ids.push(body.action_id);if(first){first=false;if(fault==='lost-response')await f.cal({action,...body});throw {code:'NETWORK'};}return f.cal({action,...body});});
     try{await c.load();c.select('2026-10-01');await c.submit('add');check(c.getSnapshot().outcome==='unknown'&&!c.getSnapshot().busy&&!c.getSnapshot().success);check(f.tables.UserPeriodRecord.length===(fault==='no-write'?0:1));await c.retry();check(ids.length===2&&ids[0]===ids[1]&&c.getSnapshot().success==='saved'&&f.tables.UserPeriodRecord.length===1&&f.tables.UserCalendarAction.length===1);}finally{c.dispose();}
   }
   for(const operation of ['add','edit','delete']) {
     const f=nativeFixture();if(operation!=='add')await f.change('add',{date:'2026-10-01'});
     const body={action:operation,action_id:crypto.randomUUID(),revision:(await f.cal()).revision,...(operation!=='add'?{period_id:f.tables.UserPeriodRecord[0].id}:{}),...(operation!=='delete'?{date:operation==='edit'?'2026-10-02':'2026-10-01'}:{})};
     f.once('after',c=>c.name==='UserPeriodRecord'&&c.method===({add:'create',edit:'updateMany',delete:'deleteMany'}[operation]));await rejects(()=>f.cal(body));
     const count=f.tables.UserCalendarAction.length,c=controller(f);
     try{await c.load();check(c.getSnapshot().value.recovery.action_id===body.action_id&&c.getSnapshot().outcome==='unknown');await c.retry();check(c.getSnapshot().outcome==='confirmed'&&!c.getSnapshot().busy&&f.tables.UserCalendarAction.length===count&&f.tables.UserPeriodRecord.length===(operation==='delete'?0:1));if(operation!=='delete')check(c.getSnapshot().value.starts[0].date===body.date);}finally{c.dispose();}
   }
 }],
 ['RC03','Explicit retry supersedes hung passive read; old read and old mutation finally cannot change new account',async()=>{
   const f=nativeFixture();let hold=false,first=true;
   /** @type {(value:any)=>void} */
   let releaseRead;const oldView=await f.cal();
   const c=createCalendarController(async(action,body)=>{if(action==='read'&&hold)return new Promise(resolve=>{releaseRead=resolve;});if(action!=='read'&&first){first=false;throw {code:'TIMEOUT'};}return f.cal({action,...body});});
   try{await c.load();c.select('2026-10-01');await c.submit('add');hold=true;const read=c.refresh();check(c.getSnapshot().loading);await c.retry();check(!c.getSnapshot().busy&&!c.getSnapshot().loading&&c.getSnapshot().success==='saved');releaseRead(oldView);await read;check(c.getSnapshot().value.starts.length===1);}finally{c.dispose();}
   let n=0;
   /** @type {(value:any)=>void} */
   let releaseOld;
   /** @type {(value:any)=>void} */
   let releaseNew;
   const d=createCalendarController(async action=>action==='read'?oldView:new Promise(resolve=>{if(++n===1)releaseOld=resolve;else releaseNew=resolve;}));
   try{await d.load();d.select('2026-10-01');const old=d.submit('add');d.invalidate();check(!d.getSnapshot().busy&&!d.getSnapshot().value);await d.load();d.select('2026-10-02');const next=d.submit('add');releaseOld({...oldView,mutationConfirmed:true,starts:[{id:'old',date:'2026-10-01'}]});await old;check(d.getSnapshot().busy&&!d.getSnapshot().success,'old finally ended new request');releaseNew({...oldView,mutationConfirmed:true,starts:[{id:'new',date:'2026-10-02'}]});await next;check(!d.getSnapshot().busy&&d.getSnapshot().value.starts[0].id==='new');}finally{d.dispose();}
 }],
 ['RC04','Actual service 20s controlled deadline clears timer; late SDK response cannot confirm or reuse aborted view',withTestClock(async clock=>{
   const f=nativeFixture(),view=await f.cal();
   /** @type {(value:any)=>void} */
   let release;
   const work=calendarRequest('read',{}, {functions:{invoke:()=>new Promise(resolve=>{release=resolve;})}},clock.timers);
   const observed=rejects(()=>work,'TIMEOUT');await clock.advance(20000);await observed;check(clock.pending()===0);
   release({data:view});await testEventTurn();check(clock.pending()===0);
   const next=await calendarRequest('read',{}, {functions:{invoke:async()=>({data:view})}},clock.timers);check(next.revision===view.revision&&clock.pending()===0);
 })],
 ['RC05','Pending intent exposes no health after withdrawal; current owner/active/lifecycle gates still prevent resume',async()=>{
   const f=nativeFixture(),view=await f.cal();f.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');
   const body={action:'add',date:'2026-10-01',action_id:crypto.randomUUID(),revision:view.revision};await rejects(()=>f.cal(body));
   f.tables.UserHealthConsent[0].consent_status='WITHDRAWN';f.tables.UserHealthConsent[0].withdrawn_at='2026-10-20T13:00:00Z';
   const hidden=await f.cal();check(hidden.state==='CONSENT_REQUIRED'&&!hidden.recovery&&!hidden.starts.length&&!hidden.recordedDays.length&&!hidden.predictedDays.length);
   const before=JSON.stringify(f.tables);await rejects(()=>f.cal({action:'resume',action_id:body.action_id,revision:body.revision}));check(JSON.stringify(f.tables)===before);
   for(const code of ['AUTH_REQUIRED','ACTIVE_ACCOUNT_REQUIRED','HEALTH_CONSENT_REQUIRED','CONSENT_STATE_CHANGED','ACCOUNT_DELETION_IN_PROGRESS','ONBOARDING_RESTART_REQUIRED','OWNER_REQUIRED']) {
     let deny=false;const c=createCalendarController(async()=>{if(deny)throw {code};return view;});
     try{await c.load();deny=true;await c.refresh();check(c.getSnapshot().value===null&&c.getSnapshot().error===code&&!c.getSnapshot().busy);}finally{c.dispose();}
   }
 }],
];
