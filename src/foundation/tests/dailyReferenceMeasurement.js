// Identical fixture/instrument used by scripts/measureDailyReferences at both refs.
import { nativeFixture } from './nativeFixture';
import { contentFixture } from './dailyFixture';
import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';
import { patternReader } from '../../../base44/shared/patternReader.js';
import { withNativeWriteChecks } from '../../../base44/shared/nativeWriteChecks.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { inspectContentLibrary } from '../../../base44/shared/base44ContentLibrary.js';
// SELECTOR_IMPORT is replaced by the script for the reviewed source revision.
export async function measureDailyReferences(selectionLibrary = inspectContentLibrary) {
  const f=nativeFixture({granted:false}),{source,decision}=contentFixture();
  const texts=['message_tr','suggestion_tr','message_en','suggestion_en'];
  for(let i=1;i<=39;i++){
    const pair=f.tables.MessagePair[i-1],day=new Date(+f.now()-i*86400000).toISOString().slice(0,10);
    f.tables.UserDailyMessage.push({id:`prior-${String(i).padStart(2,'0')}`,user_id:'ownerA',shinka_date:day,timezone:'Europe/Istanbul',category_id:pair.category_id,message_pair_id:pair.id,generated_at:`${day}T12:00:00.000Z`,...Object.fromEntries(texts.map(k=>[`${k}_snapshot`,pair[k]]))});
  }
  const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length;
  const fixtureHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(f.tables)))),x=>x.toString(16).padStart(2,'0')).join('');
  const scenarios=[];
  for(const scenario of ['daily-generation','home-reopen','pattern-history']){
    const raw=f.raw(),base=raw.asServiceRole.entities,trace=[];
    raw.asServiceRole.entities=new Proxy(base,{get:(store,entity)=>new Proxy(store[entity],{get:(api,method)=>typeof api[method]!=='function'?api[method]:async(...args)=>{const value=await api[method](...args);trace.push({entity,method,rows:Array.isArray(value)?value.length:null,bytes:bytes(value),fields:args[4]??null});return value;}})});
    const client=withNativeWriteChecks(withUserLifecycle(raw));
    const value=scenario==='pattern-history'?await patternReader(client,'ownerA').history('2026-09-21','2026-10-20'):await dailyMessageOperation(client,{action:'today',timezone:'Europe/Istanbul'},{native:true,now:f.now,library:c=>selectionLibrary(c,source,decision),random:()=>0});
    const saved=f.tables.UserDailyMessage.find(r=>r.shinka_date==='2026-10-20');
    scenarios.push({scenario,entityReads:trace.filter(e=>e.method==='filter').length,entityWrites:trace.filter(e=>e.method!=='filter').length,sdkReadBytes:trace.filter(e=>e.method==='filter').reduce((n,e)=>n+e.bytes,0),responseBytes:bytes(value),returnedRows:Array.isArray(value)?value.length:1,responseBytesPerRow:bytes(value)/(Array.isArray(value)?value.length:1),storedRowBytes:bytes(saved),repeatedTextValueBytes:texts.reduce((n,k)=>n+(saved[`${k}_snapshot`]?new TextEncoder().encode(saved[`${k}_snapshot`]).length:0),0),trace});
  }
  return {scope:'LOCAL_SYNTHETIC_SERIALIZED_UTF8_NOT_PHYSICAL_DB_LATENCY_OR_CREDITS',fixtureHash,fixtures:{historyRows:39,pairs:260,mappings:240,categories:6},scenarios};
}
