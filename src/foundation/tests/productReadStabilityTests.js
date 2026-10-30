import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { check } from './dataModelTests';
import { withTestClock, testEventTurn } from './testClock';
import { calendarRequest } from '@/services/calendarService';
import { patternRequest } from '@/services/patternService';
import { createCalendarController } from '@/features/calendar/calendarController';
import { createPatternController } from '@/features/pattern/patternController';
import { bindPatternLifecycle } from '@/features/pattern/patternLifecycle';
import { patternFixture } from './patternFixture';
import { handlePatternRequest } from '../../../base44/shared/patternOperation.js';
import { handleCalendarRequest } from '../../../base44/shared/calendarOperation.js';
const capture = async promise => { try { await promise; } catch (e) { return e; } throw new Error('EXPECTED_FAILURE'); };
const client = invoke => ({ functions: { invoke } });
const requestId = '9b688272-cd41-4202-ade3-9b1ff83ae1f0';
const fault = (status, code = undefined, delay = '0.5') => ({ response: { status, headers: { 'retry-after': delay }, data: { error_code: code, request_id: requestId } }, message: 'PRIVATE_DO_NOT_COPY' });
const view = () => ({ state:'READY',month:'2026-10',today:'2026-10-30',revision:'a'.repeat(64),writable:true,starts:[],recordedDays:[],predictedDays:[] });
/** @type {import('./testTypes').FoundationTest[]} */
export const PRODUCT_READ_STABILITY_TESTS = [
 ['CP01','Read 429/503 retries once within original budget with safe metadata and no parallel SDK attempts',withTestClock(async clock=>{
   const themes=await patternFixture().request('themes');
   for(const status of [429,503]) for(const section of ['calendar','themes']) {
     let calls=0,active=0,peak=0;
     const sdk=client(async()=>{calls++;active++;peak=Math.max(peak,active);try{if(calls===1)throw fault(status);return {data:section==='calendar'?view():themes};}finally{active--;}});
     const read=()=>section==='calendar'?calendarRequest('read',{},sdk,clock.timers,{now:clock.now}):patternRequest(section,sdk,20000,clock.timers,{now:clock.now});
     const result=await clock.run(read);
     check(result.state&&calls===2&&peak===1&&clock.pending()===0,'retry/concurrency/cleanup');
   }
 })],
 ['CP02','Persistent/budget-limited rate limit, authorization, data conflict and writes cannot become retry storms',withTestClock(async clock=>{
   for(const [status,code,delay,expected] of [[429,undefined,'0.5',2],[429,undefined,'30',1],[401,undefined,'0',1],[403,'TEST_LIFECYCLE_UNAVAILABLE','0',1],[503,'PATTERN_CATEGORY_CONFLICT','0',1]]) {
     let calls=0;const sdk=client(async()=>{calls++;throw fault(Number(status),code == null ? undefined : String(code),String(delay));});
     const error=await clock.run(()=>capture(patternRequest('themes',sdk,20000,clock.timers,{now:clock.now})));
     check(calls===expected&&error.attempts===expected&&error.diagnostic.httpStatus===status&&error.diagnostic.requestId===requestId);
     check(!JSON.stringify(error).includes('PRIVATE')&&!('response' in error)&&clock.pending()===0);
     if(status===401||status===403)check(error.code==='ACCESS_DENIED');
   }
   for(const action of ['add','edit','delete','resume']) {
     let calls=0;const error=await capture(calendarRequest(action,{},client(async()=>{calls++;throw fault(503);}),clock.timers,{now:clock.now}));
     check(calls===1&&error.attempts===1&&error.diagnostic.stage==='CALENDAR_WRITE','automatic mutation retry or wrong stage');
   }
   let calls=0;
   const invalid=await capture(patternRequest('themes',client(async()=>{calls++;return {data:{state:'READY'}};}),20000,clock.timers,{now:clock.now}));
   check(invalid.code==='PATTERN_RESPONSE_INVALID'&&calls===1);
   const unknown=await capture(patternRequest('themes',client(async()=>{throw fault(409,'PATTERN_PRIVATE_DO_NOT_COPY');}),20000,clock.timers,{now:clock.now}));
   check(unknown.code==='PATTERN_READ_FAILED'&&!JSON.stringify(unknown).includes('PRIVATE'),'unapproved code survived');
   let nestedCalls=0;const nested=await capture(patternRequest('themes',client(async()=>{nestedCalls++;throw {originalError:fault(503,'PATTERN_CATEGORY_CONFLICT')};}),20000,clock.timers,{now:clock.now}));
   check(nestedCalls===1&&nested.code==='PATTERN_CATEGORY_CONFLICT','nested SDK domain conflict retried');
   let conflictCalls=0;await capture(patternRequest('themes',client(async()=>{conflictCalls++;throw {response:{status:409,data:{diagnostic:{code:'RATE_LIMITED',httpStatus:429}}}};}),20000,clock.timers,{now:clock.now}));
   check(conflictCalls===1,'inner diagnostic overrode HTTP conflict');
 })],
 ['CP03','Suspended deadline, timeout, cancellation and late SDK results release local work without claiming remote abort',withTestClock(async clock=>{
   let now=0; let release = (_value) => {};const sdk=client(()=>new Promise(resolve=>{release=resolve;}));
   const old=capture(calendarRequest('read',{},sdk,clock.timers,{now:()=>now}));await testEventTurn();
   now=21000;release({data:view()});const error=await old;check(error.code==='TIMEOUT'&&clock.pending()===0,'late success after wall deadline');
   const abort=new AbortController();const work=capture(patternRequest('themes',sdk,20000,clock.timers,{signal:abort.signal,now:clock.now}));await testEventTurn();abort.abort();
   check((await work).code==='READ_CANCELLED'&&clock.pending()===0);release({data:{private:'ignored'}});await testEventTurn();
   const timeout=await clock.run(()=>capture(patternRequest('themes',client(()=>new Promise(()=>{})),20000,clock.timers,{now:clock.now})));
   check(timeout.code==='TIMEOUT'&&timeout.attempts===1&&clock.pending()===0);
 })],
 ['CP04','Calendar empty/retained read errors recover with month and draft; transient lifecycle is not consent refusal',async()=>{
   let mode='fail',calls=0;
   const c=createCalendarController(async()=>{calls++;if(mode==='fail')throw {code:'SERVICE_UNAVAILABLE'};if(mode==='lifecycle')throw {code:'TEST_LIFECYCLE_UNAVAILABLE',diagnostic:{code:'RATE_LIMITED',httpStatus:429,stage:'LIFECYCLE_READ',durationMs:1,requestId},attempts:2};if(mode==='deny')throw {code:'ACCESS_DENIED'};return view();});
   try {
     await c.load();check(!c.getSnapshot().value&&!c.getSnapshot().refreshError&&c.getSnapshot().error==='SERVICE_UNAVAILABLE');
     mode='ok';await Promise.all([c.retry(),c.retry()]);check(calls===2&&!c.getSnapshot().error&&c.getSnapshot().value);
     c.select('2026-10-05');mode='lifecycle';await c.refresh();check(c.getSnapshot().value&&c.getSnapshot().selected==='2026-10-05'&&c.getSnapshot().refreshError==='TEST_LIFECYCLE_UNAVAILABLE');
     check(c.getSnapshot().readDiagnostic.httpStatus===429);c.connectionLost();check(!c.getSnapshot().readDiagnostic&&c.getSnapshot().value,'old diagnostic attached to offline event');c.connectionRestored();
     mode='ok';await c.refresh();check(!c.getSnapshot().refreshError&&c.getSnapshot().selected==='2026-10-05');
     mode='deny';await c.refresh();check(!c.getSnapshot().value&&!c.getSnapshot().selected);
   } finally {c.dispose();}
 }],
 ['CP05','Expired pending slots release on return; obsolete responses and ended sessions cannot revive either screen',async()=>{
   let now=0,hold=true;const releases=[];let calls=0;
   const request=()=>{calls++;return hold?new Promise(resolve=>releases.push(resolve)):Promise.resolve(view());};
   const c=createCalendarController(request,()=>now),p=createPatternController(request,()=>now);
   try {
     const old=[c.load(),p.refresh()];await testEventTurn();check(calls===3);
     now=21000;hold=false;await Promise.all([c.refresh({background:true}),p.refresh({background:true})]);check(calls===6&&c.getSnapshot().value&&p.getSnapshot().themes.value);
     const latest=[c.getSnapshot(),p.getSnapshot()];releases.splice(0).forEach(resolve=>resolve({stale:true}));await Promise.all(old);
     check(c.getSnapshot()===latest[0]&&p.getSnapshot()===latest[1],'late generation accepted');
     c.endSession();p.endSession();now+=1001;await Promise.all([c.refresh(),c.retry(),p.load('themes'),p.refresh()]);check(calls===6&&!c.getSnapshot().value&&!p.getSnapshot().lunar.value);
   } finally {c.dispose();p.dispose();}
 }],
 ['CP06','Completed focus/visibility/online bursts, offline return and independent section retries have bounded call counts',withTestClock(async clock=>{
   let cc=0,pc=0,fail=false;const c=createCalendarController(async()=>{cc++;return view();},clock.now);
   const p=createPatternController(async()=>{pc++;if(fail)throw {code:'SERVICE_UNAVAILABLE'};return {confirmed:true};},clock.now);
   const target=new EventTarget(),doc=Object.assign(new EventTarget(),{visibilityState:'visible'});
   const stop=bindPatternLifecycle(p,{...clock.timers,now:clock.now},target,doc);
   try {
     await c.load();await testEventTurn();
     for(const event of ['focus','online','visibilitychange']) {await c.refresh({background:true});(event==='visibilitychange'?doc:target).dispatchEvent(new Event(event));await testEventTurn();}
     check(cc===1&&pc===2,'completed-event duplicate reads');
     c.connectionLost();target.dispatchEvent(new Event('offline'));await clock.advance(600000);await c.refresh();check(cc===1&&pc===2,'offline polling');
     c.connectionRestored();await c.refresh({background:true});target.dispatchEvent(new Event('online'));await testEventTurn();check(cc===2&&pc===4);
     fail=true;await p.refresh();check(p.getSnapshot().themes.value&&p.getSnapshot().lunar.value&&p.getSnapshot().themes.error&&p.getSnapshot().lunar.error);
     fail=false;await clock.advance(1001);await Promise.all([p.load('themes'),p.load('themes')]);check(pc===7&&!p.getSnapshot().themes.error&&p.getSnapshot().lunar.error);
     target.dispatchEvent(new Event('focus'));await testEventTurn();check(pc===7,'manual retry followed by event burst');
     await p.load('lunar');check(pc===8&&!p.getSnapshot().lunar.error);
   } finally {c.dispose();stop();}
   check(clock.pending()===0);
 })],
 ['CP07','Backend error envelopes retain safe admission HTTP/stage/request ID without leaking raw exception',async()=>{
   for(const {handler,action} of [{handler:handleCalendarRequest,action:'read'},{handler:handlePatternRequest,action:'themes'}]) {
     const response=await handler(new Request('https://synthetic.invalid/function',{method:'POST',body:JSON.stringify({action})}),()=>({auth:{me:async()=>{throw fault(429);}}}));
     const body=await response.json();check(response.status===503&&body.diagnostic.httpStatus===429&&body.diagnostic.stage==='SESSION_AUTH'&&body.diagnostic.requestId===requestId);
     check(body.retry_after_ms===500&&!JSON.stringify(body).includes('PRIVATE')&&Object.keys(body.diagnostic).length===5);
     const f=patternFixture();f.state.before=call=>{if(call.name==='UserPrivacyRequest')throw fault(429);};
     const lifecycle=await handler(new Request('https://synthetic.invalid/function',{method:'POST',body:JSON.stringify({action})}),()=>withUserLifecycle(f.client()));
     const safe=await lifecycle.json();check(lifecycle.status===503&&safe.diagnostic.httpStatus===429&&safe.diagnostic.stage==='LIFECYCLE_PRIVACY_READ'&&safe.retry_after_ms===500,'native lifecycle stage/Retry-After lost');
     check(!JSON.stringify(safe).includes('PRIVATE'));
   }
 }],
];
