import { notificationFixture } from './notificationFixture';
import { handleNotificationSchedule } from '../../../base44/shared/notificationScheduler.js';
import { privacyHash } from '../../../base44/shared/privacyPolicy.js';

const controls = new Set(['user','lifecycle','me','requireAuthenticatedUser','requireAdmin','admitCaller','admit','read','one','singleton','guard','eligible','dispatch','notificationTick','handleNotificationSchedule','produceDailyForOwner','existing','save','assertPrivacyAccess','readPrivacyRequests']);
const chain = () => (new Error().stack || '').split('\n').map(line => line.match(/at (?:async )?(?:Object\.)?([\w]+)\s*\(/)?.[1]).filter(name => controls.has(name));
// Count at the SDK transport boundary, never at a higher-level helper. Keep only
// method/control names and query shape; no arguments, record values or IDs.
export function measuredNotificationFixture(options = {}, admitMachine = null) {
  const f = notificationFixture(options), events = [];
  const wrap = raw => ({ ...raw, auth:{ ...raw.auth, me:async()=>{
    events.push({kind:'auth',method:'auth.me',controls:chain()});return raw.auth.me();
  } }, asServiceRole:{ ...raw.asServiceRole, entities:new Proxy(raw.asServiceRole.entities,{get(target,entity){
    const api=target[entity];return new Proxy(api,{get(handler,method){
      if(typeof handler[method]!=='function')return handler[method];
      return async(...args)=>{
        const read=['filter','list','get'].includes(String(method));
        const event={kind:read?'read':'write',entity:String(entity),method:String(method),controls:chain(),...(method==='filter'?{limit:args[2]??100,offset:args[3]??0,fields:args[4]||null}:{}),returnedRows:undefined};
        events.push(event);const result=await handler[method](...args);if(Array.isArray(result))event.returnedRows=result.length;return result;
      };
    }});
  }}) } });
  const provider=Object.fromEntries(Object.entries(f.provider).map(([method,fn])=>[method,async(...args)=>{events.push({kind:'provider',method,controls:chain()});return fn(...args);} ]));
  const call=(owner='adminA')=>handleNotificationSchedule(new Request('https://fixture.invalid/schedule',{method:'POST',body:JSON.stringify({action:'tick'})}),{createClient:()=>wrap(f.raw(admitMachine?null:owner)),enabled:true,createProvider:()=>provider,library:f.library,now:f.now,admitMachine:admitMachine?async()=>{events.push({kind:'machineAdmission',method:'verify'});await admitMachine();}:null});
  return {...f,events,wrap,provider,call};
}
export async function measureNotificationCosts(admitMachine = null) {
  const f=measuredNotificationFixture({},admitMachine),initialStateHash=await privacyHash(JSON.stringify(f.tables));
  const dailyHash=await privacyHash(JSON.stringify(f.tables.UserDailyMessage)),scenarios=[];
  for(const name of ['existing-intent','accepted-dispatch','settled-pass']){
    const start=f.events.length,response=await f.call(),result=await response.json(),trace=f.events.slice(start);
    if(response.status!==200)throw new Error('COST_SCENARIO_FAILED');
    const count=(kind,method=null)=>trace.filter(e=>e.kind===kind&&(!method||e.method===method)).length;
    const delivery=f.tables.NotificationDelivery[0];
    scenarios.push({name,time:f.now().toISOString(),counts:{entityReads:count('read'),entityWrites:count('write'),authMe:count('auth'),providerEligibility:count('provider','eligibility'),providerSend:count('provider','send')},result,product:{dailyUnchanged:dailyHash===await privacyHash(JSON.stringify(f.tables.UserDailyMessage)),dailyCount:f.tables.UserDailyMessage.length,deliveryCount:f.tables.NotificationDelivery.length,deliveryStatus:delivery?.delivery_status,dispatchState:delivery?.dispatch_state,attemptCount:delivery?.attempt_count,sendCount:f.sent.length},trace});
    if(admitMachine)scenarios.at(-1).counts.machineAdmissions=count('machineAdmission');
    if(name==='existing-intent')f.advance();
  }
  return {scope:'LOCAL_SYNTHETIC_SDK_TRANSPORT_COUNTS_NOT_LATENCY_OR_CREDITS',initialStateHash,clock:'2026-10-20T03:00:00.000Z; +5 minutes after intent only',fixture:'notificationFixture current:true granted:false; one owner, existing daily, synthetic accepted provider',scenarios};
}
