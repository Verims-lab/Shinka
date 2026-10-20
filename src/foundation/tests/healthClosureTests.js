// FIXTURE role: package literals exercise policy transitions, never declare marker authority.
import { AUTH_PROBE_PATH, AUTH_PROBE_SCREEN, isAuthProbePath, measureAuthShell, waitForAuthProbe, requireAuthProbeReady } from '../probes/authProbeContract';
import { CONTENT_ENTITY_NAMES, evaluateContentState } from '../../../base44/shared/contentStateContract.js';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';
import { handleInternalRequest } from '../../../base44/shared/internalAuthorization.js';
import { H05_CASES } from '../health/cases/h05';
import { CONTENT_SOURCE_SHA256 } from '../../../base44/shared/contentSourceReceipt.js';

const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const counts=()=>({source:'LIVE_BASE44_COUNT',measuredAt:new Date().toISOString(),results:CONTENT_ENTITY_NAMES.map(entity=>({entity,state:'MEASURED',count:0}))});
/** @param {any} [data] @param {any} [imported] @param {string} [marker] */
const decide=(data=counts(),imported=false,marker='Buildmarker-008')=>evaluateContentState(marker,data,imported);
const snapshot=(extra={})=>({path:AUTH_PROBE_PATH,root:true,screen:AUTH_PROBE_SCREEN,ready:'LOADING',loads:1,rendered:true,...extra});
const observe=async snapshots=>{
  let time=0,index=0;
  return waitForAuthProbe(()=>snapshots[Math.min(index++,snapshots.length-1)],{timeoutMs:100,now:()=>time,pause:async()=>{time+=25;}});
};

/** @type {import('./testTypes').FoundationTest[]} */
export const HEALTH_CLOSURE_TESTS=[
  ['HC01','Real isolated auth root is READY within deadline without age or OAuth grant',async()=>{
    const r=await measureAuthShell(360);
    requireAuthProbeReady(r);
    assert(r.state==='READY'&&r.route===AUTH_PROBE_PATH&&r.path===AUTH_PROBE_PATH&&r.screen===AUTH_PROBE_SCREEN&&r.elapsedMs<15000,'auth contract '+JSON.stringify(r));
    assert(r.geometry.providers==='apple,google'&&r.geometry.ageChecked===false&&r.geometry.passwords===0,'auth/age boundary changed');
  }],
  ['HC02','Only the exact probe path selects isolated presentation',()=>{
    assert(isAuthProbePath(AUTH_PROBE_PATH),'probe route absent');
    for(const path of ['/login','/login?probe=1','/onboarding','/internal/health','/','/auth-shell-probe/'])assert(!isAuthProbePath(path),'normal routing overridden');
  }],
  ['HC03','Missing probe root explicitly times out within its bound',async()=>{
    const r=await observe([snapshot({root:false})]);
    assert(r.state==='TIMEOUT'&&r.code==='AUTH_PROBE_ROOT_TIMEOUT'&&r.elapsedMs===100&&r.path===AUTH_PROBE_PATH,'missing root silently passed');
  }],
  ['HC04','Mounted root without READY has a separate bounded timeout',async()=>{
    const r=await observe([snapshot()]);assert(r.state==='TIMEOUT'&&r.code==='AUTH_PROBE_READY_TIMEOUT'&&r.elapsedMs===100,'unready root accepted');
  }],
  ['HC05','Redirect-loop navigation signals ERROR even with a READY shell',async()=>{
    const r=await observe([snapshot(),snapshot({loads:4,ready:'READY',geometry:{}})]);
    assert(r.state==='ERROR'&&r.code==='AUTH_PROBE_REDIRECT_LOOP','redirect loop passed');
    const moved=await observe([snapshot(),snapshot({path:'/login',ready:'READY',geometry:{}})]);
    assert(moved.state==='ERROR'&&moved.code==='AUTH_PROBE_ROUTE_CHANGED'&&moved.path==='/login','redirect path lost');
  }],
  ['HC06','Render error and inaccessible iframe are explicit ERROR results',async()=>{
    const r=await observe([snapshot({ready:'ERROR',code:'AUTH_PROBE_RENDER_FAILED'})]);
    assert(r.state==='ERROR'&&r.code==='AUTH_PROBE_RENDER_FAILED','render failure lost');
    const denied=await waitForAuthProbe(()=>{throw new Error('cross-origin private payload');});
    assert(denied.state==='ERROR'&&denied.code==='AUTH_PROBE_DOCUMENT_INACCESSIBLE'&&!JSON.stringify(denied).includes('private'),'unsafe/inaccessible document passed');
  }],
  ['HC07','READY requires the actual expected screen, root and geometry',async()=>{
    for(const bad of [{root:false},{screen:'AUTHENTICATED_PROFILE_REQUIRED'},{geometry:null}]){
      const r=await observe([snapshot({ready:'READY',geometry:{},...bad})]);
      assert(r.state==='ERROR'&&r.code==='AUTH_PROBE_CONTRACT_INVALID','false READY accepted');
    }
  }],
  ['HC08','H05-009 accepts all three present empty schemas with live counts',async()=>{
    const r=await H05_CASES.find(c=>c.id==='H05-009').run({contentCounts:async()=>counts(),artifacts:async()=>({importPerformed:false}),contentLibrary:async()=>({phase:'PRE_IMPORT',ready:false,sourceHash:CONTENT_SOURCE_SHA256})});
    assert(r.status==='PASS'&&decide().code==='PRE_CONTENT_EMPTY_VERIFIED','schema presence treated as import');
    for(const marker of ['Buildmarker-009','Buildmarker-010'])assert(decide(counts(),false,marker).status==='PASS','non-content package must still reject imported content');
  }],
  ['HC09','Any positive content count fails with entity/count provenance',()=>{
    for(let i=0;i<3;i++){
      const data=counts();data.results[i].count=17;
      const r=decide(data);assert(r.status==='FAIL'&&r.code==='UNEXPECTED_PRODUCT_CONTENT_PRESENT'&&r.unexpected[0].entity===CONTENT_ENTITY_NAMES[i]&&r.unexpected[0].count===17,'unexpected content missed');
    }
  }],
  ['HC10','Missing duplicate malformed unavailable counts cannot imply zero',()=>{
    const valid=counts();
    const samples=[null,{}, {...valid,source:'STATIC'}, {...valid,measuredAt:'invalid'}, {...valid,results:[]}, {...valid,results:valid.results.slice(1)}, {...valid,results:[valid.results[0],valid.results[0],valid.results[2]]}];
    for(const count of [null,-1,0.5,'0',NaN,Infinity])samples.push({...valid,results:[{...valid.results[0],count},...valid.results.slice(1)]});
    samples.push({...valid,results:[{...valid.results[0],state:'INCONCLUSIVE'},...valid.results.slice(1)]});
    for(const data of samples)assert(decide(data).status==='BLOCKED','incomplete count accepted');
  }],
  ['HC11','Import true fails and missing import evidence blocks; positive rows still fail',()=>{
    assert(decide(counts(),true).status==='FAIL'&&decide(counts(),null).status==='BLOCKED','import operation ignored');
    const data=counts();data.results[0].count=1;data.results[1].state='INCONCLUSIVE';
    assert(decide(data,null).code==='UNEXPECTED_PRODUCT_CONTENT_PRESENT','positive rows concealed by another unavailable dependency');
  }],
  ['HC12','Future content package requires approved imported-content validation',()=>{
    for(const marker of ['Buildmarker-020','Buildmarker-006','invalid'])assert(decide(counts(),false,marker).status==='BLOCKED','zero rows permanently hardcoded');
    assert(decide(counts(),false,'Buildmarker-020').code==='APPROVED_CONTENT_VALIDATION_REQUIRED','content transition not explicit');
    assert(decide(counts(),false,'Buildmarker-013').code==='CONTENT_VERIFICATION_UNAVAILABLE','Test Tools must retain staged content evidence, not assume an import');
    assert(decide(counts(),false,'Buildmarker-014').code==='CONTENT_VERIFICATION_UNAVAILABLE','Persistence closure retains staged content evidence and does not imply readiness');
  }],
  ['HC13','Admin count action uses only three exact unfiltered aggregates',async()=>{
    const calls=[];
    const entities=Object.fromEntries(CONTENT_ENTITY_NAMES.map(entity=>[entity,{count:async(...args)=>{calls.push({entity,args});return 0;}}]));
    const r=await internalHealthOperation({asServiceRole:{entities}},{action:'contentCounts',entity:'UserProfile',filter:{is_active:true}});
    assert(r.source==='LIVE_BASE44_COUNT'&&decide(r).status==='PASS'&&calls.length===3&&calls.every(x=>x.args.length===0),'filtered/partial/caller-selected count');
    assert(JSON.stringify(r).includes('count')&&!JSON.stringify(r).includes('UserProfile'),'out-of-scope entity');
  }],
  ['HC14','Failed aggregate returns sanitized inconclusive, never zero',async()=>{
    const entities=Object.fromEntries(CONTENT_ENTITY_NAMES.map(entity=>[entity,{count:async()=>{throw new Error('private content');}}]));
    const r=await internalHealthOperation({asServiceRole:{entities}},{action:'contentCounts'});
    assert(r.results.every(x=>'count' in x&&x.count===null&&x.state==='INCONCLUSIVE')&&decide(r).status==='BLOCKED'&&!JSON.stringify(r).includes('private'),'unsafe count fallback');
  }],
  ['HC15','Live content count action denies anonymous/user/forged admin before access',async()=>{
    for(const principal of [null,{id:'fixture-user',role:'user'},{id:'fixture-admin',role:'admin'}]){
      let calls=0;
      const entities=Object.fromEntries(CONTENT_ENTITY_NAMES.map(entity=>[entity,{count:async()=>{calls++;return 0;}}]));
      const response=await handleInternalRequest(new Request('https://example.test/internal',{method:'POST',body:JSON.stringify({action:'contentCounts',role:'admin'})}),()=>({auth:{me:async()=>principal},asServiceRole:{entities}}),internalHealthOperation);
      assert(response.status===(principal?.role==='admin'?200:principal?403:401)&&calls===(principal?.role==='admin'?3:0),'count authorization bypass');
    }
  }],
  ['HC16','H05-009 unavailable live transport is BLOCKED, not PASS',async()=>{
    const r=await H05_CASES.find(c=>c.id==='H05-009').run({contentCounts:async()=>{throw new Error('offline');},artifacts:async()=>({importPerformed:false})});
    assert(r.status==='BLOCKED','offline count inferred zero');
  }],
];
