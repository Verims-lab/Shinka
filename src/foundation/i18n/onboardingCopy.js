import { APPROVED_COPY } from '../uiuxTables';
import { STRINGS } from './strings';
// SRC-03 written ON-01..06 + companion. No TR translation has been approved.
const errors=['NAME_TOO_LONG','AGE_DECLARATION_REQUIRED','AUTH_PROVIDER_FAILED','DOB_REQUIRED','DATE_INVALID','DOB_FUTURE','AGE_UNDER_18','TIME_INVALID','PLACE_SELECTION_REQUIRED','GEONAMES_EMPTY','GEONAMES_UNAVAILABLE','PERIOD_START_REQUIRED','PERIOD_START_FUTURE','DAYS_INTEGER','DURATION_INVALID','DURATION_RANGE','CYCLE_LENGTH_INVALID','CYCLE_LENGTH_RANGE','CONSENT_REQUIRED'];
const en={
 intro:'A gentle guide to your daily rhythm',birthChart:'Your birth chart',begin:'Begin',nameTitle:'What should we call you?',display_name:'Name',continue:'Continue',preferNot:'Prefer not to say',signIn:'Welcome / Sign In',age:'18+',apple:STRINGS.en['auth.apple'],google:STRINGS.en['auth.google'],
 personal:'Personal Details',birth_date:'Date of birth',birth_time:'Birth time',birthplace:'Birthplace',cycle:'Your cycle, your choice',period_start_date:'Last period start date',period_duration_days:'Period duration',initial_cycle_length_days:'Cycle length',skip:'Skip for now',health_consent:'Health Data Consent',preparation:'A little moment, just for you',preparing:'We’re preparing your first Shinka insight',retry:STRINGS.en['state.retry'],saveError:APPROVED_COPY.you[0],systemError:APPROVED_COPY.you[6],inactive:APPROVED_COPY.you[15],terms:'Terms of Service',
 ...Object.fromEntries(errors.map((key,index)=>[key,APPROVED_COPY.onboarding[index]])),
};
export const ONBOARDING_COPY=Object.freeze({en:Object.freeze(en),tr:Object.freeze(Object.fromEntries(Object.keys(en).map(key=>[key,null])))});
export const ONBOARDING_COPY_STATUS=Object.freeze({en:'APPROVED_SOURCE',tr:'SOURCE_COPY_GAP'});
export const onboardingCopy=(key,language)=>ONBOARDING_COPY[language]?.[key]??'SOURCE_COPY_GAP';
export const ONBOARDING_ERROR_KEYS=Object.freeze(errors);
