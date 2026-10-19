import { check, rejects } from './dataModelTests';
import { createGeoNamesRuntimeProbe } from '../../../base44/shared/geonamesRuntimeProbe.js';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { handleInternalRequest } from '../../../base44/shared/internalAuthorization.js';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';

const body={action:'geoNamesTransportProbe'};
const shortLimits={max_requests:8,request_timeout_ms:5,total_timeout_ms:150,cleanup_grace_ms:2,cooldown_ms:20};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
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
  for(const extra of [{url:'https://fixture.invalid'},{host:'fixture.invalid'},{username:'fixture'},{headers:{}},{timeoutMs:1},{role:'admin'},{query:'Private City'},{variants:['B']},{signal:null}])check((await post(admin,probe,{...body,...extra})).status===400);
  check(calls===0);check((await post(admin,probe)).status===200&&calls===1);
  check((await post(admin,null)).status===503);
 }],
 ['G14','Baseline preserves actual adapter URL/options and successful baseline needs only two observations',async()=>{
  let baseline;await createGeoNamesAdapter({username:' fixture ',fetcher:async(url,options)=>{baseline=snapshot(url,options);return Response.json({geonames:[]});}}).search('Istanbul','tr');
  const seen=[],signals=[];let cancelled=0;
  const run=createGeoNamesRuntimeProbe({getFetch:()=>async(input,options)=>{
    seen.push(snapshot(input,options));signals.push(options.signal);
    return new Response(new ReadableStream({cancel(){cancelled++;}}),{status:401});
  }});
  const result=await run({username:' fixture '});
  check(result.results.map(r=>r.probe_id).join()==='A1,A2'&&result.request_count===2);
  check(seen.every(s=>JSON.stringify(s)===JSON.stringify(baseline))&&signals.every(s=>s.aborted)&&cancelled===2);
  check(result.results.every(r=>r.http_response_received&&r.http_status===401&&r.failure_stage===null&&r.cleanup_confirmed));
  check(result.scope==='TRANSPORT_ONLY_NOT_PROVIDER_SUCCESS');
 }],
 ['G15','String comparison changes only input form and repeats baseline/string before any conclusion',async()=>{
  const seen=[];
  const run=createGeoNamesRuntimeProbe({getFetch:()=>async(input,options)=>{
    seen.push(snapshot(input,options));if(typeof input!=='string')throw new TypeError('fixture');return new Response(null);
  }});
  const result=await run({username:'fixture'});
  check(result.results.map(r=>r.probe_id).join()==='A1,B1,A2,B2');
  check(seen.every(s=>s.url===seen[0].url&&s.redirect==='error'&&s.keys==='redirect,signal'));
  check(seen.map(s=>s.isURL).join()==='true,false,true,false');
  check(result.results.map(r=>r.http_response_received).join()==='false,true,false,true');
 }],
 ['G16','Receiver comparison invokes the same captured fetch with the same URL/options and repeats',async()=>{
  const owner={},seen=[];let captures=0;
  const fetcher=async function(input,options){seen.push({...snapshot(input,options),bound:this===owner});if(this!==owner)throw new TypeError('fixture');return new Response(null);};
  const run=createGeoNamesRuntimeProbe({getFetch:()=>{captures++;return fetcher;},fetchOwner:owner});
  const result=await run({username:'fixture'});
  check(captures===1&&result.results.map(r=>r.probe_id).join()==='A1,B1,A2,C1,A3,C2');
  check(seen.every(s=>s.url===seen[0].url&&s.redirect==='error'&&s.keys==='redirect,signal'));
  check(seen.map(s=>s.bound).join()==='false,false,false,true,false,true');
  check(seen.filter(s=>s.bound).every(s=>s.isURL));
 }],
 ['G17','All failed variants select only fixed credential-free controls and never follow redirects',async()=>{
  const seen=[];
  const run=createGeoNamesRuntimeProbe({getFetch:()=>async(input,options)=>{
    seen.push(snapshot(input,options));
    if(new URL(input).hostname==='example.com')return new Response(null,{status:200});
    if(options.redirect==='manual')return new Response(null,{status:302,headers:{Location:'https://fixture.invalid/private'}});
    throw new TypeError('fixture');
  }});
  const result=await run({username:'fixture'});
  check(result.results.map(r=>r.probe_id).join()==='A1,B1,A2,C1,A3,D1,E1,F1'&&result.request_count===8);
  const d=new URL(seen[5].url),e=new URL(seen[6].url),f=new URL(seen[7].url),a=new URL(seen[0].url);a.searchParams.delete('username');
  check(d.href===a.href&&f.href===d.href&&!d.searchParams.has('username'));
  check(e.href==='https://example.com/'&&!e.search&&!e.username&&seen[6].keys==='redirect,signal');
  check(seen.every(s=>s.redirect==='error'||s.redirect==='manual')&&seen[7].redirect==='manual');
  check(result.results[7].redirect_observed&&!JSON.stringify(result).includes('Location')&&!JSON.stringify(result).includes('fixture.invalid'));
  const opaque=createGeoNamesRuntimeProbe({getFetch:()=>async(_input,options)=>{if(options.redirect==='manual')return Object.defineProperties(new Response(null),{status:{value:0},type:{value:'opaqueredirect'}});throw new TypeError('fixture');}});
  const last=(await opaque({username:'fixture'})).results.at(-1);check(last.redirect_observed&&last.http_status===null);
  const credentialDifference=createGeoNamesRuntimeProbe({getFetch:()=>async input=>{if(new URL(input).searchParams.has('username'))throw new TypeError('fixture');return new Response(null,{status:401});}});
  const compared=await credentialDifference({username:'fixture'});
  check(compared.results.map(r=>r.probe_id).join()==='A1,B1,A2,C1,A3,D1,A4,D2');
  check(compared.results.filter(r=>r.probe_id.startsWith('D')).every(r=>r.http_status===401));
 }],
 ['G18','Probe deadlines abort sequential requests, clear timers, reject concurrent/cooldown runs and do not leak rejections',async()=>{
  const signals=[];let active=0,peak=0,unhandled=0;
  const handles=new Set(),timers={set:(fn,ms)=>{const id=setTimeout(()=>{handles.delete(id);fn();},ms);handles.add(id);return id;},clear:id=>{handles.delete(id);clearTimeout(id);}};
  const listener=()=>{unhandled++;};window.addEventListener('unhandledrejection',listener);
  try{
    const run=createGeoNamesRuntimeProbe({limits:shortLimits,timers,getFetch:()=>async(_input,options)=>{
      signals.push(options.signal);active++;peak=Math.max(peak,active);
      try{return await new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('fixture','AbortError')),{once:true}));}finally{active--;}
    }});
    const pending=run({username:'fixture'});await rejects(()=>run({username:'fixture'}),'GEONAMES_PROBE_BUSY');
    const result=await pending;check(result.request_count===8&&peak===1&&active===0&&signals.every(s=>s.aborted)&&handles.size===0);
    check(result.results.every(r=>r.transport_class==='TIMEOUT'&&r.cleanup_confirmed));
    await rejects(()=>run({username:'fixture'}),'GEONAMES_PROBE_BUSY');
    for(const fails of [false,true]){
      const immediate=createGeoNamesRuntimeProbe({timers,getFetch:()=>async()=>{if(fails)throw new Error('fixture');return new Response(null);}});
      await immediate({username:'fixture'});check(handles.size===0,'probe deadline timer retained');
    }
    await delay(15);check(unhandled===0);
  }finally{window.removeEventListener('unhandledrejection',listener);}
 }],
 ['G19','Caller abort/total deadline stop further samples; unconfirmed cancellation keeps the worker blocked',async()=>{
  const controller=new AbortController();let calls=0;
  const run=createGeoNamesRuntimeProbe({getFetch:()=>async(_input,options)=>{calls++;controller.abort();return new Promise((_,reject)=>{if(options.signal.aborted)reject(new Error('fixture'));else options.signal.addEventListener('abort',()=>reject(new Error('fixture')));});}});
  const cancelled=await run({username:'fixture',signal:controller.signal});check(calls===1&&cancelled.stop_reason==='CALLER_CANCELLED');
  let clock=0;
  const budget=createGeoNamesRuntimeProbe({now:()=>clock,getFetch:()=>async()=>{clock=30000;throw new Error('fixture');}});
  const exhausted=await budget({username:'fixture'});check(exhausted.request_count===1&&exhausted.stop_reason==='TOTAL_DEADLINE');
  /** @type {(reason:unknown)=>void} */ let rejectLate=()=>{};
  const stuck=createGeoNamesRuntimeProbe({limits:shortLimits,getFetch:()=>()=>new Promise((_,reject)=>{rejectLate=reject;})});
  const result=await stuck({username:'fixture'});check(result.request_count===1&&result.stop_reason==='CANCELLATION_UNCONFIRMED');
  await delay(25);await rejects(()=>stuck({username:'fixture'}),'GEONAMES_PROBE_BUSY');
  rejectLate(new Error('late fixture'));await delay(0);
 }],
 ['G20','Probe returns only technical projections; no body/header/error/credential or console disclosure',async()=>{
  const marker='synthetic-probe-private',methods=['log','info','warn','error','debug','trace'];
  const originals=methods.map(k=>console[k]);let logs=0,calls=0;
  methods.forEach(k=>{console[k]=()=>{logs++;};});
  try{
    const run=createGeoNamesRuntimeProbe({getFetch:()=>async(input)=>{
      calls++;const detail=`${String(input)} ${marker}`;
      throw Object.assign(new TypeError(detail,{cause:{message:detail,name:detail,code:detail}}),{stack:detail});
    }});
    const response=await post(admin,()=>run({username:marker})),result=await response.json(),text=JSON.stringify(result);
    check(response.status===200&&calls===8&&logs===0);
    for(const value of [marker,'https://','Istanbul','stack','cause','message','username'])check(!text.includes(value),'probe data leak');
    check(result.results.every(r=>r.transport_class==='UNKNOWN'&&Object.keys(r).sort().join()==='changed_variable,cleanup_confirmed,comparison_to,elapsed_ms,failure_stage,http_response_received,http_status,probe_id,redirect_observed,transport_class'));
    let fetched=0;const missing=createGeoNamesRuntimeProbe({getFetch:()=>async()=>{fetched++;return new Response(null);}});
    await rejects(()=>missing({username:'  '}),'GEONAMES_SECRET_MISSING');check(fetched===0);
  }finally{methods.forEach((k,i)=>{console[k]=originals[i];});}
 }],
];
