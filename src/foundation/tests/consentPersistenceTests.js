import { check, rejects, NOW } from './dataModelTests';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { createOnboardingCycleGate } from '../../../base44/shared/onboardingCycleGate.js';
import { normalizeDomainRead } from '../../../base44/shared/domainValidation.js';

const cycle = { action:'saveCycle', period_start_date:'2026-10-01', period_duration_days:null, initial_cycle_length_days:null, health_consent:true };
const later = '2026-10-20T12:00:00.000Z';
/** @param {ReturnType<typeof sdkOnboardingFixture>} f @param {Record<string, any>} [body] @param {Record<string, any>} [options] */
const call = (f, body=cycle, options={}) => onboardingOperation(f.client, body, { now:()=>new Date(NOW), cycleGate:f.cycleGate, ...options });
const writes = f => f.calls.filter(c=>['create','upsert','updateMany'].includes(c.method));
const grant = () => ({id:'saved-grant', user_id:'ownerA', consent_status:'GRANTED', consent_version:'health-consent-v1.0', granted_at:NOW, withdrawn_at:null, created_date:'2026-10-19T09:00:00.000000'});
async function ready(partial=false) {
  const f=sdkOnboardingFixture();
  await call(f,{action:'initialize',language_code:'tr',timezone:'Europe/Istanbul'});
  await call(f,{action:'saveProfile',birth_date:'1990-01-01',birth_time:null,display_name:null,birthplace_geonames_id:null});
  if(partial)f.rows.user_health_consent.push(grant());
  return f;
}
/** @type {import('./testTypes').FoundationTest[]} */
export const CONSENT_PERSISTENCE_TESTS = [
  ['P21','Native UTC/offset/zone-less/missing/invalid metadata cannot replace grant time',async()=>{
    for(const metadata of ['2020-01-01T10:00:00Z','2020-01-01T13:00:00+03:00','2020-01-01T10:00:00.123456',null,undefined,'invalid',42]) {
      const f=await ready(); f.nativeCreated(metadata);
      await call(f,cycle,{now:()=>new Date(later)});
      const row=f.rows.user_health_consent[0];
      check(row.granted_at===later&&f.rows.user_health_consent_event[0].occurred_at===later);
      check(normalizeDomainRead('user_health_consent',row).created_at===(metadata??null));
      const before=writes(f).length;
      await call(f,cycle,{now:()=>new Date('2026-10-21T12:00:00Z')});
      check(writes(f).length===before&&row.granted_at===later&&!f.rows.user_cycle_settings.length);
    }
  }],
  ['P22','Missing/invalid business grant time fails without native/device fallback or mutation',async()=>{
    for(const timestamp of [null,undefined,'invalid','2026-02-30T00:00:00Z','2026-10-19T09:00:00','2026-10-19T12:00:00+03:00',42]) {
      const f=await ready(true); f.rows.user_health_consent[0].granted_at=timestamp;
      const before=writes(f).length;
      await rejects(()=>call(f),'CONSENT_TIMESTAMP_INVALID');
      check(writes(f).length===before&&!f.rows.user_health_consent_event.length&&!f.rows.user_period_record.length);
    }
  }],
  ['P23','Consent survives event write failure/lost response and later retry uses same grant',async()=>{
    for(const after of [false,true]) {
      const f=await ready(); f.failWrite('user_health_consent_event',after);
      await rejects(()=>call(f),'ONBOARDING_WRITE_UNCONFIRMED');
      const saved={...f.rows.user_health_consent[0]};
      check(saved.granted_at===NOW&&!f.rows.user_period_record.length);
      f.fail(null); check((await call(f,{action:'hydrate'})).state==='AUTHENTICATED_CYCLE_STEP');
      await call(f,cycle,{now:()=>new Date(later)});
      check(f.rows.user_health_consent.length===1&&f.rows.user_health_consent[0].id===saved.id&&f.rows.user_health_consent[0].granted_at===saved.granted_at);
      check(f.rows.user_health_consent_event.length===1&&f.rows.user_health_consent_event[0].occurred_at===saved.granted_at&&f.rows.user_period_record.length===1);
    }
  }],
  ['P24','Period failure before/after commit is safely reconciled without duplicate event or defaults',async()=>{
    for(const after of [false,true]) {
      const f=await ready(); f.failWrite('user_period_record',after);
      await rejects(()=>call(f),'ONBOARDING_WRITE_UNCONFIRMED'); f.fail(null);
      check(f.rows.user_health_consent_event.length===1&&!f.rows.user_cycle_settings.length);
      await call(f,cycle,{now:()=>new Date(later)});
      check(f.rows.user_period_record.length===1&&f.rows.user_health_consent_event.length===1&&f.rows.user_health_consent[0].granted_at===NOW);
      check((await call(f,{action:'hydrate'})).state==='FIRST_SHINKA_DEPENDENCY');
    }
  }],
  ['P25','Conflicting consent/history/settings/period and duplicates are refused before writes',async()=>{
    /** @type {[((f: ReturnType<typeof sdkOnboardingFixture>)=>void), string][]} */
    const scenarios=[
      [f=>{f.rows.user_health_consent[0].consent_status='WITHDRAWN';},'CONSENT_REGRANT_WORKFLOW_REQUIRED'],
      [f=>{f.rows.user_health_consent[0].consent_version='other';},'CONSENT_VERSION_CONFLICT'],
      [f=>{f.rows.user_health_consent[0].withdrawn_at=NOW;},'ONBOARDING_READBACK_CONFLICT'],
      [f=>{f.rows.user_health_consent_event.push({id:'event',user_id:'ownerA',event_type:'GRANTED',consent_version:'health-consent-v1.0',occurred_at:later});},'IMMUTABLE_RECORD'],
      [f=>{f.rows.user_cycle_settings.push({id:'settings',user_id:'ownerA',period_duration_days:4,initial_cycle_length_days:null});},'ONBOARDING_ALREADY_SAVED'],
      [f=>{f.rows.user_period_record.push({id:'period',user_id:'ownerA',period_start_date:'2026-09-01'});},'ONBOARDING_ALREADY_SAVED'],
      [f=>{f.rows.user_health_consent.push({...grant(),id:'duplicate'});},'DUPLICATE_OWNER_STATE'],
    ];
    for(const [setup,code] of scenarios) {
      const f=await ready(true); setup(f); const before=JSON.stringify(f.rows),count=writes(f).length;
      await rejects(()=>call(f),code);check(JSON.stringify(f.rows)===before&&writes(f).length===count);
    }
    const orphan=await ready();orphan.rows.user_period_record.push({id:'orphan',user_id:'ownerA',period_start_date:cycle.period_start_date});
    await rejects(()=>call(orphan),'ONBOARDING_READBACK_CONFLICT');check(!orphan.rows.user_health_consent.length);
  }],
  ['P26','Withdrawal/inactive/deletion changes after event stop subsequent health writes',async()=>{
    for(const change of ['withdraw','inactive','deletion']) {
      const f=await ready(true),entity=f.client.asServiceRole.entities.UserHealthConsentEvent,original=entity.upsert;
      entity.upsert=async(records,options)=>{
        const result=await original(records,options);
        if(change==='withdraw')Object.assign(f.rows.user_health_consent[0],{consent_status:'WITHDRAWN',withdrawn_at:later});
        if(change==='inactive')f.rows.user_profile[0].account_status='INACTIVE';
        if(change==='deletion')f.rows.health_data_deletion_job.push({id:'job',user_id:'ownerA',job_status:'PENDING'});
        return result;
      };
      await rejects(()=>call(f,{...cycle,period_duration_days:4}),change==='withdraw'?'CONSENT_REGRANT_WORKFLOW_REQUIRED':change==='inactive'?'ACTIVE_ACCOUNT_REQUIRED':'HEALTH_DELETION_PENDING');
      check(!f.rows.user_period_record.length&&!f.rows.user_cycle_settings.length);
    }
  }],
  ['P27','Reload and simultaneous retries of partial consent preserve exact grant and immutable rows',async()=>{
    const f=await ready(true);
    await Promise.all(Array.from({length:8},(_,i)=>call(f,{...cycle,action_id:`retry-${i}`},{now:()=>new Date(Date.parse(later)+i*100)})));
    const count=writes(f).length; await call(f,{action:'hydrate'}); await call(f);
    check(writes(f).length===count&&f.rows.user_health_consent[0].granted_at===NOW);
    check(f.rows.user_health_consent_event.length===1&&f.rows.user_period_record.length===1&&!f.rows.user_cycle_settings.length);
  }],
  ['P28','Independent workers cannot overwrite first grant; detected insert race fails closed',async()=>{
    const f=await ready(),entity=f.client.asServiceRole.entities.UserHealthConsent,original=entity.create;
    let arrivals=0,release;const barrier=new Promise(resolve=>{release=()=>resolve(undefined);});
    entity.create=async record=>{const result=await original(record);if(++arrivals===2)release();await barrier;return result;};
    const results=await Promise.allSettled([0,1].map(i=>call(f,cycle,{cycleGate:createOnboardingCycleGate(),now:()=>new Date(Date.parse(NOW)+i*100)})));
    check(results.every(r=>r.status==='rejected'&&r.reason.code==='DUPLICATE_OWNER_STATE'));
    check(f.rows.user_health_consent.length===2&&f.rows.user_health_consent[0].granted_at===NOW);
    check(!f.rows.user_health_consent_event.length&&!f.rows.user_period_record.length);
    // Deliberately demonstrates the platform limitation, not production UNIQUE.
  }],
  ['P29','Worker coalescing is bounded, rejects differing in-flight payload and releases on failure',async()=>{
    const gate=createOnboardingCycleGate(1);let release=()=>{};
    const pending=gate.run('ownerA','same',()=>new Promise(resolve=>{release=()=>resolve(undefined);}));
    await Promise.resolve();check(gate.run('ownerA','same',()=>{throw new Error('must coalesce');})===pending);
    await rejects(()=>gate.run('ownerA','different',async()=>null),'ACTION_CONFLICT');
    await rejects(()=>gate.run('ownerB','same',async()=>null),'ONBOARDING_BUSY');
    release();await pending;
    await rejects(()=>gate.run('ownerA','same',async()=>{throw Object.assign(new Error(),{code:'EXPECTED_FAILURE'});}),'EXPECTED_FAILURE');
    check(await gate.run('ownerB','same',async()=>true));
  }],
  ['P30','Lost consent insert response resumes existing time rather than issuing a new grant',async()=>{
    const f=await ready();f.failWrite('user_health_consent',true);
    await rejects(()=>call(f),'ONBOARDING_WRITE_UNCONFIRMED');f.fail(null);
    check(!f.rows.user_health_consent_event.length&&!f.rows.user_period_record.length);
    await call(f,cycle,{now:()=>new Date(later)});
    check(f.rows.user_health_consent.length===1&&f.rows.user_health_consent[0].granted_at===NOW&&f.rows.user_health_consent_event[0].occurred_at===NOW);
  }],
  ['P31','Hydration requires grant event even with period; retry completes partial legacy state',async()=>{
    const f=await ready(true);f.rows.user_period_record.push({id:'existing-period',user_id:'ownerA',period_start_date:cycle.period_start_date});
    check((await call(f,{action:'hydrate'})).state==='AUTHENTICATED_CYCLE_STEP');
    await call(f);check(f.rows.user_period_record.length===1&&f.rows.user_period_record[0].id==='existing-period');
    check((await call(f,{action:'hydrate'})).state==='FIRST_SHINKA_DEPENDENCY');
    f.rows.user_health_consent_event[0].occurred_at=later;
    await rejects(()=>call(f,{action:'hydrate'}),'ONBOARDING_READBACK_CONFLICT');
  }],
  ['P32','Consent false, forged timestamps and Skip never create health/consent data',async()=>{
    for(const partial of [false,true]) {
      const f=await ready(partial),before=JSON.stringify(f.rows),count=writes(f).length;
      await rejects(()=>call(f,{...cycle,health_consent:false}),'CONSENT_REQUIRED');
      for(const field of ['granted_at','created_at','created_date'])await rejects(()=>call(f,{...cycle,[field]:NOW}),'INVALID_REQUEST');
      const result=await call(f,{action:'skipCycle'});
      check(!result.persisted&&result.state==='FIRST_SHINKA_DEPENDENCY'&&JSON.stringify(f.rows)===before&&writes(f).length===count);
    }
  }],
];
