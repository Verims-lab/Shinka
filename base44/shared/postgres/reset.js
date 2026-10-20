import { sqlFail } from './store.js';
import { readSqlOperation } from './session.js';
import { receipt, requestFingerprint } from './receipts.js';
import { testAuditRecord } from '../adminTestAudit.js';

export function createSqlResetCoordinator(context,dependencies,{now=()=>new Date()}={}) {
  return {resetStep:async(input,perform)=>{
    const {sql,appId,actor,store}=context;
    if(input.owner!==actor.user_id)sqlFail('FORGED_OWNER',403);
    const job=await readSqlOperation(context,input.owner,input.operationId);
    const profile=(await store.read('user_profile',{user_id:input.owner},'id',1))[0];
    if(profile?.account_status!=='ACTIVE')sqlFail('ACTIVE_ACCOUNT_REQUIRED',403);
    if((await store.read('health_data_deletion_job',{user_id:input.owner,job_status:{$ne:'COMPLETED'}},'id',1)).length)sqlFail('HEALTH_DELETION_PENDING',403);
    const key=`reset:${input.operationId}:${input.expectedStage}:${input.body.action}`;
    const saved=await receipt(context,key,'reset-step',await requestFingerprint(input.body),async()=>{
      if(!job||job.status!=='RESET_ACTIVE'||job.stage!==input.expectedStage)sqlFail('TEST_RESET_STEP_CONFLICT');
      const outcome=await perform(dependencies);
      const instant=now().toISOString(),done=outcome.nextStage==='DONE';
      await sql`UPDATE shinka_private.test_operation SET stage=${outcome.nextStage},
        status=${done?'COMPLETED':'RESET_ACTIVE'},progressed_at=${instant},completed_at=${done?instant:null}
        WHERE app_id=${appId} AND operation_id=${job.operation_id}`;
      if(done)await store.insert('admin_audit_log',testAuditRecord({...job,status:'COMPLETED',stage:'DONE',completed_at:instant,progressed_at:instant},'SUCCESS',instant));
      return outcome.result;
    });
    if(saved.replayed&&input.body.action==='saveCycle'&&saved.result.persisted&&!await dependencies.persistence.hasVerifiedCycle())sqlFail('CONSENT_STATE_CHANGED');
    return saved.result;
  }};
}
