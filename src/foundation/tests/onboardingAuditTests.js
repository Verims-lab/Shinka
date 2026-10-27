// 035 audit: real handler/adapter and state controller, synthetic SDK/provider IO only.
import { check, rejects, NOW, dailyFixture } from './dataModelTests';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { createBirthplaceSearch } from '@/features/profile/birthplaceSearch';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { placeFetch, KAN_CANDIDATES } from './geonamesSearchFixture';
import { BIRTHPLACE_FIELDS } from '../../../base44/shared/onboardingValidation.js';
export const auditProfile = {birth_date:'1990-01-01',birth_time:null,display_name:'Ada',birthplace_geonames_id:null};
export const auditCycle = {period_start_date:'2026-10-01',period_duration_days:null,initial_cycle_length_days:null,health_consent:true};
export async function auditBackend(owner='ownerA') {
  const f=sdkOnboardingFixture({owner}), geoNames=createGeoNamesAdapter({username:'fixture',fetcher:placeFetch});
  const request=(action,payload={})=>onboardingOperation(f.client,{...payload,action},{now:()=>new Date(NOW),cycleGate:f.cycleGate,geoNames});
  await request('initialize',{language_code:'en',timezone:'Europe/Istanbul'});
  return {...f,request};
}
const writes=f=>f.calls.filter(c=>['create','upsert','updateMany'].includes(c.method));
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_AUDIT_TESTS=[
 ['OA01','Rejection helper fails on successful work and wrong codes; awaited async rejection is observed',async()=>{
  await rejects(()=>rejects(async()=>{},'EXPECTED'));
  await rejects(()=>rejects(async()=>{throw {code:'WRONG'};},'EXPECTED'));
  await rejects(async()=>{await Promise.resolve();throw {code:'EXPECTED'};},'EXPECTED');
 }],
 ['OA02','Completed owner cannot mutate profile or add cycle/consent through onboarding, even with a damaged profile',async()=>{
  for(const damaged of [false,true])for(const action of ['saveCycle','saveProfile']){
   const f=await auditBackend();await f.request('saveProfile',auditProfile);
   f.rows.user_daily_message.push({id:'completed-day',...dailyFixture()});
   if(damaged)f.rows.user_profile[0].sun_sign_code=null;
   const before=JSON.stringify(f.rows),count=writes(f).length;
   await rejects(()=>f.request(action,action==='saveProfile'?{...auditProfile,display_name:'Forbidden'}:auditCycle),'ONBOARDING_ALREADY_SAVED');
   check(JSON.stringify(f.rows)===before&&writes(f).length===count,'completed onboarding wrote data');
  }
 }],
 ['OA03','Unfinished profile correction re-resolves all five place fields and preserves cycle history; reload uses durable state',async()=>{
  const f=await auditBackend();await f.request('saveProfile',auditProfile);
  check((await f.request('hydrate')).state==='AUTHENTICATED_CYCLE_STEP');
  const saved=await f.request('saveProfile',{...auditProfile,birth_date:'1991-04-20',birthplace_geonames_id:9001});
  check(saved.persisted&&saved.profile.sun_sign_code==='TAURUS'&&saved.profile.birth_time===null);
  const raw=KAN_CANDIDATES[0],expected=[raw.geonameId,raw.name,raw.countryCode,Number(raw.lat),Number(raw.lng)];
  check(BIRTHPLACE_FIELDS.every((k,i)=>saved.profile[k]===expected[i]));
  await f.request('saveCycle',auditCycle);const health=JSON.stringify([f.rows.user_period_record,f.rows.user_health_consent,f.rows.user_health_consent_event]);
  await f.request('skipCycle');check(JSON.stringify([f.rows.user_period_record,f.rows.user_health_consent,f.rows.user_health_consent_event])===health);
  check((await f.request('hydrate')).state==='FIRST_SHINKA_DEPENDENCY');
 }],
 ['OA04','Empty filtered first page retains failed next-page retry and deduplicates append; short retry makes no request',async()=>{
  const calls=[];let fail=true,flush=()=>{};
  const search=createBirthplaceSearch({timers:{set:fn=>{flush=fn;return 1;},clear:()=>{}},request:async(_a,p)=>{
   calls.push(p.page);if(p.page===0)return {places:[],next_page:1};
   if(fail)throw {code:'GEONAMES_RATE_LIMITED'};
   return {places:[{birthplace_geonames_id:1},{birthplace_geonames_id:1}],next_page:null};
  }});
  search.setQuery('Kan');flush();await Promise.resolve();await Promise.resolve();
  await search.more();check(search.getSnapshot().error==='GEONAMES_RATE_LIMITED');
  fail=false;await search.retry();check(calls.join()==='0,1,1'&&search.getSnapshot().results.length===1,'retry restarted at page zero');
  search.setQuery('Ka');await search.retry();check(calls.length===3,'short retry bypassed minimum length');search.dispose();
 }],
 ['OA05','UI step claims and legacy list actions cannot bypass persisted profile/owner; empty Skip has no writes',async()=>{
  const f=await auditBackend(),before=JSON.stringify(f.rows);
  await rejects(()=>f.request('skipCycle',auditCycle),'INVALID_REQUEST');
  await rejects(()=>f.request('skipCycle'),'ACTIVE_ACCOUNT_REQUIRED');
  await rejects(()=>f.request('saveCycle',auditCycle),'ACTIVE_ACCOUNT_REQUIRED');
  await rejects(()=>f.request('saveProfile',{...auditProfile,state:'AUTHENTICATED_CYCLE_STEP'}),'INVALID_REQUEST');
  for(const action of ['listPlaceCountries','listPlaceRegions','listPlaceSettlements'])await rejects(()=>f.request(action),'INVALID_REQUEST');
  check(JSON.stringify(f.rows)===before,'unverified route wrote data');
  await f.request('saveProfile',auditProfile);const count=writes(f).length;const skip=await f.request('skipCycle');
  check(skip.state==='FIRST_SHINKA_DEPENDENCY'&&skip.persisted===false&&writes(f).length===count);
  check((await f.request('hydrate')).state==='AUTHENTICATED_CYCLE_STEP','Skip became undocumented durable progress');
 }],
];
