import { youFixture, profileIntent } from './youFixture';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { handleOnboardingRequest } from '../../../base44/shared/onboardingOperations.js';
import { handleYouRequest } from '../../../base44/shared/youOperation.js';
import { nativeFixture } from './nativeFixture';
import { onboardingRequest } from '@/services/onboardingService';
import { youRequest } from '@/services/youService';
import { placeFetch } from './geonamesSearchFixture';
import { createDailyQuota, GEONAMES_QUOTA_SCOPE, geoNamesCreditCost } from '../../../base44/shared/geonamesDailyQuota.js';
import { createGeoNamesGuard, GEONAMES_LIMITS } from '../../../base44/shared/geonamesGuard.js';

const check = (value, message = 'quota assertion') => { if (!value) throw new Error(message); };
const fail = async (fn, code = 'GEONAMES_UNAVAILABLE') => { try { await fn(); } catch (e) { check(e.code === code, `expected ${code}, got ${e.code}`); return; } throw new Error('expected closed quota'); };
const HOUR = 3600000, TIME = Date.parse('2026-10-30T23:30:00Z'), H = Math.floor(TIME / HOUR);
export const quotaRow = (credits = 0) => ({ id: 'quota-one', scope: GEONAMES_QUOTA_SCOPE, revision: 0, window_hour: H, buckets: [{ hour: H, credits }] });
// Deliberately no worker lock. Each read snapshots before yielding; conditional
// mutation executes against shared current state, as required of the platform.
/** @param {Array<Record<string, any>>} rows */
export function quotaFixture(rows = [quotaRow()]) {
  const state = { rows: structuredClone(rows), reads: 0, writes: 0, creates: 0, mode: '', payloadBytes: 0 };
  const store = {
    create: async () => { state.creates++; throw new Error('request-time provisioning forbidden'); },
    /** @returns {Promise<any>} */
    filter: async (query, sort, limit) => { check(query.scope === GEONAMES_QUOTA_SCOPE && limit === 2); state.reads++; if (state.mode === 'read-error') throw new Error('private'); return structuredClone(state.rows); },
    updateMany: async (query, patch) => {
      state.writes++; state.payloadBytes += JSON.stringify({query, patch}).length;
      if (state.mode === 'write-error') throw new Error('private');
      if (state.mode === 'zero') return { success: true, updated: 0, has_more: false };
      if (state.mode === 'malformed') return { updated: 1 };
      const row = state.rows.find(r => Object.entries(query).every(([k,v]) => r[k] === v));
      if (!row) return { success: true, updated: 0, has_more: false };
      Object.assign(row, structuredClone(patch.$set)); row.revision += patch.$inc.revision;
      if (state.mode === 'lost') throw new Error('lost response after commit');
      return { success: true, updated: 1, has_more: false };
    },
  };
  return { state, store };
}
const quota = (f, extra = {}) => createDailyQuota(f.store, { now: () => TIME, cap: 3, ...extra });
/** @type {import('./testTypes').FoundationTest[]} */
export const GEONAMES_QUOTA_TESTS = [
 ['GQ10', 'Actual quota → guard → adapter → onboarding/You HTTP → service preserves setup versus provider diagnosis', async () => {
   for (const endpoint of ['onboarding','you']) for (const mode of ['missing','invalid','read-error','lost','provider']) {
     const f=endpoint==='you'?youFixture():nativeFixture(), q=quotaFixture(mode==='missing'?[]:mode==='invalid'?[{...quotaRow(),revision:null}]:[quotaRow()]);
     q.state.mode=mode; let fetches=0;
     const guard=createGeoNamesGuard({fetcher:async()=>{fetches++;return Response.json({status:{value:18,message:'private provider text'} });}});
     const dependencies={now:f.now,geoNamesFor:owner=>guard.forOwner(owner,fetcher=>createGeoNamesAdapter({username:'synthetic-secret',fetcher}),{dailyQuota:quota(q)})};
     const handler=endpoint==='onboarding'?handleOnboardingRequest:handleYouRequest;
     /** @type {{status:number,data:unknown}|undefined} */
     let response;
     const client={functions:{invoke:async(_name,body)=>{
       const res=await handler(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify(body)}),()=>f.client('ownerA'),dependencies);
       response={status:res.status,data:await res.json()};if(!res.ok)throw {response};return response;
     }}};
     const action=endpoint==='you'?'saveProfile':'searchPlaces', payload=endpoint==='you'?profileIntent(await f.request('read'),{birthplace_geonames_id:9001}):{query:'Kan',language_code:'en',page:0};
     let failure;try{await (endpoint==='onboarding'?onboardingRequest:youRequest)(action,payload,client);}catch(error){failure=error;}
     const expected={missing:'GEONAMES_QUOTA_MISSING',invalid:'GEONAMES_QUOTA_INVALID','read-error':'GEONAMES_QUOTA_READ_FAILED',lost:'GEONAMES_QUOTA_WRITE_UNCONFIRMED',provider:'GEONAMES_PROVIDER_REJECTED'}[mode];
     check(failure?.diagnostic?.code===expected,`${endpoint}/${mode}: ${failure?.diagnostic?.code}`);
     check(response?.status===(mode==='provider'?502:503));
     check(failure.code===(['missing','invalid'].includes(mode)?'GEONAMES_QUOTA_NOT_READY':'GEONAMES_UNAVAILABLE'));
     check(failure.diagnostic.requestId?.length===36&&failure.diagnostic.durationMs>=0);
     check(fetches===(mode==='provider'?1:0)&&q.state.creates===0&&q.state.writes<2);
     const text=JSON.stringify(failure);check(!['synthetic-secret','private provider text','Kan','headers','stack'].some(value=>text.includes(value)));
   }
 }],
 ['GQ11', 'Full guard/adapter retains quota denial and permits an explicitly retried successful selection', async () => {
   for(const limit of [{cap:3,hourlyCap:800},{cap:8000,hourlyCap:3}]){
     const q=quotaFixture([quotaRow(3)]);let fetches=0;
     const guard=createGeoNamesGuard({fetcher:async(url)=>{fetches++;return placeFetch(url);}});
     const owner=guard.forOwner('ownerA',fetcher=>createGeoNamesAdapter({username:'synthetic',fetcher}),{dailyQuota:quota(q,limit)});
     let error;try{await owner.search('Kan','en',0);}catch(e){error=e;}
     check(error?.code==='GEONAMES_RATE_LIMITED'&&error.retryAfterSeconds>0&&fetches===0&&q.state.writes===0);
   }
   const q=quotaFixture();q.state.mode='zero';let fetches=0;
   const owner=createGeoNamesGuard({fetcher:async url=>{fetches++;return placeFetch(url);}}).forOwner('owner',fetcher=>createGeoNamesAdapter({username:'synthetic',fetcher}),{dailyQuota:quota(q,{cap:10})});
   let error;try{await owner.search('Kan','en',0);}catch(e){error=e;}
   check(error?.code==='GEONAMES_RATE_LIMITED'&&error.retryAfterSeconds===1&&fetches===0);
   q.state.mode='';const result=await owner.search('Kan','en',0);check(result.places.length>0&&fetches===1&&q.state.writes===2);
 }],
 ['GQ01', 'Actual shared quota: serial 3 accepts, fourth blocks, two DB calls per admitted miss', async () => {
   const f=quotaFixture(), reserve=quota(f);
   for(let i=0;i<3;i++) check(await reserve()===null);
   check(await reserve()>86400); check(f.state.reads===4&&f.state.writes===3&&f.state.rows[0].buckets[0].credits===3);
 }],
 ['GQ02', 'Two independent workers: 20 concurrent reservations at 2/3 admit exactly one at daily or hourly cap', async () => {
   for (const limits of [{cap:3,hourlyCap:800},{cap:8000,hourlyCap:3}]) {
     const f=quotaFixture([quotaRow(2)]), workers=[quota(f,limits),quota(f,limits)];
     const results=await Promise.all(Array.from({length:20},(_,i)=>workers[i%2]()));
     check(results.filter(v=>v===null).length===1&&f.state.rows[0].buckets[0].credits===3);
     check(f.state.reads===20&&f.state.writes===20,'bounded one read/conditional write; no retry storm');
   }
 }],
 ['GQ03', 'Concurrent first use and duplicate singleton fail closed, never create a row', async () => {
   for(const rows of [[],[quotaRow(),{...quotaRow(),id:'duplicate'}],[{id:'legacy',quota_date:'2026-10-30',count:0}]]){
     const f=quotaFixture(rows);await Promise.all(Array.from({length:5},()=>fail(quota(f), 'GEONAMES_QUOTA_NOT_READY')));check(f.state.writes===0&&f.state.creates===0&&f.state.rows.length===rows.length);
   }
 }],
 ['GQ04', 'Missing/invalid counters, duplicate buckets, future clock and malformed read are not zero', async () => {
   for(const row of [{...quotaRow(),buckets:null},{...quotaRow(),revision:null},{...quotaRow(),buckets:[{hour:H}]},{...quotaRow(),buckets:[{hour:H,credits:-1}]},{...quotaRow(),buckets:[{hour:H,credits:1.5}]},{...quotaRow(),buckets:[{hour:H,credits:1},{hour:H,credits:1}]},{...quotaRow(),window_hour:H+1}]){
     const f=quotaFixture([row]);await fail(quota(f), 'GEONAMES_QUOTA_NOT_READY');check(f.state.writes===0);
   }
   const f=quotaFixture();f.store.filter=async()=>({items:[quotaRow()]});await fail(quota(f), 'GEONAMES_QUOTA_NOT_READY');check(f.state.writes===0);
 }],
 ['GQ05', 'updated zero, malformed response, DB failure and lost acknowledgement never authorize or retry', async () => {
   for(const mode of ['zero','malformed','read-error','write-error','lost']){
     const f=quotaFixture();f.state.mode=mode;
     if(mode==='zero')check(await quota(f)()>0);else await fail(quota(f));
     check(f.state.reads===1&&f.state.writes===(mode==='read-error'?0:1));
     if(mode==='lost'){check(f.state.rows[0].buckets[0].credits===1);f.state.mode='';check(await quota(f)()===null&&f.state.rows[0].buckets[0].credits===2);}
   }
 }],
 ['GQ06', 'Hourly and daily windows survive UTC midnight; no provider-reset assumption', async () => {
   const f=quotaFixture([quotaRow(3)]);let time=TIME;const reserve=quota(f,{now:()=>time,hourlyCap:3,cap:10});
   time=(H+1)*HOUR;check(await reserve()===3600,'midnight does not clear hourly usage');
   time=(H+2)*HOUR;check(await reserve()===null);check(f.state.rows[0].id==='quota-one');
   const d=quotaFixture([quotaRow(3)]);time=(H+24)*HOUR;const daily=quota(d,{now:()=>time});check(await daily()===3600);time=(H+25)*HOUR;check(await daily()===null&&d.state.rows[0].buckets.length===1);
 }],
 ['GQ07', 'Cache/in-flight coalescing is free; search, page and ID resolution each reserve their actual endpoint credit', async () => {
   const f=quotaFixture();let fetches=0;
   const g=createGeoNamesGuard({fetcher:async()=>{fetches++;return Response.json({ok:true});}});
   const adapter=fetcher=>({search:(q,l,p)=>fetcher(`https://secure.geonames.org/searchJSON?q=${q}&startRow=${p}`).then(r=>r.json()),resolve:id=>fetcher(`https://secure.geonames.org/getJSON?geonameId=${id}`).then(r=>r.json())});
   const owner=g.forOwner('ownerA',adapter,{dailyQuota:quota(f,{cap:10})});
   await Promise.all([owner.search('ABC','en',0),owner.search('ABC','en',0)]);await owner.search('ABC','en',0);await owner.search('ABC','en',1);await owner.resolve(1);await owner.resolve(1);
   check(fetches===3&&f.state.reads===3&&f.state.writes===3);check(geoNamesCreditCost('https://secure.geonames.org/searchJSON')===1&&geoNamesCreditCost('https://secure.geonames.org/getJSON')===1);
   await fail(async()=>geoNamesCreditCost('https://secure.geonames.org/findNearby'), 'GEONAMES_QUOTA_NOT_READY');
 }],
 ['GQ09', 'Unverified reservation never reaches fetch through the actual guard', async () => {
   for(const mode of ['zero','malformed','read-error','write-error','lost']) {
     const f=quotaFixture();f.state.mode=mode;let fetches=0;
     const guard=createGeoNamesGuard({fetcher:async()=>{fetches++;return Response.json({});}});
     const owner=guard.forOwner('owner',fetcher=>({resolve:()=>fetcher('https://secure.geonames.org/getJSON')}),{dailyQuota:quota(f)});
     let failed=false;try{await owner.resolve(1);}catch(e){failed=true;check(['GEONAMES_UNAVAILABLE','GEONAMES_RATE_LIMITED'].includes(e.code));}
     check(failed&&fetches===0&&f.state.writes<=1);
   }
 }],
 ['GQ08', 'Shared denial stops fetch; async reservation cannot bypass local burst or fetch after abort', async () => {
   const f=quotaFixture([quotaRow(3)]);let fetches=0;
   const factory=fetcher=>({search:q=>fetcher(`https://secure.geonames.org/searchJSON?q=${q}`).then(r=>r.json())});
   const g=createGeoNamesGuard({fetcher:async()=>{fetches++;return Response.json({});}}), owner=g.forOwner('ownerA',factory,{dailyQuota:quota(f)});
   try{await owner.search('ABC');throw new Error('expected denial');}catch(e){check(e.code==='GEONAMES_RATE_LIMITED'&&e.retryAfterSeconds>86400);}check(fetches===0&&f.state.writes===0);
   let finish=(_value)=>{};const pending=new Promise(resolve=>{finish=resolve;});
   const burst=createGeoNamesGuard({limits:{...GEONAMES_LIMITS,workerUpstreamCalls:1},fetcher:async()=>{fetches++;return Response.json({});}});
   const a=burst.forOwner('a',factory,{dailyQuota:()=>pending});const first=a.search('one');await Promise.resolve();
   try{await burst.forOwner('b',factory).search('two');throw new Error('expected burst denial');}catch(e){check(e.code==='GEONAMES_RATE_LIMITED');}finish(null);await first;check(fetches===1);
   const abort=new AbortController();const late=createGeoNamesGuard({fetcher:async()=>{fetches++;return Response.json({});}});
   const u=late.forOwner('c',fetcher=>({resolve:()=>fetcher('https://secure.geonames.org/getJSON',{signal:abort.signal})}),{dailyQuota:async()=>{abort.abort();return null;}});
   await fail(()=>u.resolve(1));check(fetches===1);
 }],
];
