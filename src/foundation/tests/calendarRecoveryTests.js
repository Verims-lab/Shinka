import { handleCalendarRequest } from '../../../base44/shared/calendarOperation.js';
import { check, rejects } from './dataModelTests';
import { nativeFixture } from './nativeFixture';
import { createCalendarController } from '@/features/calendar/calendarController';
import { calendarRequest } from '@/services/calendarService';
import { withTestClock, testEventTurn } from './testClock';
const controller=f=>createCalendarController((action,body)=>f.cal({action,...body}));
/** @type {import('./testTypes').FoundationTest[]} */
export const CALENDAR_RECOVERY_TESTS = [
 ['RC10','Native failures preserve safe period/receipt/readback stage and request ID without raw provider details',async()=>{
   for(const [name,method,stage] of [['UserCalendarAction','create','CALENDAR_RECEIPT_CREATE'],['UserPeriodRecord','create','CALENDAR_PERIOD_WRITE'],['UserCalendarAction','update','CALENDAR_RECEIPT_FINISH']]) {
     const f=nativeFixture(),view=await f.cal();f.state.before=async c=>{if(c.name===name&&c.method===method)throw {response:{status:503,data:{private_detail:'PRIVATE_SENTINEL'}},message:'PRIVATE_SENTINEL'};};
     const response=await handleCalendarRequest(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify({action:'add',date:'2026-10-01',action_id:crypto.randomUUID(),revision:view.revision})}),()=>f.client(),{native:true,now:f.now});
     const data=await response.json();check(data.diagnostic.stage===stage&&data.diagnostic.httpStatus===503&&data.diagnostic.durationMs>=0&&/^[a-f0-9-]{36}$/.test(data.diagnostic.requestId));
     check(!JSON.stringify(data).includes('PRIVATE_SENTINEL')&&!JSON.stringify(data).includes('2026-10-01'));
   }
 }],
 ['RC06','Read-only receipt checks distinguish ABSENT/PENDING/APPLIED/CONFLICT for add/edit/delete without mutating',async()=>{
   for(const operation of ['add','edit','delete'])for(const fault of ['before','after','applied']) {
     const f=nativeFixture();if(operation!=='add')await f.change('add',{date:'2026-10-01'});
     const body={action:operation,action_id:crypto.randomUUID(),revision:(await f.cal()).revision,...(operation!=='add'?{period_id:f.tables.UserPeriodRecord[0].id}:{}),...(operation!=='delete'?{date:operation==='edit'?'2026-10-02':'2026-10-01'}:{})};
     const read=()=>f.cal({action:'read',action_id:body.action_id,revision:body.revision});
     check((await read()).checkedAction.status==='ABSENT');
     if(fault!=='applied')f.once(fault,c=>c.name==='UserPeriodRecord'&&c.method===({add:'create',edit:'updateMany',delete:'deleteMany'}[operation]));
     if(fault==='applied')await f.cal(body);else await rejects(()=>f.cal(body));
     const before=JSON.stringify(f.tables),calls=f.state.calls.length,view=await read();
     check(view.checkedAction.status===(fault==='applied'?'APPLIED':'PENDING')&&view.checkedAction.action_id===body.action_id);
     check(JSON.stringify(f.tables)===before&&f.state.calls.slice(calls).every(c=>c.method==='filter'),'status check wrote');
     const writes=()=>f.state.calls.filter(c=>c.name==='UserPeriodRecord'&&c.method!== 'filter').length;
     const count=writes();await f.cal({action:'resume',action_id:body.action_id,revision:body.revision});
     check(writes()===count+(fault==='before'?1:0),'repeated completed period mutation');
     check((await read()).checkedAction.status==='APPLIED');
     check((await f.cal({action:'read',action_id:body.action_id,revision:'f'.repeat(64)})).checkedAction.status==='CONFLICT');
   }
 }],
 ['RC07','Passive read confirms lost APPLIED response without a write; pending check resumes once despite double tap and foreground events',async()=>{
   for(const fault of ['applied','pending']) {
     const f=nativeFixture();await f.change('add',{date:'2026-10-01'});let first=true;const calls=[];
     const c=createCalendarController(async(action,body)=>{calls.push({action,...body});if(action!=='read'&&first){first=false;if(fault==='pending')f.once('after',x=>x.name==='UserPeriodRecord'&&x.method==='deleteMany');await f.cal({action,...body});throw {code:'NETWORK'};}return f.cal({action,...body});});
     try {
       await c.load();c.select('2026-10-01');c.deletePrompt(true);await c.submit('delete');check(c.getSnapshot().outcome==='unknown'&&c.getSnapshot().confirmDelete);
       const id=calls.find(x=>x.action==='delete').action_id;
       if(fault==='applied')await c.refresh();else await Promise.all([c.retry(),c.retry(),c.refresh({background:true})]);
       check(c.getSnapshot().success==='deleted'&&!c.getSnapshot().confirmDelete&&!c.getSnapshot().busy&&c.getSnapshot().outcome==='confirmed');
       check(calls.filter(x=>x.action!=='read').length===(fault==='applied'?1:2));check(calls.filter(x=>x.action!=='read').every(x=>x.action_id===id));
       check(f.state.calls.filter(x=>x.name==='UserPeriodRecord'&&x.method==='deleteMany').length===1);
       c.select('2026-10-05');check(c.getSnapshot().selected==='2026-10-05'&&c.getSnapshot().outcome===null);
     }finally{c.dispose();}
   }
 }],
 ['RC08','Status read gates and conflicts never grant write authority; validation rejection remains editable',async()=>{
   const f=nativeFixture(),c=controller(f);
   try {await c.load();c.select('2026-10-01');await c.submit('add');c.select('2026-10-08');await c.submit('add');check(c.getSnapshot().error==='PERIOD_CONFLICT'&&c.getSnapshot().outcome==='rejected');c.select('2026-09-01');await c.submit('add');check(c.getSnapshot().success==='saved'&&!c.getSnapshot().error);}finally{c.dispose();}
   const receipt=f.tables.UserCalendarAction[0],body={action:'read',action_id:receipt.action_id,revision:receipt.base_revision};
   check((await f.cal(body)).checkedAction.status==='CONFLICT','later revision silently accepted');
   const before=JSON.stringify(f.tables);await rejects(()=>f.cal({...body,user_id:'ownerB'}),'FORGED_OWNER');
   f.tables.UserProfile[0].account_status='INACTIVE';await rejects(()=>f.cal(body),'ACTIVE_ACCOUNT_REQUIRED');f.tables.UserProfile[0].account_status='ACTIVE';
   f.tables.UserHealthConsent[0].consent_status='WITHDRAWN';f.tables.UserHealthConsent[0].withdrawn_at='2026-10-20T13:00:00Z';
   const hidden=await f.cal(body);check(hidden.state==='CONSENT_REQUIRED'&&!hidden.checkedAction&&!hidden.starts.length);
   check(before.includes(receipt.action_id)&&f.tables.UserCalendarAction.length===2);
   const other=nativeFixture();let writeCalls=0;
   const d=createCalendarController(async(action,body)=>{if(action!=='read'){writeCalls++;throw {code:'NETWORK'};}return other.cal({action,...body});});
   try {
     await d.load();d.select('2026-09-01');await d.submit('add');
     other.once('before',x=>x.name==='UserPeriodRecord'&&x.method==='create');await rejects(()=>other.change('add',{date:'2026-10-01'}));
     await d.retry();check(writeCalls===1&&other.tables.UserCalendarAction.length===1&&d.getSnapshot().error==='CALENDAR_ACTION_CONFLICT','competing pending intent caused another write');
   }finally{d.dispose();}
 }],
 ['RC09','Explicit reconciliation shares the 20s budget, ignores old account check and never writes after failed/budget-exhausted status',async()=>{
   for(const mode of ['timeout','exhausted','account']) {
     const f=nativeFixture(),view=await f.cal();let now=0,writes=0;
     /** @type {(value:any)=>void} */
     let release=()=>{};
     const c=createCalendarController(async(action,body)=>{
       if(action!=='read'){writes++;throw {code:'NETWORK'};}
       if(!body.action_id)return view;
       if(mode==='timeout')throw {code:'TIMEOUT'};
       if(mode==='account')return new Promise(resolve=>{release=resolve;});
       now=20001;return {...view,checkedAction:{action_id:body.action_id,status:'ABSENT'}};
     },()=>now);
     try{await c.load();c.select('2026-10-01');await c.submit('add');const checkWork=c.retry();if(mode==='account'){c.invalidate();release(view);}await checkWork;check(writes===1&&!c.getSnapshot().busy&&!c.getSnapshot().checking);check(mode==='account'?c.getSnapshot().value===null:c.getSnapshot().outcome==='unknown');}finally{c.dispose();}
   }
 }],

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
     try{await c.load();c.select('2026-10-01');await c.submit('add');check(c.getSnapshot().outcome==='unknown'&&!c.getSnapshot().busy&&!c.getSnapshot().success);check(f.tables.UserPeriodRecord.length===(fault==='no-write'?0:1));await c.retry();check(ids.length===(fault==='no-write'?2:1)&&(ids.length===1||ids[0]===ids[1])&&c.getSnapshot().success==='saved'&&f.tables.UserPeriodRecord.length===1&&f.tables.UserCalendarAction.length===1);}finally{c.dispose();}
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
   const c=createCalendarController(async(action,body)=>{if(action==='read'&&hold){hold=false;return new Promise(resolve=>{releaseRead=resolve;});}if(action!=='read'&&first){first=false;throw {code:'TIMEOUT'};}return f.cal({action,...body});});
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
