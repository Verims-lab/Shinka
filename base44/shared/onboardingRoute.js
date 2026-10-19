import { SUN_SIGN_CODES } from './domainSchemas.js';
import { ageOnDate, isCalendarDate } from './onboardingValidation.js';
export const ONBOARDING_STATES=Object.freeze(['UNAUTHENTICATED_INTRO','UNAUTHENTICATED_NAME','UNAUTHENTICATED_SIGN_IN','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP','FIRST_SHINKA_DEPENDENCY','ACTIVE_EXISTING_USER','INACTIVE_ACCOUNT']);
export function resolveOnboardingState({authenticated=false,entry='intro',profile=null,preferences=null,hasHealthData=false,hasDailyMessage=false,cycleStepConfirmed=false,today=null}) {
  if(!authenticated)return entry==='name'?'UNAUTHENTICATED_NAME':entry==='signIn'?'UNAUTHENTICATED_SIGN_IN':'UNAUTHENTICATED_INTRO';
  if(profile?.account_status==='INACTIVE')return 'INACTIVE_ACCOUNT';
  const usable=profile?.account_status==='ACTIVE'&&isCalendarDate(profile.birth_date)&&(!today||ageOnDate(profile.birth_date,today)>=18)&&preferences;
  if(!usable)return 'AUTHENTICATED_PROFILE_REQUIRED';
  if(hasDailyMessage&&SUN_SIGN_CODES.includes(profile.sun_sign_code))return 'ACTIVE_EXISTING_USER';
  if(hasHealthData||cycleStepConfirmed)return 'FIRST_SHINKA_DEPENDENCY';
  return 'AUTHENTICATED_CYCLE_STEP';
}
