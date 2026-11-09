import { sanitizeGeoNamesDiagnostic } from '../../base44/shared/geonamesDiagnostics.js';
import { healthReadDiagnostic } from '../../base44/shared/healthReadDiagnostics.js';
import { base44 } from '@/api/base44Client';
import { ONBOARDING_ERROR_KEYS } from '@/foundation/i18n/onboardingCopy';
import { ONBOARDING_DEPENDENCIES } from '../../base44/shared/onboardingDependencies.js';
import { OnboardingError } from '../../base44/shared/onboardingValidation.js';
// UI advancement requires the operation's explicit readback envelope. A fulfilled
// invocation or arbitrary state string is not a successful save.
export function assertOnboardingProgress(action, payload, result) {
  if (result?.state === 'INACTIVE_ACCOUNT') return;
  const valid = action === 'saveProfile'
    ? result?.persisted === true && typeof result.profile?.id === 'string' && result.profile.birth_date === payload.birth_date && ['AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP'].includes(result.state)
    : ['FIRST_SHINKA_DEPENDENCY','ACTIVE_EXISTING_USER'].includes(result?.state) && result.persisted === (action === 'saveCycle' && !!payload.period_start_date);
  if (!valid) throw new OnboardingError('ONBOARDING_READBACK_CONFLICT');
}
// Read failures and unknown envelopes are never a "new user" decision.
export function assertOnboardingSnapshot(value) {
  const states = ['AUTHENTICATED_NAME_REQUIRED','AUTHENTICATED_PROFILE_REQUIRED','AUTHENTICATED_CYCLE_STEP','FIRST_SHINKA_DEPENDENCY','ACTIVE_EXISTING_USER','INACTIVE_ACCOUNT'];
  if (!states.includes(value?.state) || (value.state === 'AUTHENTICATED_NAME_REQUIRED' && value.profile != null)) throw new OnboardingError('ONBOARDING_READBACK_CONFLICT');
  return value;
}
export const isOnboardingPrivacyRestriction = code => ['ACCOUNT_DELETION_IN_PROGRESS','HEALTH_DELETION_PENDING','CONSENT_REGRANT_WORKFLOW_REQUIRED'].includes(code);
const SAFE_CODES=new Set(['MAINTENANCE_WRITE_PAUSED',...ONBOARDING_ERROR_KEYS,...Object.values(ONBOARDING_DEPENDENCIES),'TIMEZONE_INITIALIZATION_REQUIRED','PREFERENCES_INITIALIZATION_REQUIRED','AUTH_REQUIRED','ACCOUNT_DELETION_IN_PROGRESS','HEALTH_DELETION_PENDING','CONSENT_REGRANT_WORKFLOW_REQUIRED','DUPLICATE_OWNER_STATE','ACTION_CONFLICT','ONBOARDING_ALREADY_SAVED','ONBOARDING_WRITE_UNCONFIRMED','ONBOARDING_READBACK_CONFLICT','SUN_SIGN_RULE_REQUIRED','HEALTH_CONSENT_SOURCE_REQUIRED','CONSENT_TIMESTAMP_INVALID','CONSENT_VERSION_CONFLICT','IMMUTABLE_RECORD','ONBOARDING_BUSY']);
/** @param {{functions:{invoke:(name:string,payload:object)=>Promise<{data:any}>}}} client */
export async function onboardingRequest(action,payload={},client=base44) {
  let timer;
  try {
    const response=await Promise.race([client.functions.invoke('onboarding',{...payload,action}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('TIMEOUT'),{code:'TIMEOUT'})),15000);})]);
    if(response.data?.error_code)throw {response:{data:response.data}};
    return response.data;
  }catch(error){
    const data=error?.response?.data;
    const code=SAFE_CODES.has(data?.error_code)?data.error_code:'ONBOARDING_OPERATION_FAILED';
    const field=['display_name','birth_date','birth_time','birthplace','period_start_date','period_duration_days','initial_cycle_length_days','health_consent'].includes(data?.field)?data.field:null;
    const retry = error?.response?.data?.retry_after_seconds;
    const retryAfterSeconds = Number.isInteger(retry) && retry > 0 && retry <= 172800 ? retry : null;
    throw Object.assign(new Error(code),{code,field,retryAfterSeconds,diagnostic:sanitizeGeoNamesDiagnostic(data?.diagnostic) || healthReadDiagnostic(error)});
  }finally{clearTimeout(timer);}
}
