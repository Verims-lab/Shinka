import { DOMAIN_SCHEMAS, base44Schema, physicalName, SUN_SIGN_CODES } from '../../../base44/shared/domainSchemas.js';
import { SOURCE_FIELD_NAMES, expectedDomainFields } from '../../../base44/shared/domainSourceReceipt.js';
import { validateDomainRecord, normalizeDomainRead } from '../../../base44/shared/domainValidation.js';
import { RELATIONSHIPS } from '../../../base44/shared/domainContract.js';
import { canonicalUniqueKeys, createOnce, mutateConditionally, assertReferenceTargets } from '../../../base44/shared/domainAtomic.js';
import { SYSTEM_AUTHORITIES as S } from '../../../base44/shared/domainSecurity.js';
import { inspectProductWriteSurface } from '../inspection/domainRules';
import { loadStaticEvidence } from '../inspection/sourceScanner';
export const check = (condition,message='contract failed') => {if(!condition) throw new Error(message);};
export async function rejects(fn, code) {
  let found, caught = false;
  try { await fn(); } catch (error) { caught = true; found = error.code; }
  check(caught && (code === undefined || found === code), `expected rejection${code ? ` ${code}` : ''}; got ${caught ? found ?? 'unclassified error' : 'success'}`);
}
export const NOW='2026-10-19T09:00:00.000Z';
export const dailyFixture = (overrides={}) => ({user_id:'ownerA',shinka_date:'2026-10-19',timezone:'Europe/Istanbul',category_id:'categoryA',message_pair_id:'pairA',generated_at:NOW,...overrides});
// Isolated synchronous-map atomic simulator. No network, SDK or product row writes.
// Tests the adapter protocol and helper behavior, NOT Base44 concurrency support.
export function atomicFixture() {
  const rows=new Map(),keys=new Map();let sequence=0;
  return {rows,
    createIfAbsent:async ({entity,keys:unique,record})=>{
      const found=unique.map(k=>keys.get(k)).find(Boolean);
      if(found) return {status:'EXISTING',id:found};
      const id=`fixture${++sequence}`;rows.set(`${entity}:${id}`,{...record,id,revision:'1'});unique.forEach(k=>keys.set(k,id));return {status:'CREATED',id};
    },
    read:async(entity,id)=>rows.get(`${entity}:${id}`),
    compareAndSet:async({entity,id,revision,record})=>{const row=rows.get(`${entity}:${id}`);if(row?.revision!==revision)return {status:'CONFLICT'};rows.set(`${entity}:${id}`,{...record,id,revision:String(Number(revision)+1)});return {status:'UPDATED'};},
  };
}
/** @type {import('./testTypes').FoundationTest[]} */
export const DATA_MODEL_TESTS = [
 ['D23','Final ID-only physical schema excludes legacy text; required assignments/RLS stay intact; source inspection is not hosted proof',async()=>{
   const keys=['message_tr_snapshot','suggestion_tr_snapshot','message_en_snapshot','suggestion_en_snapshot'];
   const physical=base44Schema('user_daily_message'),domain=DOMAIN_SCHEMAS.user_daily_message;
   check(JSON.stringify(Object.keys(physical.properties).sort())===JSON.stringify(Object.keys(domain.properties).sort()));
   check(JSON.stringify(physical.required)===JSON.stringify(domain.required));
   for(const key of keys){check(!Object.hasOwn(physical.properties,key)&&!physical.required.includes(key)&&!Object.hasOwn(domain.properties,key));await rejects(()=>validateDomainRecord('user_daily_message',{...dailyFixture(),[key]:'not a new-write field'}),'INVALID_DOMAIN_RECORD');}
   check(['create','read','update','delete'].every(op=>physical.rls[op]===false)&&!Object.hasOwn(physical.properties,'id'));
   const evidence=(await loadStaticEvidence()).domain.dailyCompatibility;
   check(evidence.valid&&evidence.phase==='ID_ONLY_SCHEMA'&&evidence.cleanupVerified===false&&evidence.scope==='REPOSITORY_ONLY'&&evidence.optionalLegacyFields.length===0);
 }],

 ['D01','20 schemas match original fields plus explicit 029/045 decisions',async()=>{const evidence=(await loadStaticEvidence()).domain;check(evidence.present===20&&evidence.mismatches.length===0&&evidence.unexpected.length===0);check(Object.keys(SOURCE_FIELD_NAMES).length===20);for(const [entity,names] of Object.entries(SOURCE_FIELD_NAMES))check(JSON.stringify([...expectedDomainFields(entity,names)].sort())===JSON.stringify(Object.keys(DOMAIN_SCHEMAS[entity].properties).sort()),entity);} ],
 ['D02','One logical/physical mapping; builtin identity and tooling separate',async()=>{check((await loadStaticEvidence()).domain.testOperationPolicy);const mapped=Object.keys(DOMAIN_SCHEMAS).map(physicalName);check(new Set(mapped).size===20&&!mapped.includes('User')&&!mapped.includes('InternalHealthRun')&&!mapped.includes('AdminTestOperation'));}],
 ['D03','Required fields enforced; unsupported uniqueness properties absent',async()=>{await rejects(()=>validateDomainRecord('user_period_record',{user_id:'ownerA'}),'INVALID_DOMAIN_RECORD');for(const entity of Object.keys(DOMAIN_SCHEMAS)){const schema=base44Schema(entity);check(!Object.hasOwn(schema,'unique_fields')&&!Object.hasOwn(schema.properties,'created_at')&&!Object.hasOwn(schema.properties,'id'));}}],
 ['D04','Logical NULL stays absent on write and NULL on read; no 5/28 defaults',()=>{const row=validateDomainRecord('user_cycle_settings',{user_id:'ownerA',period_duration_days:null,initial_cycle_length_days:null});check(Object.keys(row).length===1);const read=normalizeDomainRead('user_cycle_settings',row);check(read.period_duration_days===null&&read.initial_cycle_length_days===null);} ],
 ['D05','Date is a calendar date; impossible dates and UTC conversions rejected',async()=>{for(const value of ['2026-02-30','2026-10-19T00:00:00Z'])await rejects(()=>validateDomainRecord('user_period_record',{user_id:'ownerA',period_start_date:value}),'INVALID_DOMAIN_RECORD');check(validateDomainRecord('user_period_record',{user_id:'ownerA',period_start_date:'2026-10-19'}).period_start_date==='2026-10-19');}],
 ['D06','Birthplace coherence, optional time and display name bounds',async()=>{const base={user_id:'ownerA',birth_date:'1990-01-01',birth_time:null};check(!Object.hasOwn(validateDomainRecord('user_profile',base),'birth_time'));for(const extra of [{birth_time:'24:00'},{display_name:'x'.repeat(51)},{birthplace_name:'incomplete'}])await rejects(()=>validateDomainRecord('user_profile',{...base,...extra}),'INVALID_DOMAIN_RECORD');}],
 ['D07','12 Sun codes; UNKNOWN allowed only for mapping cycle',async()=>{check(SUN_SIGN_CODES.length===12);await rejects(()=>validateDomainRecord('user_profile',{user_id:'ownerA',birth_date:'1990-01-01',sun_sign_code:'UNCERTAIN'}),'INVALID_DOMAIN_RECORD');await rejects(()=>validateDomainRecord('message_category_mapping',{sun_sign_code:'ARIES',moon_phase_code:'NEW',cycle_phase_code:'INVALID',category_id:'categoryA'}),'INVALID_DOMAIN_RECORD');check(validateDomainRecord('message_category_mapping',{sun_sign_code:'ARIES',moon_phase_code:'NEW',cycle_phase_code:'UNKNOWN',category_id:'categoryA'}).cycle_phase_code==='UNKNOWN');}],
 ['D08','Numeric ranges and cycle day relative bound reject invalid records',async()=>{for(const input of [{period_duration_days:11},{period_duration_days:1.5},{initial_cycle_length_days:14},{initial_cycle_length_days:61}])await rejects(()=>validateDomainRecord('user_cycle_settings',{user_id:'ownerA',...input}),'INVALID_DOMAIN_RECORD');await rejects(()=>validateDomainRecord('cycle_phase_lookup',{cycle_length_days:15,period_duration_days:5,cycle_day:16,phase_code:'LUTEAL'}),'INVALID_DOMAIN_RECORD');}],
 ['D09','Preferences enforce IANA timezone, fixed 06:00 and false default',async()=>{const base={user_id:'ownerA',language_code:'tr',timezone:'Europe/Istanbul'};const row=validateDomainRecord('user_preferences',base);check(row.notifications_enabled===false&&row.notification_time==='06:00');for(const extra of [{timezone:'invented/zone'},{notification_time:'07:00'},{language_code:'fr'}])await rejects(()=>validateDomainRecord('user_preferences',{...base,...extra}),'INVALID_DOMAIN_RECORD');}],
 ['D10','25 source relationships reference real fields and valid target entities',()=>{check(RELATIONSHIPS.length===25);for(const ref of RELATIONSHIPS){const [entity,field]=ref.from.split('.');check(Object.hasOwn(DOMAIN_SCHEMAS[entity].properties,field));check(ref.to==='User.id'||Object.hasOwn(DOMAIN_SCHEMAS,ref.to.split('.')[0]));}}],
 ['D11','Reference precheck rejects absent and cross-owner targets',async()=>{const row={user_id:'ownerA',reference_period_id:'periodA'};await rejects(()=>assertReferenceTargets('user_cycle_prediction',row,async()=>null),'REFERENCE_NOT_FOUND');await rejects(()=>assertReferenceTargets('user_cycle_prediction',row,async(name,id)=>name==='User'?{id}:{id,user_id:'ownerB'}),'REFERENCE_OWNER_MISMATCH');}],
 ['D12','All 11 uniqueness contracts and open deletion key are collision-safe',()=>{const contracts=Object.values(DOMAIN_SCHEMAS).reduce((n,s)=>n+s.unique.length,0);check(contracts===11);check(canonicalUniqueKeys('user_daily_message',dailyFixture()).length===1);check(canonicalUniqueKeys('health_data_deletion_job',{user_id:'ownerA',job_status:'FAILED'}).length===1);check(canonicalUniqueKeys('health_data_deletion_job',{user_id:'ownerA',job_status:'COMPLETED'}).length===0);} ],
 ['D13','Concurrent daily creates preserve the first immutable assignment',async()=>{const store=atomicFixture();const result=await Promise.all(Array.from({length:20},(_,n)=>createOnce('user_daily_message',dailyFixture({message_pair_id:`pair-${n}`}),S.DAILY_MESSAGE,store)));check(store.rows.size===1&&result.filter(r=>r.created).length===1&&new Set(result.map(r=>r.record.id)).size===1);check(result.every(r=>r.record.message_pair_id==='pair-0'));}],
 ['D14','Repeated singleton create returns same row',async()=>{const store=atomicFixture();const row={user_id:'ownerA',language_code:'en',timezone:'UTC'};const a=await createOnce('user_preferences',row,S.PROFILE,store),b=await createOnce('user_preferences',row,S.PROFILE,store);check(a.created&&!b.created&&a.record.id===b.record.id);}],
 ['D15','Unsupported atomic primitives fail closed before any write',async()=>{await rejects(()=>createOnce('user_daily_message',dailyFixture(),S.DAILY_MESSAGE,null),'ATOMIC_CAPABILITY_REQUIRED');}],
 ['D16','Conditional mutation detects stale revision and identity changes',async()=>{const store=atomicFixture();const {record}=await createOnce('user_preferences',{user_id:'ownerA',language_code:'tr',timezone:'UTC'},S.PROFILE,store);await mutateConditionally('user_preferences',record,{language_code:'en'},'1',S.PROFILE,store);await rejects(()=>mutateConditionally('user_preferences',record,{language_code:'tr'},'1',S.PROFILE,store),'WRITE_CONFLICT');await rejects(()=>mutateConditionally('user_preferences',record,{user_id:'ownerB'},'2',S.PROFILE,store),'IDENTITY_CHANGE_DENIED');}],
 ['D17','Unsafe readback cannot report idempotent success',async()=>{const store=atomicFixture();store.read=async()=>({id:'fixture1',user_id:'ownerB',shinka_date:'2026-10-19'});await rejects(()=>createOnce('user_daily_message',dailyFixture(),S.DAILY_MESSAGE,store),'ATOMIC_READBACK_CONFLICT');}],
 ['D24','GeoNames shared quota is closed internal tooling, never a product or user record',async()=>{const d=(await loadStaticEvidence()).domain;check(d.geoNamesQuotaPolicy&&d.internal===7&&d.expected===20&&d.unexpected.length===0);}],
 ['D22','Repository seed tripwire catches an injected live product writer',async()=>{check((await loadStaticEvidence()).domain.writeSurface.ok);const scan=inspectProductWriteSurface({'/src/injected.js':"client.entities.MessagePair.bulkCreate([{message_tr:'fixture'}]);"});check(!scan.ok&&scan.unexpected.length===1);}],
 ['D21','Conditional NULL update verifies actual removal, not a merge-only success',async()=>{const store=atomicFixture();const {record}=await createOnce('user_cycle_settings',{user_id:'ownerA',period_duration_days:5},S.CYCLE,store);store.compareAndSet=async()=>({status:'UPDATED'});await rejects(()=>mutateConditionally('user_cycle_settings',record,{period_duration_days:null},'1',S.CYCLE,store),'ATOMIC_READBACK_CONFLICT');}],
 ['D18','Metadata timestamps remain native and data reads remove platform emails',()=>{const row=normalizeDomainRead('user_period_record',{id:'recordA',user_id:'ownerA',period_start_date:'2026-10-19',created_date:NOW,updated_date:NOW,created_by:'private@example.test',secret:'hidden'});check(row.created_at===NOW&&row.updated_at===NOW&&!Object.hasOwn(row,'created_by')&&!Object.hasOwn(row,'secret'));}],
 ['D19','Consent and Pattern field pairs preserve state semantics',async()=>{await rejects(()=>validateDomainRecord('user_health_consent',{user_id:'ownerA',consent_status:'GRANTED',consent_version:'v1'}),'INVALID_DOMAIN_RECORD');await rejects(()=>validateDomainRecord('user_pattern_summary',{user_id:'ownerA',as_of_date:'2026-10-19',timezone:'UTC',primary_category_id:'categoryA',window_start_date:'2026-10-01',window_end_date:'2026-10-19',calculated_at:NOW}),'INVALID_DOMAIN_RECORD');}],
 ['D20','Explicit Inactive supported; unknown content states and backwards Moon intervals rejected',async()=>{await rejects(()=>validateDomainRecord('message_pair',{category_id:'categoryA',message_tr:'test',suggestion_tr:'test',message_en:'test',suggestion_en:'test',is_active:'Unknown'}),'INVALID_DOMAIN_RECORD');await rejects(()=>validateDomainRecord('moon_phase_lookup',{phase_code:'NEW',start_at_utc:NOW,end_at_utc:NOW}),'INVALID_DOMAIN_RECORD');await rejects(()=>validateDomainRecord('moon_phase_lookup',{phase_code:'NEW',start_at_utc:'2026-02-30T00:00:00Z',end_at_utc:NOW}),'INVALID_DOMAIN_RECORD');}],
];
