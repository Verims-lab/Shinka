import { createOnboardingCyclePersistence } from '../onboardingCyclePersistence.js';
import { validatedOnboardingGrant, onboardingGrantEvent } from '../onboardingConsent.js';
import { HEALTH_CONSENT_VERSION } from '../onboardingDependencies.js';
import { assertActiveAccount } from '../domainSecurity.js';
import { sqlFail } from './store.js';
import { DOMAIN_SCHEMAS } from '../domainSchemas.js';

// All methods execute on the caller's locked PostgreSQL transaction.
export function createSqlOnboardingPersistence(context,{now=()=>new Date()}={}) {
  const {store,actor}=context,owner=actor.user_id;
  const fields=Object.fromEntries(Object.entries(DOMAIN_SCHEMAS).map(([e,s])=>[e,Object.keys(s.properties)]));
  const read=async(entity,query={})=>{
    const rows=await store.read(entity,{...query,user_id:owner},'id',2);
    if(rows.length>1)sqlFail('DUPLICATE_OWNER_STATE');return rows[0]??null;
  };
  const record=(entity,data)=>store.record(entity,{...data,user_id:owner});
  const identical=(entity,row,want)=>fields[entity].every(k=>(row[k]??null)===(want[k]??null));
  const verify=async(entity,want)=>{
    const row=await read(entity);if(!row||!identical(entity,row,want))sqlFail('ONBOARDING_READBACK_CONFLICT');return row;
  };
  const healthAllowed=async()=>{
    assertActiveAccount(owner,await read('user_profile'));
    if(await read('health_data_deletion_job',{job_status:{$ne:'COMPLETED'}}))sqlFail('HEALTH_DELETION_PENDING');
  };
  const saveCycle=createOnboardingCyclePersistence({owner,now,consentVersion:HEALTH_CONSENT_VERSION,
    gate:{run:(_owner,_key,work)=>work()}, // Durable exclusion is the outer SQL owner lock.
    read,record,verify,identical,fields,healthAllowed,
    insert:(entity,input)=>store.insert(entity,input),
    upsert:(entity,input,key)=>store.upsert(entity,[input],{key}),
  });
  const put=async(entity,data)=>{
    const before=await read(entity),input=record(entity,data);
    if(before&&identical(entity,before,input))return before;
    return before?store.update(entity,before.id,input):store.insert(entity,input);
  };
  return {
    read,saveCycle,
    savePreferences:async data=>{
      const before=await read('user_preferences');
      return put('user_preferences',{...data,notifications_enabled:before?.notifications_enabled??false,notification_time:'06:00'});
    },
    saveProfile:data=>put('user_profile',data),
    hasVerifiedCycle:async()=>{
      const consent=await read('user_health_consent');if(!consent||consent.consent_status==='WITHDRAWN')return false;
      const grant=validatedOnboardingGrant(consent,HEALTH_CONSENT_VERSION);
      await healthAllowed();
      const period=await store.read('user_period_record',{user_id:owner},'period_start_date',1);
      if(!period.length)return false;
      const events=await store.read('user_health_consent_event',{user_id:owner,occurred_at:{$gte:grant.granted_at}},'id',2);
      const expected=onboardingGrantEvent(grant);
      if(events.length!==1||!identical('user_health_consent_event',events[0],expected))sqlFail('CONSENT_EVENT_UNCONFIRMED');
      return true;
    },
  };
}
