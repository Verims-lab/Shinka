import { patternOperation } from './patternOperation.js';
import { guardDomainOwner } from './nativeDomainGuard.js';
import { calendarReader } from './base44CalendarReader.js';
import { calculateCalendar } from './calendarCalculation.js';
import { resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { readBoundedJson } from './boundedJson.js';
import { DOMAIN_SCHEMAS, SHARED_ENTITIES, HEALTH_ENTITIES, physicalName } from './domainSchemas.js';
import { resolveAuthenticatedOwner, assertActiveAccount, assertHealthConsent, assertAdminAccess, assertProtectedRecordMutationAllowed } from './domainSecurity.js';
import { readDomainPage } from './domainReadPage.js';
import { normalizeDomainRead } from './domainValidation.js';
import { withAdminAudit } from './domainAudit.js';
const one = (rows) => rows.length===1?rows[0]:null;
export async function domainAccessOperation(client, body) {
  const principal=await requireAuthenticatedUser(client);
  resolveAuthenticatedOwner(principal,body);
  if(Object.keys(body).some(k=>!['entity','action','recordId','user_id'].includes(k))) throw new InternalError('INVALID_REQUEST',400);
  const entity=body.entity;
  if(!Object.hasOwn(DOMAIN_SCHEMAS,entity)) throw new InternalError('INVALID_DOMAIN_ENTITY',400);
  if(body.recordId!==undefined && (typeof body.recordId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(body.recordId))) throw new InternalError('INVALID_REQUEST',400);
  const store=client.asServiceRole.entities;
  if(body.action==='adminRead') {
    assertAdminAccess(principal);
    if(!body.recordId) throw new InternalError('RECORD_ID_REQUIRED',400);
    return withAdminAudit(client,principal,{target_entity:entity,target_record_id:body.recordId,action_type:'VIEW'},async()=>{
      if (entity === 'user_pattern_summary') throw new InternalError('DERIVED_PATTERN_READ_REQUIRED',409);
      if (['user_cycle_prediction','user_cycle_phase_day'].includes(entity)) throw new InternalError('DERIVED_CALENDAR_READ_REQUIRED',409);
      const row=await store[physicalName(entity)].get(body.recordId);
      if (row?.user_id && client.shinkaNative) await guardDomainOwner(client,row.user_id,entity);
      if (client.shinkaNative) { assertAdminAccess(await requireAuthenticatedUser(client)); if (row?.user_id) await guardDomainOwner(client,row.user_id,entity); }
      return {records:[normalizeDomainRead(entity,row)]};
    });
  }
  if(body.action!=='read') {
    const attempt=()=>assertProtectedRecordMutationAllowed(entity,body.action,principal);
    if(principal.role==='admin' && ['update','delete'].includes(body.action)) {
      return withAdminAudit(client,principal,{target_entity:entity,target_record_id:body.recordId,action_type:body.action.toUpperCase()},attempt);
    }
    attempt();
  }
  if(entity==='admin_audit_log'||entity==='system_error_log') throw new InternalError('DOMAIN_ACCESS_DENIED',403);
  const ownerId=principal.id;
  if (client.shinkaNative) await guardDomainOwner(client,ownerId,entity);
  if (client.shinkaNative && entity === 'user_pattern_summary') {
    if (body.recordId) throw new InternalError('DERIVED_PATTERN_READ_REQUIRED',409);
    const value = await patternOperation(client, { action: 'themes' });
    return { records: [value.summary], derived: true };
  }
  if (client.shinkaNative && ['user_cycle_prediction','user_cycle_phase_day'].includes(entity)) {
    const snapshot=await calendarReader(client,principal).confirmedSnapshot();
    const today=serverLocalDate(new Date(),resolveTimezone(null,snapshot.preferences?.timezone));
    const calculated=calculateCalendar({periods:snapshot.periods,settings:snapshot.settings,today});
    if ((await store.UserCalendarAction.filter({user_id:ownerId,status:'PENDING'},'id',1,0,['id'])).length) throw new InternalError('CALENDAR_PENDING_REVIEW',409);
    await guardDomainOwner(client,ownerId,entity);
    const key=entity==='user_cycle_prediction'?'predictions':'phases';
    return {records:calculated[key].slice(0,100).map(row=>({...row,user_id:ownerId})),derived:true,truncated:calculated[key].length>100};
  }
  const profile=one(await store.UserProfile.filter({user_id:ownerId},'-created_date',2));
  assertActiveAccount(ownerId,profile);
  if(HEALTH_ENTITIES.includes(entity)) {
    const consent=one(await store.UserHealthConsent.filter({user_id:ownerId},'-created_date',2));
    const jobs=await store.HealthDataDeletionJob.filter({user_id:ownerId,job_status:{$ne:'COMPLETED'}},'-created_date',1);
    assertHealthConsent(ownerId,consent,jobs);
  }
  const shared=SHARED_ENTITIES.includes(entity);
  // Scope in the query as well as after readback. Never get an arbitrary private id before checking owner.
  const query={...(shared?{}:{user_id:ownerId}),...(body.recordId?{id:body.recordId}:{})};
  const page=await readDomainPage(store[physicalName(entity)],entity,query,principal,shared);
  if(client.shinkaNative) await guardDomainOwner(client,ownerId,entity);
  return page;
}
export async function handleDomainRequest(req,createClient) {
  try {
    const client=createClient(req);
    if(req.method!=='POST') throw new InternalError('METHOD_NOT_ALLOWED',405);
    const body=await readBoundedJson(req,10000,(code,status)=>{throw new InternalError(code,status);});
    return Response.json(await domainAccessOperation(client,body));
  } catch(error) {
    return Response.json({error_code:error instanceof InternalError?error.code:'DOMAIN_OPERATION_FAILED'},{status:error instanceof InternalError?error.status:500});
  }
}
