import { CONTENT_CATEGORY_DECISION } from '../../../base44/shared/contentCategoryDecision.js';
import { nativeFixture } from './nativeFixture';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { withNativeWriteChecks } from '../../../base44/shared/nativeWriteChecks.js';
import { domainAccessOperation } from '../../../base44/shared/domainAccess.js';
import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';
import { calendarOperation } from '../../../base44/shared/calendarOperation.js';
import { patternOperation } from '../../../base44/shared/patternOperation.js';
import { youOperation } from '../../../base44/shared/youOperation.js';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';

export async function measureCoreData() {
  const scenarios=[];
  const measured=f=>{
    const events=[],raw=f.raw(),base=raw.asServiceRole.entities;let auth=0;
    raw.asServiceRole.entities=new Proxy(base,{get:(store,entity)=>new Proxy(store[entity],{get:(api,method)=>{
      // The older native fixture models filter only. SDK list is an unfiltered
      // read with sort/limit/offset, so model it identically for BOTH revisions.
      const invoke=method==='list'&&!api.list?(sort,limit,offset)=>api.filter({},sort,limit,offset):api[method];
      if(typeof invoke!=='function')return invoke;
      return async(...args)=>{
        const value=await invoke(...args);
        events.push({entity,method,limit:args[method==='list'?1:2]??null,fields:args[4]??null,rows:Array.isArray(value)?value.length:null,bytes:JSON.stringify(value)?.length||0});return value;
      };
    }})});
    const me=raw.auth.me;raw.auth.me=()=>{auth++;return me();};
    return {client:withNativeWriteChecks(withUserLifecycle(raw)),events,counts:()=>({auth,provider:0,entityReads:events.filter(e=>['filter','get','list'].includes(e.method)).length,entityWrites:events.filter(e=>!['filter','get','list'].includes(e.method)).length,sdkBytes:events.reduce((n,e)=>n+e.bytes,0)})};
  };
  /** @type {[string,string,number][]} */
  const readScenarios=[['user_period_record','UserPeriodRecord',100],['user_period_record','UserPeriodRecord',101],['message_category_mapping','MessageCategoryMapping',240]];
  for(const [entity,name,count] of readScenarios) {
    const f=nativeFixture(),m=measured(f);
    f.tables[name]=Array.from({length:count},(_,i)=>({id:'row-'+String(i).padStart(4,'0'),user_id:'ownerA',period_start_date:'2026-10-01',created_date:'2026-10-01T00:00:00Z',created_by:'synthetic@example.invalid',undeclared_blob:'x'.repeat(2048)}));
    const value=await domainAccessOperation(m.client,{entity,action:'read'});
    scenarios.push({scenario:`domain-${entity}-${count}`,fixtureRows:count,...m.counts(),returned:value.records.length,truncated:value.truncated??null,responseBytes:JSON.stringify(value).length,trace:m.events});
  }
  const f=nativeFixture();
  f.tables.MessageCategoryLookup.forEach((row,i)=>{const names=CONTENT_CATEGORY_DECISION.rows[i];Object.assign(row,{category_code:names.category_code,display_name_tr:names.display_name_tr,display_name_en:names.display_name_en});});
  const dates=['2026-10-01','2026-10-08','2026-10-17','2026-10-25','2026-11-01','2026-11-09','2026-11-17','2026-11-24','2026-12-01'];
  f.tables.MoonPhaseLookup=dates.slice(0,-1).map((date,i)=>({id:`moon-${i}`,phase_code:['NEW','WAXING','FULL','WANING'][i%4],start_at_utc:`${date}T00:00:00.000Z`,end_at_utc:`${dates[i+1]}T00:00:00.000Z`}));
  /** @type {[string,(client: ReturnType<typeof withNativeWriteChecks>)=>Promise<unknown>][]} */
  const productScenarios=[
    ['home-first',client=>dailyMessageOperation(client,{action:'today',timezone:'Europe/Istanbul'},{native:true,now:f.now,library:f.library,random:()=>0})],
    ['home-reopen',client=>dailyMessageOperation(client,{action:'today',timezone:'Europe/Istanbul'},{native:true,now:f.now,library:f.library,random:()=>0})],
    ['calendar-read',client=>calendarOperation(client,{action:'read',timezone:'Europe/Istanbul'},{native:true,now:f.now})],
    ['pattern-themes',client=>patternOperation(client,{action:'themes',timezone:'Europe/Istanbul'},{now:f.now})],
    ['pattern-lunar',client=>patternOperation(client,{action:'lunar',timezone:'Europe/Istanbul'},{now:f.now})],
    ['you-read',client=>youOperation(client,{action:'read'},{now:f.now})],
  ];
  for(const [scenario,invoke] of productScenarios) {
    const m=measured(f),before={daily:f.tables.UserDailyMessage.length,periods:f.tables.UserPeriodRecord.length,profiles:f.tables.UserProfile.length},value=await invoke(m.client);
    scenarios.push({scenario,fixtureRows:before,...m.counts(),responseBytes:JSON.stringify(value).length,trace:m.events});
  }
  for(const count of [10,1000]) {
    const f=nativeFixture();
    f.tables.InternalHealthRun=Array.from({length:count},(_,i)=>({id:`health-${i}`,run_id:`run-${i}`,status:'READY',completed_at:'2026-10-01T12:00:00Z',report_json:'x'.repeat(15000),report_digest:'d'.repeat(64),report_file_uri:`private://fixture-${i}`}));
    const m=measured(f),value=await internalHealthOperation(m.client,{action:'list'});
    scenarios.push({scenario:`health-history-${count}`,fixtureRows:count,...m.counts(),responseBytes:JSON.stringify(value).length,trace:m.events});
  }
  return {scope:'LOCAL_SYNTHETIC_SDK_COUNTS_NO_LATENCY_OR_CREDITS',samples:1,clock:'nativeFixture fixed 2026-10-20',cache:'fresh client each scenario; shared product fixture after first daily; no auth cache',library:'six approved category labels, 240 synthetic mappings/260 synthetic pairs/eight Moon intervals via fixture; reference loader substituted, zero provider calls',scenarios};
}
