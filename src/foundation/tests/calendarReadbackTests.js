import { createCalendarController } from '@/features/calendar/calendarController';
import { handleCalendarRequest } from '../../../base44/shared/calendarOperation.js';
import { createCalendarReadContext, withCalendarReads } from '../../../base44/shared/calendarReadContext.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { withNativeWriteChecks } from '../../../base44/shared/nativeWriteChecks.js';
import { check, rejects } from './dataModelTests';
import { nativeFixture } from './nativeFixture';

const limited = (delay = '0') => ({ response: { status: 429, headers: { 'retry-after': delay }, data: { private: 'PRIVATE_SENTINEL' } }, message: 'PRIVATE_SENTINEL' });
const writes = (f, name) => f.state.calls.filter(c => c.name === name && c.method !== 'filter');
const request = body => new Request('https://fixture.invalid/calendar', { method: 'POST', body: JSON.stringify(body) });
const run = (f, body, diagnostics = []) => {
  let time = 0;
  const reads = createCalendarReadContext({ now: () => time, sleep: async ms => { time += ms; }, emit: (event, data) => diagnostics.push([event, data]) });
  return handleCalendarRequest(request(body), (_req, context) => withNativeWriteChecks(withUserLifecycle(withCalendarReads(f.raw(), context))), { native: true, now: f.now, reads });
};
/** @type {import('./testTypes').FoundationTest[]} */
export const CALENDAR_READBACK_TESTS = [
 ['RC17', 'A written November 3 period and exhausted readback 429 recover the same receipt without another period or consent write', async () => {
   /** @type {[boolean, boolean][]} */
   const cases = [[false, true], [true, false], [true, true]];
   for (const [granted, requestConsent] of cases) {
     const f = nativeFixture({ granted }); f.state.time = '2026-11-27T18:43:00Z';
     const body = { action: 'add', date: '2026-11-03', health_consent: requestConsent, action_id: crypto.randomUUID(), revision: (await f.cal()).revision };
     let afterWrite = false;
     f.state.after = async c => { if (c.name === 'UserPeriodRecord' && c.method === 'create') afterWrite = true; };
     f.state.before = async c => { if (afterWrite && c.name === 'UserPeriodRecord' && c.method === 'filter') throw limited('2'); };
     const logs = [], failed = await run(f, body, logs), data = await failed.json();
     check(failed.status === 429 && failed.headers.get('retry-after') === '2' && data.diagnostic.code === 'RATE_LIMITED' && data.retry_after_ms === 2000, 'readback throttle was disguised as HTTP500');
     check(f.tables.UserPeriodRecord.length === 1 && f.tables.UserCalendarAction[0].status === 'PENDING');
     check(!JSON.stringify([data, logs]).includes('PRIVATE_SENTINEL') && !JSON.stringify(logs).includes(body.date) && !JSON.stringify(logs).includes('ownerA'), 'diagnostics leaked private values');
     check(logs.some(([, d]) => d.entity === 'UserPeriodRecord' && d.stage === 'CALENDAR_READBACK' && d.code === 'RATE_LIMITED'), 'missing precise readback query evidence');
     f.state.before = null; f.state.after = null;
     const period = JSON.stringify(f.tables.UserPeriodRecord), consent = JSON.stringify([f.tables.UserHealthConsent, f.tables.UserHealthConsentEvent]);
     const count = f.state.calls.length;
     const controller = createCalendarController(async (action, payload) => {
       const response = await run(f, { action, ...payload }), value = await response.json();
       if (!response.ok) throw Object.assign(new Error(), { code: value.error_code, status: response.status, retryAfterMs: value.retry_after_ms });
       return value;
     });
     try {
       await controller.load('2026-11'); await controller.retry();
       check(controller.getSnapshot().outcome === 'unknown' && controller.getSnapshot().canContinue && !controller.getSnapshot().success);
       check(f.state.calls.slice(count).every(c => c.method === 'filter'), 'status inspection completed a receipt or repeated a write');
       await controller.continueIntent();
       check(controller.getSnapshot().outcome === 'confirmed' && controller.getSnapshot().value.mutationConfirmed && f.tables.UserCalendarAction[0].status === 'APPLIED');
     } finally { controller.dispose(); }
     check(JSON.stringify(f.tables.UserPeriodRecord) === period && JSON.stringify([f.tables.UserHealthConsent, f.tables.UserHealthConsentEvent]) === consent);
     check(f.state.calls.slice(count).filter(c => c.method !== 'filter').every(c => c.name === 'UserCalendarAction') && writes(f, 'UserPeriodRecord').length === 1, 'recovery repeated a data write');
     const saved = JSON.stringify(f.tables); await run(f, { action: 'resume', action_id: body.action_id, revision: body.revision }); check(JSON.stringify(f.tables) === saved, 'APPLIED replay wrote');
   }
 }],
 ['RC18', 'Matching-result recovery refuses competing intent, changed receipt, unrelated revision and withdrawn consent without writing', async () => {
   const blocked=nativeFixture();blocked.once('before',c=>c.name==='UserPeriodRecord'&&c.method==='create');
   await rejects(()=>blocked.change('add',{date:'2026-10-01'}));
   const unchanged=JSON.stringify(blocked.tables);
   await rejects(()=>blocked.change('add',{date:'2026-09-01'}),'CALENDAR_ACTION_CONFLICT');
   check(JSON.stringify(blocked.tables)===unchanged,'a new intent poisoned the existing pending receipt');
   for (const fault of ['rival', 'revision', 'receipt', 'withdrawn', 'foreign']) {
     const f = nativeFixture(), body = { action: 'add', date: '2026-10-01', action_id: crypto.randomUUID(), revision: (await f.cal()).revision };
     f.once('after', c => c.name === 'UserPeriodRecord' && c.method === 'create'); await rejects(() => f.cal(body));
     const receipt = f.tables.UserCalendarAction[0];
     if (fault === 'rival') f.tables.UserCalendarAction.push({ ...receipt, id: 'rival', action_id: crypto.randomUUID(), fingerprint: 'f'.repeat(64) });
     if (fault === 'revision') f.tables.UserPeriodRecord.push({ id: 'unrelated', user_id: 'ownerA', period_start_date: '2026-09-01' });
     if (fault === 'withdrawn') { f.tables.UserHealthConsent[0].consent_status = 'WITHDRAWN'; f.tables.UserHealthConsent[0].withdrawn_at = '2026-10-20T13:00:00Z'; }
     if (fault === 'foreign') receipt.user_id = 'ownerB';
     let lookups = 0;
     if (fault === 'receipt') f.state.before = async c => { if (c.name === 'UserCalendarAction' && c.method === 'filter' && c.args[0].action_id && ++lookups === 2) receipt.base_revision = 'f'.repeat(64); };
     const count = f.state.calls.length;
     if (fault === 'revision') check((await f.cal({ action: 'read', action_id: body.action_id, revision: body.revision })).checkedAction.status === 'CONFLICT', 'status check offered impossible revision recovery');
     await rejects(() => f.cal({ action: 'resume', action_id: body.action_id, revision: body.revision }));
     check(f.state.calls.slice(count).every(c => c.method === 'filter') && receipt.status === 'PENDING', `${fault} allowed a write`);
   }
 }],
 ['RC19', 'Read retries honor Retry-After, have a shared budget, never retry authorization errors or SDK writes', async () => {
   let time = 0, attempts = 0; const waits = [], logs = [];
   const ctx = createCalendarReadContext({ now: () => time, sleep: async ms => { waits.push(ms); time += ms; }, emit: (e, d) => logs.push([e, d]) });
   const raw = { auth: { me: async () => ({ id: 'secret-owner' }) }, asServiceRole: { entities: { UserPeriodRecord: {
     filter: async () => { if (++attempts === 1) throw limited('2'); return []; }, create: async () => { attempts++; throw limited('2'); },
   } } } };
   const wrapped = withCalendarReads(raw, ctx); ctx.stage('CALENDAR_READBACK');
   await wrapped.asServiceRole.entities.UserPeriodRecord.filter({ user_id: 'secret-owner' }); check(attempts === 2 && waits[0] >= 2000 && waits[0] < 2500);
   await rejects(() => wrapped.asServiceRole.entities.UserPeriodRecord.create({ privateSample: 'PRIVATE_SENTINEL' })); check(attempts === 3, 'SDK mutation retried');
   for (const status of [401, 403, 500]) {
     attempts = 0; raw.asServiceRole.entities.UserPeriodRecord.filter = async () => { attempts++; throw { status }; };
     await rejects(() => wrapped.asServiceRole.entities.UserPeriodRecord.filter({})); check(attempts === 1, 'non-429 read retried');
   }
   attempts = 0; raw.asServiceRole.entities.UserPeriodRecord.filter = async () => { attempts++; throw limited('60'); };
   await rejects(() => wrapped.asServiceRole.entities.UserPeriodRecord.filter({})); check(attempts === 1 && waits.length === 1, 'Retry-After was shortened to fit');
   raw.asServiceRole.entities.UserPeriodRecord.filter = async () => { attempts++; throw limited(); };
   for (let i = 0; i < 3; i++) await rejects(() => wrapped.asServiceRole.entities.UserPeriodRecord.filter({}));
   check(waits.length === 2, 'request retry budget was not shared'); ctx.close();
   check(!JSON.stringify(logs).includes('PRIVATE_SENTINEL') && !JSON.stringify(logs).includes('secret-owner'));
 }],
 ['RC20', 'Receipt write 429 or lost applied acknowledgement never repeats the written period and explicit recovery reads APPLIED', async () => {
   for (const when of ['before', 'after']) {
     const f = nativeFixture(), body = { action: 'add', date: '2026-10-01', action_id: crypto.randomUUID(), revision: (await f.cal()).revision };
     f.state[when] = async c => { if (c.name === 'UserCalendarAction' && c.method === 'updateMany') throw limited(); };
     const failed = await run(f, body); check(failed.status === 429 && writes(f, 'UserCalendarAction').filter(c => c.method === 'updateMany').length === 1, 'uncertain receipt write retried');
     check(f.tables.UserCalendarAction[0].status === (when === 'before' ? 'PENDING' : 'APPLIED') && f.tables.UserPeriodRecord.length === 1);
     f.state[when] = null; const responses = await Promise.all([run(f, { action: 'resume', action_id: body.action_id, revision: body.revision }), run(f, { action: 'resume', action_id: body.action_id, revision: body.revision })]);
     check(responses.every(response => response.status === 200) && f.tables.UserCalendarAction[0].status === 'APPLIED' && writes(f, 'UserPeriodRecord').length === 1);
   }
 }],
 ['RC21', 'Receipt-only recovery refuses duplicate periods, missing grant evidence, wrong grant timestamp and new pending work', async () => {
   for (const fault of ['duplicate','event','grant','other-base']) {
     const f=nativeFixture({granted:false}),body={action:'add',date:'2026-10-01',health_consent:true,action_id:crypto.randomUUID(),revision:(await f.cal()).revision};
     f.once('before',c=>c.name==='UserCalendarAction'&&c.method==='updateMany');await rejects(()=>f.cal(body));
     if(fault==='duplicate')f.tables.UserPeriodRecord.push({...f.tables.UserPeriodRecord[0],id:'duplicate'});
     if(fault==='event')f.tables.UserHealthConsentEvent[0].event_type='WITHDRAWN';
     if(fault==='grant')f.tables.UserCalendarAction[0].grant_at='2026-10-19T12:00:00Z';
     if(fault==='other-base')f.tables.UserCalendarAction.push({...f.tables.UserCalendarAction[0],id:'other',action_id:crypto.randomUUID(),base_revision:'a'.repeat(64)});
     const count=f.state.calls.length;await rejects(()=>f.cal({action:'resume',action_id:body.action_id,revision:body.revision}));
     check(f.state.calls.slice(count).every(c=>c.method==='filter')&&f.tables.UserCalendarAction[0].status==='PENDING',fault+' changed health or receipt');
   }
 }],
 ['RC22', 'A cancelled or changed receipt at the final SDK boundary is fenced without overwriting its status or rewriting health', async () => {
   for(const fault of ['cancel','intent']){
     const f=nativeFixture(),body={action:'add',date:'2026-10-01',action_id:crypto.randomUUID(),revision:(await f.cal()).revision};
     f.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='create');await rejects(()=>f.cal(body));
     f.state.before=async c=>{if(c.name==='UserCalendarAction'&&c.method==='updateMany'){if(fault==='cancel')f.tables.UserCalendarAction[0].status='CANCELLED';else f.tables.UserCalendarAction[0].previous_date='2026-09-01';}};
     await rejects(()=>f.cal({action:'resume',action_id:body.action_id,revision:body.revision}));
     check(f.tables.UserCalendarAction[0].status===(fault==='cancel'?'CANCELLED':'PENDING')&&writes(f,'UserPeriodRecord').length===1,'changed receipt overwritten');
   }
 }],
 ['RC23', 'Closing or exhausting a Calendar request during retry waiting cannot dispatch another GET, including HTTP-date Retry-After', async () => {
   for(const mode of ['closed','elapsed','http-date']){
     let time=Date.parse('2026-11-27T18:43:00Z'),attempts=0,context;const waits=[];
     context=createCalendarReadContext({now:()=>time,sleep:async ms=>{waits.push(ms);if(mode==='closed')context.close();time+=mode==='elapsed'?18000:ms;},emit:()=>{}});
     const raw={auth:{me:async()=>{attempts++;throw limited(mode==='http-date'?'Fri, 27 Nov 2026 18:43:02 GMT':'0');}},asServiceRole:{entities:{}}};
     await rejects(()=>withCalendarReads(raw,context).auth.me());
     check(attempts===(mode==='http-date'?2:1)&&waits.length===1&&(mode!=='http-date'||waits[0]===2000));context.close();
   }
 }],
 ['RC24', 'Same-receipt resume retains both snapshot passes and fresh finish guards while removing only the duplicate initial receipt lookup', async () => {
   const f=nativeFixture(),body={action:'add',date:'2026-10-01',action_id:crypto.randomUUID(),revision:(await f.cal()).revision};
   f.once('after',c=>c.name==='UserPeriodRecord'&&c.method==='create');await rejects(()=>f.cal(body));
   const start=f.state.calls.length;await f.cal({action:'resume',action_id:body.action_id,revision:body.revision});
   const calls=f.state.calls.slice(start),firstPeriod=calls.findIndex(c=>c.name==='UserPeriodRecord');
   check(calls.slice(0,firstPeriod).filter(c=>c.name==='UserCalendarAction'&&c.args[0].action_id).length===1,'duplicate initial lookup retained');
   check(calls.filter(c=>c.name==='UserPeriodRecord'&&c.method==='filter').length===2,'confirmation pass removed or cached');
   check(calls.filter(c=>c.name==='UserHealthConsent'&&c.method==='filter').length>=6,'fresh admission/readback guards removed');
   check(calls.filter(c=>c.method!=='filter').length===1&&f.tables.UserCalendarAction[0].status==='APPLIED');
 }],

];
