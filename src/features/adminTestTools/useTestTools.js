import { useEffect, useRef, useState } from 'react';
import { adminTestRequest } from '@/services/internal/adminTestTools';
const KEY = 'shinka.pending-test-operation';
const readPending = () => { try { const p=JSON.parse(sessionStorage.getItem(KEY)); return p && /^[a-zA-Z0-9_-]{1,100}$/.test(p.target) && /^[a-zA-Z0-9_-]{16,100}$/.test(p.id) ? p : null; } catch {return null;} };
const remember = value => { try {if(value)sessionStorage.setItem(KEY,JSON.stringify(value));else sessionStorage.removeItem(KEY);} catch { /* Lookup by ID still recovers server state. */ } };

export function useTestTools(request = adminTestRequest) {
  const initial = useRef(readPending());
  const [input,setInput] = useState(initial.current?.target || ''), [value,setValue] = useState(null);
  const [preview,setPreview] = useState(null), [job,setJob] = useState(null), [pendingId,setPendingId] = useState(initial.current?.id || null);
  const [error,setError] = useState(null), [busy,setBusy] = useState(false), [phase,setPhase] = useState('IDLE');
  const generation = useRef(0), inFlight = useRef(false);
  const accept = result => {
    // A response owns its displayed target. Never carry a pre-operation identity
    // into a later status/execute response that did not read that identity.
    setValue(result); setJob(result.job || null);
    const outcome=result.result_state || (result.job?.status==='RESET_ACTIVE'?'RESET_ACTIVE':result.job?'PARTIAL':'IDLE');
    setPhase(outcome);
    if(result.job) {setPreview(null);setPendingId(result.job.operation_id);remember({target:input.trim(),id:result.job.operation_id});}
  };
  async function run(action,payload,onResult=accept) {
    if(inFlight.current)return;
    const version=generation.current;
    inFlight.current=true;setBusy(true);setError(null);
    if(action==='execute'||action==='resume')setPhase(preview?.operation==='RESET_ONBOARDING'||job?.operation==='RESET_ONBOARDING'?'RESETTING':'DELETING');
    const started=performance.now();
    try {
      let result=await request(action,payload);
      if(version!==generation.current)return;
      onResult(result);
      const operationId=payload.request_id||payload.operation_id;
      // Only an acknowledged partial response can continue the already approved
      // operation. Unknown responses leave this loop and only reconcile reads.
      for(let pass=1;['execute','resume'].includes(action)&&pass<12&&performance.now()-started<60000;pass++) {
        if(result.result_state!=='PARTIAL'||!result.resume_enabled||result.job?.operation!=='DELETE_USER'||result.job.operation_id!==operationId)break;
        if(result.job.status!=='RUNNING'&&result.job.error_code!=='TEST_CLEANUP_MORE_REQUIRED')break;
        if(version!==generation.current)break;
        setPhase('DELETING');
        result=await request('resume',{target_id:payload.target_id,operation_id:operationId});
        if(version!==generation.current)break;
        onResult(result);
      }
    }
    catch(e) {
      if(version!==generation.current)return;
      setValue(previous=>previous ? {...previous,target:null} : null);
      setError({code:e.code||'TEST_TOOLS_FAILED',stage:e.stage||null,requestId:e.requestId||null});
      if(action==='execute'||action==='resume'||action==='status') {
        setPhase('UNKNOWN');setPreview(null);
        // Unknown completion: read only; no automatic destructive retry.
        for(let attempt=0;attempt<2&&version===generation.current;attempt++) {
          try {
            const result=await request('status',{target_id:payload.target_id,operation_id:payload.request_id||payload.operation_id});
            if(version!==generation.current)break;
            accept(result);setError(null);
            if(result.result_state==='COMPLETED'||result.job?.status!=='RUNNING')break;
          } catch(readError) {
            if(version===generation.current)setError({code:readError.code||'TEST_TOOLS_FAILED',stage:readError.stage||null,requestId:readError.requestId||null});
          }
        }
      } else {setPhase(e.code==='TEST_USER_NOT_FOUND'?'MISSING':'UNKNOWN');if(e.code==='TEST_USER_NOT_FOUND'){setPendingId(null);remember(null);}}
    } finally {if(version===generation.current){inFlight.current=false;setBusy(false);}}
  }
  function changeInput(next) {
    if(inFlight.current&&pendingId)return;
    generation.current++;inFlight.current=false;remember(null);
    setInput(next);setValue(null);setPreview(null);setJob(null);setPendingId(null);setError(null);setBusy(false);setPhase('IDLE');
  }
  function lookup() { if(inFlight.current)return;setValue(null);setPreview(null);setJob(null);return run('lookup',{target_id:input.trim()}); }
  useEffect(()=>{if(initial.current)void lookup();return()=>{generation.current++;};},[]);
  const inspect=operation=>{if(!value?.target||busy)return;setPreview(null);return run('preview',{target_id:value.target.id,operation},result=>{setPreview(result);setJob(result.active_operation||null);});};
  function cancel(){if(inFlight.current)return;setPreview(null);setError(null);}
  function execute(){
    if(inFlight.current||!preview?.enabled||Date.parse(preview.expires_at)<=Date.now())return;
    const id=pendingId||crypto.randomUUID();setPendingId(id);remember({target:preview.target.id,id});
    return run('execute',{target_id:preview.target.id,operation:preview.operation,confirmation:true,preview_token:preview.preview_token,request_id:id});
  }
  const status=()=>run('status',{target_id:input.trim(),operation_id:job?.operation_id||pendingId});
  const resume=()=>run('resume',{target_id:input.trim(),operation_id:job?.operation_id||pendingId});
  return {input,value,preview,job,pendingId,error,busy,phase,changeInput,lookup,inspect,cancel,execute,status,resume};
}
