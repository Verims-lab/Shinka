import { InternalError } from './internalAuthorization.js';
import { classifyGeoNamesTransport } from './geonamesDiagnostics.js';

/** @typedef {{max_requests:number,request_timeout_ms:number,total_timeout_ms:number,cleanup_grace_ms:number,cooldown_ms:number}} ProbeLimits */
/** @type {Readonly<ProbeLimits>} */
const LIMITS=Object.freeze({max_requests:8,request_timeout_ms:3000,total_timeout_ms:30000,cleanup_grace_ms:250,cooldown_ms:60000});

// One explicit, read-only diagnostic session per warm worker. This is not a
// distributed lock; the existing server-admin guard remains the access boundary.
/** @param {{getFetch?:()=>typeof fetch,fetchOwner?:object,now?:()=>number,limits?:ProbeLimits,timers?:{set:(fn:()=>void,ms:number)=>ReturnType<typeof setTimeout>,clear:(timer:ReturnType<typeof setTimeout>)=>void}}} [options] */
export function createGeoNamesRuntimeProbe({getFetch=()=>globalThis.fetch,fetchOwner=globalThis,now=()=>performance.now(),limits=LIMITS,timers={set:(fn,ms)=>setTimeout(fn,ms),clear:timer=>clearTimeout(timer)}}={}) {
  let running=false,draining=false,nextAllowed=0;
  return async function run({username,signal=undefined}) {
    if(running||draining||now()<nextAllowed)throw new InternalError('GEONAMES_PROBE_BUSY',429);
    const configured=typeof username==='string'?username.trim():'';
    if(!configured)throw new InternalError('GEONAMES_SECRET_MISSING',503);
    if(signal?.aborted)throw new InternalError('GEONAMES_PROBE_CANCELLED',409);
    running=true;
    const started=now(),results=[];
    let stopped=null,requests=0;
    try {
      // Capture one function for the whole comparison; only C changes its receiver.
      const fetcher=getFetch();
      const target=new URL('https://secure.geonames.org/searchJSON');
      Object.entries({q:'Istanbul',maxRows:8,lang:'tr',style:'FULL',featureClass:'P',username:configured}).forEach(([k,v])=>target.searchParams.set(k,String(v)));
      const anonymousTarget=new URL(target);anonymousTarget.searchParams.delete('username');
      const controlTarget=new URL('https://example.com/');
      const elapsed=from=>Math.max(0,Math.round(now()-from));

      async function sample(id,variant,comparisonTo,changedVariable) {
        if(stopped)return null;
        if(signal?.aborted){stopped='CALLER_CANCELLED';return null;}
        const remaining=limits.total_timeout_ms-elapsed(started);
        if(remaining<=limits.cleanup_grace_ms){stopped='TOTAL_DEADLINE';return null;}
        if(requests>=limits.max_requests){stopped='REQUEST_LIMIT';return null;}
        const sampleStarted=now(),abort=new AbortController();
        let timer,cleanupTimer,settled=false,timedOut=false,cancelled=false,httpStatus=null,redirectObserved=false,stage='FETCH',transportClass=null,failed=false;
        const url=new URL(variant==='E'?controlTarget:variant==='D'||variant==='F'?anonymousTarget:target);
        const input=variant==='B'?url.toString():url;
        /** @type {RequestInit} */
        const options={signal:abort.signal,redirect:variant==='F'?'manual':'error'};
        let endWait=()=>{};
        const interrupted=new Promise(resolve=>{endWait=()=>resolve(null);});
        const onCancel=()=>{cancelled=true;abort.abort();endWait();};
        signal?.addEventListener('abort',onCancel,{once:true});
        const attempt=Promise.resolve().then(()=>{
          if(signal?.aborted){onCancel();return null;}
          if(abort.signal.aborted)return null;
          requests++;
          return variant==='C'?Reflect.apply(fetcher,fetchOwner,[input,options]):fetcher(input,options);
        }).then(async response=>{
          if(!response)return;
          // No body/header/Location/URL is read or returned. Stop the unused stream.
          if(!timedOut&&!cancelled){
            httpStatus=Number.isInteger(response.status)&&response.status>=100&&response.status<=599?response.status:null;
            redirectObserved=(httpStatus>=300&&httpStatus<400)||response.type==='opaqueredirect';
            stage='RESPONSE_CLEANUP';
          }
          await response.body?.cancel();
        }).catch(error=>{failed=true;transportClass=classifyGeoNamesTransport(error);}).finally(()=>{settled=true;});
        try {
          timer=timers.set(()=>{timedOut=true;abort.abort();endWait();},Math.min(limits.request_timeout_ms,remaining-limits.cleanup_grace_ms));
          await Promise.race([attempt,interrupted]);
        } finally {
          timers.clear(timer);abort.abort();signal?.removeEventListener('abort',onCancel);
          // A non-compliant fetch must not let this session start another request.
          if(!settled){
            await Promise.race([attempt,new Promise(resolve=>{cleanupTimer=timers.set(()=>resolve(null),limits.cleanup_grace_ms);})]);
            timers.clear(cleanupTimer);
          }
          if(!settled){draining=true;stopped='CANCELLATION_UNCONFIRMED';void attempt.then(()=>{draining=false;});}
        }
        if(cancelled)stopped='CALLER_CANCELLED';
        const result={probe_id:id,comparison_to:comparisonTo,changed_variable:changedVariable,
          http_response_received:httpStatus!==null,http_status:httpStatus,redirect_observed:redirectObserved,
          failure_stage:timedOut||cancelled||failed?stage:null,
          transport_class:timedOut?'TIMEOUT':cancelled?'CANCELLED':failed?transportClass:null,
          elapsed_ms:elapsed(sampleStarted),cleanup_confirmed:settled};
        results.push(result);return result;
      }
      const reached=r=>r?.http_response_received===true;
      const a1=await sample('A1','A',null,'BASELINE');
      if(reached(a1))await sample('A2','A','A1','REPEAT');
      else {
        const b1=await sample('B1','B','A1','INPUT_FORM');
        const a2=await sample('A2','A','A1','REPEAT');
        if(reached(b1))await sample('B2','B','A2','INPUT_FORM');
        else if(!reached(a2)){
          const c1=await sample('C1','C','A2','CALL_RECEIVER');
          const a3=await sample('A3','A','A2','REPEAT');
          if(reached(c1))await sample('C2','C','A3','CALL_RECEIVER');
          else if(!reached(a3)){
            const d=await sample('D1','D','A3','OMIT_CREDENTIAL');
            if(reached(d)){
              await sample('A4','A','A3','REPEAT');
              await sample('D2','D','A4','OMIT_CREDENTIAL');
            }else{
              await sample('E1','E','D1','DESTINATION');
              await sample('F1','F','D1','REDIRECT_POLICY');
            }
          }
        }
      }
      return {probe_version:'geonames-runtime-isolation-v1',execution_surface:'internalHealth',
        evidence_kind:'RUNTIME_TRANSPORT_COMPARISON',scope:'TRANSPORT_ONLY_NOT_PROVIDER_SUCCESS',
        limits:{...limits},request_count:requests,elapsed_ms:elapsed(started),
        stop_reason:stopped||'PLAN_COMPLETE',results};
    } finally {running=false;nextAllowed=now()+limits.cooldown_ms;}
  };
}
