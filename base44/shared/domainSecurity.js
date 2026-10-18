import { InternalError, assertAuthenticatedPrincipal, assertAdmin } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS, HEALTH_ENTITIES, PROTECTED_ENTITIES, IMMUTABLE_ENTITIES, SHARED_ENTITIES } from './domainSchemas.js';
const deny = (code='DOMAIN_ACCESS_DENIED') => {throw new InternalError(code,403);};
export function resolveAuthenticatedOwner(principal, input={}) {
  assertAuthenticatedPrincipal(principal);
  if(Object.keys(input).some(k=>['role','admin','is_admin','isAdmin','authority','process','created_by','created_by_id'].includes(k))) deny('CLIENT_AUTHORITY_REJECTED');
  if(input.user_id!==undefined && input.user_id!==principal.id) deny('FORGED_OWNER');
  return principal.id;
}
export function assertOwner(principal, row) {
  assertAuthenticatedPrincipal(principal);
  if(!row || row.user_id!==principal.id) deny('OWNER_REQUIRED');
}
export function assertActiveAccount(ownerId, profile) {
  if(!profile || profile.user_id!==ownerId || profile.account_status!=='ACTIVE') deny('ACTIVE_ACCOUNT_REQUIRED');
}
export function assertHealthConsent(ownerId, consent, openDeletionJobs) {
  if(!consent || consent.user_id!==ownerId || consent.consent_status!=='GRANTED' || !Array.isArray(openDeletionJobs) || openDeletionJobs.some(j=>j.user_id!==ownerId || j.job_status!=='COMPLETED')) deny('HEALTH_CONSENT_REQUIRED');
}
// Non-serializable, module-owned grants. A future server worker imports its specific grant.
// Never resolve a grant from a request process/role flag. No worker/HTTP write route exists in 007.
const grant = (name) => Object.freeze({name});
export const SYSTEM_AUTHORITIES = Object.freeze({
  DAILY_MESSAGE:grant('DAILY_MESSAGE'),CONSENT:grant('CONSENT'),PROTECTION:grant('PROTECTION'),
  DELETION:grant('DELETION'),AUDIT:grant('AUDIT'),REFERENCE:grant('REFERENCE'),
  CYCLE:grant('CYCLE'),NOTIFICATION:grant('NOTIFICATION'),PATTERN:grant('PATTERN'),ERROR:grant('ERROR'),PROFILE:grant('PROFILE'),
});
const systemGrants=new Set(Object.values(SYSTEM_AUTHORITIES));
const writers={user_profile:'PROFILE',user_preferences:'PROFILE',user_health_consent:'CONSENT',user_health_consent_event:'CONSENT',
  user_cycle_settings:'CYCLE',user_period_record:'CYCLE',user_cycle_prediction:'CYCLE',user_cycle_phase_day:'CYCLE',cycle_phase_lookup:'REFERENCE',message_category_lookup:'REFERENCE',message_category_mapping:'REFERENCE',message_pair:'REFERENCE',user_daily_message:'DAILY_MESSAGE',notification_delivery:'NOTIFICATION',user_pattern_summary:'PATTERN',moon_phase_lookup:'REFERENCE',admin_audit_log:'AUDIT',system_error_log:'ERROR',health_data_deletion_job:'DELETION',data_protection_event:'PROTECTION'};
export function assertProtectedRecordMutationAllowed(entity, operation, actor) {
  if(!Object.hasOwn(DOMAIN_SCHEMAS,entity) || !['create','update','delete'].includes(operation)) deny();
  const system=systemGrants.has(actor);
  if(!system) {
    assertAuthenticatedPrincipal(actor);
    if(PROTECTED_ENTITIES.includes(entity)) deny('PROTECTED_RECORD');
    // All product mutation workflows are inactive in this foundation package.
    deny('PRODUCT_MUTATION_NOT_ACTIVE');
  }
  if(operation==='delete') {
    if(HEALTH_ENTITIES.includes(entity) && actor===SYSTEM_AUTHORITIES.DELETION) return;
    deny('DELETE_NOT_AUTHORIZED');
  }
  if(actor!==SYSTEM_AUTHORITIES[writers[entity]]) deny('SYSTEM_AUTHORITY_REQUIRED');
  if(operation==='update' && IMMUTABLE_ENTITIES.includes(entity)) deny('IMMUTABLE_RECORD');
}
export function assertAdminAccess(principal) {assertAdmin(principal);}
export const ACCESS_MATRIX = Object.freeze(Object.keys(DOMAIN_SCHEMAS).map(entity=>({entity,
  anonymousRead:'DENY',userOwnRead:entity==='admin_audit_log'||entity==='system_error_log'?'DENY':SHARED_ENTITIES.includes(entity)?'ACTIVE_SHARED_BACKEND':'ACTIVE_OWNER_BACKEND',
  userOwnCreate:'DENY_IN_007',userOwnUpdate:'DENY_IN_007',userOwnDelete:'DENY_IN_007',adminRead:'AUDITED_BACKEND',adminCreate:'DENY_IN_007',adminUpdate:PROTECTED_ENTITIES.includes(entity)?'DENY_PROTECTED':'DENY_IN_007',adminDelete:PROTECTED_ENTITIES.includes(entity)?'DENY_PROTECTED':'DENY_IN_007',
  backendCreate:`GUARDED_${writers[entity]}`,backendUpdate:IMMUTABLE_ENTITIES.includes(entity)?'DENY_IMMUTABLE':`CONDITIONAL_${writers[entity]}`,backendDelete:HEALTH_ENTITIES.includes(entity)?'VERIFIED_DELETION_WORKER':'DENY',
})));
