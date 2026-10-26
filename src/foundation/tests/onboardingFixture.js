import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { placeFetch, fixtureProviderPlace } from './geonamesSearchFixture';
// Contract simulator only. Never imported by a product route, server entry or SDK client.
import { resolveSunSign } from '../../../base44/shared/sunSign.js';
import { DOMAIN_SCHEMAS, physicalName, SUN_SIGN_CODES } from '../../../base44/shared/domainSchemas.js';
import { InternalError } from '../../../base44/shared/internalAuthorization.js';
import { NOW } from './dataModelTests';
import { normalizeGeoNamesPlace } from '../../../base44/shared/onboardingValidation.js';
export const fixturePlace=fixtureProviderPlace;
export function onboardingFixture({complete=false,preferences=true,role='user',owner='ownerA'}={}) {
  const data=Object.fromEntries(Object.keys(DOMAIN_SCHEMAS).map(k=>[k,[]]));
  if(preferences)data.user_preferences.push({id:'prefA',user_id:owner,language_code:'en',timezone:'Europe/Istanbul',notifications_enabled:false,notification_time:'06:00'});
  if(complete)data.user_profile.push({id:'profileA',user_id:owner,birth_date:'1990-01-01',birth_time:null,sun_sign_code:'CAPRICORN',account_status:'ACTIVE'});
  const entities=Object.fromEntries(Object.keys(data).map(entity=>[physicalName(entity),{filter:async(query,_sort,limit)=>data[entity].filter(row=>Object.entries(query).every(([k,v])=>typeof v==='object'?row[k]!==v.$ne:row[k]===v)).slice(0,limit)}]));
  const client={auth:{me:async()=>owner?{id:owner,role}:null},asServiceRole:{entities}};
  const actions=new Map();let sequence=0,failAt=-1;
  const atomic={commitOwnerAction:async({owner,actionId,fingerprint,operations})=>{
    const key=`${owner}:${actionId}`,receipt=actions.get(key);
    if(receipt){if(receipt.fingerprint!==fingerprint)throw new InternalError('ACTION_CONFLICT',409);return {...receipt.outcome,status:'REPLAYED'};}
    const next=structuredClone(data),profile=next.user_profile.find(r=>r.user_id===owner);
    if(profile?.account_status==='INACTIVE')throw new InternalError('ACTIVE_ACCOUNT_REQUIRED',403);
    if(operations.some(o=>o.entity==='user_period_record')&&next.user_period_record.some(r=>r.user_id===owner))throw new InternalError('ONBOARDING_ALREADY_SAVED',409);
    const saved=operations.map((op,index)=>{
      if(index===failAt)throw new InternalError('SYNTHETIC_WRITE_FAILED',503);
      if(op.record.user_id!==owner)throw new InternalError('FORGED_OWNER',403);
      if(op.requirements.noOpenDeletionJob&&next.health_data_deletion_job.some(r=>r.user_id===owner&&r.job_status!=='COMPLETED'))throw new InternalError('HEALTH_DELETION_PENDING',409);
      if(op.requirements.healthConsent&&!next.user_health_consent.some(r=>r.user_id===owner&&r.consent_status==='GRANTED'))throw new InternalError('HEALTH_CONSENT_REQUIRED',403);
      const existing=op.keys.length?next[op.entity].find(r=>r.user_id===owner):null;
      if(existing){
        if(op.mode==='COMPLETE_PROFILE'&&!SUN_SIGN_CODES.includes(existing.sun_sign_code)){
          const row={...op.record,id:existing.id};next[op.entity][next[op.entity].indexOf(existing)]=row;return row;
        }
        if(Object.entries(op.record).some(([k,v])=>existing[k]!==v))throw new InternalError('ACTION_CONFLICT',409);
        return existing;
      }
      const row={...op.record,id:`fixture-${++sequence}`};next[op.entity].push(row);return row;
    });
    Object.keys(data).forEach(entity=>{data[entity]=next[entity];});
    const outcome={status:'COMMITTED',records:saved};actions.set(key,{fingerprint,outcome});return outcome;
  }};
  const calculationInputs=[];
  const dependencies={atomic,now:()=>new Date(NOW),consentVersion:'SYNTHETIC_TEST_ONLY',sunSign:async input=>{calculationInputs.push(input);return resolveSunSign(input);},geoNames:{...createGeoNamesAdapter({username:'fixture',fetcher:placeFetch}),search:async()=>({places:[normalizeGeoNamesPlace(fixturePlace)],page:0,next_page:null,limited:false}),resolve:async()=>normalizeGeoNamesPlace(fixturePlace)}};
  return {client,data,dependencies,calculationInputs,failAt:index=>{failAt=index;}};
}