import { createSqlStore, sqlFail, sqlTable } from './store.js';
import { projectOperation, OPERATION_FIELDS } from '../adminTestPolicy.js';
const normalize = row => row && Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v instanceof Date?v.toISOString():v]));

export async function verifyBase44Identity(client, id = null) {
  let me;
  try{me=id?{id}:await client.auth.me();}catch{sqlFail('AUTH_REQUIRED',401);}
  if(!me?.id||typeof me.id!=='string')sqlFail('AUTH_REQUIRED',401);
  const rows=await client.asServiceRole.entities.User.filter({id:me.id},'id',2,0,['id']);
  if(!Array.isArray(rows)||rows.length!==1||rows[0].id!==me.id)sqlFail('AUTH_REQUIRED',401);
  return {id:me.id}; // Base44 role, email, and token never become SQL role authority.
}

export async function withSqlTransaction(pool,{appId,actorId,targetId=null,exclusiveRoster=false,allowActorInactive=false},work) {
  return pool.begin(async sql=>{
    const [privilege]=await sql`SELECT r.rolsuper OR r.rolbypassrls OR EXISTS(
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='shinka_private' AND pg_has_role(current_user,c.relowner,'USAGE')) AS unsafe
      FROM pg_roles r WHERE r.rolname=current_user`;
    if(!privilege||privilege.unsafe)sqlFail('SQL_RUNTIME_ROLE_UNSAFE',503);
    await sql`SELECT set_config('shinka.app_id',${appId},true)`;
    await sql`SELECT set_config('statement_timeout','20000',true),set_config('lock_timeout','10000',true)`;
    const apps=exclusiveRoster
      ? await sql`SELECT * FROM shinka_private.application WHERE app_id=${appId} FOR UPDATE`
      : await sql`SELECT * FROM shinka_private.application WHERE app_id=${appId} FOR SHARE`;
    if(apps.length!==1||apps[0].environment!=='TEST'||apps[0].authority_version!==1)sqlFail('SQL_AUTHORITY_UNVERIFIED',503);
    // Only the actor authenticated by Base44 is registered automatically.
    await sql`INSERT INTO shinka_private.owner(app_id,user_id,identity_verified_at)
      VALUES(${appId},${actorId},clock_timestamp()) ON CONFLICT(app_id,user_id) DO NOTHING`;
    const ids=[...new Set([actorId,...(targetId?[targetId]:[])])].sort();
    const owners=await sql`SELECT * FROM shinka_private.owner WHERE app_id=${appId} AND user_id IN ${sql(ids)} ORDER BY user_id FOR UPDATE`;
    const actor=owners.find(row=>row.user_id===actorId);
    if(!actor||actor.deletion_fenced_at)sqlFail('ACCOUNT_DELETION_IN_PROGRESS',403);
    const store=createSqlStore(sql,appId);
    const profile=(await store.read('user_profile',{user_id:actorId},'id',1))[0];
    if(!allowActorInactive&&profile?.account_status==='INACTIVE')sqlFail('ACTIVE_ACCOUNT_REQUIRED',403);
    return work({sql,appId,store,actor:normalize(actor),owners:owners.map(normalize),profile});
  });
}

export function createSqlClient(context,rawClient,{projection=async()=>[]}={}) {
  const {sql,appId,store,actor}=context;
  const operationRows=async query=>{
    if(Object.keys(query).some(key=>!['target_id','operation_id'].includes(key)))sqlFail('INVALID_SQL_QUERY',400);
    const rows=await sql`SELECT * FROM shinka_private.test_operation WHERE app_id=${appId}
      ${query.target_id?sql`AND target_id=${query.target_id}`:sql``}
      ${query.operation_id?sql`AND operation_id=${query.operation_id}`:sql``} ORDER BY id`;
    return rows.map(row=>projectOperation(normalize(row)));
  };
  const lifecycle=async owner=>{
    const rows=(await operationRows({target_id:owner})).filter(row=>row.status!=='COMPLETED'||row.operation==='DELETE_USER');
    if(rows.length>1)sqlFail('TEST_OPERATION_STATE_INVALID');return rows[0]??null;
  };
  const userFilter=async(query={},_sort='id',limit=100,offset=0)=>{
    if(Object.keys(query).some(k=>!['id','role'].includes(k)))sqlFail('INVALID_SQL_QUERY',400);
    const rows=await sql`SELECT user_id,is_admin FROM shinka_private.owner WHERE app_id=${appId} AND deletion_fenced_at IS NULL
      ${query.id?sql`AND user_id=${query.id}`:sql``} ${query.role?sql`AND is_admin=${query.role==='admin'}`:sql``}
      ORDER BY user_id LIMIT ${limit} OFFSET ${offset}`;
    return rows.map(row=>({id:row.user_id,role:row.is_admin?'admin':'user'}));
  };
  const entities={...store.entities,
    User:{filter:userFilter},
    AdminTestOperation:{filter:async(query,_sort,limit=100,offset=0,fields=OPERATION_FIELDS)=>(await operationRows(query)).slice(offset,offset+limit).map(row=>Object.fromEntries(fields.map(k=>[k,row[k]])))},
    // Tooling history alone remains in Base44; it is never product authority.
    InternalHealthRun:rawClient.asServiceRole.entities.InternalHealthRun,
  };
  for(const entity of ['user_cycle_prediction','user_cycle_phase_day']) {
    const name=entity==='user_cycle_prediction'?'UserCyclePrediction':'UserCyclePhaseDay';
    entities[name]={
      filter:(query,sort,limit,offset,fields)=>projection(entity,query,sort,limit,offset,fields),
      list:()=>[], // Schema probe; projections have no independent storage.
      count:()=>sqlFail('DERIVED_OWNER_REQUIRED',400),
    };
  }
  return {
    getConfig:()=>rawClient.getConfig(),
    auth:{me:async()=>({id:actor.user_id,role:actor.is_admin&&context.profile?.account_status==='ACTIVE'?'admin':'user'})},
    asServiceRole:{entities,integrations:rawClient.asServiceRole.integrations},
    shinkaLifecycle:lifecycle,shinkaAuthority:'POSTGRESQL_TEST_V1',
    shinkaOperation:operationRows,
  };
}

export async function readSqlOperation(context,target,id=null) {
  const {sql,appId}=context;
  const rows=await sql`SELECT * FROM ${sqlTable(sql,'test_operation')} WHERE app_id=${appId} AND target_id=${target}
    ${id?sql`AND operation_id=${id}`:sql`AND (status <> 'COMPLETED' OR operation='DELETE_USER')`} ORDER BY id`;
  if(rows.length>1)sqlFail('TEST_OPERATION_STATE_INVALID');
  return rows[0]?projectOperation(normalize(rows[0])):null;
}
