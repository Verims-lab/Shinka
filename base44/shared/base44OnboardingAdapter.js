import { InternalError, assertAuthenticatedPrincipal } from './internalAuthorization.js';
import { assertOwner, assertActiveAccount, assertProtectedRecordMutationAllowed, SYSTEM_AUTHORITIES as S } from './domainSecurity.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { validateDomainRecord, normalizeDomainRead } from './domainValidation.js';
import { validateBirthDate, optionalName, optionalBirthTime, resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { isOnboardingProfileReady } from './onboardingRoute.js';
import { HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
import { createOnboardingCyclePersistence } from './onboardingCyclePersistence.js';
import { onboardingCycleGate } from './onboardingCycleGate.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from './onboardingConsent.js';

export const PRODUCTION_ONBOARDING_ADAPTER = Object.freeze({
  status:'IMPLEMENTED', strategy:'BASE44_KEYED_UPSERT_VERIFIED_READBACK',
  nativeTransaction:false, rollback:false, crossInstanceEnforcement:'LIVE_VERIFICATION_REQUIRED',
});
const fail=(code,status=409)=>{throw new InternalError(code,status);};
const FIELDS=Object.fromEntries(Object.entries(DOMAIN_SCHEMAS).map(([entity,spec])=>[entity,Object.keys(spec.properties)]));
const identical=(entity,row,expected)=>FIELDS[entity].every(k=>(row[k]??null)===(expected[k]??null));
// A real, request-scoped service-role adapter. It deliberately does NOT implement
// domainAtomic.commitOwnerAction: Base44 upsert is not a multi-entity transaction.
export function createBase44OnboardingAdapter(client,principal,{now=()=>new Date(),consentVersion=HEALTH_CONSENT_VERSION,cycleGate=onboardingCycleGate,allowReadyProfile=false}={}) {
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
    // ON-05 → ON-04 back: a ready profile may be corrected only until the first daily
    // message exists (onboarding not finished). After that, onboarding is not the You editing endpoint.
    if(!allowReadyProfile&&isOnboardingProfileReady(before,preferences,today)&&await read('user_daily_message'))fail('PROFILE_ALREADY_READY');
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
  const insert=async(entity,expected,authority)=>{
    assertProtectedRecordMutationAllowed(entity,'create',authority);
    try {await store[physicalName(entity)].create(expected);}
    catch {fail('ONBOARDING_WRITE_UNCONFIRMED',503);}
  };
  const saveCycle=createOnboardingCyclePersistence({
    owner,now,consentVersion,gate:cycleGate,read,record,verify,insert,upsert,
    identical,fields:FIELDS,healthAllowed,
  });
  const hasVerifiedCycle=async()=>{
    const consent=await read('user_health_consent');
    if(!consent||consent.consent_status==='WITHDRAWN')return false;
    const grant=validatedOnboardingGrant(consent,consentVersion);
    await healthAllowed();
    const period=await read('user_period_record');
    if(!period)return false;
    const event=await read('user_health_consent_event');
    if(!event)return false; // Partial legacy state must return to ON-05.
    await verify('user_health_consent_event',onboardingGrantEvent(grant));
    record('user_period_record',{period_start_date:period.period_start_date});
    const settings=await read('user_cycle_settings');
    if(settings)record('user_cycle_settings',{period_duration_days:settings.period_duration_days,initial_cycle_length_days:settings.initial_cycle_length_days});
    await healthAllowed();
    await verify('user_health_consent',grant);
    return true;
  };
  return {kind:PRODUCTION_ONBOARDING_ADAPTER.strategy,read,saveProfile,savePreferences,saveCycle,hasVerifiedCycle};
}