import { captureFixtureConsole } from './fixtureConsole';
import { withTestClock, testEventTurn } from './testClock';
import { check, rejects } from './dataModelTests';
import { createGeoNamesRuntimeProbe } from '../../../base44/shared/geonamesRuntimeProbe.js';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { handleInternalRequest } from '../../../base44/shared/internalAuthorization.js';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';

const body={action:'geoNamesTransportProbe'};
const shortLimits={max_requests:8,request_timeout_ms:5,total_timeout_ms:150,cleanup_grace_ms:2,cooldown_ms:20};
const snapshot=(input,options)=>({url:String(input),isURL:input instanceof URL,keys:Object.keys(options).sort().join(),redirect:options.redirect});
const post=(client,probe,payload=body)=>handleInternalRequest(new Request('https://fixture.invalid/internalHealth',{method:'POST',body:JSON.stringify(payload)}),()=>client,(c,b)=>internalHealthOperation(c,b,{geoNamesTransportProbe:probe}));
const admin={auth:{me:async()=>({id:'fixture-admin',role:'admin'})},get asServiceRole(){throw new Error('probe must not access entities');}};
/** @type {import('./testTypes').FoundationTest[]} */
export const GEONAMES_RUNTIME_PROBE_TESTS=[
 ['G13','Runtime probe uses existing admin guard and rejects all caller-controlled target/credential options',async()=>{
  let calls=0;const probe=async()=>{calls++;return {ok:true};};
  for(const me of [null,{id:'fixture-user',role:'user'}]){
    const response=await post({auth:{me:async()=>me}},probe,{...body,role:'admin'});
    check(response.status===(me?403:401));
  }
  for(const extra of [{url:'https://fixture.invalid'},{host:'fixture.invalid'},{username:'fixture'},{headers:{}},{timeoutMs:1},{role:'admin'},{query:'Private City'},{variants:['B']},{redirect:'follow'},{fetchOwner:{}},{signal:null}])check((await post(admin,probe,{...body,...extra})).status===400);
  check(calls===0);check((await post(admin,probe)).status===200&&calls===1);
  check((await post(admin,null)).status===503);
 }],
 ['G14','Four credentialed policy samples preserve actual adapter URL, input form and all other options',async()=>{
  let baseline;await createGeoNamesAdapter({username:' fixture ',fetcher:async(url,options)=>{baseline=snapshot(url,options);return Response.json({geonames:[]});}}).search('Istanbul','tr');
  const seen=[],signals=[];let cancelled=0;
  const run=createGeoNamesRuntimeProbe({getFetch:()=>async(input,options)=>{
    seen.push(snapshot(input,options));signals.push(options.signal);
    return new Response(new ReadableStream({cancel(){cancelled++;}}),{status:401});
  }});
  const result=await run({username:' fixture '});
  check(result.results.map(r=>r.probe_id).join()==='ERROR_1,MANUAL_1,ERROR_2,MANUAL_2'&&result.request_count===4);
  check(seen.every(s=>JSON.stringify({...s,redirect:'manual'})===JSON.stringify(baseline))&&signals.every(s=>s.aborted)&&cancelled===4);
  check(new Set(signals).size===4&&seen.map(s=>s.redirect).join()==='error,manual,error,manual');
  check(result.results.every(r=>r.http_response_received&&r.http_status===401&&r.failure_stage===null&&r.cleanup_confirmed));
  check(result.scope==='TRANSPORT_ONLY_NOT_PROVIDER_SUCCESS'&&result.probe_version==='geonames-redirect-policy-v2');
  check(result.stop_reason==='PLAN_COMPLETE'&&result.limits.max_requests===8&&result.limits.request_timeout_ms===3000&&result.limits.total_timeout_ms===30000&&result.limits.cleanup_grace_ms===250&&result.limits.cooldown_ms===60000);
 }],
 ['G15','Unsupported error policy compares against manual twice with the same captured detached fetch',async()=>{
  const seen=[],receivers=[];let captures=0;
  const fetcher=async function(input,options){
    receivers.push(this);seen.push(snapshot(input,options));
    if(options.redirect==='error')throw new TypeError('fixture');return new Response(null,{status:200});
  };
  const run=createGeoNamesRuntimeProbe({getFetch:()=>{captures++;return fetcher;}});
  const result=await run({username:'fixture'});
  check(captures===1&&receivers.every(r=>r===undefined));
  check(seen.every(s=>s.url===seen[0].url&&s.isURL&&s.keys==='redirect,signal'));
  check(seen.map(s=>s.redirect).join()==='error,manual,error,manual');
  check(result.results.map(r=>r.http_response_received).join()==='false,true,false,true');
  check(result.results.filter(r=>!r.http_response_received).every(r=>r.transport_class==='UNKNOWN'&&r.failure_stage==='FETCH'));
  check(result.results.map(r=>r.comparison_to).join()===',ERROR_1,ERROR_1,ERROR_2');
  check(result.results.map(r=>r.changed_variable).join()==='BASELINE,REDIRECT_POLICY,REPEAT,REDIRECT_POLICY');
 }],
 ['G16','Comparison completes both pairs despite inconsistent responses and never asserts a runtime identity or root cause',async()=>{
  let count=0;
  const run=createGeoNamesRuntimeProbe({getFetch:()=>async()=>{count++;if(count===2)throw new TypeError('fixture');return new Response(null,{status:503});}});
  const result=await run({username:'fixture'});
  check(count===4&&result.request_count===4&&result.stop_reason==='PLAN_COMPLETE');
  check(result.results.map(r=>r.http_response_received).join()==='true,false,true,true');
  check(result.results[1].transport_class==='UNKNOWN');
  check(!('root_cause' in result)&&!('runtime_identity' in result)&&!('provider_success' in result));
 }],
 ['G17','Manual probe samples observe redirects without following or reading headers/body/Location',async()=>{
  for(const opaque of [false,true]){
    let calls=0,cancelled=0;
    const run=createGeoNamesRuntimeProbe({getFetch:()=>async(input,options)=>{
      calls++;check(input instanceof URL&&input.origin==='https://secure.geonames.org'&&input.pathname==='/searchJSON'&&input.searchParams.get('username')==='fixture');
      if(options.redirect==='error')throw new TypeError('fixture');
      const response=new Response(new ReadableStream({cancel(){cancelled++;}}),{status:302});
      return Object.defineProperties(response,{headers:{get(){throw new Error('must not inspect headers');}},text:{value:()=>{throw new Error('must not read body');}},...(opaque?{status:{value:0},type:{value:'opaqueredirect'}}:{})});
    }});
    const result=await run({username:'fixture'});
    check(calls===4&&cancelled===2&&result.results.filter(r=>r.probe_id.startsWith('MANUAL')).every(r=>r.redirect_observed&&r.http_status===(opaque?null:302)&&r.cleanup_confirmed));
  }
 }],
 ['G18','Probe deadlines abort sequential requests, clear timers, reject concurrent/cooldown runs and do not leak rejections',withTestClock(async(clock,context)=>{
  const signals=[];let active=0,peak=0,unhandled=0;
  const timers=clock.timers;
  const listener=()=>{unhandled++;};window.addEventListener('unhandledrejection',listener);context.cleanup?.(()=>window.removeEventListener('unhandledrejection',listener));
  try{
    const run=createGeoNamesRuntimeProbe({limits:shortLimits,timers,now:clock.now,getFetch:()=>async(_input,options)=>{
      signals.push(options.signal);active++;peak=Math.max(peak,active);
      try{return await new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('fixture','AbortError')),{once:true}));}finally{active--;}
    }});
    const pending=run({username:'fixture'});await rejects(()=>run({username:'fixture'}),'GEONAMES_PROBE_BUSY');
    context.stage?.('FETCH_WAIT');const result=await clock.run(()=>pending);check(result.request_count===4&&peak===1&&active===0&&signals.every(s=>s.aborted)&&clock.pending()===0);
    check(result.results.every(r=>r.transport_class==='TIMEOUT'&&r.cleanup_confirmed));
    await rejects(()=>run({username:'fixture'}),'GEONAMES_PROBE_BUSY');
    for(const fails of [false,true]){
      const immediate=createGeoNamesRuntimeProbe({timers,now:clock.now,getFetch:()=>async()=>{if(fails)throw new Error('fixture');return new Response(null);}});
      await immediate({username:'fixture'});check(clock.pending()===0,'probe deadline timer retained');
    }
    context.stage?.('SETTLED_CHECK');await clock.advance(15);await testEventTurn(context.signal);check(unhandled===0);
  }finally{window.removeEventListener('unhandledrejection',listener);}
 })],
 ['G19','Caller abort/total deadline stop further samples; unconfirmed cancellation keeps the worker blocked',withTestClock(async(testClock,context)=>{
  const controller=new AbortController();let calls=0;
  const run=createGeoNamesRuntimeProbe({getFetch:()=>async(_input,options)=>{calls++;controller.abort();return new Promise((_,reject)=>{if(options.signal.aborted)reject(new Error('fixture'));else options.signal.addEventListener('abort',()=>reject(new Error('fixture')));});}});
  const cancelled=await run({username:'fixture',signal:controller.signal});check(calls===1&&cancelled.stop_reason==='CALLER_CANCELLED');
  let clock=0;
  const budget=createGeoNamesRuntimeProbe({now:()=>clock,getFetch:()=>async()=>{clock=30000;throw new Error('fixture');}});
  const exhausted=await budget({username:'fixture'});check(exhausted.request_count===1&&exhausted.stop_reason==='TOTAL_DEADLINE');
  /** @type {(reason:unknown)=>void} */ let rejectLate=()=>{};
  const stuck=createGeoNamesRuntimeProbe({limits:shortLimits,timers:testClock.timers,now:testClock.now,getFetch:()=>()=>new Promise((_,reject)=>{rejectLate=reject;})});
  context.stage?.('CLEANUP');const result=await testClock.run(()=>stuck({username:'fixture'}));check(result.request_count===1&&result.stop_reason==='CANCELLATION_UNCONFIRMED');
  context.stage?.('COOLDOWN');await testClock.advance(25);await rejects(()=>stuck({username:'fixture'}),'GEONAMES_PROBE_BUSY');
  rejectLate(new Error('late fixture'));await testEventTurn(context.signal);check(testClock.pending()===0);
 })],
 ['G20','Probe returns only technical projections; no body/header/error/credential or console disclosure',async(context={})=>{
  const marker='synthetic-probe-private',methods=['log','info','warn','error','debug','trace'];
  const captured=captureFixtureConsole(methods,context);let calls=0;
  try{
    const run=createGeoNamesRuntimeProbe({getFetch:()=>async(input)=>{
      calls++;const detail=`${String(input)} ${marker}`;
      throw Object.assign(new TypeError(detail,{cause:{message:detail,name:detail,code:detail}}),{stack:detail});
    }});
    const response=await post(admin,()=>run({username:marker})),result=await response.json(),text=JSON.stringify(result);
    check(response.status===200&&calls===4&&captured.count()===0);
    for(const value of [marker,'https://','Istanbul','stack','cause','message','username'])check(!text.includes(value),'probe data leak');
    check(result.results.every(r=>r.transport_class==='UNKNOWN'&&Object.keys(r).sort().join()==='changed_variable,cleanup_confirmed,comparison_to,elapsed_ms,failure_stage,http_response_received,http_status,probe_id,redirect_observed,transport_class'));
    let fetched=0;const missing=createGeoNamesRuntimeProbe({getFetch:()=>async()=>{fetched++;return new Response(null);}});
    await rejects(()=>missing({username:'  '}),'GEONAMES_SECRET_MISSING');check(fetched===0);
  }finally{captured.dispose();}
 }],
];
