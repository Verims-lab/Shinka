import { InternalError, assertAdmin } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { validateDomainRecord } from './domainValidation.js';
const token = value => typeof value==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const code = value => typeof value==='string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value);
const invalid = () => {throw new InternalError('UNSAFE_LOG_METADATA',400);};
export function createAdminAuditEntry(principal, metadata, now=new Date().toISOString()) {
  assertAdmin(principal);
  const allowed=['target_user_id','target_entity','target_record_id','action_type','action_status','error_code'];
  if(Object.keys(metadata).some(k=>!allowed.includes(k))) invalid();
  if(!Object.hasOwn(DOMAIN_SCHEMAS,metadata.target_entity) || !token(principal.id)) invalid();
  for(const key of ['target_user_id','target_record_id']) if(metadata[key]!=null && !token(metadata[key])) invalid();
  if(metadata.error_code!=null && !code(metadata.error_code)) invalid();
  return validateDomainRecord('admin_audit_log',{...metadata,admin_user_id:principal.id,performed_at:now});
}
export function createSystemErrorEntry(metadata) {
  const allowed=Object.keys(DOMAIN_SCHEMAS.system_error_log.properties);
  if(!metadata || Object.keys(metadata).some(k=>!allowed.includes(k))) invalid();
  if(!code(metadata.error_code) || !code(metadata.process_name) || !token(metadata.correlation_id)) invalid();
  return validateDomainRecord('system_error_log',metadata);
}
export async function withAdminAudit(client, principal, target, operation) {
  assertAdmin(principal);
  // Audit failure blocks return of data. No raw exception or result is copied.
  let result;
  try { result=await operation(); }
  catch(error) {
    await client.asServiceRole.entities[physicalName('admin_audit_log')].create(createAdminAuditEntry(principal,{...target,action_status:'FAILED',error_code:error instanceof InternalError?error.code:'ADMIN_OPERATION_FAILED'}));
    throw error;
  }
  await client.asServiceRole.entities[physicalName('admin_audit_log')].create(createAdminAuditEntry(principal,{...target,action_status:'SUCCESS'}));
  return result;
}
