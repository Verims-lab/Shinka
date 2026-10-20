import {verifyBase44Identity} from './session.js';
import {sqlFail} from './store.js';
import {receipt,requestFingerprint} from './receipts.js';

export async function changeSqlAdmin({identity,body,transaction,rawClient,allowedPrincipals,now}) {
  if(!['grant','revoke'].includes(body.action)||Object.keys(body).some(k=>!['action','target_id','action_id'].includes(k))||
    typeof body.action_id!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(body.action_id)||!allowedPrincipals.includes(body.target_id))sqlFail('INVALID_REQUEST',400);
  return transaction(identity,{targetId:body.target_id,exclusiveRoster:true},async({context,client})=>{
    if((await client.auth.me()).role!=='admin')sqlFail('FORBIDDEN_INTERNAL_TOOLING',403);
    await verifyBase44Identity(rawClient,body.target_id);
    const {sql,appId,store}=context,target=context.owners.find(row=>row.user_id===body.target_id);
    if(!target||target.deletion_fenced_at)sqlFail('TEST_USER_NOT_FOUND',404);
    const profile=(await store.read('user_profile',{user_id:target.user_id},'id',1))[0];
    if(profile?.account_status!=='ACTIVE')sqlFail('ACTIVE_ACCOUNT_REQUIRED',403);
    const outcome=await receipt(context,body.action_id,'application-admin',await requestFingerprint(body),async()=>{
      if(body.action==='revoke'&&target.is_admin) {
        const active=await sql`SELECT count(*) AS n FROM shinka_private.owner o LEFT JOIN shinka_private.user_profile p
          ON o.app_id=p.app_id AND o.user_id=p.user_id WHERE o.app_id=${appId} AND o.is_admin AND o.deletion_fenced_at IS NULL
          AND p.account_status='ACTIVE'`;
        if(Number(active[0].n)<=1)sqlFail('TEST_LAST_ADMIN_DENIED',403);
      }
      const isAdmin=body.action==='grant';
      await sql`UPDATE shinka_private.owner SET is_admin=${isAdmin} WHERE app_id=${appId} AND user_id=${target.user_id}`;
      await store.insert('admin_audit_log',{admin_user_id:identity.id,target_user_id:target.user_id,target_entity:'ApplicationAdmin',
        target_record_id:target.user_id,action_type:'UPDATE',action_status:'SUCCESS',performed_at:now().toISOString(),error_code:null});
      return {id:target.user_id,role:isAdmin?'admin':'user',authority:'POSTGRESQL_TEST_V1'};
    });
    const [current]=await sql`SELECT is_admin FROM shinka_private.owner WHERE app_id=${appId} AND user_id=${target.user_id}`;
    if(current.is_admin!==(outcome.result.role==='admin'))sqlFail('SQL_ADMIN_STATE_CHANGED');
    return outcome.result;
  });
}
