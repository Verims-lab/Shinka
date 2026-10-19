import { InternalError, assertAuthenticatedPrincipal } from './internalAuthorization.js';
import { assertOwner, assertActiveAccount, assertProtectedRecordMutationAllowed, SYSTEM_AUTHORITIES as S } from './domainSecurity.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { validateDomainRecord, normalizeDomainRead } from './domainValidation.js';
import { validateBirthDate, optionalName, optionalBirthTime, resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { isOnboardingProfileReady } from './onboardingRoute.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';

export const PRODUCTION_ONBOARDING_ADAPTER = Object.freeze({
  status:'IMPLEMENTED', strategy:'BASE44_KEYED_UPSERT_VERIFIED_READBACK',
  nativeTransaction:false, rollback:false, crossInstanceEnforcement:'LIVE_VERIFICATION_REQUIRED',
});
const fail=(code,status=409)=>{throw new InternalError(code,status);};
const FIELDS=Object.fromEntries(Object.entries(DOMAIN_SCHEMAS).map(([entity,spec])=>[entity,Object.keys(spec.properties)]));
const identical=(entity,row,expected)=>FIELDS[entity].every(k=>(row[k]??null)===(expected[k]??null));
// A real, request-scoped service-role adapter. It deliberately does NOT implement
// domainAtomic.commitOwnerAction: Base44 upsert is not a multi-entity transaction.
export function createBase44OnboardingAdapter(client,principal,{now=()=>new Date(),consentVersion=HEALTH_CONSENT_VERSION}={}) {
  assertAuthenticatedPrincipal(principal);
  const owner=principal.id,store=client.asServiceRole.entities;
  const read=async(entity,query={})=>{
    const result=await store[physicalName(entity)].filter({...query,user_id:owner},'-created_date',2);
    if(!Array.isArray(result))fail('ONBOARDING_READ_FAILED',503);
    result.forEach(row=>assertOwner(principal,row));
    if(result.length>1)fail('DUPLICATE_OWNER_STATE');
    return result[0]?normalizeDomainRead(entity,result[0]):null;
  };
  const active=async(allowAbsent=false)=>{
    const profile=await read('user_profile');
    if(profile||!allowAbsent)assertActiveAccount(owner,profile);
    return profile;
  };
  const record=(entity,input)=>{
    if(input.user_id!==undefined&&input.user_id!==owner)fail('FORGED_OWNER',403);
    const validated=validateDomainRecord(entity,{...input,user_id:owner});
    // SDK updates merge. Explicit nulls are essential to clear optional fields.
    return Object.fromEntries(FIELDS[entity].map(k=>[k,validated[k]??null]));
  };
  const verify=async(entity,expected,query={})=>{
    const saved=await read(entity,query);
    if(!saved?.id||!identical(entity,saved,expected))fail('ONBOARDING_READBACK_CONFLICT');
    return saved;
  };
  const upsert=async(entity,expected,key,authority,{omitStatus=false}={})=>{
    assertProtectedRecordMutationAllowed(entity,'create',authority);
    const data={...expected};if(omitStatus)delete data.account_status;
    try {await store[physicalName(entity)].upsert([data],{key});}
    catch {fail('ONBOARDING_WRITE_UNCONFIRMED',503);} // Unknown outcome: retry reads durable state, never assume rollback.
  };
  const savePreferences=async input=>{
    await active(true);
    const before=await read('user_preferences');
    const expected=record('user_preferences',{
      ...input,timezone:resolveTimezone(input.timezone,before?.timezone),
      notifications_enabled:before?.notifications_enabled??false,notification_time:'06:00',
    });
    if(before&&identical('user_preferences',before,expected))return before;
    if(before){
      assertProtectedRecordMutationAllowed('user_preferences','update',S.PROFILE);
      await active(true);
      try {await store.UserPreferences.updateMany({id:before.id,user_id:owner,updated_date:before.updated_at},{$set:expected});}
      catch{fail('ONBOARDING_WRITE_UNCONFIRMED',503);}
    }else await upsert('user_preferences',expected,'user_id',S.PROFILE);
    const saved=await verify('user_preferences',expected);await active(true);return saved;
  };
  const saveProfile=async input=>{
    const before=await active(true),preferences=await read('user_preferences');
    if(!preferences)fail('PREFERENCES_INITIALIZATION_REQUIRED');
    const today=serverLocalDate(now(),resolveTimezone(null,preferences.timezone));
    const expected=record('user_profile',{
      ...input,display_name:optionalName(input.display_name),birth_date:validateBirthDate(input.birth_date,today),
      birth_time:optionalBirthTime(input.birth_time),account_status:'ACTIVE',
    });
    if(before&&identical('user_profile',before,expected))return before;
    if(isOnboardingProfileReady(before,preferences,today))fail('PROFILE_ALREADY_READY'); // Onboarding is not the You editing endpoint.
    if(before){
      assertProtectedRecordMutationAllowed('user_profile','update',S.PROFILE);
      const patch={...expected};delete patch.account_status;
      // Same-row predicate prevents reactivation and lost updates where supported;
      // readback still decides success. It is not a cross-entity transaction.
      const query={id:before.id,user_id:owner,account_status:'ACTIVE',updated_date:before.updated_at};
      try {await store.UserProfile.updateMany(query,{$set:patch});}
      catch{fail('ONBOARDING_WRITE_UNCONFIRMED',503);}
    }else{
      // ACTIVE is a schema create default; never send a status update through upsert.
      await upsert('user_profile',expected,'user_id',S.PROFILE,{omitStatus:true});
    }
    const saved=await verify('user_profile',expected);assertActiveAccount(owner,saved);return saved;
  };
  const healthAllowed=async()=>{
    if(!consentVersion)fail('HEALTH_CONSENT_SOURCE_REQUIRED',503);
    await active();
    if(await read('health_data_deletion_job',{job_status:{$ne:'COMPLETED'}}))fail('HEALTH_DELETION_PENDING');
  };
  const saveCycle=async cycle=>{
    await healthAllowed();
    if(cycle.health_consent!==true)fail('CONSENT_REQUIRED',400);
    const previous=await read('user_health_consent');
    if(previous?.consent_status==='WITHDRAWN')fail('CONSENT_REGRANT_WORKFLOW_REQUIRED');
    if(previous&&previous.consent_version!==consentVersion)fail('CONSENT_VERSION_CONFLICT');
    // A timestamp persisted in current consent identifies this onboarding grant.
    // Retry/reload reuses it; action IDs and client timestamps are not authorities.
    const grant=record('user_health_consent',{consent_status:'GRANTED',consent_version:consentVersion,granted_at:previous?.granted_at||now().toISOString(),withdrawn_at:null});
    if(!previous){
      await upsert('user_health_consent',grant,'user_id',S.CONSENT);
    }
    let current=await read('user_health_consent');
    if(!current?.granted_at||current.consent_status!=='GRANTED'||current.consent_version!==consentVersion)fail('ONBOARDING_READBACK_CONFLICT');
    // First server-created consent timestamp is stable across racing upserts.
    // Do not reinterpret the platform's timezone-less timestamps as UTC.
    const created=current.created_at;
    if(typeof created!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(created)||!Number.isFinite(Date.parse(created)))fail('NATIVE_CONSENT_TIMESTAMP_REQUIRED',503);
    const granted_at=new Date(created).toISOString();
    if(current.granted_at!==granted_at){
      assertProtectedRecordMutationAllowed('user_health_consent','update',S.CONSENT);
      try {await store.UserHealthConsent.updateMany({id:current.id,user_id:owner,consent_status:'GRANTED',consent_version:consentVersion},{$set:{granted_at}});}
      catch{fail('ONBOARDING_WRITE_UNCONFIRMED',503);}
      current=await read('user_health_consent');
      if(current?.granted_at!==granted_at)fail('ONBOARDING_READBACK_CONFLICT');
    }
    await healthAllowed();
    const event=record('user_health_consent_event',{event_type:'GRANTED',consent_version:consentVersion,occurred_at:current.granted_at});
    const eventKey={event_type:event.event_type,consent_version:event.consent_version,occurred_at:event.occurred_at};
    const existingEvent=await read('user_health_consent_event',eventKey);
    if(existingEvent){if(!identical('user_health_consent_event',existingEvent,event))fail('IMMUTABLE_RECORD');}
    else {
      // Every immutable domain field is part of the natural key. A retry cannot
      // replace event content; no update/delete API is exposed for events.
      // Native system timestamp behavior still requires live verification.
      await upsert('user_health_consent_event',event,FIELDS.user_health_consent_event,S.CONSENT);
    }
    await verify('user_health_consent_event',event,eventKey);
    const settings=record('user_cycle_settings',{period_duration_days:cycle.period_duration_days,initial_cycle_length_days:cycle.initial_cycle_length_days});
    if(cycle.period_duration_days!=null||cycle.initial_cycle_length_days!=null){
      await healthAllowed();await upsert('user_cycle_settings',settings,'user_id',S.CYCLE);await verify('user_cycle_settings',settings);
    }
    // Period is the final completion evidence. Partial grants/settings never
    // cause the route resolver to claim that the cycle step completed.
    const existingPeriod=await read('user_period_record');
    const period=record('user_period_record',{period_start_date:cycle.period_start_date});
    if(existingPeriod&&!identical('user_period_record',existingPeriod,period))fail('ONBOARDING_ALREADY_SAVED');
    if(!existingPeriod){await healthAllowed();await upsert('user_period_record',period,['user_id','period_start_date'],S.CYCLE);}
    await verify('user_period_record',period);
    await healthAllowed();
    return {consent:current};
  };
  return {kind:PRODUCTION_ONBOARDING_ADAPTER.strategy,read,saveProfile,savePreferences,saveCycle};
}
