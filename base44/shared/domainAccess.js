import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS, SHARED_ENTITIES, HEALTH_ENTITIES, physicalName } from './domainSchemas.js';
import { resolveAuthenticatedOwner, assertOwner, assertActiveAccount, assertHealthConsent, assertAdminAccess, assertProtectedRecordMutationAllowed } from './domainSecurity.js';
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
    return withAdminAudit(client,principal,{target_entity:entity,target_record_id:body.recordId,action_type:'VIEW'},async()=>({records:[normalizeDomainRead(entity,await store[physicalName(entity)].get(body.recordId))]}));
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
  const rows=await store[physicalName(entity)].filter(query,'-created_date',100);
  if(!shared) rows.forEach(row=>assertOwner(principal,row));
  return {records:rows.map(row=>normalizeDomainRead(entity,row))};
}
export async function handleDomainRequest(req,createClient) {
  try {
    const client=createClient(req);
    if(req.method!=='POST') throw new InternalError('METHOD_NOT_ALLOWED',405);
    const text=await req.text();
    if(new TextEncoder().encode(text).length>10000) throw new InternalError('REQUEST_TOO_LARGE',413);
    let body;try{body=JSON.parse(text);}catch{throw new InternalError('INVALID_REQUEST',400);}
    if(!body||typeof body!=='object'||Array.isArray(body)) throw new InternalError('INVALID_REQUEST',400);
    return Response.json(await domainAccessOperation(client,body));
  } catch(error) {
    return Response.json({error_code:error instanceof InternalError?error.code:'DOMAIN_OPERATION_FAILED'},{status:error instanceof InternalError?error.status:500});
  }
}
