import { youFixture, preferencesIntent } from './youFixture';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { dailyMessageRequest, safeDailyErrorCode } from '@/services/dailyMessageService';
import { check, rejects } from './dataModelTests';
import { closureFixture } from './onboardingClosureFixture';
import { auditProfile, auditCycle } from './onboardingAuditTests';
import { BIRTHPLACE_FIELDS } from '../../../base44/shared/onboardingValidation.js';
/** @type {import('./testTypes').FoundationTest[]} */
export const ONBOARDING_CLOSURE_TESTS = [
 ['OF01','Device variants/fallback and saved language precedence; initialization never replaces a saved preference',async()=>{
  for(const [locale,expected] of [['tr-TR','tr'],['TR','tr'],['en-US','en'],['en-GB','en'],['de-DE','en'],['','en'],['trash','en']])check(resolveLanguage(undefined,locale)===expected,locale);
  check(resolveLanguage('tr','en-US')==='tr'&&resolveLanguage('en','tr-TR')==='en');
  const f=await closureFixture();f.rows.user_preferences[0].language_code='tr';
  await f.request('initialize',{language_code:'en',timezone:'Europe/Istanbul'});
  check((await f.request('hydrate')).preferences.language_code==='tr','saved preference overwritten');
  const reset=youFixture();await reset.request('savePreferences',preferencesIntent(await reset.request('read'),{language_code:'en'}));
  await reset.execute(await reset.preview());
  const hydrated=await onboardingOperation(reset.client(),{action:'hydrate'},{now:reset.now});
  check(hydrated.state==='AUTHENTICATED_PROFILE_REQUIRED'&&hydrated.preferences.language_code==='en'&&resolveLanguage(hydrated.preferences.language_code,'tr-TR')==='en','reset lost saved You language');
 }],
 ['OF02','DOB alone crosses actual service/handler/native readback with NULL time/all five place fields and zero provider construction',async()=>{
  const f=await closureFixture();const result=await f.request('saveProfile',auditProfile);
  check(result.persisted&&result.state==='AUTHENTICATED_CYCLE_STEP');
  check(result.profile.birth_time===null&&BIRTHPLACE_FIELDS.every(k=>result.profile[k]===null));
  check(f.providerConstructions()===0,'optional blank read secret/provider');
  const before=JSON.stringify(f.rows);await f.request('skipCycle');check(JSON.stringify(f.rows)===before,'skip wrote');
  for(const time of ['24:00','12:60','1:','12:'])await rejects(()=>f.request('saveProfile',{...auditProfile,birth_time:time}),'TIME_INVALID');
 }],
 ['OF03','Daily service deadline is bounded/cleared, late response is not success, fresh retry reads the same persisted daily',async()=>{
  const f=await closureFixture();await f.request('saveProfile',auditProfile);await f.request('skipCycle');
  const daily=await f.daily();let expire=()=>{},release=(_value)=>{},cleared=0;
  const pending=new Promise(resolve=>{release=resolve;});
  const attempt=dailyMessageRequest({functions:{invoke:()=>pending}},{set:fn=>{expire=fn;return 1;},clear:id=>{if(id!==undefined)cleared++;}});
  const rejected=rejects(()=>attempt,'TIMEOUT');expire();await rejected;release({data:daily});await Promise.resolve();
  check(cleared===1&&(await f.daily()).daily.id===daily.daily.id&&f.rows.user_daily_message.length===1);
  await rejects(()=>dailyMessageRequest({functions:{invoke:async()=>({data:{persisted:true,state:'ACTIVE_EXISTING_USER',daily:{id:'fake'}}})}}),'DAILY_READBACK_CONFLICT');
  check(safeDailyErrorCode('private payload')==='DAILY_OPERATION_FAILED');
 }],
 ['OF04','Consent path and partial daily create response loss reconcile one immutable day without another health write',async()=>{
  const f=await closureFixture();await f.request('saveProfile',auditProfile);await f.request('saveCycle',auditCycle);
  const health=JSON.stringify([f.rows.user_health_consent,f.rows.user_health_consent_event,f.rows.user_period_record]);
  f.failWrite('user_daily_message',true);await rejects(()=>f.daily(),'DAILY_OPERATION_FAILED');
  check(f.rows.user_daily_message.length===1,'fixture did not write before losing response');
  const row=JSON.stringify(f.rows.user_daily_message[0]);f.fail(null);
  const a=await f.daily(),b=await f.daily();check(a.daily.id===b.daily.id&&JSON.stringify(f.rows.user_daily_message[0])===row&&f.rows.user_daily_message.length===1);
  check(JSON.stringify([f.rows.user_health_consent,f.rows.user_health_consent_event,f.rows.user_period_record])===health&&f.rows.user_cycle_settings.length===0);
 }],
];
