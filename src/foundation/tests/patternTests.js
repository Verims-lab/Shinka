import { PATTERN_REFRESH_TESTS } from './patternRefreshTests';
import { withTestClock } from './testClock';
import { check } from './dataModelTests';
import { patternFixture, patternRow, PATTERN_NOW } from './patternFixture';
import { calculatePatternSummary, calculateLunarSummary, patternWindowStart } from '../../../base44/shared/patternCalculation.js';
import { reconcileDailyRows } from '../../../base44/shared/nativeDailyPersistence.js';
import { handlePatternRequest } from '../../../base44/shared/patternOperation.js';
import { patternRequest, validatePatternResponse } from '@/services/patternService';
import { createPatternController } from '@/features/pattern/patternController';
const reject = async (run, code = null) => { try { await run(); } catch (error) { check(!code || error.code === code, `${code} expected; ${error.code} received`); return; } throw new Error(`Expected rejection ${code}`); };
const summary = (rows, firstDay = null) => calculatePatternSummary({ rows, firstDay, owner: 'ownerA', timezone: 'Europe/Istanbul', instant: new Date(PATTERN_NOW) });
/** @type {import('./testTypes').FoundationTest[]} */
export const PATTERN_TESTS = [
 ...PATTERN_REFRESH_TESTS,
 ['PT01', 'Empty and single assigned category, no current mapping or writes', async () => {
   const f = patternFixture(), empty = await f.request('themes');
   check(empty.state === 'EMPTY' && !empty.themes.length && empty.summary.primary_count === null);
   f.tables.UserDailyMessage.push(patternRow('2026-10-19'));
   const one = await f.request('themes');
   check(one.themes.length === 1 && one.themes[0].count === 1 && one.themes[0].display_name_tr === 'Kendine Bir Nefes');
   check(f.state.calls.every(c => c.method === 'filter' && !['UserPatternSummary','MessageCategoryMapping','UserPeriodRecord','UserHealthConsent'].includes(c.name)));
 }],
 ['PT02', 'More than two categories ranks by count then most recently assigned local day', () => {
   const rows = [patternRow('2026-10-15','a'),patternRow('2026-10-16','b'),patternRow('2026-10-17','c'),patternRow('2026-10-18','a'),patternRow('2026-10-19','b')];
   const value = summary(rows);
   check(value.primary_category_id === 'b' && value.primary_count === 2 && value.secondary_category_id === 'a' && value.secondary_count === 2);
   check(summary(rows.reverse()).primary_category_id === 'b');
 }],
 ['PT03', '29/30 calendar-day window includes boundary and gaps, excludes day 31/future', () => {
   check(patternWindowStart('2026-10-20') === '2026-09-21');
   const rows = [patternRow('2026-09-20','outside'),patternRow('2026-09-21','a'),patternRow('2026-10-19','b'),patternRow('2026-10-21','future')];
   const value = summary(rows,'2026-09-20');
   check(value.window_start_date === '2026-09-21' && value.primary_count === 1 && value.secondary_count === 1 && value.primary_category_id === 'b');
   check(summary([patternRow('2026-09-22')], '2026-09-22').window_start_date === '2026-09-22');
   check(summary([patternRow('2026-10-19')], '2026-01-01').window_start_date === '2026-09-21');
 }],
 ['PT04', 'Duplicate day chooses Home business instant then codepoint ID, one counted day', () => {
   const a = patternRow('2026-10-19','a','a'), b = { ...a, id: 'b', category_id: 'b' }, late = { ...a, id: '0', category_id: 'late', generated_at: '2026-10-19T10:00:00Z' };
   const rows = [late, b, a], home = reconcileDailyRows(rows,'ownerA','2026-10-19');
   check(home.record.id === 'a' && summary(rows).primary_category_id === home.record.category_id && summary(rows).primary_count === 1 && summary(rows).secondary_count === null);
 }],
 ['PT05', 'Stored day is not reinterpreted by timezone and local DST/year boundary is respected', () => {
   const instant = new Date('2026-01-01T00:30:00Z'), row = patternRow('2025-12-31');
   const value = calculatePatternSummary({ rows: [row], owner: 'ownerA', timezone: 'America/Los_Angeles', instant });
   check(value.as_of_date === '2025-12-31' && value.primary_count === 1 && row.shinka_date === '2025-12-31');
   check(patternWindowStart('2026-03-29') === '2026-02-28');
 }],
 ['PT06', 'Malformed candidate and missing/conflicting approved category fail instead of empty', async () => {
   await reject(() => summary([{ ...patternRow('2026-10-19'), generated_at: '2026-10-19T09:00:00' }]), 'PATTERN_DATA_INVALID');
   await reject(() => summary([{ ...patternRow('2026-10-19'), user_id: 'ownerB' }]), 'PATTERN_DATA_INVALID');
   const f = patternFixture(); f.tables.UserDailyMessage.push(patternRow('2026-10-19','missing'));
   await reject(() => f.request('themes'), 'PATTERN_CATEGORY_CONFLICT');
   f.tables.UserDailyMessage[0].category_id='category-0'; f.tables.MessageCategoryLookup[0].display_name_en='Unapproved';
   await reject(() => f.request('themes'), 'PATTERN_CATEGORY_CONFLICT');
 }],
 ['PT07', 'Current half-open phase and strictly future FULL before/exactly at/after its start', () => {
   const rows = patternFixture().tables.MoonPhaseLookup;
   for (const [instant, phase, next] of [
     ['2026-10-16T23:59:59.999Z','WAXING','2026-10-17'],
     ['2026-10-17T00:00:00.000Z','FULL','2026-11-17'],
     [PATTERN_NOW,'FULL','2026-11-17'],
     ['2026-10-25T00:00:00.000Z','WANING','2026-11-17'],
   ]) {
     const view=calculateLunarSummary(rows,new Date(instant),'Europe/Istanbul');
     check(view.current.phase_code===phase && view.next_full.date===next);
     validatePatternResponse({section:'lunar',state:'READY',lunar:view},'lunar');
     check(Date.parse(view.next_full.start_at_utc)>Date.parse(instant));
   }
 }],
 ['PT08', 'Next FULL local date uses IANA across year/DST; no client clock or fabricated suffix', () => {
   const rows=[{phase_code:'WAXING',start_at_utc:'2025-12-25T00:00:00Z',end_at_utc:'2026-01-01T00:30:00Z'},
     {phase_code:'FULL',start_at_utc:'2026-01-01T00:30:00Z',end_at_utc:'2026-01-08T00:00:00Z'}];
   check(calculateLunarSummary(rows,new Date('2025-12-30T12:00:00Z'),'America/Los_Angeles').next_full.date==='2025-12-31');
   check(calculateLunarSummary(rows,new Date('2025-12-30T12:00:00Z'),'Europe/Istanbul').next_full.date==='2026-01-01');
   for(const start of ['2026-03-29T01:30:00Z','2026-10-25T01:30:00Z']) {
     const t=Date.parse(start), pair=[{phase_code:'WAXING',start_at_utc:new Date(t-86400000).toISOString(),end_at_utc:start},
       {phase_code:'FULL',start_at_utc:start,end_at_utc:new Date(t+86400000).toISOString()}];
     check(calculateLunarSummary(pair,new Date(t-1),'Europe/Berlin').next_full.date===start.slice(0,10));
   }
 }],
 ['PT09', 'Partial coverage preserves current phase; missing/current gaps, overlap and bad stamps never fabricate next', async () => {
   const rows=patternFixture().tables.MoonPhaseLookup;
   for(const altered of [[],rows.slice(4)]) {
     const lunar=calculateLunarSummary(altered,new Date(PATTERN_NOW),'UTC');
     check(lunar.current===null&&lunar.next_full===null);
     validatePatternResponse({section:'lunar',state:'PARTIAL',lunar},'lunar');
   }
   const partial=calculateLunarSummary(rows.slice(0,3),new Date(PATTERN_NOW),'UTC');
   check(partial.current.phase_code==='FULL'&&partial.next_full===null);
   validatePatternResponse({section:'lunar',state:'PARTIAL',lunar:partial},'lunar');
   await reject(()=>validatePatternResponse({section:'lunar',state:'READY',lunar:partial},'lunar'),'PATTERN_RESPONSE_INVALID');
   const past={...partial,current:partial.current,next_full:{...partial.current,date:'2026-10-17'}};
   await reject(()=>validatePatternResponse({section:'lunar',state:'READY',lunar:past},'lunar'),'PATTERN_RESPONSE_INVALID');
   for(const altered of [rows.filter((_,i)=>i!==2),rows.map((r,i)=>i===1?{...r,phase_code:'FULL'}:r),rows.map((r,i)=>i===1?{...r,start_at_utc:'2026-10-07T00:00:00Z'}:r),rows.map((r,i)=>i===1?{...r,start_at_utc:'2026-10-08T00:00:00'}:r)]) await reject(()=>calculateLunarSummary(altered,new Date(PATTERN_NOW),'UTC'));
 }],
 ['PT10', 'Actual HTTP handler returns both valid sections, safe non-2xx error paths and no writes', async () => {
   const f = patternFixture(); f.tables.UserDailyMessage.push(patternRow('2026-10-19'));
   const before = JSON.stringify(f.tables);
   for (const action of ['themes','lunar']) {
     const req = new Request('https://fixture.invalid/pattern',{method:'POST',body:JSON.stringify({action,timezone:'Europe/Istanbul'})});
     const res = await handlePatternRequest(req,()=>f.client(),{now:f.now});
     check(res.status===200); validatePatternResponse(await res.json(),action);
   }
   f.state.before = c => { if(c.name==='UserDailyMessage')throw new Error('private diagnostic must not leak'); };
   const res = await handlePatternRequest(new Request('https://fixture.invalid',{method:'POST',body:'{"action":"themes"}'}),()=>f.client(),{now:f.now});
   check(res.status===503 && JSON.stringify(await res.json())==='{"error_code":"PATTERN_READ_FAILED"}');
   check(JSON.stringify(f.tables)===before && f.state.calls.every(c=>c.method==='filter'));
 }],
 ['PT11', 'Anonymous, other user, forged authority, inactive, reset and deletion are denied', async () => {
   const f = patternFixture();
   await reject(()=>f.request('themes',{},null));
   await reject(()=>f.request('themes',{user_id:'ownerB'}),'FORGED_OWNER');
   await reject(()=>f.request('lunar',{role:'admin'}),'CLIENT_AUTHORITY_REJECTED');
   await reject(()=>f.request('themes',{user_id:'ownerA'}),'INVALID_REQUEST');
   await reject(()=>f.request('themes',{},'ownerB'),'ACTIVE_ACCOUNT_REQUIRED');
   f.tables.UserProfile[0].account_status='INACTIVE'; await reject(()=>f.request('themes'),'ACTIVE_ACCOUNT_REQUIRED');
   f.tables.UserProfile[0].account_status='ACTIVE';
   const reset = await f.preview(); await f.execute(reset);
   await reject(()=>f.request('themes'),'ONBOARDING_RESTART_REQUIRED');
   f.tables.AdminTestOperation[0].operation='DELETE_USER';f.tables.AdminTestOperation[0].status='RUNNING';f.tables.AdminTestOperation[0].stage='VERIFY';
   await reject(()=>f.request('lunar'),'ACCOUNT_DELETION_IN_PROGRESS');
 }],
 ['PT12', 'Fresh post-read identity/account guard prevents returning old owner results', async () => {
   const f = patternFixture();
   f.state.after = c => { if(c.name==='MoonPhaseLookup') f.tables.UserProfile[0].account_status='INACTIVE'; };
   await reject(()=>f.request('lunar'),'ACTIVE_ACCOUNT_REQUIRED');
 }],
 ['PT13', 'Beyond default page size read is complete; sentinel/duplicate IDs reject truncation', async () => {
   const f = patternFixture();
   f.tables.UserDailyMessage = Array.from({length:150},(_,i)=>patternRow('2026-10-19','category-0',`candidate-${i}`));
   const view = await f.request('themes'); check(view.themes[0].count===1);
   f.tables.UserDailyMessage.push({...f.tables.UserDailyMessage[0]}); await reject(()=>f.request('themes'),'PATTERN_READ_FAILED');
   f.tables.UserDailyMessage = Array.from({length:4001},(_,i)=>patternRow('2026-10-19','category-0',`candidate-${i}`));
   await reject(()=>f.request('themes'),'PATTERN_READ_FAILED');
 }],
 ['PT14', 'Transport success, malformed response, server denial and deadline are separately executed', withTestClock(async clock => {
   const f=patternFixture(), valid=await f.request('themes');
   check((await patternRequest('themes',{functions:{invoke:async()=>({data:valid})}})).state==='EMPTY');
   await reject(()=>patternRequest('themes',{functions:{invoke:async()=>({data:{state:'EMPTY'}})}}),'PATTERN_RESPONSE_INVALID');
   await reject(()=>patternRequest('themes',{functions:{invoke:async()=>{throw {response:{data:{error_code:'AUTH_REQUIRED'}}};}}}),'AUTH_REQUIRED');
   await clock.run(()=>reject(()=>patternRequest('themes',{functions:{invoke:()=>new Promise(()=>{})}},20000,clock.timers),'TIMEOUT'));
   check(clock.now()===20000&&clock.pending()===0);
 })],
 ['PT15', 'Independent section failure/retry retains other success and prevents duplicate requests', async () => {
   const f=patternFixture(); let failed=true, calls=0;
   const controller=createPatternController(async section=>{calls++; if(section==='lunar'&&failed)throw {code:'MOON_LOOKUP_COVERAGE_REQUIRED'};return f.request(section);});
   await controller.refresh(); check(controller.getSnapshot().themes.value.state==='EMPTY'&&controller.getSnapshot().lunar.error);
   failed=false; await Promise.all([controller.load('lunar'),controller.load('lunar')]);
   check(calls===3&&controller.getSnapshot().lunar.value.lunar.next_full.date==='2026-11-17');controller.dispose();
 }],
 ['PT16', 'Late responses, session invalidation/disposal and privacy errors cannot revive data', async () => {
   /** @type {(value: any) => void} */ let release; const pending=new Promise(resolve=>{release=resolve;});
   const controller=createPatternController(()=>pending); const old=controller.load('themes');
   controller.invalidate(); release({state:'READY'}); await old;check(controller.getSnapshot().themes.value===null);
   controller.dispose();await controller.load('themes');check(controller.getSnapshot().themes.value===null);
   /** @type {(value: any) => void} */ let lunarRelease;const late=new Promise(resolve=>{lunarRelease=resolve;});
   const c=createPatternController(section=>section==='themes'?Promise.reject({code:'ACTIVE_ACCOUNT_REQUIRED'}):late);
   const request=c.refresh();await Promise.resolve();lunarRelease({state:'READY'});await request;
   check(!c.getSnapshot().lunar.value&&c.getSnapshot().themes.error==='ACTIVE_ACCOUNT_REQUIRED');c.dispose();
 }],
 ['PT18', 'Bounded projected queries and late first-day conflict are explicit read failures', async () => {
   const f=patternFixture(), client=f.client();
   const entities=client.asServiceRole.entities, captured=[];
   const daily=entities.UserDailyMessage;
   const wrapped={...client,asServiceRole:{entities:new Proxy(entities,{get:(target,key)=>key==='UserDailyMessage'?{...daily,filter:async(...args)=>{captured.push(args);return daily.filter(...args);}}:target[key]})}};
   const {patternOperation}=await import('../../../base44/shared/patternOperation.js');
   await patternOperation(wrapped,{action:'themes',timezone:'Europe/Istanbul'},{now:f.now});
   check(captured.length===2&&captured.some(args=>args[2]===4001&&args[0].shinka_date.$gte==='2026-09-21'&&args[4].join(',')==='id,user_id,shinka_date,timezone,category_id,generated_at'));
   check(captured.some(args=>args[2]===1&&args[4].join(',')==='id,user_id,shinka_date'));
   const bad={...client,asServiceRole:{entities:new Proxy(entities,{get:(target,key)=>key==='UserDailyMessage'?{filter:async(_q,_sort,limit)=>limit===1?[{id:'new',user_id:'ownerA',shinka_date:'2026-10-20'}]:[]}:target[key]})}};
   await reject(()=>patternOperation(bad,{action:'themes',timezone:'Europe/Istanbul'},{now:f.now}),'PATTERN_DATA_CHANGED');
   f.tables.UserDailyMessage.push({id:'broken',user_id:'ownerA',shinka_date:'2026-01-00'});
   await reject(()=>f.request('themes'),'PATTERN_DATA_INVALID');
 }],
 ['PT19', 'Generic native summary reader uses current daily projection and never exposes a stale cache row', async () => {
   const f=patternFixture();f.tables.UserPatternSummary.push({id:'stale',user_id:'ownerA',primary_category_id:'stale'});
   const {domainAccessOperation}=await import('../../../base44/shared/domainAccess.js');
   const value=await domainAccessOperation(f.client(),{entity:'user_pattern_summary',action:'read'});
   check(value.derived===true&&value.records.length===1&&value.records[0].primary_category_id===null);
   await reject(()=>domainAccessOperation(f.client(),{entity:'user_pattern_summary',action:'read',recordId:'stale'}),'DERIVED_PATTERN_READ_REQUIRED');
   await reject(()=>domainAccessOperation(f.client('adminA'),{entity:'user_pattern_summary',action:'adminRead',recordId:'stale'}),'DERIVED_PATTERN_READ_REQUIRED');
   check(!f.state.calls.some(c=>c.name==='UserPatternSummary'));
 }],
 ['PT17', 'Old summary/cache is ignored; all assigned native IDs must match approved lookup', async () => {
   const f=patternFixture();f.tables.UserPatternSummary.push({id:'stale',user_id:'ownerA',primary_category_id:'stale'});
   f.tables.UserDailyMessage.push(patternRow('2026-10-19'));
   const view=await f.request('themes');check(view.summary.primary_category_id==='category-0');
   check(!f.state.calls.some(c=>c.name==='UserPatternSummary'));
 }],
];
