// Execute the actual TS entry with only platform imports replaced. No real secrets,
// backend calls or production mutations; no entry source is sent to the browser.
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { handleInternalRequest } from '../base44/shared/internalAuthorization.js';
import { internalHealthOperation } from '../base44/shared/internalHealthOperations.js';
import { createGeoNamesGuard } from '../base44/shared/geonamesGuard.js';

export async function verifyGeoNamesRuntimeProbeEntry(root) {
  const source=await readFile(`${root}/base44/functions/internalHealth/entry.ts`,'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};let role=null,reads=0,runs=0,factories=0,currentValue='fixture-first',currentSignal;
  const client={auth:{me:async()=>role?{id:'fixture-admin',role}:null},get asServiceRole(){throw new Error('no entity access in probe');}};
  const imports={
    "../../shared/userLifecycle.js":{withUserLifecycle:client=>client},
    'npm:@base44/sdk@0.8.54':{createClientFromRequest:()=>client},
    '../../shared/healthPersistence.js':{healthUploadSigner:()=>{throw new Error('health signer accessed by transport probe');}},
    'base44:runtime':{secrets:{get:key=>{assert.equal(role,'admin');assert.equal(key,'GEONAMES_USERNAME');reads++;return currentValue;}}},
    '../../shared/internalAuthorization.js':{handleInternalRequest},
    '../../shared/internalHealthOperations.js':{internalHealthOperation},
    '../../shared/geonamesRuntimeProbe.js':{createGeoNamesRuntimeProbe:()=>{
      factories++;return async({username,signal})=>{runs++;assert.equal(username,currentValue);assert.equal(signal,currentSignal);return {probe_version:'fixture'};};
    }},
  };
  runInNewContext(output,{exports,require:name=>{assert.ok(Object.hasOwn(imports,name));return imports[name];}},{timeout:1000});
  assert.equal(reads,0);assert.equal(runs,0);assert.equal(factories,1);
  const call=async(body)=>{
    const req=new Request('https://fixture.invalid/internalHealth',{method:'POST',body:JSON.stringify(body)});currentSignal=req.signal;
    return exports.default(req);
  };
  for(const [principal,status] of [[null,401],['user',403]]){role=principal;assert.equal((await call({action:'geoNamesTransportProbe',role:'admin'})).status,status);}
  role='admin';assert.equal((await call({action:'geoNamesTransportProbe',url:'https://fixture.invalid'})).status,400);
  assert.equal(reads,0);assert.equal(runs,0);
  for(const value of ['fixture-first','fixture-rotated']){currentValue=value;assert.equal((await call({action:'geoNamesTransportProbe'})).status,200);}
  assert.equal(reads,2);assert.equal(runs,2);assert.equal(factories,1);
  return {scope:'LOCAL_PLATFORM_IMPORT_SUBSTITUTION',deniedRequests:3,authorizedRequests:2,secretReadsBeforeAuthorization:0,workerFactories:1,passed:true};
}

export async function verifyGeoNamesEntry(root) {
  const source=await readFile(`${root}/base44/functions/onboarding/entry.ts`,'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={},reads=[],bindings=[];
  let active=false,currentValue;
  const createClient=()=>{};
  const imports={
    "../../shared/userLifecycle.js":{withUserLifecycle:client=>client},
    '../../shared/nativeClient.ts':{createNativeClient:createClient},
    'base44:runtime':{secrets:{get:key=>{
      assert.equal(active,true,'secret read outside request');
      assert.equal(key,'GEONAMES_USERNAME');reads.push(key);return currentValue;
    }}},
    '../../shared/geonamesGuard.js':{createGeoNamesGuard},
    '../../shared/geonamesAdapter.js':{createGeoNamesAdapter:({username})=>{bindings.push(username);return {search:async()=>({binding:bindings.length})};}},
    '../../shared/onboardingOperations.js':{handleOnboardingRequest:async(req,client,{geoNamesFor})=>{
      assert.equal(client(req),createClient(req));
      const before=reads.length;
      const guarded=geoNamesFor(`owner-${before}`);assert.equal(reads.length,before,'no secret read before a provider call');
      assert.equal((await guarded.search(`fixture-${before}`,'en')).binding,bindings.length);
      return {request:req};
    }},
  };
  runInNewContext(output,{exports,require:name=>{assert.ok(Object.hasOwn(imports,name),'unexpected platform import');return imports[name];}},{timeout:1000});
  assert.equal(reads.length,0,'no module-load secret cache');
  assert.equal(typeof exports.default,'function');
  for(const value of [undefined,'fixture-first','fixture-rotated']){
    active=true;currentValue=value;const req={};
    try{assert.equal((await exports.default(req)).request,req);}finally{active=false;}
    assert.equal(bindings.at(-1),value,'current request secret must reach adapter');
  }
  assert.equal(reads.length,3);
  return {scope:'LOCAL_PLATFORM_IMPORT_SUBSTITUTION',requests:3,secretReadsAtModuleLoad:0,passed:true};
}
