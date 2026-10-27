import { check, rejects } from './dataModelTests';
import { nativeFixture } from './nativeFixture';
import { calendarFixture } from './calendarFixture';
import { calendarOperation } from '../../../base44/shared/calendarOperation.js';
import { calendarRequest } from '@/services/calendarService';
import { createCalendarController } from '@/features/calendar/calendarController';
const writes = f => f.state.calls.filter(c => c.method !== 'filter');
const observation = date => ({ id:'old-period', user_id:'ownerA', period_start_date:date });
/** @type {import('./testTypes').FoundationTest[]} */
export const CALENDAR_FUTURE_TESTS = [
 ['CF01','Native future add/edit rejected before every health/receipt write; today/past still save',async()=>{
  for(const granted of [true,false]) {
   const f=nativeFixture({granted}),view=await f.cal(),before=JSON.stringify(f.tables);f.state.calls=[];
   await rejects(()=>f.cal({action:'add',date:'2026-10-21',health_consent:true,revision:view.revision,action_id:'future-add-test-01'}),'PERIOD_START_FUTURE');
   check(writes(f).length===0&&JSON.stringify(f.tables)===before,'future add wrote');
   await f.change('add',{date:'2026-10-20',health_consent:true});const id=f.tables.UserPeriodRecord[0].id;
   const saved=JSON.stringify(f.tables);f.state.calls=[];
   await rejects(()=>f.change('edit',{period_id:id,date:'2026-10-21'}),'PERIOD_START_FUTURE');
   check(writes(f).length===0&&JSON.stringify(f.tables)===saved,'future edit wrote');
   await f.change('edit',{period_id:id,date:'2026-10-19'});check(f.tables.UserPeriodRecord[0].period_start_date==='2026-10-19');
  }
 }],
 ['CF02','Server IANA day controls year/month/midnight boundaries; forged today and synthetic atomic path fail closed',async()=>{
  for(const [instant,timezone,today,future] of [
   ['2026-01-01T00:30:00Z','America/Los_Angeles','2025-12-31','2026-01-01'],
   ['2026-01-31T21:00:00Z','Europe/Istanbul','2026-02-01','2026-02-02'],
   ['2026-03-01T07:59:59Z','America/Los_Angeles','2026-02-28','2026-03-01'],
   ['2026-03-01T08:00:00Z','America/Los_Angeles','2026-03-01','2026-03-02'],
  ]) {
   const f=nativeFixture();f.state.time=instant;f.tables.UserPreferences[0].timezone=timezone;
   const view=await f.cal({action:'read',timezone:null,month:future.slice(0,7)});check(view.today===today,'server fallback day');
   const body={action:'add',timezone,date:future,revision:view.revision,action_id:'boundary-future-01'};f.state.calls=[];
   await rejects(()=>f.cal(body),'PERIOD_START_FUTURE');check(!writes(f).length);
   await rejects(()=>f.cal({...body,today:future}),'INVALID_REQUEST');
   await f.cal({...body,date:today});check(f.tables.UserPeriodRecord[0].period_start_date===today);
  }
  const f=calendarFixture(),view=await f.request('read'),before=JSON.stringify(f.rows);
  await rejects(()=>calendarOperation(f.client,{action:'add',date:'2026-10-21',action_id:'atomic-future-0001',revision:view.revision},{atomic:f.worker(),now:()=>new Date('2026-10-20T12:00:00Z')}),'PERIOD_START_FUTURE');
  check(JSON.stringify(f.rows)===before,'non-native wrote');
 }],
 ['CF03','Pending initial grant resume and APPLIED replay cannot bypass fresh day; no implicit repair or duplicate writes',async()=>{
  const f=nativeFixture({granted:false}),view=await f.cal();
  const body={action:'add',date:'2026-10-20',health_consent:true,action_id:'partial-future-001',revision:view.revision};
  f.once('before',c=>c.name==='UserHealthConsentEvent'&&c.method==='create');await rejects(()=>f.cal(body));
  check(f.tables.UserHealthConsent.length===1&&!f.tables.UserHealthConsentEvent.length&&!f.tables.UserPeriodRecord.length,'partial boundary');
  const saved=JSON.stringify(f.tables);f.state.time='2026-10-19T12:00:00Z';f.state.calls=[];
  for(const action of ['add','resume']) await rejects(()=>f.cal(action==='resume'?{action,action_id:body.action_id,revision:body.revision}:body),'PERIOD_START_FUTURE');
  check(!writes(f).length&&JSON.stringify(f.tables)===saved,'resume wrote before date validation');
  f.state.time='2026-10-20T12:00:00Z';await f.cal({action:'resume',action_id:body.action_id,revision:body.revision});
  const completed=JSON.stringify(f.tables);f.state.time='2026-10-19T12:00:00Z';f.state.calls=[];
  await rejects(()=>f.cal(body),'PERIOD_START_FUTURE');check(!writes(f).length&&JSON.stringify(f.tables)===completed,'APPLIED replay changed data');
  f.state.time='2026-10-20T12:00:00Z';await f.cal(body);check(JSON.stringify(f.tables)===completed,'retry duplicated');
  // A boundary change while a request is in flight is checked at the actual write.
  const g=nativeFixture();g.state.before=c=>{if(c.name==='UserCalendarAction'&&c.method==='create')g.state.time='2026-10-19T12:00:00Z';};
  await rejects(()=>g.change('add',{date:'2026-10-20'}),'PERIOD_START_FUTURE');check(!g.tables.UserPeriodRecord.length,'late day wrote');
 }],
 ['CF04','Legacy future observation remains visible and correctable/deletable with predictions withheld',async()=>{
  for(const action of ['edit','delete']) {
   const f=nativeFixture();f.tables.UserPeriodRecord.push(observation('2026-11-01'));
   const before=JSON.stringify(f.tables),view=await f.cal({action:'read',month:'2026-11'});
   check(view.calculationError==='CALENDAR_FUTURE_RECORD'&&view.starts[0].id==='old-period'&&!view.predictedDays.length&&view.writable,'future row inaccessible');
   check(JSON.stringify(f.tables)===before,'read repaired history');
   const result=await f.change(action,{period_id:'old-period',...(action==='edit'?{date:'2026-10-20'}:{})});
   check(result.mutationConfirmed&&!result.calculationError&&f.tables.UserPeriodRecord.length===(action==='edit'?1:0));
  }
 }],
 ['CF05','Selection/prediction is not saved; future UI handler and false success envelopes cannot confirm mutation',async()=>{
  const f=nativeFixture();await f.change('add',{date:'2026-10-01'});let attempts=0;
  const c=createCalendarController((action,body)=>{if(action!=='read')attempts++;return f.cal({action,...body});});
  try {await c.load();c.select('2026-10-29');await c.submit('add');check(attempts===0&&c.getSnapshot().error==='PERIOD_START_FUTURE'&&!c.getSnapshot().success);c.cancelEdit();}
  finally {c.dispose();}
  const view=await f.cal();
  for(const invalid of [{...view,mutationConfirmed:false},{...view,mutationConfirmed:true}]) {
   await rejects(()=>calendarRequest('add',{date:'2026-10-20',month:view.month},{functions:{invoke:async()=>({data:invalid})}}),'CALENDAR_READBACK_CONFLICT');
   const controller=createCalendarController(async action=>action==='read'?view:invalid);
   try {await controller.load();controller.select('2026-10-20');await controller.submit('add');check(!controller.getSnapshot().success&&controller.getSnapshot().error==='CALENDAR_READBACK_CONFLICT','false saved UI');}
   finally {controller.dispose();}
  }
 }],
];
