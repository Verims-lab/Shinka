// No network. Execute installed/pinned SDK entity transport, not a handwritten
// SDK replacement. Optional argument points at an unpacked exact backend SDK.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createDailyQuota } from '../base44/shared/geonamesDailyQuota.js';
import { quotaRow } from '../src/foundation/tests/geonamesQuotaTests.js';
const roots = [path.resolve('node_modules/@base44/sdk'), ...process.argv.slice(2).map(p=>path.resolve(p))];
const results=[];
for(const root of roots){
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const {createEntitiesModule}=await import(pathToFileURL(path.join(root,'dist/modules/entities.js')).href);
 for(const outcome of ['accepted','zero','malformed','lost']){
  const calls=[];
  const axios={get:async(url,options)=>{calls.push({method:'GET',url,options});return [quotaRow()];},patch:async(url,body)=>{
   calls.push({method:'PATCH',url,body});assert.equal(body.query.id,'quota-one');assert.equal(body.query.revision,0);assert.equal(body.data.$inc.revision,1);
   assert.equal(body.data.$set.buckets[0].credits,1);assert.ok(url.endsWith('/entities/GeoNamesDailyQuota/update-many'));
   if(outcome==='lost')throw new Error('fixture lost reply');
   if(outcome==='malformed')return {updated:1};
   return {success:true,updated:outcome==='zero'?0:1,has_more:false};
  }};
  const store=createEntitiesModule({axios,appId:'synthetic',getSocket:()=>{throw new Error('unexpected socket');}}).GeoNamesDailyQuota;
  const reserve=createDailyQuota(store,{now:()=>Date.parse('2026-10-30T23:30:00Z')});
  if(outcome==='accepted')assert.equal(await reserve(),null);
  else if(outcome==='zero')assert.equal(await reserve(),1);
  else await assert.rejects(reserve,{code:'GEONAMES_UNAVAILABLE'});
  assert.equal(calls.length,2);assert.equal(JSON.parse(calls[0].options.params.q).scope,'APP_CREDITS_V1');
  results.push({version:pkg.version,outcome,requests:2,passed:true});
 }
}
console.log(JSON.stringify({scope:'LOCAL_NODE_ACTUAL_SDK_ENTITY_TRANSPORT_NO_NETWORK',denoRuntime:'NOT_RUN: Deno executable unavailable',hostedAtomicity:'NOT_RUN',results},null,2));
