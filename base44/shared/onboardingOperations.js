import { readUserLifecycle, resetRoute, resetOnboardingStep } from './userLifecycle.js';
import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { resolveAuthenticatedOwner, assertOwner, assertActiveAccount, SYSTEM_AUTHORITIES as S } from './domainSecurity.js';
import { normalizeDomainRead } from './domainValidation.js';
import { physicalName, SUN_SIGN_CODES } from './domainSchemas.js';
import { createBase44OnboardingAdapter } from './base44OnboardingAdapter.js';
import { commitOwnerAction } from './domainAtomic.js';
import { resolveOnboardingState, isOnboardingProfileReady } from './onboardingRoute.js';
import { optionalName, optionalBirthTime, validateBirthDate, validateCycleInput, resolveTimezone, serverLocalDate, emptyBirthplace, validTimezone, OnboardingError } from './onboardingValidation.js';
import { SUN_SIGN_RESOLVER, HEALTH_CONSENT_VERSION } from './onboardingDependencies.js';
import { geoNamesDiagnostic } from './geonamesDiagnostics.js';
import { verifiedDailyRecord } from './dailyRecord.js';
const fail=(code,status=400)=>{throw new OnboardingError(code,null,status);};
const allowed={hydrate:[],initialize:['language_code','timezone','action_id'],saveProfile:['display_name','birth_date','birth_time','birthplace_geonames_id','action_id'],saveCycle:['period_start_date','period_duration_days','initial_cycle_length_days','health_consent','action_id'],skipCycle:[],listPlaceCountries:['language_code'],listPlaceRegions:['country','parent_id','offset','language_code'],listPlaceSettlements:['country','parent_id','offset','language_code'],searchPlaces:['query','language_code']};
// Dependencies are server configuration/injected contract fixtures, never request fields.
async function normalOnboardingOperation(client,body,dependencies={}) {
  const {atomic=null,geoNames=null,sunSign=SUN_SIGN_RESOLVER,consentVersion=HEALTH_CONSENT_VERSION,now=()=>new Date()}=dependencies;
  const principal=await requireAuthenticatedUser(client),owner=resolveAuthenticatedOwner(principal,body);
  const persistence=dependencies.persistence??(atomic?null:createBase44OnboardingAdapter(client,principal,{now,consentVersion,cycleGate:dependencies.cycleGate}));
  const fields=allowed[body.action];
  if(!fields||Object.keys(body).some(k=>!['action','user_id',...fields].includes(k)))fail('INVALID_REQUEST');
  const store=client.asServiceRole.entities;
  const rows=async(entity,limit=2,extra={})=>{
    const result=await store[physicalName(entity)].filter({user_id:owner,...extra},'-created_date',limit);
    if(!Array.isArray(result))fail('ONBOARDING_READ_FAILED',503);
    result.forEach(row=>assertOwner(principal,row));return result;
  };
  const singleton=async(entity)=>{const result=await rows(entity);if(result.length>1)fail('DUPLICATE_OWNER_STATE',409);return result[0]?normalizeDomainRead(entity,result[0]):null;};
  const profile=await singleton('user_profile');
  if(profile?.account_status==='INACTIVE')return {state:'INACTIVE_ACCOUNT'};
  if(body.action==='searchPlaces') {
    if(!geoNames)fail('GEONAMES_UNAVAILABLE',503);
    return {places:await geoNames.search(body.query,body.language_code)};
  }
  if(['listPlaceCountries','listPlaceRegions','listPlaceSettlements'].includes(body.action)) {
    if(!geoNames)fail('GEONAMES_UNAVAILABLE',503);
    if(body.action==='listPlaceCountries')return geoNames.countries(body.language_code);
    const input={country:body.country,parent_id:body.parent_id??null,offset:body.offset??0,language_code:body.language_code};
    return body.action==='listPlaceRegions'?geoNames.regions(input):geoNames.places(input);
  }
  const preferences=await singleton('user_preferences');
  const today=preferences&&validTimezone(preferences.timezone)?serverLocalDate(now(),preferences.timezone):null;
  const state=async(cycleStepConfirmed=false)=>{
    // A previous daily record is durable completion, independent of today's
    // generation/health dependencies. Avoid fetching health data for Home routing.
    const daily=profile&&!dependencies.resetFlow?await rows('user_daily_message',1):[];
    if(daily.length)verifiedDailyRecord(daily[0],owner);
    let hasHealthData=false;
    if(profile&&!dependencies.resetFlow&&!cycleStepConfirmed&&!daily.length){
      if(persistence)hasHealthData=await persistence.hasVerifiedCycle();
      else {
        const consent=await singleton('user_health_consent');
        hasHealthData=consent?.consent_status==='GRANTED'&&(await rows('user_period_record',1)).length>0;
      }
    }
    const missingDependencies=profile&&!SUN_SIGN_CODES.includes(profile.sun_sign_code)?['SUN_SIGN_RULE_REQUIRED']:[];
    const route=resolveOnboardingState({authenticated:true,profile,preferences,today,hasHealthData,hasDailyMessage:daily.length>0,cycleStepConfirmed});
    return {dependencies:missingDependencies,completionReady:route==='ACTIVE_EXISTING_USER',state:route,profile,preferences,today};
  };
  if(body.action==='hydrate')return state();
  const commit=async(writes)=>{
    // Stable canonical request excludes timestamps (retry timestamps must not fork actions).
    const canonical=JSON.stringify(Object.fromEntries(Object.keys(body).filter(k=>k!=='action_id'&&k!=='user_id').sort().map(k=>[k,body[k]])));
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical))),b=>b.toString(16).padStart(2,'0')).join('');
    return commitOwnerAction(principal,body.action_id,hash,writes,atomic);
  };
  if(body.action==='initialize') {
    if(!['en','tr'].includes(body.language_code))fail('LANGUAGE_INVALID');
    const timezone=resolveTimezone(body.timezone,preferences?.timezone);
    if(preferences&&validTimezone(preferences.timezone))return state(); // Hydration preserves established valid preferences.
    if(persistence){await persistence.savePreferences({language_code:preferences?.language_code||body.language_code,timezone});return {state:'AUTHENTICATED_PROFILE_REQUIRED',persisted:true};}
    await commit([{entity:'user_preferences',authority:S.PROFILE,record:{user_id:owner,language_code:body.language_code,timezone,notifications_enabled:false,notification_time:'06:00'}}]);
    return {state:'AUTHENTICATED_PROFILE_REQUIRED',persisted:true};
  }
  if(!preferences)fail('PREFERENCES_INITIALIZATION_REQUIRED',409);
  if(body.action==='saveProfile') {
    if(!dependencies.resetFlow&&profile&&SUN_SIGN_CODES.includes(profile.sun_sign_code)&&resolveOnboardingState({authenticated:true,profile,preferences,today})!=='AUTHENTICATED_PROFILE_REQUIRED')return {...await state(),persisted:true};
    const birth_date=validateBirthDate(body.birth_date,today),birth_time=optionalBirthTime(body.birth_time),display_name=optionalName(body.display_name);
    const sun_sign_code=typeof sunSign==='function'?await sunSign(birth_date):null;
    if(sun_sign_code!==null&&!SUN_SIGN_CODES.includes(sun_sign_code))fail('SUN_SIGN_RESOLVER_INVALID',503);
    let birthplace=emptyBirthplace();
    if(body.birthplace_geonames_id!=null) {
      if(!geoNames)fail('GEONAMES_UNAVAILABLE',503);
      birthplace=await geoNames.resolve(body.birthplace_geonames_id);
    }
    const input={display_name,birth_date,birth_time,...birthplace,sun_sign_code,account_status:'ACTIVE'};
    let saved;
    if(persistence)saved=await persistence.saveProfile(input);
    else {const result=await commit([{entity:'user_profile',authority:S.PROFILE,mode:'COMPLETE_PROFILE',record:{user_id:owner,...input}}]);saved=normalizeDomainRead('user_profile',result.records[0]);}
    return {state:isOnboardingProfileReady(saved,preferences,today)?'AUTHENTICATED_CYCLE_STEP':'AUTHENTICATED_PROFILE_REQUIRED',persisted:true,profile:saved,completionReady:false,dependencies:sun_sign_code?[]:['SUN_SIGN_RULE_REQUIRED']};
  }
  assertActiveAccount(owner,profile);
  if(resolveOnboardingState({authenticated:true,profile,preferences,today})==='AUTHENTICATED_PROFILE_REQUIRED')fail('PROFILE_COMPLETION_REQUIRED',409);
  if(body.action==='skipCycle')return {...await state(true),persisted:false};
  const cycle=validateCycleInput(body,today);
  if(!cycle.hasHealthData)return {...await state(true),persisted:false};
  if(!consentVersion)fail('HEALTH_CONSENT_SOURCE_REQUIRED',503);
  if(persistence){await persistence.saveCycle({...cycle,health_consent:body.health_consent});return {...await state(true),persisted:true};}
  const jobs=await rows('health_data_deletion_job',1,{job_status:{$ne:'COMPLETED'}});
  if(jobs.length)fail('HEALTH_DELETION_PENDING',409);
  const consent=await singleton('user_health_consent');
  // Re-consent after withdrawal belongs to its own future workflow.
  if(consent?.consent_status==='WITHDRAWN')fail('CONSENT_REGRANT_WORKFLOW_REQUIRED',409);
  if((await rows('user_period_record',1)).length)return state(true);
  const occurred_at=consent?.granted_at||now().toISOString();
  /** @type {{entity:string,authority:any,record:Record<string,any>}[]} */
  const writes=[
    {entity:'user_health_consent',authority:S.CONSENT,record:{user_id:owner,consent_status:'GRANTED',consent_version:consentVersion,granted_at:occurred_at,withdrawn_at:null}},
    {entity:'user_health_consent_event',authority:S.CONSENT,record:{user_id:owner,event_type:'GRANTED',consent_version:consentVersion,occurred_at}},
    {entity:'user_period_record',authority:S.CYCLE,record:{user_id:owner,period_start_date:cycle.period_start_date}},
  ];
  if(cycle.period_duration_days!==null||cycle.initial_cycle_length_days!==null)writes.push({entity:'user_cycle_settings',authority:S.CYCLE,record:{user_id:owner,period_duration_days:cycle.period_duration_days,initial_cycle_length_days:cycle.initial_cycle_length_days}});
  await commit(writes);
  return {...await state(true),persisted:true};
}
export async function onboardingOperation(client, body, dependencies = {}) {
  const principal = await requireAuthenticatedUser(client);
  const reset = await readUserLifecycle(client, principal.id);
  if (!reset || reset.operation !== 'RESET_ONBOARDING') return normalOnboardingOperation(client, body, dependencies);
  if (reset.status !== 'RESET_ACTIVE') fail('TEST_TARGET_BUSY', 409);
  const passive = ['hydrate', 'searchPlaces', 'listPlaceCountries', 'listPlaceRegions', 'listPlaceSettlements'];
  if (passive.includes(body.action)) {
    const result = await normalOnboardingOperation(client, body, { ...dependencies, resetFlow: true });
    if (!result.state || result.state === 'INACTIVE_ACCOUNT') return result;
    return { ...result, state: resetRoute(reset), completionReady: false };
  }
  return resetOnboardingStep({ client, reset, owner: principal.id, body, coordinator: dependencies.lifecycleCoordinator,
    perform: async context => {
      const result = await normalOnboardingOperation(client, body, { ...dependencies, ...context, resetFlow: true });
      return body.action === 'initialize' && result.state !== 'INACTIVE_ACCOUNT' ? { ...result, state: resetRoute(reset), completionReady: false } : result;
    },
  });
}
export async function handleOnboardingRequest(req,createClient,dependencies={}) {
  try {
    if(req.method!=='POST')fail('METHOD_NOT_ALLOWED',405);
    const text=await req.text();if(new TextEncoder().encode(text).length>8000)fail('REQUEST_TOO_LARGE',413);
    let body;try{body=JSON.parse(text);}catch{fail('INVALID_REQUEST');}
    if(!body||typeof body!=='object'||Array.isArray(body))fail('INVALID_REQUEST');
    return Response.json(await onboardingOperation(createClient(req),body,dependencies));
  }catch(error){
    const diagnostic=geoNamesDiagnostic(error);
    return Response.json({error_code:error instanceof InternalError?error.code:'ONBOARDING_OPERATION_FAILED',field:error instanceof OnboardingError?error.field:null,...(diagnostic?{diagnostic}:{})},{status:error instanceof InternalError?error.status:500});
  }
}
