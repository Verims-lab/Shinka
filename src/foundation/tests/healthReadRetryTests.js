import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';
import { DOMAIN_ENTITIES } from '../../../base44/shared/domainContract.js';
import { invokeHealthRead } from '../../services/internal/healthReadService';
import { createHealthContext } from '../health/context';
import { firstShinkaPrerequisite } from '../health/firstShinkaPrerequisite';
import { H05_CASES } from '../health/cases/h05';
import { nativeReadiness } from '../../../base44/shared/nativeReadiness.js';
import { nativeFixture } from './nativeFixture';
import { verifiedLibrary, verifiedMoon, verifiedCounts } from './healthReadFixture';
import { handleContentLibraryRequest, contentLibraryOperation } from '../../../base44/shared/contentLibraryOperation.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { healthReadDiagnostic } from '../../../base44/shared/healthReadDiagnostics.js';
import { retryAfterMs } from '../../../base44/shared/healthReadRetry.js';
const check = (ok, detail = 'Bounded Health read regression') => { if (!ok) throw new Error(detail); };
const rejected = async work => { try { await work(); } catch (error) { return error; } throw new Error('Expected rejection'); };
const uuid = '9b688272-cd41-4202-ade3-9b1ff83ae1f0';
const rate = (seconds = '1') => ({ response: { status:503, headers:{'retry-after':seconds}, data:{error_code:'TEST_LIFECYCLE_UNAVAILABLE',request_id:uuid, diagnostic:{code:'RATE_LIMITED',httpStatus:429,stage:'LIFECYCLE_READ',durationMs:120,requestId:uuid}, private:'PRIVATE'} } });
const clock = () => { let now=0; const waits=[]; return {waits, clock:()=>now, wallClock:()=>Date.parse('2026-10-30T00:00:00Z'),sleep:async ms=>{waits.push(ms);now+=ms;},advance:ms=>{now+=ms;}}; };
/** @returns {Promise<Record<string, (...args: any[]) => Promise<any>>>} */
const ready = async () => ({nativeReadiness:async()=>nativeReadiness(nativeFixture().client('adminA')),contentCounts:async()=>verifiedCounts(),artifacts:async()=>({importPerformed:false}),contentLibrary:async()=>verifiedLibrary(),moonReadiness:async()=>verifiedMoon()});
const safe = value => check(!JSON.stringify(value).includes('PRIVATE'),'raw error escaped');
const h05 = () => H05_CASES.find(c=>c.id==='H05-009');

/** @type {import('./testTypes').FoundationTest[]} */
export const HEALTH_READ_RETRY_TESTS = [
 ['HD18','H09 reports missing Moon tail separately from current coverage; closed metadata never exposes conflicts or arbitrary values',async()=>{
  const ctx=await ready();
  const moon={ready:false,create:4,same:99,conflicts:[],astronomyVersion:'2.1.19',coveragePolicy:'MONTHLY_FORWARD_2Y_V1',actualCount:103,
   generatedAt:'2026-11-01T00:00:00.000Z',horizon:'2026-12-01T00:00:00.000Z',requiredCoverageEnd:'2028-12-01T00:00:00.000Z',
   coverageStart:'2026-11-01T20:28:58.794Z',coverageEnd:'2028-12-02T01:40:45.472Z',actualCoverageStart:'2026-10-03T13:25:33.710Z',actualCoverageEnd:'2028-11-02T09:17:57.674Z',
   currentCovered:true,currentPhase:'FULL',nextFullMoonAt:'2026-11-24T14:54:04.191Z',digest:'PRIVATE',records:[{private:'PRIVATE'}]};
  ctx.moonReadiness=async()=>moon;
  let r=await firstShinkaPrerequisite(ctx),summary=r.evidence.actual.moon;
  check(r.status==='BLOCKED'&&summary.missing===4&&summary.same===99&&summary.conflicts===0&&summary.currentCovered&&summary.astronomyVersion==='2.1.19');safe(r);
  for(const patch of [{ready:true,create:0},{conflicts:['PRIVATE']},{astronomyVersion:'PRIVATE'},{coveragePolicy:'PRIVATE'},{actualCoverageEnd:'PRIVATE'},{same:-1},{actualCount:1},{nextFullMoonAt:'2026-10-01T00:00:00.000Z'},{actualCoverageStart:'2027-01-01T00:00:00.000Z'},{currentCovered:false,currentPhase:null,ready:true,create:0}]){
   ctx.moonReadiness=async()=>({...moon,...patch});r=await firstShinkaPrerequisite(ctx);check(r.status==='FAIL');safe(r);
  }
  ctx.moonReadiness=async()=>({...moon,ready:true,create:0,same:103,actualCount:107,actualCoverageEnd:moon.coverageEnd});
  r=await firstShinkaPrerequisite(ctx);check(r.status==='PASS'&&r.evidence.actual.moon.missing===0);safe(r);
 }],
 ['HD11','429 then verified response: H05 and H09 coalesce two attempts, honor Retry-After and keep exact checks',async()=>{
  const time=clock();let calls=0,active=0,maxActive=0;
  const loaders=await ready();loaders.contentLibrary=options=>invokeHealthRead('contentLibrary',{action:'verify'},async()=>{
   calls++;active++;maxActive=Math.max(maxActive,active);await Promise.resolve();active--;
   if(calls===1)throw rate();return {data:verifiedLibrary()};
  },{...options,...time});
  const ctx=createHealthContext(loaders);
  const results=await Promise.all([h05().run(ctx),firstShinkaPrerequisite(ctx)]);
  check(results.every(r=>r.status==='PASS')&&calls===2&&maxActive===1&&time.waits.join(',')==='1000');
  await firstShinkaPrerequisite(ctx);check(calls===2,'later case started another read');
  check(retryAfterMs({headers:{'Retry-After':'Fri, 30 Oct 2026 00:00:02 GMT'}},time.wallClock())===2000);
  check(retryAfterMs({headers:{'retry-after':'PRIVATE'}})===null);
  check(retryAfterMs({headers:{'retry-after':'2026-10-30T00:00:00'}})===null);
 }],
 ['HD12','Persistent 429 or exhausted budget remains shared BLOCKED; no shortened Retry-After or unbounded retries',async()=>{
  for(const mode of ['persistent','long-wait','slow-first']){
   const time=clock();let calls=0;const loaders=await ready();
   loaders.contentLibrary=options=>invokeHealthRead('contentLibrary',{action:'verify'},async()=>{calls++;if(mode==='slow-first')time.advance(17500);throw rate(mode==='long-wait'?'30':'1');},{...options,...time});
   const ctx=createHealthContext(loaders), a=await h05().run(ctx),b=await firstShinkaPrerequisite(ctx);
   check(a.status==='BLOCKED'&&b.status==='BLOCKED');
   check(calls===(mode==='persistent'?2:1)&&time.waits.length===(mode==='persistent'?1:0));
   check(b.evidence.actual.diagnostics.contentLibrary.requestId===uuid&&b.evidence.actual.diagnostics.contentLibrary.httpStatus===429);
   check(b.evidence.actual.readAttempts.contentLibrary.state===(mode==='persistent'?'EXHAUSTED':'BUDGET_EXHAUSTED'));safe(b);
  }
 }],
 ['HD13','Authorization, client errors, malformed content/schema and mutation requests cannot acquire access through retry',async()=>{
  for(const status of [401,403,400,409]){
   let calls=0;const time=clock(),error=rate();error.response.status=status;
   const denied=await rejected(()=>invokeHealthRead('contentLibrary',{action:'verify'},async()=>{calls++;throw error;},time));
   if([401,403].includes(status))check(denied.diagnostic.code==='ACCESS_DENIED'&&denied.diagnostic.httpStatus===status);
   check(calls===1&&time.waits.length===0);
  }
  for (const response of [null, {}, {data:null}, {data:'PRIVATE'}]) {
   let count=0;const e=await rejected(()=>invokeHealthRead('contentLibrary',{action:'verify'},async()=>{count++;return response;},clock()));
   check(count===1&&e.diagnostic.code==='INVALID_RESPONSE');safe(e);
  }
  let calls=0;
  await rejected(()=>invokeHealthRead('contentLibrary',{action:'applyBatch'},async()=>{calls++;throw rate();},clock()));check(calls===1);
  for(const change of [v=>{v.sourceHash='wrong';},v=>{v.pairIds.pop();},v=>{v.counts.message_pair.same=259;},v=>{v.conflicts=['PRIVATE'];}]){
   const ctx=await ready(), value=verifiedLibrary();change(value);ctx.contentLibrary=async()=>value;
   check((await h05().run(ctx)).status==='FAIL'&&(await firstShinkaPrerequisite(ctx)).status==='FAIL');
   ctx.contentCounts=async()=>{throw rate();};check((await h05().run(ctx)).status==='FAIL','known content mismatch hidden by count rate limit');
  }
  for(const value of [null,{}, {ready:true}, {...verifiedMoon(),conflicts:['PRIVATE']}]){
   const ctx=await ready();ctx.moonReadiness=async()=>value;const r=await firstShinkaPrerequisite(ctx);check(r.status==='FAIL');safe(r);
  }
  const ctx=await ready();ctx.nativeReadiness=async()=>({authority:'WRONG',schemas:[]});check((await firstShinkaPrerequisite(ctx)).status==='FAIL');
 }],
 ['HD14','H09 preserves separate minimized content/Moon failures, including request IDs, even when native contract fails',async()=>{
  for(const nativeBad of [false,true]){
   const ctx=await ready();ctx.contentLibrary=async()=>{throw rate();};ctx.moonReadiness=async()=>{throw {response:{status:504,data:{request_id:'8ac5d21a-5124-41de-9312-b1a44f3df321',private:'PRIVATE'}}};};
   if(nativeBad)ctx.nativeReadiness=async()=>({authority:'WRONG'});
   const r=await firstShinkaPrerequisite(ctx),d=r.evidence.actual.diagnostics;
   check(r.status===(nativeBad?'FAIL':'BLOCKED')&&d.contentLibrary.code==='RATE_LIMITED'&&d.contentLibrary.stage==='LIFECYCLE_READ'&&d.contentLibrary.durationMs===120&&d.contentLibrary.requestId===uuid);
   check(d.moonReadiness.code==='TIMEOUT'&&d.moonReadiness.httpStatus===504&&d.moonReadiness.requestId==='8ac5d21a-5124-41de-9312-b1a44f3df321');safe(r);
  }
 }],
 ['HD15','Abort during retry wait or pending read cannot start a later attempt or cache late success; a new run is independent',async()=>{
  for(const during of ['wait','read']){
   const controller=new AbortController();let calls=0;
   /** @type {((value: any) => void) | undefined} */ let settle;const time=clock();
   const loader=options=>invokeHealthRead('contentLibrary',{action:'verify'},async()=>{calls++;if(during==='wait')throw rate();return new Promise(resolve=>{settle=resolve;});},{...options,...time,signal:controller.signal,sleep:async()=>{controller.abort();}});
   const ctx=createHealthContext({contentLibrary:loader});const result=ctx.contentLibrary();
   if(during==='read'){for(let i=0;i<5;i++)await Promise.resolve();controller.abort();}
   const error=await rejected(()=>result);check(error.readAttempt.state==='CANCELLED');
   settle?.({data:verifiedLibrary()});await Promise.resolve();check(await rejected(()=>ctx.contentLibrary())===error&&calls===1);
   const fresh=createHealthContext({contentLibrary:()=>invokeHealthRead('contentLibrary',{action:'verify'},async()=>({data:verifiedLibrary()}))});
   check((await fresh.contentLibrary()).ready===true);
  }
  /** @type {((value: any) => void) | undefined} */ let lateResolve;let pendingCalls=0;
  const late=await rejected(()=>invokeHealthRead('contentLibrary',{action:'verify'},()=>{pendingCalls++;return new Promise(resolve=>{lateResolve=resolve;});},{remainingMs:()=>260}));
  check(late.diagnostic.code==='TIMEOUT'&&pendingCalls===1);lateResolve?.({data:verifiedLibrary()});await Promise.resolve();check(pendingCalls===1);
  let calls=0;const time=clock();
  const error=await rejected(()=>invokeHealthRead('contentLibrary',{action:'verify'},async()=>{calls++;return {data:verifiedLibrary()};},{...time,remainingMs:()=>0}));
  check(calls===0&&error.diagnostic.code==='TIMEOUT');
 }],
 ['HD16','Readonly content admission runs once per request, retains gates, forwards safe retry delay and identifies lifecycle substage',async()=>{
  const counters={auth:0,user:0,privacy:0,operations:0};let failStage=null,role='admin';
  const read=(key,rows)=>async()=>{counters[key]++;if(failStage===key)throw {status:429,headers:{'retry-after':'2'},message:'PRIVATE'};return rows();};
  const client=withUserLifecycle({auth:{me:async()=>{counters.auth++;return {id:'synthetic-admin',role};}},asServiceRole:{entities:{
   User:{filter:read('user',()=>[{id:'synthetic-admin',role}])},UserPrivacyRequest:{filter:read('privacy',()=>[])},AdminTestOperation:{filter:read('operations',()=>[])},
  }}});
  const deps={source:{sha256:'synthetic'},decision:{status:'PENDING_PRODUCT_DECISION'}};
  const request=()=>new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify({action:'verify'})});
  const response=await handleContentLibraryRequest(request(),()=>client,deps);check(response.status===200&&Object.values(counters).every(n=>n===1));
  role='user';check((await handleContentLibraryRequest(request(),()=>client,deps)).status===403);role='admin';
  await rejected(()=>contentLibraryOperation(client,{action:'verify'},deps,{id:'synthetic-admin',role:'admin'}));
  for(const [key,stage] of [['user','LIFECYCLE_USER_READ'],['privacy','LIFECYCLE_PRIVACY_READ'],['operations','LIFECYCLE_OPERATION_READ']]){
   failStage=key;const r=await handleContentLibraryRequest(request(),()=>client,deps),body=await r.json();
   check(r.status===503&&r.headers.get('retry-after')==='2'&&body.diagnostic.stage===stage&&body.diagnostic.httpStatus===429);safe(body);
   check(healthReadDiagnostic({response:{status:r.status,data:body}}).code==='RATE_LIMITED');
  }
 }],
 ['HD17','Entity probe preserves full coverage and safe results with at most three simultaneous SDK reads',async()=>{
  let active=0,maxActive=0,calls=0;
  const entities=Object.fromEntries(DOMAIN_ENTITIES.map((d,i)=>[d.plannedName,{list:async()=>{
   active++;calls++;maxActive=Math.max(maxActive,active);await Promise.resolve();active--;
   if(i===0)throw {status:404};if(i===1)throw {status:429};return [{private:'PRIVATE'}];
  }}]));
  const value=await internalHealthOperation({asServiceRole:{entities}},{action:'probe'});
  check(calls===DOMAIN_ENTITIES.length&&maxActive===3&&active===0&&value.results.length===DOMAIN_ENTITIES.length);
  check(value.results[0].state==='ABSENT'&&value.results[1].state==='INCONCLUSIVE'&&value.results.slice(2).every(r=>r.state==='PRESENT'));safe(value);
 }],
];
