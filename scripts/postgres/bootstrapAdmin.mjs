import {verifyBase44Identity} from '../../base44/shared/postgres/session.js';
import {createSqlStore} from '../../base44/shared/postgres/store.js';

// Operator connection only; never exposed as a browser/backend bootstrap route.
// The intended first admin must authenticate with Base44 as that exact ID.
export async function bootstrapAdmin(pool,nativeClient,{appId,confirmedUserId,allowedPrincipals}) {
  const identity=await verifyBase44Identity(nativeClient);
  if(!confirmedUserId||identity.id!==confirmedUserId||!allowedPrincipals.includes(identity.id))throw new Error('BOOTSTRAP_IDENTITY_UNCONFIRMED');
  return pool.begin(async sql=>{
    await sql`SELECT set_config('shinka.app_id',${appId},true)`;
    const apps=await sql`SELECT * FROM shinka_private.application WHERE app_id=${appId} FOR UPDATE`;
    if(apps.length!==1||apps[0].environment!=='TEST')throw new Error('BOOTSTRAP_TEST_REQUIRED');
    const admins=await sql`SELECT user_id FROM shinka_private.owner WHERE app_id=${appId} AND is_admin`;
    if(admins.length||apps[0].admin_bootstrapped_at)throw new Error('BOOTSTRAP_ALREADY_CLOSED');
    await sql`INSERT INTO shinka_private.owner(app_id,user_id,identity_verified_at) VALUES(${appId},${identity.id},clock_timestamp()) ON CONFLICT DO NOTHING`;
    const rows=await sql`SELECT * FROM shinka_private.owner WHERE app_id=${appId} AND user_id=${identity.id} FOR UPDATE`;
    const store=createSqlStore(sql,appId),profile=(await store.read('user_profile',{user_id:identity.id},'id',1))[0];
    if(rows[0].deletion_fenced_at||profile?.account_status!=='ACTIVE')throw new Error('BOOTSTRAP_ACTIVE_IDENTITY_REQUIRED');
    await sql`UPDATE shinka_private.owner SET is_admin=true WHERE app_id=${appId} AND user_id=${identity.id}`;
    await store.insert('admin_audit_log',{admin_user_id:identity.id,target_user_id:identity.id,target_entity:'ApplicationAdmin',target_record_id:identity.id,
      action_type:'UPDATE',action_status:'SUCCESS',performed_at:new Date().toISOString(),error_code:null});
    await sql`UPDATE shinka_private.application SET admin_bootstrapped_at=clock_timestamp() WHERE app_id=${appId}`;
    return {authority:'POSTGRESQL_TEST_V1',verifiedIdentity:true,bootstrapClosed:true};
  });
}
