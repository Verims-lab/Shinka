// Actual TS entries and handlers, only platform transport/secrets substituted.
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { handleOnboardingRequest } from '../base44/shared/onboardingOperations.js';
import { handleYouRequest } from '../base44/shared/youOperation.js';
import { createGeoNamesGuard } from '../base44/shared/geonamesGuard.js';
import { createDailyQuota } from '../base44/shared/geonamesDailyQuota.js';
import { withUserLifecycle } from '../base44/shared/userLifecycle.js';
import { withNativeWriteChecks } from '../base44/shared/nativeWriteChecks.js';
export async function verifyGeoNamesQuotaEntries(root) {
 const results=[];
 for(const name of ['onboarding','you']){
  let actor=null, inactive=false, quotaReads=0, quotaWrites=0, provider=0, secrets=0;
  const entities=new Proxy({}, {get:(_target,entity)=>({filter:async query=>{
   if(entity==='GeoNamesDailyQuota'){quotaReads++;throw new Error('forbidden quota access');}
   if(entity==='User')return actor?[{id:actor.id,role:'user'}]:[];
   if(entity==='UserProfile')return [{id:'profile',user_id:query.user_id,account_status:inactive?'INACTIVE':'ACTIVE'}];
   return [];
  },updateMany:async()=>{quotaWrites++;throw new Error('forbidden write');}})});
  const raw={auth:{me:async()=>actor},asServiceRole:{entities}};
  const client=()=>withNativeWriteChecks(withUserLifecycle(raw));
  const imports={
   '../../shared/nativeClient.ts':{createNativeClient:client},
   'npm:@base44/sdk@0.8.54':{createClientFromRequest:()=>raw},
   'base44:runtime':{secrets:{get:()=>{secrets++;throw new Error('secret must stay lazy');}}},
   '../../shared/geonamesAdapter.js':{createGeoNamesAdapter:()=>{provider++;throw new Error('provider forbidden');}},
   '../../shared/geonamesGuard.js':{createGeoNamesGuard:()=>{
    const guard=createGeoNamesGuard();return {forOwner:(owner,factory,options)=>{
     assert.equal(typeof options?.dailyQuota,'function','actual entry must bind the shared quota');
     return guard.forOwner(owner,factory,options);
    }};
   }},
   '../../shared/geonamesDailyQuota.js':{createDailyQuota},
   '../../shared/onboardingOperations.js':{handleOnboardingRequest},
   '../../shared/youOperation.js':{handleYouRequest},
  };
  const output=ts.transpileModule(await readFile(`${root}/base44/functions/${name}/entry.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};runInNewContext(output,{exports,require:key=>{assert.ok(Object.hasOwn(imports,key));return imports[key];}},{timeout:1000});
  const call=body=>exports.default(new Request('https://fixture.invalid/entry',{method:'POST',body:JSON.stringify(body)}));
  const body=name==='onboarding'?{action:'searchPlaces',query:'ABC',language_code:'en'}:{action:'saveProfile',birthplace_geonames_id:123};
  assert.equal((await call(body)).status,401);
  actor={id:'ownerA',role:'user'};
  assert.equal((await call({...body,user_id:'ownerB'})).status,403);
  assert.equal((await call({...body,role:'admin'})).status,403);
  inactive=true;const denied=await call(body);assert.ok(denied.status===403||((await denied.json()).state==='INACTIVE_ACCOUNT'));
  assert.deepEqual([quotaReads,quotaWrites,provider,secrets],[0,0,0,0]);
  results.push({function:name,negativeRequests:4,quotaReads,quotaWrites,provider,secrets,passed:true});
 }
 return {scope:'LOCAL_ACTUAL_TS_ENTRY_HANDLERS_SYNTHETIC_SDK',results,passed:true};
}
if(process.argv[1]?.endsWith('verifyGeoNamesQuotaEntries.mjs'))console.log(JSON.stringify(await verifyGeoNamesQuotaEntries(process.cwd()),null,2));
