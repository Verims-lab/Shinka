import { InternalError } from './internalAuthorization.js';
export class OnboardingError extends InternalError {
  constructor(code,field=null,status=400){super(code,status);this.field=field;}
}
const reject=(code,field)=>{throw new OnboardingError(code,field);};
export function optionalName(input) {
  if(input==null) return null;
  if(typeof input!=='string') reject('NAME_TOO_LONG','display_name');
  const value=input.trim();
  if([...value].length>50) reject('NAME_TOO_LONG','display_name');
  return value||null;
}
export function isCalendarDate(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [year,month,day]=value.split('-').map(Number);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  return year>=1&&month>=1&&month<=12&&day>=1&&day<=days[month-1];
}
export function ageOnDate(birthDate,today) {
  if(!isCalendarDate(birthDate)||!isCalendarDate(today))return null;
  return Number(today.slice(0,4))-Number(birthDate.slice(0,4))-(today.slice(5)<birthDate.slice(5)?1:0);
}
export function validateBirthDate(value,today) {
  if(value==null||value==='')reject('DOB_REQUIRED','birth_date');
  if(!isCalendarDate(value))reject('DATE_INVALID','birth_date');
  if(!isCalendarDate(today))throw new OnboardingError('SERVER_DATE_UNAVAILABLE',null,503);
  if(value>today)reject('DOB_FUTURE','birth_date');
  if(ageOnDate(value,today)<18)reject('AGE_UNDER_18','birth_date');
  return value;
}
export function optionalBirthTime(value) {
  if(value==null||value==='')return null;
  if(typeof value!=='string'||!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value))reject('TIME_INVALID','birth_time');
  return value;
}
export function validTimezone(value) {
  if(typeof value!=='string'||!value||value.length>100||/^[+-]/.test(value))return false;
  try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}
}
export function resolveTimezone(current,previous) {
  if(validTimezone(current))return current;
  if(validTimezone(previous))return previous;
  throw new OnboardingError('TIMEZONE_INITIALIZATION_REQUIRED',null,503);
}
export function serverLocalDate(now,timezone) {
  if(!validTimezone(timezone)||!Number.isFinite(now?.getTime()))throw new OnboardingError('SERVER_DATE_UNAVAILABLE',null,503);
  const parts=new Intl.DateTimeFormat('en',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=(name)=>parts.find(p=>p.type===name).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function optionalDays(value,field,min,max) {
  if(value==null||value==='')return null;
  const code=field==='period_duration_days'?'DURATION':'CYCLE_LENGTH';
  if(typeof value!=='string'&&typeof value!=='number')reject(`${code}_INVALID`,field);
  const text=String(value).trim();if(!text)return null;
  if(!/^-?\d+(?:\.\d+)?$/.test(text))reject(`${code}_INVALID`,field);
  const number=Number(text);if(!Number.isInteger(number))reject('DAYS_INTEGER',field);
  if(number<min||number>max)reject(`${code}_RANGE`,field);
  return number;
}
export function validateCycleInput(input,today) {
  const duration=optionalDays(input.period_duration_days,'period_duration_days',1,10);
  const length=optionalDays(input.initial_cycle_length_days,'initial_cycle_length_days',15,60);
  const start=input.period_start_date||null;
  if(!start&&(duration!==null||length!==null))reject('PERIOD_START_REQUIRED','period_start_date');
  if(start&&!isCalendarDate(start))reject('DATE_INVALID','period_start_date');
  if(start&&start>today)reject('PERIOD_START_FUTURE','period_start_date');
  if(start&&input.health_consent!==true)reject('CONSENT_REQUIRED','health_consent');
  return {period_start_date:start,period_duration_days:duration,initial_cycle_length_days:length,hasHealthData:start!==null};
}
export const BIRTHPLACE_FIELDS=Object.freeze(['birthplace_geonames_id','birthplace_name','birthplace_country_code','birthplace_latitude','birthplace_longitude']);
export function emptyBirthplace(){return Object.fromEntries(BIRTHPLACE_FIELDS.map(k=>[k,null]));}
export function normalizeGeoNamesPlace(raw) {
  const number=v=>typeof v==='number'?v:typeof v==='string'&&v.trim()!==''?Number(v):NaN;
  const id=number(raw?.geonameId),latitude=number(raw?.lat),longitude=number(raw?.lng);
  if(!Number.isSafeInteger(id)||id<=0||typeof raw?.name!=='string'||!raw.name.trim()||raw.name.length>200||!/^([A-Z]{2})$/.test(raw.countryCode)||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new OnboardingError('GEONAMES_INVALID_RESULT',null,502);
  return {birthplace_geonames_id:id,birthplace_name:raw.name.trim(),birthplace_country_code:raw.countryCode,birthplace_latitude:latitude,birthplace_longitude:longitude};
}
