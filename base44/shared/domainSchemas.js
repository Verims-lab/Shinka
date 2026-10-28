// SRC-05 DB v1.2 §§2–9 + SRC-07 entity sheets. Logical schemas; no product seed.
// Base44 optional fields are omitted on write and normalized to logical NULL on read.
// Native null acceptance is not asserted. Native id/created_date/updated_date are never redeclared.
export const SUN_SIGN_CODES = Object.freeze(['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES']);
export const CYCLE_PHASE_CODES = Object.freeze(['MENSTRUAL','FOLLICULAR','OVULATION','LUTEAL']);
export const MOON_PHASE_CODES = Object.freeze(['NEW','WAXING','FULL','WANING']);
const str = (extra = {}) => ({type:'string', ...extra});
const en = (values, extra = {}) => str({enum:values, ...extra});
const integer = (minimum, maximum) => ({type:'integer', ...(minimum === undefined ? {} : {minimum}), ...(maximum === undefined ? {} : {maximum})});
const date = () => str({format:'date'});
const instant = () => str({format:'date-time'});
const time = () => str({pattern:'^([01][0-9]|2[0-3]):[0-5][0-9]$'});
const id = () => str({minLength:1});
const text = () => str({minLength:1});
const owned = (fields) => ({user_id:id(), ...fields});
const schema = (properties, optional = [], unique = []) => ({properties, required:Object.keys(properties).filter(k=>!optional.includes(k)), optional, unique});

export const DOMAIN_SCHEMAS = Object.freeze({
  user_profile:schema(owned({display_name:str({maxLength:50}), birth_date:date(), birth_time:time(), birthplace_geonames_id:{type:'number'}, birthplace_name:text(), birthplace_country_code:str({minLength:2,maxLength:2}), birthplace_latitude:{type:'number',minimum:-90,maximum:90}, birthplace_longitude:{type:'number',minimum:-180,maximum:180}, sun_sign_code:en(SUN_SIGN_CODES), account_status:en(['ACTIVE','INACTIVE'],{default:'ACTIVE'})}), ['display_name','birth_time','birthplace_geonames_id','birthplace_name','birthplace_country_code','birthplace_latitude','birthplace_longitude','sun_sign_code'], [['user_id']]),
  user_preferences:schema(owned({language_code:en(['tr','en']),notifications_enabled:{type:'boolean',default:false},notification_time:{...time(),enum:['06:00'],default:'06:00'},timezone:text(),theme_code:en(['light','dark'])}), ['theme_code'], [['user_id']]),
  user_health_consent:schema(owned({consent_status:en(['GRANTED','WITHDRAWN']),consent_version:text(),granted_at:instant(),withdrawn_at:instant()}),['granted_at','withdrawn_at'],[['user_id']]),
  user_health_consent_event:schema(owned({event_type:en(['GRANTED','WITHDRAWN']),consent_version:text(),occurred_at:instant()})),
  user_cycle_settings:schema(owned({period_duration_days:integer(1,10),initial_cycle_length_days:integer(15,60)}),['period_duration_days','initial_cycle_length_days'],[['user_id']]),
  user_period_record:schema(owned({period_start_date:date()})),
  user_cycle_prediction:schema(owned({reference_period_id:id(),predicted_start_date:date(),predicted_end_date:date(),estimated_cycle_length_days:integer(1),calculated_at:instant()}),['reference_period_id']),
  user_cycle_phase_day:schema(owned({phase_date:date(),phase_code:en(CYCLE_PHASE_CODES),calculation_basis:en(['RECORDED_START','PREDICTED']),reference_period_id:id(),calculated_at:instant()}),['reference_period_id'],[['user_id','phase_date']]),
  cycle_phase_lookup:schema({cycle_length_days:integer(15,60),period_duration_days:integer(1,10),cycle_day:integer(1,60),phase_code:en(CYCLE_PHASE_CODES)},[],[['cycle_length_days','period_duration_days','cycle_day']]),
  message_category_lookup:schema({category_code:text(),display_name_tr:text(),display_name_en:text()},[],[['category_code']]),
  message_category_mapping:schema({sun_sign_code:en(SUN_SIGN_CODES),moon_phase_code:en(MOON_PHASE_CODES),cycle_phase_code:en([...CYCLE_PHASE_CODES,'UNKNOWN']),category_id:id()},[],[['sun_sign_code','moon_phase_code','cycle_phase_code']]),
  message_pair:schema({category_id:id(),message_tr:text(),suggestion_tr:text(),message_en:text(),suggestion_en:text(),is_active:en(['Active','Inactive'],{default:'Active'})}),
  user_daily_message:schema(owned({shinka_date:date(),timezone:text(),category_id:id(),message_pair_id:id(),generated_at:instant()}),[],[['user_id','shinka_date']]),
  notification_delivery:schema(owned({daily_message_id:id(),notification_type:en(['DAILY_SHINKA'],{default:'DAILY_SHINKA'}),scheduled_at:instant(),delivery_status:en(['PENDING','SENT','FAILED','SKIPPED']),attempt_count:{...integer(0),default:0},last_attempt_at:instant(),sent_at:instant(),error_code:text(),shinka_date:date(),dispatch_state:en(['READY','IN_FLIGHT','RETRYABLE','ACCEPTED','PERMANENT','UNKNOWN','INELIGIBLE']),next_attempt_at:instant(),claim_id:id(),error_stage:en(['ADMISSION','PROVIDER','PROVIDER_ACCEPTANCE'])}),['last_attempt_at','sent_at','error_code','shinka_date','dispatch_state','next_attempt_at','claim_id','error_stage'],[['daily_message_id','notification_type']]),
  user_pattern_summary:schema(owned({as_of_date:date(),timezone:text(),primary_category_id:id(),primary_count:integer(1),secondary_category_id:id(),secondary_count:integer(1),window_start_date:date(),window_end_date:date(),calculated_at:instant()}),['primary_category_id','primary_count','secondary_category_id','secondary_count'],[['user_id']]),
  moon_phase_lookup:schema({phase_code:en(MOON_PHASE_CODES),start_at_utc:instant(),end_at_utc:instant()}),
  admin_audit_log:schema({admin_user_id:id(),target_user_id:id(),target_entity:text(),target_record_id:id(),action_type:en(['VIEW','UPDATE','DELETE']),action_status:en(['SUCCESS','FAILED']),performed_at:instant(),error_code:text()},['target_user_id','target_record_id','error_code']),
  system_error_log:schema({error_code:text(),process_name:text(),severity:en(['INFO','WARNING','ERROR','CRITICAL']),error_status:en(['OPEN','RETRYING','RESOLVED']),retry_count:{...integer(0),default:0},last_retry_at:instant(),resolved_at:instant(),alert_sent_at:instant(),correlation_id:text()},['last_retry_at','resolved_at','alert_sent_at']),
  health_data_deletion_job:schema(owned({protection_event_id:id(),job_status:en(['PENDING','PROCESSING','RETRYING','COMPLETED','FAILED']),requested_at:instant(),started_at:instant(),completed_at:instant(),retry_count:{...integer(0),default:0},last_retry_at:instant(),error_code:text()}),['started_at','completed_at','last_retry_at','error_code']),
  data_protection_event:schema(owned({event_type:en(['HEALTH_DATA_DELETION','ACCOUNT_DEACTIVATION']),event_status:en(['PENDING','COMPLETED','FAILED']),requested_at:instant(),completed_at:instant()}),['completed_at']),
});

export const physicalName = (logical) => logical.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join('');
export const SHARED_ENTITIES = Object.freeze(['cycle_phase_lookup','message_category_lookup','message_category_mapping','message_pair','moon_phase_lookup']);
export const HEALTH_ENTITIES = Object.freeze(['user_cycle_settings','user_period_record','user_cycle_prediction','user_cycle_phase_day']);
export const IMMUTABLE_ENTITIES = Object.freeze(['user_daily_message','user_health_consent_event','admin_audit_log']);
export const PROTECTED_ENTITIES = Object.freeze([...IMMUTABLE_ENTITIES,'data_protection_event','health_data_deletion_job']);
export const TIMESTAMP_MAPPING = Object.freeze({created_at:'created_date',updated_at:'updated_date',status:'PARTIALLY_VERIFIED',evidence:'2026-10-19 read-only InternalHealthRun metadata: both fields present, UTC offset absent. Product update/immutability/UTC behavior remains LIVE_ENFORCEMENT_REQUIRED.'});

export function base44Schema(logical) {
  const spec=DOMAIN_SCHEMAS[logical];
  if(!spec) throw new Error('UNKNOWN_DOMAIN_ENTITY');
  return {name:physicalName(logical),type:'object',description:`Shinka ${logical}. SRC-05 v1.2 / SRC-07 v1.2. Optional absent fields mean logical NULL; native timestamps mapped under OD-004. Backend access only.`,properties:spec.properties,required:spec.required,
    // Server reads enforce ACTIVE, consent, owner and audited admin access together.
    // No direct SDK operation may bypass those predicates, including lookup reads.
    rls:{create:false,read:false,update:false,delete:false}};
}