import { nativeFixture } from './nativeFixture';
import { handleInternalRequest } from '../../../base44/shared/internalAuthorization.js';
import { nativeAdminTestOperation } from '../../../base44/shared/nativeAdminTestOperation.js';
import { createPreviewSigner } from '../../../base44/shared/adminTestPreview.js';
import { testOperationDiagnostics } from '../../../base44/shared/adminTestDiagnostics.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { adminTestRequest } from '@/services/internal/adminTestTools';

// Real service/HTTP handler/native repository/journal. Only platform SDK IO and
// latency are substituted; no fake transaction, lock or successful response.
export function deletionFixture({ latency = 0, periods = 0, handle = undefined } = {}) {
  const f = nativeFixture(); f.state.time = new Date().toISOString();
  const state = { time: 0, auth: 0, actor: 'adminA', before: null, after: null, calls: [], traces: [] };
  f.state.before = async call => { state.time += latency; await state.before?.(call); };
  f.state.after = async call => { await state.after?.(call); };
  for (let i=0;i<periods;i++) f.tables.UserPeriodRecord.push({ id:`period-${String(i).padStart(4,'0')}`, user_id:'ownerA', period_start_date:'2026-10-01' });
  const clock = () => state.time, now = () => new Date(Date.parse(f.state.time) + state.time);
  const signer = createPreviewSigner('isolated-deletion-signing-key-at-least-32-characters', now);
  const invoke = async body => {
    const start=state.time, offset=f.state.calls.length, auth=state.auth;
    const diagnostics=testOperationDiagnostics({clock,emit:record=>state.traces.push(record)});
    const raw=f.raw(state.actor), original=raw.auth.me;
    raw.auth.me=async()=>{state.auth++;return original();};
    const request=new Request('https://fixture.invalid/adminTestTools',{method:'POST',body:JSON.stringify(body)});
    const response=await (handle?handle(request,raw):handleInternalRequest(request,
      ()=>withUserLifecycle(diagnostics.wrap(raw)),
      (client,payload)=>nativeAdminTestOperation(client,payload,{policy:{appId:'native-fixture',label:'TEST'},signer,now,clock,diagnostics})));
    const data=await response.json(), calls=f.state.calls.slice(offset);
    state.calls.push({ action:body.action, operationId:body.operation_id||body.request_id||null, durationMs:state.time-start,
      entityReads:calls.filter(c=>c.method==='filter').length, writes:calls.filter(c=>c.method!=='filter').length, auth:state.auth-auth,
      stage:data.job?.stage||data.stage||null, checkpoints:data.job?.checkpoints||[], result:data.result_state||data.error_code,
      progress:data.progress||null, httpStatus:response.status });
    if(!response.ok) throw {response:{status:response.status,data}};
    return {data,status:response.status};
  };
  const client={functions:{invoke:async(_name,body)=>invoke(body)}};
  const request=(action,body)=>adminTestRequest(action,body,client);
  const preview=()=>request('preview',{target_id:'ownerA',operation:'DELETE_USER'});
  const execute=(view,id=crypto.randomUUID())=>request('execute',{target_id:'ownerA',operation:'DELETE_USER',confirmation:true,preview_token:view.preview_token,request_id:id});
  const resume=id=>request('resume',{target_id:'ownerA',operation_id:id});
  const status=id=>request('status',{target_id:'ownerA',operation_id:id});
  return {...f,measure:state,request,preview,execute,resume,status,clock,serviceClient:client};
}

export async function finishDeletion(f, result, limit=80) {
  const id=result.job.operation_id;
  for(let i=0;result.result_state!=='COMPLETED'&&i<limit;i++)result=await f.resume(id);
  if(result.result_state!=='COMPLETED')throw new Error('ISOLATED_DELETION_DID_NOT_FINISH');
  return result;
}
