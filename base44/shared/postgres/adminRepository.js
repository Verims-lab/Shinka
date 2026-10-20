import {DELETED_ENTITIES,RETAINED_ENTITIES,hashToolValue} from '../adminTestPolicy.js';
import {DERIVED_ENTITIES,sqlFail} from './store.js';
import {readSqlOperation,verifyBase44Identity} from './session.js';

export function createSqlAdminRepository(context,rawClient) {
  const {sql,appId,store}=context;
  const user=async id=>{
    const rows=await sql`SELECT * FROM shinka_private.owner WHERE app_id=${appId} AND user_id=${id}`;
    if(!rows.length)return null;
    try{await verifyBase44Identity(rawClient,id);}catch(error){if(error.code==='AUTH_REQUIRED')return null;throw error;}
    return {id,role:rows[0].is_admin?'admin':'user'};
  };
  const owned=async(entity,id)=>DERIVED_ENTITIES.includes(entity)?[]:store.read(entity,{user_id:id},'id',20001);
  const target=async id=>{
    const identity=await user(id);if(!identity)sqlFail('TEST_USER_NOT_FOUND',404);
    const profiles=await owned('user_profile',id),jobs=await owned('health_data_deletion_job',id);
    const admins=await sql`SELECT count(*) AS n FROM shinka_private.owner o LEFT JOIN shinka_private.user_profile p
      ON o.app_id=p.app_id AND o.user_id=p.user_id WHERE o.app_id=${appId} AND o.is_admin AND o.deletion_fenced_at IS NULL
      AND p.account_status='ACTIVE'`;
    return {...identity,account_status:profiles[0]?.account_status??'NO_PROFILE',open_deletion:jobs.some(row=>row.job_status!=='COMPLETED'),
      last_admin:identity.role==='admin'&&Number(admins[0].n)<2};
  };
  const impact=async id=>{
    const records={},counts={};
    for(const entity of [...DELETED_ENTITIES,...RETAINED_ENTITIES.filter(e=>!['admin_audit_log','system_error_log'].includes(e))]) {
      const rows=await owned(entity,id);if(rows.length>=20001)sqlFail('TEST_SCOPE_TOO_LARGE',503);
      counts[entity]=rows.length;
      records[entity]=rows.map(row=>({id:row.id,updated_at:row.updated_at,delivery_status:row.delivery_status}));
    }
    const audit=await store.read('admin_audit_log',{$or:[{admin_user_id:id},{target_user_id:id}]},'id',20001);
    if(audit.length>=20001)sqlFail('TEST_SCOPE_TOO_LARGE',503);
    counts.admin_audit_log=audit.length;
    records.admin_audit_log=audit.map(row=>({id:row.id,updated_at:row.updated_at}));
    return {counts,pending_notifications:records.notification_delivery.filter(row=>['PENDING','FAILED'].includes(row.delivery_status)).length,
      hash:await hashToolValue(records)};
  };
  return {user,target,owned,impact,operation:(id,job)=>readSqlOperation(context,id,job),lifecycle:id=>readSqlOperation(context,id)};
}
