import { nativeReadiness } from '../../../base44/shared/nativeReadiness.js';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';
import { handleInternalRequest, InternalError } from '../../../base44/shared/internalAuthorization.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { healthReadDiagnostic, sanitizeHealthDiagnostic } from '../../../base44/shared/healthReadDiagnostics.js';
import { artifactOperation } from '../../../base44/shared/contentArtifactOperation.ts';
import { ARTIFACT_URLS } from '../../../base44/shared/contentArtifactSources.ts';
import { invokeHealthRead } from '../../services/internal/healthReadService';
import { createHealthContext } from '../health/context';
import { nativePrerequisite } from '../health/nativeReadinessContract';
import { H05_CASES } from '../health/cases/h05';
import { contentRows, mappingRows } from './contentArtifactFixture';

const check = (ok, detail = 'Health read diagnostic contract') => { if (!ok) throw new Error(detail); };
const rejected = async work => { try { await work(); } catch (error) { return error; } throw new Error('Expected rejection'); };
const names = ['AdminTestOperation','UserCalendarAction','InternalHealthRun','UserPrivacyRequest','PrivacyRecoveryReceipt'];
const contentNames = ['MessageCategoryLookup','MessageCategoryMapping','MessagePair'];
const client = entities => ({ auth: { me: async () => ({ id: 'synthetic-admin', role: 'admin' }) }, asServiceRole: { entities } });
const request = () => new Request('https://fixture.invalid', { method: 'POST', body: '{}' });
const safe = value => { const serialized = JSON.stringify(value); check(!/PRIVATE|secret=|Bearer|fixture TR|fixture EN/.test(serialized), 'Unsafe diagnostic'); };
const kinds = [[404,'NOT_FOUND'],[401,'ACCESS_DENIED'],[403,'ACCESS_DENIED'],[400,'INVALID_QUERY'],[422,'INVALID_QUERY'],[429,'RATE_LIMITED'],[500,'SERVICE_UNAVAILABLE'],[503,'SERVICE_UNAVAILABLE'],[504,'TIMEOUT'],[null,'UNKNOWN']];
const failure = status => ({ status, message: 'PRIVATE https://fixture.invalid?secret=PRIVATE', data: { code: 'PRIVATE', record: 'PRIVATE' } });
const readyClient = rows => client(Object.fromEntries(names.map(name => [name, { filter: async () => rows }])));
const artifactResult = async (rows = contentRows()) => {
  let index = 0;
  const sets = [rows, mappingRows(false), mappingRows(true)];
  return artifactOperation(null, { mode: 'live' }, {
    fetchImpl: async () => new Response(new Uint8Array([index++])),
    readSheet: async bytes => ({ rows: sets[new Uint8Array(bytes)[0]], sheetFile: 'synthetic' }),
  });
};

/** @type {import('./testTypes').FoundationTest[]} */
export const HEALTH_READ_TESTS = [
  ['HD01','Readiness distinguishes a successful empty table from a bounded positive sample',async()=>{
    for(const rows of [[],[{id:'synthetic',body:'PRIVATE'}]]){
      const value=await nativeReadiness(readyClient(rows));
      check(value.schemas.every(row=>row.readable&&'sampledRows' in row&&row.sampledRows===rows.length));safe(value);
      check((await nativePrerequisite({nativeReadiness:async()=>value},'daily')).status==='PASS');
      check(value.hostedMutationVerified===false);
    }
  }],
  ['HD02','Readiness preserves query/access/not-found/transient/unknown classes without inferring schema absence',async()=>{
    for(const [status,code] of kinds){
      const c=readyClient([]); c.asServiceRole.entities.AdminTestOperation.filter=async()=>{throw failure(status);};
      const value=await nativeReadiness(c), row=value.schemas[0];
      check(row.readable===false&&'diagnostic' in row&&row.diagnostic.code===code&&row.diagnostic.stage==='ENTITY_READ');safe(value);
      const expected=['RATE_LIMITED','SERVICE_UNAVAILABLE','TIMEOUT'].includes(String(code))?'BLOCKED':'FAIL';
      check((await nativePrerequisite({nativeReadiness:async()=>value},'reset')).status===expected);
    }
    for(const rows of [null,{},[{}],[{id:'a'},{id:'b'}]]){
      const value=await nativeReadiness(readyClient(rows));check(value.schemas.every(r=>!r.readable&&'diagnostic' in r&&r.diagnostic.code==='INVALID_RESPONSE'));
    }
    const value=await nativeReadiness(client(Object.fromEntries(names.map(name=>[name,{}]))));
    check(value.schemas.every(r=>'diagnostic' in r&&r.diagnostic.code==='SDK_METHOD_UNAVAILABLE'));
  }],
  ['HD03','Aggregate zero is measured; absent, denied, transient and malformed aggregates stay null',async()=>{
    for(const value of [0,260]){
      const c=client(Object.fromEntries(contentNames.map(name=>[name,{count:async()=>value}])));
      check((await internalHealthOperation(c,{action:'contentCounts'})).results.every(r=>r.state==='MEASURED'&&r.count===value));
    }
    for(const [status,code] of kinds){
      const c=client(Object.fromEntries(contentNames.map(name=>[name,{count:async()=>{throw failure(status);}}])));
      const value=await internalHealthOperation(c,{action:'contentCounts'});
      check(value.results.every(r=>r.count===null&&r.state==='INCONCLUSIVE'&&r.diagnostic.code===code));safe(value);
    }
    for(const count of [undefined,null,'0',-1,NaN,1.5]){
      const c=client(Object.fromEntries(contentNames.map(name=>[name,{count:async()=>count}])));
      check((await internalHealthOperation(c,{action:'contentCounts'})).results.every(r=>r.count===null&&r.diagnostic.code==='INVALID_RESPONSE'));
    }
    const c=client(Object.fromEntries(contentNames.map(name=>[name,{}])));
    check((await internalHealthOperation(c,{action:'contentCounts'})).results.every(r=>r.diagnostic.code==='SDK_METHOD_UNAVAILABLE'));
  }],
  ['HD04','Lifecycle failures retain original safe status and prevent the internal operation',async()=>{
    for(const [status,code] of kinds){
      let calls=0;
      const c=withUserLifecycle(client({User:{filter:async()=>{throw failure(status);}}}));
      const response=await handleInternalRequest(request(),()=>c,async()=>{calls++;});
      const body=await response.json();safe(body);
      check(calls===0&&response.status===503&&body.error_code==='TEST_LIFECYCLE_UNAVAILABLE');
      check(body.diagnostic.code===code&&body.diagnostic.stage==='LIFECYCLE_READ'&&body.diagnostic.httpStatus===status);
    }
    for(const role of ['user',null]){
      let calls=0;const c=client({});c.auth.me=async()=>role?{id:'synthetic',role}:null;
      const response=await handleInternalRequest(request(),()=>c,async()=>{calls++;});
      check(calls===0&&response.status===(role?403:401));
    }
    for(const [error,code,stage] of [[failure(503),'SERVICE_UNAVAILABLE','SESSION_AUTH'],[new InternalError('PRIVACY_STATE_UNCONFIRMED',503),'PRIVACY_STATE_UNCONFIRMED','SESSION_AUTH_LIFECYCLE']]){
      const c=client({});c.auth.me=async()=>{throw error;};
      const response=await handleInternalRequest(request(),()=>c,async()=>{throw new Error('Must not enter operation');});
      const body=await response.json();safe(body);
      check(body.diagnostic.code===code&&body.diagnostic.stage===stage&&body.diagnostic.httpStatus===503);
    }
  }],
  ['HD05','SDK data, Axios response and nested original error carry only closed diagnostic fields to Health',async()=>{
    const diagnostic={code:'RATE_LIMITED',httpStatus:429,stage:'ARTIFACT_DOWNLOAD',durationMs:12,requestId:'8ac5d21a-5124-41de-9312-b1a44f3df321',message:'PRIVATE'};
    const data={diagnostic,request_id:diagnostic.requestId,token:'PRIVATE'};
    for(const error of [{status:502,data},{response:{status:502,data}},{originalError:{response:{status:502,data}}}]){
      const e=await rejected(()=>invokeHealthRead('validateContentArtifacts',{},async()=>{throw error;}));
      check(e.diagnostic.code==='RATE_LIMITED'&&e.diagnostic.requestId===diagnostic.requestId);safe(e);
      const result=await H05_CASES[0].run({artifacts:async()=>{throw e;}});
      check(result.status==='BLOCKED'&&result.evidence.actual.diagnostic.stage==='ARTIFACT_DOWNLOAD');safe(result);
    }
    const clean=sanitizeHealthDiagnostic({code:'PRIVATE',stage:'PRIVATE',httpStatus:999,durationMs:-1,requestId:'PRIVATE'});
    check(clean.code==='UNKNOWN'&&clean.stage==='FUNCTION_INVOKE'&&clean.requestId===null&&clean.httpStatus===null&&clean.durationMs===null);safe(clean);
    for(const error of [{code:'ETIMEDOUT'},{name:'TimeoutError'},{code:'TIMEOUT'}])check(healthReadDiagnostic(error).code==='TIMEOUT');
    check(healthReadDiagnostic({code:'ERR_NETWORK'}).code==='NETWORK_UNAVAILABLE');
  }],
  ['HD06','Run context shares one successful or rejected read across all callers without retry',async()=>{
    for(const fails of [false,true]){
      const calls={};const loaders={};
      for(const key of ['nativeReadiness','artifacts','contentCounts','contentLibrary'])loaders[key]=async()=>{calls[key]=(calls[key]||0)+1;if(fails)throw failure(429);return {};};
      const ctx=createHealthContext(loaders);
      await Promise.allSettled(Array.from({length:8},()=>Promise.all(Object.keys(loaders).map(key=>ctx[key]()))));
      check(Object.values(calls).every(n=>n===1));
    }
  }],
  ['HD07','Artifact download errors and real corrupt ZIP parse errors have different safe stages',async()=>{
    for(const [status,code] of [[403,'ACCESS_DENIED'],[404,'NOT_FOUND'],[429,'RATE_LIMITED'],[503,'SERVICE_UNAVAILABLE']]){
      let calls=0;
      const error=await rejected(()=>artifactOperation(null,{mode:'live'},{fetchImpl:async(url)=>{check(Object.values(ARTIFACT_URLS).includes(url));calls++;return new Response(null,{status:Number(status)});}}));
      check(calls===3&&error.diagnostic.stage==='ARTIFACT_DOWNLOAD'&&error.diagnostic.code===code);safe(error);
    }
    const error=await rejected(()=>artifactOperation(null,{mode:'live'},{fetchImpl:async()=>new Response('PRIVATE not a workbook')}));
    check(error.diagnostic.stage==='ARTIFACT_PARSE'&&error.diagnostic.code==='ARTIFACT_PARSE_FAILED');safe(error);
    const result=await H05_CASES[0].run({artifacts:async()=>{throw error;}});
    check(result.status==='BLOCKED'&&result.evidence.actual.diagnostic.stage==='ARTIFACT_PARSE');
  }],
  ['HD08','Valid synthetic workbook rows pass actual H05 runners; content inconsistency remains FAIL',async()=>{
    const value=await artifactResult();safe(value);
    for(const c of H05_CASES.slice(0,8))check((await c.run({artifacts:async()=>value})).status==='PASS',c.id);
    const rows=contentRows(); rows[1][2]=''; rows[2][0]=rows[1][0];
    const bad=await artifactResult(rows);
    for(const id of ['H05-007','H05-008'])check((await H05_CASES.find(c=>c.id===id).run({artifacts:async()=>bad})).status==='FAIL',id);
    const fixture=await artifactOperation(null,{mode:'fixture'},{fetchImpl:async()=>{throw new Error('Must not fetch');}});
    check(fixture.mode==='fixture'&&fixture.result.contentDuplicateIds.length>0);
  }],
  ['HD09','Internal handler and H05 retain download/parse/validation stages instead of generic backend failure',async()=>{
    for(const stage of ['ARTIFACT_DOWNLOAD','ARTIFACT_PARSE','ARTIFACT_VALIDATION']){
      const options=stage==='ARTIFACT_DOWNLOAD'?{fetchImpl:async()=>{throw Object.assign(new Error('PRIVATE'),{name:'TimeoutError'});}}
        :stage==='ARTIFACT_PARSE'?{fetchImpl:async()=>new Response('bad ZIP')}
        :{fetchImpl:async()=>new Response('irrelevant'),readSheet:async()=>({rows:null,sheetFile:'fixture'})};
      const response=await handleInternalRequest(request(),()=>client({}),()=>artifactOperation(null,{mode:'live'},options));
      const body=await response.json();safe(body);
      check(response.status===502&&body.stage===stage&&body.diagnostic.stage===stage&&body.diagnostic.requestId===body.request_id);
      const error={response:{status:response.status,data:body}};
      for(const c of H05_CASES.slice(0,8))check((await c.run({artifacts:async()=>{throw error;}})).status==='BLOCKED');
    }
  }],
  ['HD10','H05-009 exposes count invocation diagnostics while preserving unavailable versus zero',async()=>{
    const c=H05_CASES.find(c=>c.id==='H05-009');
    const value=await c.run({contentCounts:async()=>{throw failure(429);},artifacts:async()=>{throw failure(503);},contentLibrary:async()=>{throw failure(404);}});
    check(value.status==='BLOCKED'&&value.evidence.actual.counts===null&&value.evidence.actual.diagnostics.counts.code==='RATE_LIMITED');safe(value);
  }],
];
