import {DELETE_STEPS,DELETED_ENTITIES,projectOperation} from '../adminTestPolicy.js';
import {testAuditRecord} from '../adminTestAudit.js';
import {sqlFail,sqlTable,DERIVED_ENTITIES} from './store.js';
import {readSqlOperation} from './session.js';

export async function beginSqlJob(context,{actor,target,operation,requestId,previewHash},now) {
  const {sql,appId,store}=context,instant=now().toISOString();
  const job={id:crypto.randomUUID(),operation_id:requestId,actor_id:actor,target_id:target,operation,
    status:operation==='RESET_ONBOARDING'?'RESET_ACTIVE':'RUNNING',stage:operation==='RESET_ONBOARDING'?'PROFILE':'START',
    request_id:requestId,preview_hash:previewHash,started_at:instant,progressed_at:instant,completed_at:null,error_code:null,checkpoints:[]};
  const insert={app_id:appId,...job,checkpoints:sql.json([])};
  await sql`INSERT INTO shinka_private.test_operation ${sql(insert)}`;
  if(operation==='DELETE_USER')await sql`UPDATE shinka_private.owner SET deletion_fenced_at=${instant},is_admin=false WHERE app_id=${appId} AND user_id=${target}`;
  else await sql`UPDATE shinka_private.owner SET generation=generation+1 WHERE app_id=${appId} AND user_id=${target}`;
  await store.insert('admin_audit_log',testAuditRecord(job,'SUCCESS',instant));
  return projectOperation(job);
}

// Each stage/checkpoint is a durable SQL transaction. The User stage has an
// external effect: a crash/rollback retains the already committed fence, and
// retry confirms native User absence before repeating. No joint rollback claim.
export async function resumeSqlDeletion({identity,target,operationId,transaction,rawClient,now,beforeStage=null}) {
  const run=work=>transaction(identity,{targetId:target},async bundle=>{
    const {context,client}=bundle;
    if((await client.auth.me()).role!=='admin')sqlFail('FORBIDDEN_INTERNAL_TOOLING',403);
    const job=await readSqlOperation(context,target,operationId);
    if(!job||job.operation!=='DELETE_USER')sqlFail('TEST_OPERATION_NOT_FOUND',404);
    if(!context.owners.find(row=>row.user_id===target)?.deletion_fenced_at)sqlFail('TEST_JOB_START_UNCONFIRMED',503);
    return work({...bundle,job});
  });
  try {
    for(const stage of DELETE_STEPS)await run(async({context,job})=>{
      if(job.status==='COMPLETED'||job.checkpoints.includes(stage))return;
      if(beforeStage)await beforeStage(stage,context); // Injection only; never request/config data.
      const {sql,appId,store}=context;
      if(stage==='NOTIFICATIONS') {
        await sql`UPDATE shinka_private.notification_delivery SET delivery_status='SKIPPED',error_code='ADMIN_TEST_USER_DELETED',updated_at=clock_timestamp()
          WHERE app_id=${appId} AND user_id=${target} AND delivery_status IN ('PENDING','FAILED')`;
        await sql`DELETE FROM shinka_private.request_receipt WHERE app_id=${appId} AND user_id=${target}`;
      } else if(DELETED_ENTITIES.includes(stage)&&!DERIVED_ENTITIES.includes(stage)) {
        await sql`DELETE FROM ${sqlTable(sql,stage)} WHERE app_id=${appId} AND user_id=${target}`;
      } else if(stage==='USER') {
        const exists=async()=>{
          const rows=await rawClient.asServiceRole.entities.User.filter({id:target},'id',2,0,['id']);
          if(!Array.isArray(rows)||rows.length>1||rows.some(row=>row.id!==target))sqlFail('TEST_USER_READ_UNCONFIRMED');
          return rows.length>0;
        };
        if(await exists())await rawClient.asServiceRole.entities.User.delete(target);
        if(await exists())sqlFail('TEST_DELETE_UNCONFIRMED');
      } else if(stage==='VERIFY') {
        const rows=await rawClient.asServiceRole.entities.User.filter({id:target},'id',2,0,['id']);
        if(!Array.isArray(rows)||rows.length)sqlFail('TEST_DELETE_UNCONFIRMED');
        for(const entity of DELETED_ENTITIES.filter(e=>!DERIVED_ENTITIES.includes(e))) {
          if((await store.read(entity,{user_id:target},'id',1)).length)sqlFail('TEST_DELETE_UNCONFIRMED');
        }
        if((await store.read('notification_delivery',{user_id:target,delivery_status:{$in:['PENDING','FAILED']}},'id',1)).length)sqlFail('TEST_DELETE_UNCONFIRMED');
      }
      const instant=now().toISOString(),checkpoints=[...job.checkpoints,stage],done=stage==='VERIFY';
      await sql`UPDATE shinka_private.test_operation SET stage=${stage},checkpoints=${sql.json(checkpoints)},
        status=${done?'COMPLETED':'RUNNING'},error_code=null,progressed_at=${instant},completed_at=${done?instant:null}
        WHERE app_id=${appId} AND operation_id=${operationId}`;
      if(done)await store.insert('admin_audit_log',testAuditRecord({...job,stage,checkpoints,status:'COMPLETED',completed_at:instant},'SUCCESS',instant));
    });
  } catch(error) {
    if(error.code==='FORBIDDEN_INTERNAL_TOOLING')throw error;
    await run(async({context,job})=>{
      if(job.status==='COMPLETED')return;
      await context.sql`UPDATE shinka_private.test_operation SET status='RETRY_REQUIRED',error_code='TEST_JOB_RETRY_REQUIRED',progressed_at=clock_timestamp()
        WHERE app_id=${context.appId} AND operation_id=${operationId}`;
      await context.store.insert('admin_audit_log',testAuditRecord(job,'FAILED',now().toISOString(),'TEST_JOB_RETRY_REQUIRED'));
    });
    sqlFail('TEST_JOB_RETRY_REQUIRED',503);
  }
  return run(({job})=>job);
}
