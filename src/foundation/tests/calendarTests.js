import { CALENDAR_RECOVERY_TESTS } from './calendarRecoveryTests';
import { CALENDAR_FUTURE_TESTS } from './calendarFutureTests';
import { CYCLE_RANGE_TESTS } from './cycleRangeTests';
import { check } from './dataModelTests';
import { calendarFixture, CALENDAR_NOW } from './calendarFixture';
import { calculateCalendar, validatePeriodChange, addCalendarDays, calendarMonthView } from '../../../base44/shared/calendarCalculation.js';
import { calendarOperation, handleCalendarRequest } from '../../../base44/shared/calendarOperation.js';
import { planCalendarChange, verifyCalendarCommit } from '../../../base44/shared/calendarState.js';
import { resolveDailyCycle } from '../../../base44/shared/dailyCycle.js';
import { serverLocalDate } from '../../../base44/shared/onboardingValidation.js';
import { createCalendarController } from '@/features/calendar/calendarController';
import { calendarRequest } from '@/services/calendarService';
import { dailyRecordFixture } from './dailyRecordFixture';
import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';
const reject = async (run, code) => { try { await run(); } catch (e) { check(!code || e.code === code, `${code} expected; ${e.code} received`); return; } throw new Error(`Expected ${code}`); };
const period = (id, date) => ({ id, user_id: 'ownerA', period_start_date: date });
const read = f => f.request('read');
/** @type {import('./testTypes').FoundationTest[]} */
export const CALENDAR_TESTS = [
 ...CALENDAR_RECOVERY_TESTS,
 ...CALENDAR_FUTURE_TESTS,
 ...CYCLE_RANGE_TESTS,
 ['CA01', 'Source 28/5 phases, three future cycles, real/predicted basis and NULL inputs', () => {
   const settings = { period_duration_days: null, initial_cycle_length_days: null };
   const result = calculateCalendar({ periods: [period('p1', '2026-10-01')], settings, today: '2026-10-20' });
   check(result.predictions.length === 3 && result.phases.length === 112 && result.estimate.length === 28);
   check(result.phases.slice(0,5).every(row => row.phase_code === 'MENSTRUAL') && result.phases[5].phase_code === 'FOLLICULAR' && result.phases[12].phase_code === 'OVULATION' && result.phases[15].phase_code === 'LUTEAL');
   check(result.phases[27].calculation_basis === 'RECORDED_START' && result.phases[28].calculation_basis === 'PREDICTED');
   check(settings.period_duration_days === null && settings.initial_cycle_length_days === null);
 }],
 ['CA02', 'Source 26/27/45 preserves actual outlier, half-up 27 and unsupported history', async () => {
   const dates = ['2026-06-01','2026-06-27','2026-07-24','2026-09-07'];
   const periods = dates.map((day,i) => period(`p${i}`, day));
   const result = calculateCalendar({ periods, today: '2026-09-10' });
   check(result.estimate.length === 27 && result.estimate.excluded[0] === 45 && result.observations.length === 3 && periods.length === 4);
   const unsupported = calculateCalendar({ periods: [period('a','2026-01-01'),period('b','2026-04-01')], today:'2026-10-20' });
   check(unsupported.estimate.length === null && !unsupported.predictions.length && !unsupported.phases.length);
 }],
 ['CA03', 'Duplicate and 14 days rejected, 15 accepted on both sides outside displayed month', async () => {
   const rows = [period('a','2026-08-31'),period('b','2026-09-30'),period('c','2026-10-30')];
   await reject(() => validatePeriodChange(rows,'add',null,'2026-09-30','2026-12-01'),'PERIOD_DUPLICATE');
   for (const day of ['2026-09-14','2026-09-16']) await reject(() => validatePeriodChange(rows,'add',null,day,'2026-12-01'),'PERIOD_CONFLICT');
   validatePeriodChange(rows,'add',null,'2026-09-15','2026-12-01');
   validatePeriodChange(rows,'edit','b','2026-09-30','2026-12-01');
   await reject(() => validatePeriodChange(rows,'edit','b','2026-10-16','2026-12-01'),'PERIOD_CONFLICT');
   await reject(() => validatePeriodChange(rows,'edit','b','2026-09-14','2026-12-01'),'PERIOD_CONFLICT');
 }],
 ['CA04', 'Leap/year/local date and DST boundaries; invalid/future starts fail', async () => {
   check(addCalendarDays('2024-02-28',1)==='2024-02-29' && addCalendarDays('2024-02-29',1)==='2024-03-01' && addCalendarDays('2025-12-31',1)==='2026-01-01');
   check(serverLocalDate(new Date('2026-03-29T00:30:00Z'),'Europe/Berlin')==='2026-03-29');
   check(serverLocalDate(new Date('2026-10-25T01:30:00Z'),'Europe/Berlin')==='2026-10-25');
   check(serverLocalDate(new Date('2026-01-01T00:30:00Z'),'America/Los_Angeles')==='2025-12-31');
   await reject(() => validatePeriodChange([],'add',null,'2026-02-29','2026-10-20'),'PERIOD_DATE_INVALID');
   await reject(() => validatePeriodChange([],'add',null,'2026-10-21','2026-10-20'),'PERIOD_START_FUTURE');
 }],
 ['CA05', 'Add, reopen, edit same ID, delete last and retain settings and grant time', async () => {
   const f=calendarFixture(); f.rows.user_cycle_settings.push({id:'settings',user_id:'ownerA',period_duration_days:null,initial_cycle_length_days:29});
   const grant=f.rows.user_health_consent[0].granted_at;
   await f.change('add',{date:'2026-10-01'});
   const id=f.rows.user_period_record[0].id;
   check((await read(f)).starts[0].id===id && f.rows.user_cycle_phase_day.length>0);
   await f.change('edit',{period_id:id,date:'2026-10-02'});
   check(f.rows.user_period_record.length===1 && f.rows.user_period_record[0].id===id && f.rows.user_period_record[0].period_start_date==='2026-10-02');
   const last=await f.change('delete',{period_id:id});
   check(!last.hasPeriods && !last.predictedDays.length && !f.rows.user_cycle_prediction.length && !f.rows.user_cycle_phase_day.length && f.rows.user_cycle_settings[0].initial_cycle_length_days===29);
   check(f.rows.user_health_consent[0].granted_at===grant && f.rows.user_health_consent_event.length===1);
   check(resolveDailyCycle({day:'2026-10-20',periods:[],settings:f.rows.user_cycle_settings[0]})==='UNKNOWN');
 }],
 ['CA06', 'Failed derived commit preserves every previous collection; repeat completes once', async () => {
   const f=calendarFixture(); await f.change('add',{date:'2026-09-01'});
   const before=JSON.stringify(f.rows), current=await read(f);
   const body={date:'2026-10-01',revision:current.revision,action_id:'calendar-failure-0001'};
   f.fault('beforeCommit'); await reject(()=>f.request('add',body),'CALENDAR_OPERATION_FAILED');
   check(JSON.stringify(f.rows)===before); f.fault(null);
   await f.request('add',body); await f.request('add',body);
   check(f.rows.user_period_record.length===2 && f.rows.user_health_consent_event.length===1);
 }],
 ['CA07', 'Lost response and independent worker retry replay durable receipt without duplicate writes', async () => {
   const f=calendarFixture({granted:false}), current=await read(f);
   const body={action:'add',timezone:'Europe/Istanbul',date:'2026-10-01',health_consent:true,revision:current.revision,action_id:'calendar-lost-00001'};
   f.fault('lostResponse'); await reject(()=>calendarOperation(f.client,body,{atomic:f.worker(),now:()=>new Date(CALENDAR_NOW)}),'CALENDAR_OPERATION_FAILED');
   const saved=JSON.stringify(f.rows), time=f.rows.user_health_consent[0].granted_at; f.fault(null);
   await calendarOperation(f.client,body,{atomic:f.worker(),now:()=>new Date(CALENDAR_NOW)});
   check(JSON.stringify(f.rows)===saved && f.rows.user_health_consent[0].granted_at===time && f.rows.user_health_consent_event.length===1);
   await reject(()=>calendarOperation(f.client,{...body,date:'2026-10-02'},{atomic:f.worker()}),'ACTION_CONFLICT');
 }],
 ['CA08', 'Two independent workers serialize conflicting revisions; distinct IDs cannot bypass duplicate rule', async () => {
   const f=calendarFixture(), current=await read(f), base={action:'add',date:'2026-10-01',revision:current.revision};
   const results=await Promise.allSettled(['calendar-tab-one01','calendar-tab-two02'].map(action_id=>calendarOperation(f.client,{...base,action_id},{atomic:f.worker(),now:()=>new Date(CALENDAR_NOW)})));
   check(results.filter(r=>r.status==='fulfilled').length===1 && f.rows.user_period_record.length===1);
   await reject(()=>f.change('add',{date:'2026-10-01'}),'PERIOD_DUPLICATE');
 }],
 ['CA09', 'Production refuses mutations without SDK writes; no forged owner/authority/derived input', async () => {
   const f=calendarFixture(), current=await read(f);
   const body={action:'add',date:'2026-10-01',revision:current.revision,action_id:'calendar-prod-00001'};
   await reject(()=>calendarOperation(f.client,body,{now:()=>new Date(CALENDAR_NOW)}),'CALENDAR_ATOMIC_CAPABILITY_REQUIRED');
   check(!f.rows.user_period_record.length && f.calls.every(c=>c.method==='filter'));
   for(const input of [{user_id:'ownerB'},{role:'admin'},{phase:'MENSTRUAL'},{predictions:[]},{granted_at:CALENDAR_NOW}]) await reject(()=>calendarOperation(f.client,{action:'read',...input}));
 }],
 ['CA10', 'No consent means no health reads; entry/selection cannot grant consent', async () => {
   const f=calendarFixture({granted:false});
   const value=await read(f); check(value.state==='CONSENT_REQUIRED' && !value.recordedDays.length);
   check(!f.calls.some(c=>['user_period_record','user_cycle_settings','user_cycle_phase_day','user_cycle_prediction'].includes(c.entity)));
   await reject(()=>f.change('add',{date:'2026-10-01',health_consent:false}),'HEALTH_CONSENT_REQUIRED');
   check(!f.rows.user_health_consent.length);
 }],
 ['CA11', 'Inactive, open deletion job, missing event and other owner are refused', async () => {
   for(const mutation of [
     f=>{f.rows.user_profile[0].account_status='INACTIVE';},
     f=>{f.rows.health_data_deletion_job.push({id:'job',user_id:'ownerA',job_status:'RETRYING'});},
     f=>{f.rows.user_health_consent_event.length=0;},
   ]) { const f=calendarFixture(); mutation(f); await reject(()=>f.change('add',{date:'2026-10-01'})); check(!f.rows.user_period_record.length); }
   const f=calendarFixture(); f.rows.user_period_record.push({id:'other',user_id:'ownerB',period_start_date:'2026-10-01'});
   check(!(await read(f)).starts.length); await reject(()=>f.change('delete',{period_id:'other'}),'PERIOD_NOT_FOUND'); check(f.rows.user_period_record.length===1);
   f.client.auth.me=async()=>null; await reject(()=>read(f),'AUTH_REQUIRED');
   const g=calendarFixture(), state=await g.snapshot();
   state.consent={...state.consent,user_id:'ownerB',consent_status:'WITHDRAWN'};
   await reject(()=>planCalendarChange(state,'ownerA',{action:'add',date:'2026-10-20',health_consent:true},'2026-10-20',CALENDAR_NOW,()=>crypto.randomUUID()),'OWNER_REQUIRED');
 }],
 ['CA12', 'Explicit regrant only after verified deletion; no restoration or new timestamp on retry', async () => {
   const f=calendarFixture(); f.rows.user_health_consent[0].consent_status='WITHDRAWN'; f.rows.user_health_consent[0].withdrawn_at='2026-10-10T12:00:00.000Z';
   f.rows.user_health_consent_event.push({id:'withdrawn',user_id:'ownerA',event_type:'WITHDRAWN',consent_version:'health-consent-v1.0',occurred_at:'2026-10-10T12:00:00.000Z'});
   await reject(()=>f.change('add',{date:'2026-10-20',health_consent:true}),'HEALTH_DELETION_UNCONFIRMED');
   f.rows.health_data_deletion_job.push({id:'job',user_id:'ownerA',protection_event_id:'protection',job_status:'COMPLETED',requested_at:'2026-10-10T12:00:00.000Z',completed_at:'2026-10-10T12:01:00.000Z',retry_count:0});
   await f.change('add',{date:'2026-10-20',health_consent:true});
   check(f.rows.user_health_consent_event.length===3 && f.rows.user_period_record.length===1 && f.rows.user_period_record[0].period_start_date==='2026-10-20');
   await read(f);
 }],
 ['CA13', 'Full paginated history, no per-day queries and no silent truncation', async () => {
   const f=calendarFixture();
   for(let i=0;i<105;i++)f.rows.user_period_record.push(period(`p${i}`,addCalendarDays('2020-01-01',i*20)));
   await read(f);
   const queries=f.calls.filter(c=>c.entity==='user_period_record');
   check(queries.length===4 && queries.every(c=>c.query.user_id==='ownerA' && c.limit===100) && queries.some(c=>c.skip===100));
   // Existing old observation remains in the validation set even off-screen.
   await reject(()=>f.change('add',{date:'2020-01-15'}),'PERIOD_CONFLICT');
 }],
 ['CA14', 'Historical phases preserve unaffected values; immutable daily TR/EN survives mutations', async () => {
   const f=calendarFixture(); f.rows.user_daily_message.push({...dailyRecordFixture('saved-day','ownerA'),shinka_date:'2026-10-20'});
   const before=JSON.stringify(f.rows.user_daily_message);
   await f.change('add',{date:'2026-09-01'}); await f.change('add',{date:'2026-10-01'});
   const old=f.rows.user_cycle_phase_day.find(row=>row.phase_date==='2026-09-01');
   await f.change('add',{date:'2026-10-16'});
   check(JSON.stringify(f.rows.user_cycle_phase_day.find(row=>row.phase_date==='2026-09-01'))===JSON.stringify(old));
   await f.change('delete',{period_id:f.rows.user_period_record.at(-1).id});
   check(JSON.stringify(f.rows.user_daily_message)===before);
   await dailyMessageOperation(f.client,{action:'today',timezone:'Europe/Istanbul'},{now:()=>new Date(CALENDAR_NOW)});
   check(JSON.stringify(f.rows.user_daily_message)===before);
 }],
 ['CA15', 'Controller selection/edit/delete cancel writes nothing; failure preserves date and prior data', async () => {
   const f=calendarFixture(); await f.change('add',{date:'2026-10-01'});
   let writes=0; const control=createCalendarController((action,body)=>{if(action!=='read')writes++;return f.request(action,body);});
   await control.load('2026-10'); const before=JSON.stringify(f.rows);
   control.select('2026-10-01'); const id=control.getSnapshot().editing.id;
   control.deletePrompt(true); control.deletePrompt(false); check(!writes && JSON.stringify(f.rows)===before);
   control.select('2026-10-02'); check(control.getSnapshot().editing.id===id);
   f.fault('beforeCommit'); await control.submit('edit');
   check(control.getSnapshot().selected==='2026-10-02' && control.getSnapshot().value.starts[0].date==='2026-10-01');
   f.fault(null); await control.retry(); check(f.rows.user_period_record[0].id===id && f.rows.user_period_record[0].period_start_date==='2026-10-02');
   control.dispose();
 }],
 ['CA16', 'Old responses cannot restore health after invalidation/session disposal; double submits coalesce', async () => {
   const f=calendarFixture(); let release=()=>{}, pending=false;
   const controller=createCalendarController(async(action,body)=>{const value=await f.request(action,body);pending=true;return new Promise(resolve=>{release=()=>resolve(value);});});
   const loading=controller.load(); while(!pending)await new Promise(resolve=>setTimeout(resolve,1));
   controller.invalidate(); release(); await loading; check(controller.getSnapshot().value===null); controller.dispose();
   const c=createCalendarController(f.request); await c.load(); c.select('2026-10-01');
   await Promise.all([c.submit('add'),c.submit('add')]); check(f.rows.user_period_record.length===1); c.dispose();
 }],
 ['CA17', 'Malformed durable readback, unsafe transport and raw error disclosure fail closed', async () => {
   const f=calendarFixture(); await f.change('add',{date:'2026-10-01'});
   const state=await f.snapshot(); state.phases.pop();
   await reject(()=>verifyCalendarCommit(state,'ownerA','2026-10-20'),'CALENDAR_READBACK_CONFLICT');
   const response=await handleCalendarRequest(new Request('https://test.invalid',{method:'POST',body:'{"action":"read"}'}),()=>({auth:{me:async()=>{throw new Error('secret@example.invalid health payload');}}}));
   check(!JSON.stringify(await response.json()).includes('secret'));
   await reject(()=>calendarRequest('read',{}, {functions:{invoke:async()=>({data:{state:'READY'}})}}),'CALENDAR_READBACK_CONFLICT');
   const view=await f.request('read');
   for (const invalid of [
     {...view,calculationNotice:'UNAPPROVED_NOTICE'},
     {...view,calculationNotice:'CYCLE_ESTIMATE_UNAVAILABLE',predictedDays:['2026-10-29']},
   ]) await reject(()=>calendarRequest('read',{}, {functions:{invoke:async()=>({data:invalid})}}),'CALENDAR_READBACK_CONFLICT');
   const unsupported={...view,calculationNotice:'CYCLE_ESTIMATE_UNAVAILABLE',predictedDays:[]};
   check((await calendarRequest('read',{}, {functions:{invoke:async()=>({data:unsupported})}})).calculationNotice==='CYCLE_ESTIMATE_UNAVAILABLE');
   f.rows.user_cycle_phase_day[0].calculated_at='2026-10-20T12:00:00';
   const before=JSON.stringify(f.rows);
   await reject(()=>f.change('edit',{period_id:f.rows.user_period_record[0].id,date:'2026-10-01'}));
   check(JSON.stringify(f.rows)===before,'invalid reused cache must fail before commit');
   await reject(()=>calculateCalendar({periods:[null,period('valid','2026-10-01')],today:'2026-10-20'}),'CALENDAR_DATA_CONFLICT');
 }],
 ['CA18', 'Real days override predictions; delete non-start refused and changed references have no dangling IDs', async () => {
   const f=calendarFixture(); await f.change('add',{date:'2026-09-01'}); await f.change('add',{date:'2026-10-01'});
   const last=f.rows.user_period_record.at(-1).id;
   await f.change('delete',{period_id:last});
   check(![...f.rows.user_cycle_prediction,...f.rows.user_cycle_phase_day].some(row=>row.reference_period_id===last));
   const result=calculateCalendar({periods:f.rows.user_period_record,today:'2026-10-20'});
   const month=calendarMonthView(f.rows.user_period_record,null,result,'2026-09');
   check(month.recordedDays.includes('2026-09-01') && !month.predictedDays.includes('2026-09-01'));
   await reject(()=>f.change('delete',{period_id:'predicted-day'}),'PERIOD_NOT_FOUND');
 }],
 ['CA19', 'Regrant with residual health rejected; consent changes cannot be bypassed by prior action receipt', async () => {
   const f=calendarFixture(); const current=await read(f);
   const body={date:'2026-10-01',revision:current.revision,action_id:'calendar-revoke-001'};
   await f.request('add',body);
   f.rows.user_health_consent[0].consent_status='WITHDRAWN';
   f.rows.user_health_consent[0].withdrawn_at=CALENDAR_NOW;
   await reject(()=>f.request('add',body),'HEALTH_CONSENT_REQUIRED');
   const state=await f.snapshot();
   await reject(()=>planCalendarChange(state,'ownerA',{action:'add',date:'2026-10-20',health_consent:true},'2026-10-20',CALENDAR_NOW,()=>crypto.randomUUID()),'HEALTH_DELETION_UNCONFIRMED');
 }],
 ['CA20', 'Initial grant and late conflict are all-or-nothing; fresh transaction guards beat earlier UI reads', async () => {
   const f=calendarFixture({granted:false}), before=JSON.stringify(f.rows);
   f.fault('beforeCommit');await reject(()=>f.change('add',{date:'2026-10-01',health_consent:true}),'CALENDAR_OPERATION_FAILED');
   check(JSON.stringify(f.rows)===before);
   const g=calendarFixture(), view=await read(g);
   const atomic={transactCalendar:request=>{g.rows.user_profile[0].account_status='INACTIVE';return g.worker().transactCalendar(request);}};
   await reject(()=>calendarOperation(g.client,{action:'add',date:'2026-10-01',action_id:'calendar-deactivate1',revision:view.revision},{atomic,now:()=>new Date(CALENDAR_NOW)}),'ACTIVE_ACCOUNT_REQUIRED');
   check(!g.rows.user_period_record.length);
 }],
 ['CA21', 'Late mutation cannot restore health after access invalidation; monthly navigation retains edit ID', async () => {
   const f=calendarFixture(); await f.change('add',{date:'2026-10-01'});
   let release=()=>{},waiting=false;
   const c=createCalendarController(async(action,body)=>{
     const result=await f.request(action,body);
     if(action==='read')return result;
     waiting=true;return new Promise(resolve=>{release=()=>resolve(result);});
   });
   await c.load();c.select('2026-10-01');const id=c.getSnapshot().editing.id;
   await c.load('2026-09');check(c.getSnapshot().editing.id===id);c.select('2026-09-30');
   const saving=c.submit('edit');while(!waiting)await new Promise(resolve=>setTimeout(resolve,1));
   c.invalidate();release();await saving;check(c.getSnapshot().value===null&&!c.getSnapshot().success);c.dispose();
 }],
 ['CA22', 'Late-day receipt replay does not recalculate the committed cache or issue consent again', async () => {
   const f=calendarFixture({granted:false}), view=await read(f);
   const body={action:'add',date:'2026-10-01',health_consent:true,revision:view.revision,action_id:'calendar-later-day01'};
   await calendarOperation(f.client,body,{atomic:f.worker(),now:()=>new Date(CALENDAR_NOW)});
   const before=JSON.stringify(f.rows);
   const later=await calendarOperation(f.client,body,{atomic:f.worker(),now:()=>new Date('2026-11-30T12:00:00.000Z')});
   check(JSON.stringify(f.rows)===before&&later.today==='2026-11-30'&&later.coverageEnd>'2027-01-01');
 }],
 ['CA23', 'Superseded receipt never restores deleted records or reports a stale save as success', async () => {
   const f=calendarFixture(), view=await read(f);
   const body={date:'2026-10-01',revision:view.revision,action_id:'calendar-superseded1'};
   await f.request('add',body);await f.change('delete',{period_id:f.rows.user_period_record[0].id});
   await reject(()=>f.request('add',body),'CALENDAR_STATE_CHANGED');
   check(!f.rows.user_period_record.length&&!f.rows.user_cycle_phase_day.length);
 }],
];
