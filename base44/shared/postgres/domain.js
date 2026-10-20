import {domainAccessOperation} from '../domainAccess.js';
import {DOMAIN_SCHEMAS,HEALTH_ENTITIES} from '../domainSchemas.js';
import {assertActiveAccount,assertHealthConsent} from '../domainSecurity.js';
import {InternalError} from '../internalAuthorization.js';
import {DERIVED_ENTITIES,sqlFail} from './store.js';
import {readSqlOperation} from './session.js';

export async function sqlDomainExecute(identity,body,transaction) {
  let targetId=null;
  if(body.action==='adminRead') {
    // Resolve only owner metadata under verified SQL admin authority. Then lock
    // both owners in the normal order and re-read the record in that transaction.
    targetId=await transaction(identity,{},async({context,client})=>{
      if((await client.auth.me()).role!=='admin')sqlFail('ADMIN_REQUIRED',403);
      if(!Object.hasOwn(DOMAIN_SCHEMAS,body.entity)||typeof body.recordId!=='string')sqlFail('INVALID_REQUEST',400);
      if(DERIVED_ENTITIES.includes(body.entity))sqlFail('DERIVED_OWNER_READ_REQUIRED',400);
      const row=(await context.store.read(body.entity,{id:body.recordId},'id',1))[0];
      return row?.user_id??null;
    });
  }
  const outcome=await transaction(identity,{targetId},async({context,client})=>{
    const owner=targetId??identity.id;
    if(targetId) {
      const target=context.owners.find(row=>row.user_id===targetId);
      if(!target||target.deletion_fenced_at)sqlFail('ACCOUNT_DELETION_IN_PROGRESS',403);
      const record=(await context.store.read(body.entity,{id:body.recordId},'id',1))[0];
      if(!record||record.user_id!==targetId)sqlFail('DOMAIN_STATE_CHANGED');
      assertActiveAccount(targetId,(await context.store.read('user_profile',{user_id:targetId},'id',1))[0]);
    }
    if(await readSqlOperation(context,owner))sqlFail('ONBOARDING_RESTART_REQUIRED');
    if(HEALTH_ENTITIES.includes(body.entity)) {
      const consent=(await context.store.read('user_health_consent',{user_id:owner},'id',1))[0];
      const jobs=await context.store.read('health_data_deletion_job',{user_id:owner,job_status:{$ne:'COMPLETED'}},'id',1);
      assertHealthConsent(owner,consent,jobs);
    }
    try{return {result:await domainAccessOperation(client,body)};}
    catch(error){
      // Commit the existing bounded FAILED audit for a denied admin mutation.
      // SQL/transport failures still abort; never return partial data.
      if(error instanceof InternalError)return {failure:{code:error.code,status:error.status}};
      throw error;
    }
  });
  if(outcome.failure)sqlFail(outcome.failure.code,outcome.failure.status);
  return outcome.result;
}
