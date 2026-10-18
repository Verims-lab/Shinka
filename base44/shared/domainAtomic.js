import { InternalError } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS, HEALTH_ENTITIES } from './domainSchemas.js';
import { validateDomainRecord } from './domainValidation.js';
import { assertProtectedRecordMutationAllowed, SYSTEM_AUTHORITIES } from './domainSecurity.js';
import { RELATIONSHIPS } from './domainContract.js';
const fail = (code,status=409) => {throw new InternalError(code,status);};
// Adapter contract: all unique keys + owner/state/reference predicates are checked in
// the SAME durable, cross-instance atomic operation. A local mutex, list/create or
// SDK upsert does not implement this interface. No production adapter is asserted.
export const ATOMIC_ADAPTER_STATUS='UNVERIFIED_NO_PRODUCTION_ADAPTER';
export function canonicalUniqueKeys(entity,record) {
  const keys=DOMAIN_SCHEMAS[entity]?.unique;
  if(!keys) fail('INVALID_DOMAIN_ENTITY',400);
  const fields=entity==='health_data_deletion_job' && record.job_status!=='COMPLETED'?[...keys,['user_id']]:keys;
  return fields.map(parts=>JSON.stringify([entity,...parts.map(k=>{if(record[k]==null) fail('MISSING_UNIQUE_KEY',400);return [k,record[k]];})]));
}
function requirements(entity,record) {
  return {
    // Retained protection/deletion metadata must remain operable for INACTIVE accounts.
    activeOwner:['health_data_deletion_job','data_protection_event'].includes(entity)?null:record.user_id??null,
    healthConsent:HEALTH_ENTITIES.includes(entity),
    noOpenDeletionJob:HEALTH_ENTITIES.includes(entity)||(entity==='user_health_consent'&&record.consent_status==='GRANTED'),
    references:RELATIONSHIPS.filter(r=>r.from.startsWith(`${entity}.`) && record[r.from.split('.')[1]]!=null).map(r=>({target:r.to,id:record[r.from.split('.')[1]],owner:record.user_id??null})),
  };
}
function requireAdapter(adapter,method) {
  if(!adapter || typeof adapter[method]!=='function'||typeof adapter.read!=='function') fail('ATOMIC_CAPABILITY_REQUIRED',503);
}
export async function createOnce(entity,input,authority,adapter) {
  assertProtectedRecordMutationAllowed(entity,'create',authority);
  const record=validateDomainRecord(entity,input);
  if(entity==='health_data_deletion_job' && (record.job_status!=='PENDING'||record.completed_at!=null||record.started_at!=null)) fail('INVALID_JOB_TRANSITION');
  requireAdapter(adapter,'createIfAbsent');
  const keys=canonicalUniqueKeys(entity,record);
  if(!keys.length) fail('IDEMPOTENCY_KEY_CONTRACT_REQUIRED',503);
  const outcome=await adapter.createIfAbsent({entity,keys,record,requirements:requirements(entity,record)});
  if(!outcome || !['CREATED','EXISTING'].includes(outcome.status)||!outcome.id) fail('ATOMIC_RESULT_INVALID');
  const saved=await adapter.read(entity,outcome.id);
  if(!saved || saved.id!==outcome.id || JSON.stringify(canonicalUniqueKeys(entity,saved))!==JSON.stringify(keys) || outcome.status==='CREATED' && Object.entries(record).some(([key,value])=>saved[key]!==value)) fail('ATOMIC_READBACK_CONFLICT');
  // Return the winning record. Never overwrite a previously committed snapshot on retry.
  return {created:outcome.status==='CREATED',record:saved};
}
const receipts=new WeakMap();
export async function verifyDeletionCompletion(authority,job,readRemainingCounts) {
  if(authority!==SYSTEM_AUTHORITIES.DELETION || !job?.id || !job?.user_id) fail('SYSTEM_AUTHORITY_REQUIRED',403);
  const counts=await readRemainingCounts(job.user_id,HEALTH_ENTITIES);
  if(!counts || HEALTH_ENTITIES.some(entity=>counts[entity]!==0)) fail('DELETION_NOT_VERIFIED');
  const receipt=Object.freeze({});
  receipts.set(receipt,{jobId:job.id,userId:job.user_id});
  return receipt;
}
export function assertDeletionTransition(before,after,authority,receipt) {
  if(authority!==SYSTEM_AUTHORITIES.DELETION) fail('SYSTEM_AUTHORITY_REQUIRED',403);
  if(after.user_id!==before.user_id || after.protection_event_id!==before.protection_event_id || after.requested_at!==before.requested_at) fail('PROTECTED_METADATA');
  const next={PENDING:['PROCESSING'],PROCESSING:['RETRYING','COMPLETED','FAILED'],RETRYING:['PROCESSING','FAILED'],FAILED:['RETRYING'],COMPLETED:[]};
  if(!next[before.job_status]?.includes(after.job_status)) fail('INVALID_JOB_TRANSITION');
  if(after.job_status==='COMPLETED') {
    const proof=receipts.get(receipt);
    if(!proof || proof.jobId!==before.id || proof.userId!==before.user_id || !after.completed_at) fail('DELETION_NOT_VERIFIED');
  } else if(after.completed_at!=null) fail('DELETION_NOT_VERIFIED');
}
export async function mutateConditionally(entity,before,patch,revision,authority,adapter,receipt) {
  assertProtectedRecordMutationAllowed(entity,'update',authority);
  if(!before?.id || typeof revision!=='string' || !revision) fail('REVISION_REQUIRED');
  const fields=Object.keys(DOMAIN_SCHEMAS[entity].properties);
  const previous=Object.fromEntries(fields.filter(k=>before[k]!==undefined).map(k=>[k,before[k]]));
  const after=validateDomainRecord(entity,{...previous,...patch});
  if(after.user_id!==previous.user_id || JSON.stringify(canonicalUniqueKeys(entity,previous))!==JSON.stringify(canonicalUniqueKeys(entity,after)) && entity!=='health_data_deletion_job') fail('IDENTITY_CHANGE_DENIED',403);
  if(entity==='health_data_deletion_job') assertDeletionTransition(before,after,authority,receipt);
  if(entity==='data_protection_event') fail('PROTECTION_TRANSITION_WORKFLOW_REQUIRED',503);
  requireAdapter(adapter,'compareAndSet');
  const result=await adapter.compareAndSet({entity,id:before.id,revision,record:after,keys:canonicalUniqueKeys(entity,after),requirements:requirements(entity,after)});
  if(result?.status!=='UPDATED') fail('WRITE_CONFLICT');
  const saved=await adapter.read(entity,before.id);
  if(!saved || saved.id!==before.id || fields.some(key=>after[key]===undefined?saved[key]!=null:saved[key]!==after[key])) fail('ATOMIC_READBACK_CONFLICT');
  return saved;
}
// An optional reference precheck for future workers. It does not replace atomic
// referential validation or transaction/restrict-on-delete support in the adapter.
export async function assertReferenceTargets(entity,record,resolve) {
  for(const ref of requirements(entity,record).references) {
    const target=await resolve(ref.target.split('.')[0],ref.id);
    if(!target || target.id!==ref.id) fail('REFERENCE_NOT_FOUND',400);
    if(ref.target==='User.id' && record.user_id && ref.id!==record.user_id && entity!=='admin_audit_log') fail('REFERENCE_OWNER_MISMATCH',403);
    if(target.user_id && record.user_id && target.user_id!==record.user_id) fail('REFERENCE_OWNER_MISMATCH',403);
  }
}
