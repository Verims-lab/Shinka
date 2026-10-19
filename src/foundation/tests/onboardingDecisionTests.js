import { check, rejects, NOW } from './dataModelTests';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { fixturePlace } from './onboardingFixture';
import { resolveSunSign } from '../../../base44/shared/sunSign.js';
import { DOMAIN_SCHEMAS, SUN_SIGN_CODES } from '../../../base44/shared/domainSchemas.js';
import { ONBOARDING_DECISION_STATUS, HEALTH_CONSENT_VERSION } from '../../../base44/shared/onboardingDependencies.js';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { resolveOnboardingState, isOnboardingProfileReady } from '../../../base44/shared/onboardingRoute.js';
import { normalizeGeoNamesPlace } from '../../../base44/shared/onboardingValidation.js';
import { ONBOARDING_COPY, ONBOARDING_COPY_STATUS } from '../i18n/onboardingCopy';
import { inspectOnboardingSurface } from '../inspection/onboardingRules';
import receipt from './onboardingCopyReceipt.json';
// Independent expected dates transcribed from the approved decision, not the resolver table.
const boundaries=[
 ['CAPRICORN','12-22','01-19'],['AQUARIUS','01-20','02-18'],['PISCES','02-19','03-20'],
 ['ARIES','03-21','04-19'],['TAURUS','04-20','05-20'],['GEMINI','05-21','06-20'],
 ['CANCER','06-21','07-22'],['LEO','07-23','08-22'],['VIRGO','08-23','09-22'],
 ['LIBRA','09-23','10-22'],['SCORPIO','10-23','11-21'],['SAGITTARIUS','11-22','12-21'],
];
const shifted=(date,delta)=>{const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+delta);return value.toISOString().slice(0,10);};
const call=(f,body,dependencies={})=>onboardingOperation(f.client,body,{now:()=>new Date(NOW),cycleGate:f.cycleGate,...dependencies});
const profile={action:'saveProfile',birth_date:'1990-01-01',birth_time:null,display_name:null,birthplace_geonames_id:null};
const cycle={action:'saveCycle',period_start_date:'2026-10-01',period_duration_days:null,initial_cycle_length_days:null,health_consent:true};
async function fresh(){const f=sdkOnboardingFixture();await call(f,{action:'initialize',language_code:'tr',timezone:'Europe/Istanbul'});return f;}
async function ready(){const f=await fresh();await call(f,profile);return f;}
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_DECISION_TESTS=[
 ...boundaries.map(([code,start,end],i)=>/** @type {import('./testTypes').FoundationTest} */([
   `C${String(i+1).padStart(2,'0')}`,`${code}: first/last day and adjacent boundaries`,()=>{
     check(resolveSunSign(`2000-${start}`)===code&&resolveSunSign(`2000-${end}`)===code);
     check(resolveSunSign(shifted(`2000-${start}`,-1))===boundaries[(i+11)%12][0]);
     check(resolveSunSign(shifted(`2000-${end}`,1))===boundaries[(i+1)%12][0]);
   },
 ])),
 ['C13','Leap dates valid; invalid dates rejected before backend Sun invocation',async()=>{
   check(resolveSunSign('2000-02-29')==='PISCES'&&resolveSunSign('2004-02-29')==='PISCES');
   for(const date of ['1900-02-29','2001-02-29','2000-04-31','0000-01-01','not-date','2000-02-29T00:00:00Z'])await rejects(()=>resolveSunSign(date),'DATE_INVALID');
   const f=await fresh();let invocations=0;await rejects(()=>call(f,{...profile,birth_date:'2001-02-29'},{sunSign:()=>{invocations++;return 'ARIES';}}),'DATE_INVALID');check(invocations===0&&!f.rows.user_profile.length);
 }],
 ['C14','Only birth_date reaches resolver; optional time/place never change Sun',async()=>{
   for(const birth_time of [null,'00:00','23:59'])for(const place of [null,123]){
     const f=await fresh(),inputs=[];
     const result=await call(f,{...profile,birth_time,birthplace_geonames_id:place},{sunSign:value=>{inputs.push(value);return resolveSunSign(value);},geoNames:{resolve:async()=>normalizeGeoNamesPlace(fixturePlace)}});
     check(inputs.length===1&&inputs[0]===profile.birth_date&&result.profile.sun_sign_code==='CAPRICORN');
     check(result.profile.birth_time===birth_time&&result.state==='AUTHENTICATED_CYCLE_STEP');
   }
 }],
 ['C15','Every day of leap year deterministically yields one of exactly 12 signs',()=>{
   const seen=new Set();for(let day=0;day<366;day++){const date=shifted('2000-01-01',day),code=resolveSunSign(date);check(code===resolveSunSign(date)&&SUN_SIGN_CODES.includes(String(code))&&code!=='UNCERTAIN');seen.add(code);}check(seen.size===12);
 }],
 ['C16','Profile readiness requires adult valid domain data and derived Sun',async()=>{
   const f=await ready(),p=f.rows.user_profile[0],prefs=f.rows.user_preferences[0],today='2026-10-19';check(isOnboardingProfileReady(p,prefs,today));
   for(const patch of [{sun_sign_code:null},{sun_sign_code:'ARIES'},{birth_date:'2009-01-01'},{birth_time:'25:00'},{birthplace_name:'partial'},{...normalizeGeoNamesPlace(fixturePlace),birthplace_geonames_id:0},{account_status:'INACTIVE'}])check(!isOnboardingProfileReady({...p,...patch},prefs,today));
   f.rows.user_profile[0].sun_sign_code=null;check((await call(f,{action:'hydrate'})).state==='AUTHENTICATED_PROFILE_REQUIRED');
   await call(f,profile);check(f.rows.user_profile.length===1&&(await call(f,{action:'hydrate'})).state==='AUTHENTICATED_CYCLE_STEP');
 }],
 ['C17','Approved production consent version persists once across taps and retries',async()=>{
   const f=await ready();await Promise.all(Array.from({length:8},(_,i)=>call(f,{...cycle,period_duration_days:4},{now:()=>new Date(Date.parse(NOW)+i*100)})));
   await call(f,{action:'hydrate'});await call(f,{...cycle,period_duration_days:4,action_id:'new-page'});
   for(const entity of ['user_health_consent','user_health_consent_event','user_cycle_settings','user_period_record'])check(f.rows[entity].length===1);
   check(f.rows.user_health_consent[0].consent_version==='health-consent-v1.0'&&f.rows.user_health_consent_event[0].consent_version===HEALTH_CONSENT_VERSION);
   check(f.rows.user_cycle_settings[0].initial_cycle_length_days===null&&(await call(f,{action:'hydrate'})).state==='FIRST_SHINKA_DEPENDENCY');
   const g=await ready();await call(g,{...cycle,initial_cycle_length_days:30});check(g.rows.user_cycle_settings[0].period_duration_days===null);
 }],
 ['C18','Skip restart safely resumes cycle; only actual owner daily record completes',async()=>{
   const f=await ready();check((await call(f,{action:'skipCycle'})).state==='FIRST_SHINKA_DEPENDENCY');check((await call(f,{action:'hydrate'})).state==='AUTHENTICATED_CYCLE_STEP');
   await call(f,{...cycle,period_start_date:null,health_consent:true});for(const e of ['user_health_consent','user_health_consent_event','user_cycle_settings','user_period_record','user_daily_message'])check(!f.rows[e].length);
   await rejects(()=>call(f,{action:'hydrate',cycleStepConfirmed:true}),'INVALID_REQUEST');
   // Existing daily data is injected only into isolated test transport. Never generate product content.
   f.rows.user_daily_message.push({id:'other-test-record',user_id:'ownerB'});check((await call(f,{action:'hydrate'})).state==='AUTHENTICATED_CYCLE_STEP');
   f.rows.user_daily_message.push({id:'existing-owner-test-record',user_id:'ownerA'});const hydrated=await call(f,{action:'hydrate'});check(hydrated.state==='ACTIVE_EXISTING_USER'&&hydrated.completionReady);
   f.rows.user_profile[0].account_status='INACTIVE';check((await call(f,{action:'hydrate'})).state==='INACTIVE_ACCOUNT');
   check(!f.calls.some(c=>c.entity==='user_daily_message'&&['upsert','updateMany'].includes(c.method)));
 }],
 ['C19','Approved EN/TR copy matches independent request receipt with full parity',()=>{
   check(Object.keys(ONBOARDING_COPY.en).sort().join()===Object.keys(ONBOARDING_COPY.tr).sort().join());check(Object.values(ONBOARDING_COPY.tr).every(v=>typeof v==='string'&&v.length>0&&!v.includes('PENDING_COPY_REVIEW')));
   for(const pair of receipt.mappings){
     // Retain the existing short-copy range punctuation, as explicitly requested.
     const en=pair.en.replace('supported range (15-60)','supported range(15-60)');const key=Object.keys(ONBOARDING_COPY.en).find(k=>ONBOARDING_COPY.en[k]===en);check(key&&ONBOARDING_COPY.tr[key]===pair.tr,`approved copy mismatch: ${pair.en}`);
   }
   check(ONBOARDING_COPY_STATUS.tr==='APPROVED_PRODUCT_COPY'&&ONBOARDING_COPY.tr.terms==='Terms of Service');
   check(!inspectOnboardingSurface({'/src/features/onboarding/fixture.jsx':`const x=<p>${ONBOARDING_COPY.tr.intro}</p>;`},Object.values(ONBOARDING_COPY.tr)).ok);
 }],
 ['C20','Four decisions resolved without new product entity, flag or completion authority',()=>{
   check(Object.keys(ONBOARDING_DECISION_STATUS).length===4&&Object.values(ONBOARDING_DECISION_STATUS).every(v=>v==='RESOLVED_BY_PRODUCT_DECISION'));
   check(Object.keys(DOMAIN_SCHEMAS).length===20&&!Object.keys(DOMAIN_SCHEMAS).some(k=>k.includes('onboarding')));
   check(!Object.values(DOMAIN_SCHEMAS).some(s=>Object.keys(s.properties).some(k=>/onboarding|completion|progress/.test(k))));
   check(resolveOnboardingState({authenticated:true,cycleStepConfirmed:true})==='AUTHENTICATED_PROFILE_REQUIRED');
 }],
 ['C21','Approved default consent is still explicit and never accepts client version/owner',async()=>{
   const f=await ready();for(const health_consent of [false,null,'true'])await rejects(()=>call(f,{...cycle,health_consent}),'CONSENT_REQUIRED');
   await rejects(()=>call(f,{...cycle,consent_version:'latest'}),'INVALID_REQUEST');await rejects(()=>call(f,{...cycle,user_id:'ownerB'}),'FORGED_OWNER');check(!f.rows.user_health_consent.length&&!f.rows.user_period_record.length);
   await call(f,cycle);check(!f.rows.user_cycle_settings.length&&f.rows.user_health_consent_event.length===1);
 }],
];
