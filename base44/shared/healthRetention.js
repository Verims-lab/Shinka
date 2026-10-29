// Operator-reviewed retention for this app's actual data store. Preview/PUBLISHED
// labels are report provenance, never separate databases. No product data writes.
import { InternalError, requireInternalAdmin } from './internalAuthorization.js';
import { withUserLifecycle } from './userLifecycle.js';
import { privacyHash } from './privacyPolicy.js';
import { GATE } from './healthConstants.js';

export const HEALTH_RETENTION_LIMIT = 5;
const APP = '6ad5190f4845d4e3af03b420';
const FIELDS = ['id','run_id','completed_at','created_date','updated_date','status','report_file_uri','report_digest'];
const fail = code => { throw new InternalError(code,409); };
const instant = value => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const fingerprint = row => privacyHash(JSON.stringify(FIELDS.map(key=>[key,row[key] ?? null])));

async function admit(client) {
  if (client.getConfig?.().appId !== APP) fail('RETENTION_APP_MISMATCH');
  const actor = await requireInternalAdmin(withUserLifecycle(client));
  const profiles = await client.asServiceRole.entities.UserProfile.filter({user_id:actor.id},'id',2,0,['id','user_id','account_status']);
  if (!Array.isArray(profiles) || profiles.length!==1 || profiles[0].user_id!==actor.id || profiles[0].account_status!=='ACTIVE') fail('ACTIVE_ACCOUNT_REQUIRED');
}
async function inventory(store) {
  const rows=[], seen=new Set(); let cursor=null;
  for (;;) {
    const page=await store.filter(cursor?{id:{$gt:cursor}}:{},'id',100,0,FIELDS);
    if (!Array.isArray(page) || page.length>100 || new Set(page.map(row=>row?.id)).size!==page.length || page.some((row,i)=>typeof row?.id!=='string' || !row.id || seen.has(row.id) || cursor && row.id<=cursor || i>0 && row.id<=page[i-1].id)) fail('RETENTION_INVENTORY_INVALID');
    for (const row of page) {seen.add(row.id);rows.push(row);}
    if(rows.length>10000)fail('RETENTION_INVENTORY_LIMIT');
    if(page.length<100)return rows;
    cursor=page.at(-1).id;
  }
}
export function planHealthRetention(rows, protectedRunIds = []) {
  const runCounts=new Map();
  rows.forEach(row=>runCounts.set(row.run_id,(runCounts.get(row.run_id)||0)+1));
  const completed=rows.filter(row=>typeof row.run_id==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(row.run_id) && instant(row.completed_at)!==null && row.status!==GATE.INCOMPLETE && Object.values(GATE).includes(row.status));
  const latest=new Set([...completed].sort((a,b)=>instant(b.completed_at)-instant(a.completed_at)||b.id.localeCompare(a.id)).slice(0,HEALTH_RETENTION_LIMIT).map(row=>row.id));
  const eligible=[],retained=[];
  for(const row of rows) {
    // completed_at is the canonical report-finish business timestamp, not a
    // native creation clock or proof that all save/recovery writers are drained.
    // Native metadata may omit a timezone; it is fingerprinted, never parsed.
    const reason=protectedRunIds.includes(row.run_id)?'ACTIVE_RECOVERY':latest.has(row.id)?'LATEST_FIVE':!completed.includes(row)?'INCOMPLETE_OR_UNKNOWN':runCounts.get(row.run_id)!==1?'RUN_ID_CONFLICT':null;
    (reason?retained:eligible).push(reason?{id:row.id,reason}:row);
  }
  return {eligible,retained};
}
async function inspect(store, ids=null, protectedRunIds=[]) {
  const rows=await inventory(store),plan=planHealthRetention(rows,protectedRunIds);
  const selected=ids || plan.eligible.slice(0,25).map(row=>row.id);
  const targets=await Promise.all(selected.map(async id=>{
    const row=rows.find(r=>r.id===id);
    return {id,state:!row?'ABSENT':plan.eligible.includes(row)?'ELIGIBLE':'PROTECTED',fingerprint:row?await fingerprint(row):null};
  }));
  const digest=await privacyHash(JSON.stringify({contract:'health-retention/1',targets,protectedRunIds:[...protectedRunIds].sort()}));
  const retainedIds=new Set(plan.retained.map(row=>row.id));
  const files=new Map();
  for(const row of rows)if(row.report_file_uri)files.set(row.report_file_uri,(files.get(row.report_file_uri)||[]).concat(row.id));
  return {rows,plan,report:{contract:'health-retention/1',total:rows.length,eligible:plan.eligible.length,retained:plan.retained,ids:selected,targets,reviewed_digest:digest,
    files:{referenced:files.size,referencedByRetained:[...files.values()].filter(refs=>refs.some(id=>retainedIds.has(id))).length,deletion:'NOT_SUPPORTED_BY_VERIFIED_SDK',deleted:0},
    hasMore:plan.eligible.some(row=>!selected.includes(row.id))}};
}
export async function healthRetention(client, body) {
  if(!body || !['dryRun','applyBatch','verify'].includes(body.action) || Object.keys(body).some(k=>!['action','ids','reviewed_digest','protected_run_ids','writers_drained'].includes(k)))fail('RETENTION_INPUT_INVALID');
  if(body.ids && (!Array.isArray(body.ids)||!body.ids.length||body.ids.length>25||new Set(body.ids).size!==body.ids.length||body.ids.some(id=>typeof id!=='string'||!id.trim())))fail('RETENTION_INPUT_INVALID');
  const protectedIds=body.protected_run_ids??[];
  if(!Array.isArray(protectedIds)||protectedIds.length>200||new Set(protectedIds).size!==protectedIds.length||protectedIds.some(id=>typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)))fail('RETENTION_INPUT_INVALID');
  await admit(client);
  // An explicit operator precondition, not a distributed lock: stop Health
  // save writers, drain in-flight saves and identify all open recovery runs.
  // If that cannot be established, inspect only. Age alone is not that proof.
  if(body.action==='applyBatch'&&(body.writers_drained!==true||!Object.hasOwn(body,'protected_run_ids')))fail('RETENTION_DRAIN_REQUIRED');
  const store=client.asServiceRole.entities.InternalHealthRun;
  const initial=await inspect(store,body.ids,protectedIds);
  if(body.action!=='applyBatch')return initial.report;
  if(!body.ids || body.reviewed_digest!==initial.report.reviewed_digest)fail('RETENTION_REVIEW_EXPIRED');
  if(initial.report.targets.some(row=>row.state==='PROTECTED'))fail('RETENTION_TARGET_PROTECTED');
  const outcomes=[];
  for(const target of initial.report.targets) {
    try {
      await admit(client);
      // Re-inventory before each delete: new saves/reordered latest-five and
      // shared references cannot be inferred from a stale initial page.
      const fresh=await inspect(store,[target.id],protectedIds), current=fresh.report.targets[0];
      if(current.state==='ABSENT') {outcomes.push({id:target.id,status:'VERIFIED_ABSENT'});continue;}
      if(current.state!=='ELIGIBLE'||current.fingerprint!==target.fingerprint)fail('RETENTION_REVIEW_EXPIRED');
      try {await store.delete(target.id);} catch { /* Lost ACK is reconciled below. */ }
      const remaining=await store.filter({id:target.id},'id',2,0,['id']);
      if(!Array.isArray(remaining)||remaining.length)fail('RETENTION_DELETE_UNCONFIRMED');
      outcomes.push({id:target.id,status:'VERIFIED_ABSENT'});
    }catch(error) {outcomes.push({id:target.id,status:error instanceof InternalError?error.code:'RETENTION_IO_UNCONFIRMED'});break;}
  }
  return {outcomes,complete:outcomes.length===body.ids.length&&outcomes.every(row=>row.status==='VERIFIED_ABSENT'),pendingIds:body.ids.filter(id=>!outcomes.some(row=>row.id===id&&row.status==='VERIFIED_ABSENT')),filesDeleted:0,fileDeletion:'NOT_SUPPORTED_BY_VERIFIED_SDK'};
}
