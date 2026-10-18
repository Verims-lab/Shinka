import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { InternalError } from './internalAuthorization.js';
const invalid = () => {throw new InternalError('INVALID_DOMAIN_RECORD',400);};
export function validateDomainRecord(entity, input) {
  const spec=DOMAIN_SCHEMAS[entity];
  if(!spec || !input || typeof input!=='object' || Array.isArray(input)) invalid();
  if(Object.keys(input).some(k=>!Object.hasOwn(spec.properties,k))) invalid();
  const result={};
  for(const [key, field] of Object.entries(spec.properties)) {
    let value=input[key];
    if(value===undefined && Object.hasOwn(field,'default')) value=field.default;
    if(value===undefined || value===null) {if(spec.required.includes(key)) invalid(); continue;}
    if(field.type==='integer' ? !Number.isInteger(value) : typeof value!==field.type) invalid();
    if(typeof value==='number' && (!Number.isFinite(value) || (field.minimum!==undefined && value<field.minimum) || (field.maximum!==undefined && value>field.maximum))) invalid();
    if(typeof value==='string') {
      if(field.minLength!==undefined && value.trim().length<field.minLength || field.maxLength!==undefined && [...value].length>field.maxLength) invalid();
      if(field.pattern && !new RegExp(field.pattern).test(value)) invalid();
      if(field.format==='date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) invalid();
      if(field.format==='date-time' && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,19)!==value.slice(0,19))) invalid();
    }
    if(field.enum && !field.enum.includes(value)) invalid();
    result[key]=value;
  }
  if(result.timezone) {try {new Intl.DateTimeFormat('en',{timeZone:result.timezone});} catch {invalid();}}
  if(entity==='user_profile') {
    const birthplace=Object.keys(spec.properties).filter(k=>k.startsWith('birthplace_'));
    const present=birthplace.filter(k=>result[k]!==undefined).length;
    if(present!==0 && present!==birthplace.length) invalid();
  }
  if(entity==='user_health_consent' && !result[result.consent_status==='GRANTED'?'granted_at':'withdrawn_at']) invalid();
  if(entity==='cycle_phase_lookup' && result.cycle_day>result.cycle_length_days) invalid();
  if(entity==='moon_phase_lookup' && Date.parse(result.start_at_utc)>=Date.parse(result.end_at_utc)) invalid();
  if(entity==='user_cycle_prediction' && result.predicted_start_date>result.predicted_end_date) invalid();
  if(entity==='user_pattern_summary') {
    for(const prefix of ['primary','secondary']) if((result[`${prefix}_category_id`]===undefined)!==(result[`${prefix}_count`]===undefined)) invalid();
    if(result.secondary_category_id && !result.primary_category_id || result.window_start_date>result.window_end_date) invalid();
  }
  return result;
}
/** @returns {Record<string, any>} */
export function normalizeDomainRead(entity, row) {
  const spec=DOMAIN_SCHEMAS[entity];
  if(!spec || !row) throw new InternalError('INVALID_DOMAIN_RECORD',400);
  // Do not leak platform created_by email, internal fields, or undeclared payloads.
  return {id:row.id, ...Object.fromEntries(Object.keys(spec.properties).map(k=>[k,row[k]??null])),created_at:row.created_date??null,updated_at:row.updated_date??null};
}
