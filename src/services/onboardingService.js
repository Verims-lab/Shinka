import { base44 } from '@/api/base44Client';
import { ONBOARDING_ERROR_KEYS } from '@/foundation/i18n/onboardingCopy';
import { ONBOARDING_DEPENDENCIES } from '../../base44/shared/onboardingDependencies.js';
const SAFE_CODES=new Set(['MAINTENANCE_WRITE_PAUSED',...ONBOARDING_ERROR_KEYS,...Object.values(ONBOARDING_DEPENDENCIES),'TIMEZONE_INITIALIZATION_REQUIRED','PREFERENCES_INITIALIZATION_REQUIRED','AUTH_REQUIRED','HEALTH_DELETION_PENDING','CONSENT_REGRANT_WORKFLOW_REQUIRED','DUPLICATE_OWNER_STATE','ACTION_CONFLICT','ONBOARDING_ALREADY_SAVED','ONBOARDING_WRITE_UNCONFIRMED','ONBOARDING_READBACK_CONFLICT','SUN_SIGN_RULE_REQUIRED','HEALTH_CONSENT_SOURCE_REQUIRED','CONSENT_TIMESTAMP_INVALID','CONSENT_VERSION_CONFLICT','IMMUTABLE_RECORD','ONBOARDING_BUSY']);
/** @param {{functions:{invoke:(name:string,payload:object)=>Promise<{data:any}>}}} client */
export async function onboardingRequest(action,payload={},client=base44) {
  let timer;
  try {
    const response=await Promise.race([client.functions.invoke('onboarding',{...payload,action}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),15000);})]);
    if(response.data?.error_code)throw {response:{data:response.data}};
    return response.data;
  }catch(error){
    const data=error?.response?.data;
    const code=SAFE_CODES.has(data?.error_code)?data.error_code:'ONBOARDING_OPERATION_FAILED';
    const field=['display_name','birth_date','birth_time','birthplace','period_start_date','period_duration_days','initial_cycle_length_days','health_consent'].includes(data?.field)?data.field:null;
    throw Object.assign(new Error(code),{code,field});
  }finally{clearTimeout(timer);}
}