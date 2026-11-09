import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { validateDomainRecord } from './domainValidation.js';
import { ageOnDate, isCalendarDate, validTimezone, normalizeGeoNamesPlace } from './onboardingValidation.js';
import { resolveSunSign } from './sunSign.js';
export const ONBOARDING_STATES=Object.freeze(['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_NAME_REQUIRED','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP','FIRST_SHINKA_DEPENDENCY','ACTIVE_EXISTING_USER','INACTIVE_ACCOUNT']);
export function isOnboardingProfileReady(profile,preferences,today) {
  if(profile?.account_status!=='ACTIVE'||!isCalendarDate(today)||!isCalendarDate(profile.birth_date)||ageOnDate(profile.birth_date,today)<18||!validTimezone(preferences?.timezone)||!['tr','en'].includes(preferences?.language_code))return false;
  try {
    validateDomainRecord('user_profile',Object.fromEntries(Object.keys(DOMAIN_SCHEMAS.user_profile.properties).map(k=>[k,profile[k]])));
    if(profile.birthplace_geonames_id!=null)normalizeGeoNamesPlace({geonameId:profile.birthplace_geonames_id,name:profile.birthplace_name,countryCode:profile.birthplace_country_code,lat:profile.birthplace_latitude,lng:profile.birthplace_longitude});
    return profile.sun_sign_code===resolveSunSign(profile.birth_date);
  }catch{return false;}
}
// Server-derived records are authoritative. cycleStepConfirmed is ephemeral,
// backend-confirmed progression, never a request field or durable completion flag.
export function resolveOnboardingState({authenticated=false,entry='intro',profile=null,preferences=null,hasHealthData=false,hasDailyMessage=false,cycleStepConfirmed=false,today=null}) {
  if(!authenticated)return entry==='signIn'||entry==='name'?'UNAUTHENTICATED_SIGN_IN':'UNAUTHENTICATED_INTRO';
  // A profile (including explicit NULL name) is persisted only with birth details.
  // No profile means the authenticated name/profile form has not been saved.
  if(!profile)return 'AUTHENTICATED_NAME_REQUIRED';
  if(profile?.account_status==='INACTIVE')return 'INACTIVE_ACCOUNT';
  if(!isOnboardingProfileReady(profile,preferences,today))return 'AUTHENTICATED_PROFILE_REQUIRED';
  if(hasDailyMessage)return 'ACTIVE_EXISTING_USER';
  if(hasHealthData||cycleStepConfirmed)return 'FIRST_SHINKA_DEPENDENCY';
  return 'AUTHENTICATED_CYCLE_STEP';
}
