import { createOnboardingCycleGate } from '../../../base44/shared/onboardingCycleGate.js';
// Fake transport for the REAL production adapter. SDK method signatures/merge
// behavior match installed @base44/sdk; no live Base44 or transaction simulator.
import { DOMAIN_SCHEMAS, physicalName } from '../../../base44/shared/domainSchemas.js';
import { NOW } from './dataModelTests';
export function sdkOnboardingFixture({owner='ownerA',role='user'}={}) {
  const rows=Object.fromEntries(Object.keys(DOMAIN_SCHEMAS).map(e=>[e,[]])),calls=[];
  let seq=0,failEntity=null,failAfterWrite=false,omitField=null,nativeCreated=NOW,failReads=true;
  const match=(row,query)=>Object.entries(query).every(([k,v])=>v&&typeof v==='object'?Object.entries(v).every(([op,value])=>op==='$ne'?row[k]!==value:op==='$gte'?row[k]>=value:op==='$lte'?row[k]<=value:false):(row[k]??null)===v);
  const entities=Object.fromEntries(Object.keys(rows).map(entity=>[physicalName(entity),{
    filter:async(query,sort,limit)=>{calls.push({method:'filter',entity,query});if(failReads&&failEntity===entity&&!failAfterWrite)throw new Error('private backend payload');const key=sort.replace(/^-/,'');return rows[entity].filter(row=>match(row,query)).sort((a,b)=>String(a[key]??'').localeCompare(String(b[key]??''))*(sort.startsWith('-')?-1:1)).slice(0,limit).map(row=>{const copy={...row};if(omitField)delete copy[omitField];return copy;});},
    create:async(record)=>{
      calls.push({method:'create',entity,records:[structuredClone(record)]});
      if(failEntity===entity&&!failAfterWrite)throw new Error('private backend payload');
      const row={...record,id:`sdk-${++seq}`,created_date:nativeCreated,updated_date:NOW};
      rows[entity].push(row);
      if(failEntity===entity&&failAfterWrite)throw new Error('lost response after write');
      return {...row};
    },
    upsert:async(records,{key})=>{
      calls.push({method:'upsert',entity,records:structuredClone(records),key});
      if(failEntity===entity&&!failAfterWrite)throw new Error('private backend payload');
      const keys=Array.isArray(key)?key:[key];let created=0,updated=0;
      const written=records.map(record=>{
        let row=rows[entity].find(row=>keys.every(k=>row[k]===record[k]));
        if(row){Object.assign(row,record);updated++;}
        else {const defaults=Object.fromEntries(Object.entries(DOMAIN_SCHEMAS[entity].properties).filter(([,field])=>Object.hasOwn(field,'default')).map(([k,field])=>[k,field.default]));row={...defaults,...record,id:`sdk-${++seq}`,created_date:nativeCreated,updated_date:NOW};rows[entity].push(row);created++;}
        return {...row};
      });
      if(failEntity===entity&&failAfterWrite)throw new Error('lost response after write');
      return {created,updated,records:written};
    },
    updateMany:async(query,patch)=>{
      calls.push({method:'updateMany',entity,query,patch});
      if(failEntity===entity)throw new Error('private backend payload');
      const matches=rows[entity].filter(row=>match(row,query));matches.forEach(row=>Object.assign(row,patch.$set));return {updated:matches.length};
    },
  }]));
  const client={auth:{me:async()=>owner?{id:owner,role}:null},asServiceRole:{entities}};
  return {client,rows,calls,cycleGate:createOnboardingCycleGate(),fail:(entity,after=false)=>{failEntity=entity;failAfterWrite=after;failReads=true;},failWrite:(entity,after=false)=>{failEntity=entity;failAfterWrite=after;failReads=false;},omit:key=>{omitField=key;},nativeCreated:value=>{nativeCreated=value;}};
}
