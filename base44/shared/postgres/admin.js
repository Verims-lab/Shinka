import {validateTestRequest,DELETED_ENTITIES,RETAINED_ENTITIES,SHARED_ENTITIES} from '../adminTestPolicy.js';
import {targetGuard} from '../adminTestOperation.js';
import {createSqlAdminRepository} from './adminRepository.js';
import {beginSqlJob,resumeSqlDeletion} from './adminJobs.js';
import {sqlFail} from './store.js';

const sqlTargetGuard=(actor,target,operation)=>{
  if(operation==='RESET_ONBOARDING'&&target.account_status!=='ACTIVE')sqlFail('TEST_INACTIVE_ACCOUNT');
  targetGuard(actor,target,operation);
};
export async function sqlAdminExecute({identity,body,transaction,appId,rawClient,now,options}) {
  validateTestRequest(body);
  if(!options.allowedPrincipals?.includes(body.target_id))sqlFail('SQL_TEST_PRINCIPAL_REQUIRED',403);
  const environment={app_id:appId,server:new URL(rawClient.getConfig().serverUrl).origin,label:'TEST',authorized:true};
  const mutating=['execute','resume'].includes(body.action);
  if(mutating&&!options.allowTestTools)sqlFail('TEST_EXECUTION_NOT_AUTHORIZED',403);
  const first=await transaction(identity,{targetId:body.target_id,exclusiveRoster:mutating},async({context,client})=>{
    if((await client.auth.me()).role!=='admin')sqlFail('FORBIDDEN_INTERNAL_TOOLING',403);
    const repository=createSqlAdminRepository(context,rawClient);
    const job=await repository.lifecycle(body.target_id);
    const recovery={resume_enabled:!!options.allowTestTools,mutation_blocker:options.allowTestTools?null:'TEST_EXECUTION_NOT_AUTHORIZED'};
    if(body.action==='status') {
      const saved=await repository.operation(body.target_id,body.operation_id);if(!saved)sqlFail('TEST_OPERATION_NOT_FOUND',404);
      return {job:saved,environment,...recovery};
    }
    const exists=await repository.user(body.target_id);
    if(!exists&&job?.operation!=='DELETE_USER')sqlFail('TEST_USER_NOT_FOUND',404);
    const target=exists?await repository.target(body.target_id):null;
    if(body.action==='lookup')return {target,job,environment,...recovery};
    const binding={actor:identity.id,target:body.target_id,operation:body.operation,app:appId};
    if(body.action==='preview') {
      if(!target)sqlFail('TEST_USER_NOT_FOUND',404);
      const impact=await repository.impact(target.id),blockers=[];
      try{sqlTargetGuard(identity,target,body.operation);}catch(error){blockers.push(error.code);}
      if(job)blockers.push('TEST_TARGET_BUSY');
      if(!options.allowTestTools)blockers.push('TEST_EXECUTION_NOT_AUTHORIZED');
      if(!options.signer)blockers.push('TEST_PREVIEW_SIGNER_REQUIRED');
      return {target,environment,operation:body.operation,counts:impact.counts,pending_notifications:impact.pending_notifications,
        scope:{deleted:body.operation==='DELETE_USER'?[...DELETED_ENTITIES,'User']:[],retained:RETAINED_ENTITIES,shared:SHARED_ENTITIES},
        blockers,enabled:!blockers.length,preview_token:blockers.length?null:await options.signer.sign({...binding,scope_hash:impact.hash}),
        expires_at:new Date(now().getTime()+300000).toISOString(),active_operation:job};
    }
    const requestId=body.action==='resume'?body.operation_id:body.request_id;
    const previous=await repository.operation(body.target_id,requestId);
    if(body.action==='resume') {
      if(!previous)sqlFail('TEST_OPERATION_NOT_FOUND',404);
      // Recovery by another current SQL admin is explicit and audited.
      if(previous.actor_id!==identity.id)await context.store.insert('admin_audit_log',{
        admin_user_id:identity.id,target_user_id:body.target_id,target_entity:'AdminTestOperation',target_record_id:requestId,
        action_type:'UPDATE',action_status:'SUCCESS',performed_at:now().toISOString(),error_code:null});
      return {job:previous,environment};
    }
    if(!options.signer)sqlFail('TEST_PREVIEW_SIGNER_REQUIRED',503);
    const signed=await options.signer.verify(body.preview_token,binding);
    if(previous) {
      if(previous.actor_id!==identity.id||previous.operation!==body.operation||previous.preview_hash!==signed.scope_hash)sqlFail('TEST_OPERATION_CONFLICT');
      return {job:previous,environment};
    }
    if(!target)sqlFail('TEST_USER_NOT_FOUND',404);
    sqlTargetGuard(identity,target,body.operation);
    if(job)sqlFail('TEST_TARGET_BUSY');
    if((await repository.impact(target.id)).hash!==signed.scope_hash)sqlFail('TEST_PREVIEW_STALE');
    const created=await beginSqlJob(context,{actor:identity.id,target:target.id,operation:body.operation,requestId,previewHash:signed.scope_hash},now);
    return {job:created,environment};
  });
  if(!mutating||first.job.operation!=='DELETE_USER'||first.job.status==='COMPLETED')return first;
  return {job:await resumeSqlDeletion({identity,target:body.target_id,operationId:first.job.operation_id,transaction,rawClient,now,beforeStage:options.beforeDeleteStage}),
    environment,retained:RETAINED_ENTITIES};
}
